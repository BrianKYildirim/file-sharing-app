# backend/app/routes.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .models import User, File, SharedFile, EmailVerification
from . import db
from .services import upload_file_to_s3, generate_presigned_url, generate_code, send_verification_email
import uuid
from datetime import timezone, timedelta, datetime
import traceback
from werkzeug.security import generate_password_hash
import yfinance as yf
import pandas as pd
import requests

api_bp = Blueprint('api_bp', __name__)


def error_response(message, code):
    return jsonify({'msg': message}), code


def success_response(message, code=200, **kwargs):
    resp = {'msg': message}
    resp.update(kwargs)
    return jsonify(resp), code


@api_bp.route('/register-initiate', methods=['POST'])
def register_initiate():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        if not username or not email or not password:
            return error_response('Missing username, email or password', 400)

        # Prevent duplicates
        if User.query.filter_by(email=email).first():
            return error_response('Email already in use', 409)

        # Create a verification record
        code = generate_code()
        expires = datetime.now(timezone.utc) + timedelta(minutes=10)
        ev = EmailVerification(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            code=code,
            expires_at=expires
        )
        db.session.add(ev)
        db.session.commit()

        # Send the email
        send_verification_email(email, code)

        return success_response('Verification code sent', 200, verification_id=ev.id)

    except Exception as ex:
        current_app.logger.error("Error in register-initiate", exc_info=True)
        # Return the exception text so the frontend can display it
        return jsonify({'msg': f"Internal error: {str(ex)}"}), 500


@api_bp.route('/register-verify', methods=['POST'])
def register_verify():
    try:
        data = request.get_json(silent=True) or {}
        vid = data.get('verification_id')
        input_code = data.get('code')

        ev = EmailVerification.query.get(vid)
        if not ev:
            return error_response('Invalid verification session', 400)

        now = datetime.now(timezone.utc)
        exp = ev.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        if now > exp:
            return error_response('Verification code expired', 400)

        if ev.attempts >= 5:
            return error_response('Too many attempts', 429)

        ev.attempts += 1
        if ev.code != input_code:
            db.session.commit()
            return error_response('Incorrect code', 401)

        # Everything’s valid – create the real user
        user = User(username=ev.username, email=ev.email)
        user.password_hash = ev.password_hash
        db.session.add(user)

        # Clean up the verification record
        db.session.delete(ev)
        db.session.commit()

        return success_response('Registration complete', 201)

    except Exception as ex:
        # Log the full traceback in your Gunicorn logs
        current_app.logger.error("Error in register-verify:\n%s", traceback.format_exc())
        # Return JSON with the exception text so your React UI can display it
        return jsonify({'msg': f"Internal error: {str(ex)}"}), 500


@api_bp.route('/register-resend', methods=['POST'])
def register_resend():
    data = request.get_json(silent=True) or {}
    vid = data.get('verification_id')
    ev = EmailVerification.query.get(vid) or None
    if not ev:
        return error_response('Invalid session', 400)
    now = datetime.now(timezone.utc)
    last = ev.last_sent
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    if (now - last) < timedelta(seconds=60):
        return error_response('Please wait at least 60 seconds before resending', 429)
    # Generate & send new code
    ev.code = generate_code()
    ev.expires_at = now + timedelta(minutes=10)
    ev.last_sent = now
    ev.attempts = 0
    db.session.commit()
    try:
        send_verification_email(ev.email, ev.code)
    except:
        return error_response('Resend failed', 500)
    return success_response('Code resent', 200)


@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return error_response('Invalid JSON input', 400)
    identifier = data.get('identifier')
    password = data.get('password')
    if not identifier or not password:
        return error_response('Missing credentials', 400)
    user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'access_token': access_token}), 200
    return error_response('Invalid credentials', 401)


@api_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return error_response('Invalid token identity', 400)
    user = User.query.get_or_404(user_id)
    return jsonify({'username': user.username, 'email': user.email}), 200


@api_bp.route('/market/<string:symbol>', methods=['GET'])
@jwt_required()
def get_market_data(symbol):
    api_key = current_app.config['ALPHAVANTAGE_API_KEY']
    interval = request.args.get('interval', '1min')

    # pick function + JSON key
    if interval in ('1min', '5min', '15min', '30min', '60min'):
        fn = 'TIME_SERIES_INTRADAY'
        key = f'Time Series ({interval})'
        # build the exact same query-string you tested in the browser:
        url = (
            f'https://www.alphavantage.co/query'
            f'?function={fn}'
            f'&symbol={symbol}'
            f'&interval={interval}'
            f'&outputsize=compact'
            f'&apikey={api_key}'
        )
    elif interval == 'daily':
        fn, key = 'TIME_SERIES_DAILY', 'Time Series (Daily)'
        url = f'https://www.alphavantage.co/query?function={fn}&symbol={symbol}&apikey={api_key}'
    elif interval == 'weekly':
        fn, key = 'TIME_SERIES_WEEKLY', 'Weekly Time Series'
        url = f'https://www.alphavantage.co/query?function={fn}&symbol={symbol}&apikey={api_key}'
    elif interval == 'monthly':
        fn, key = 'TIME_SERIES_MONTHLY', 'Monthly Time Series'
        url = f'https://www.alphavantage.co/query?function={fn}&symbol={symbol}&apikey={api_key}'
    else:
        return error_response(f"Unsupported interval: {interval}", 400)

    try:
        # log it so you can verify in your Flask logs
        current_app.logger.info(f"AlphaVantage URL → {url}")

        resp = requests.get(url, timeout=10)
        data = resp.json()

        # if AV gives you a "Note" (rate-limit) or an error message:
        if key not in data:
            msg = data.get('Note') or data.get('Error Message') or 'No data'
            current_app.logger.warning(f"AlphaVantage returned no \"{key}\" key, payload was: {data}")
            return error_response(msg, 404)

        # turn it into our uniform array:
        raw = data[key]
        items = sorted(raw.items(), key=lambda x: x[0])
        out = [{
            'time': ts,
            'open': float(vals['1. open']),
            'high': float(vals['2. high']),
            'low': float(vals['3. low']),
            'close': float(vals['4. close']),
            'volume': int(vals['5. volume']),
        } for ts, vals in items]

        return jsonify(out), 200

    except Exception as e:
        current_app.logger.error("AlphaVantage exception", exc_info=True)
        return error_response("Error fetching market data", 500)


@api_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    user_id = get_jwt_identity()
    if 'file' not in request.files:
        return error_response('No file part', 400)
    file_obj = request.files['file']
    if file_obj.filename == '':
        return error_response('No file selected', 400)

    # Create a unique S3 key
    s3_key = f"{user_id}/{uuid.uuid4()}_{file_obj.filename}"

    try:
        upload_file_to_s3(file_obj, s3_key)
    except Exception as e:
        current_app.logger.error(f"Error uploading file: {e}")
        return error_response("Error uploading file", 500)

    new_file = File(user_id=user_id, filename=file_obj.filename, s3_key=s3_key, size=0)
    db.session.add(new_file)
    db.session.commit()

    return success_response('File uploaded', 201, file_id=new_file.id)


@api_bp.route('/files', methods=['GET'])
@jwt_required()
def list_files():
    user_id = int(get_jwt_identity())
    owned_files = File.query.filter_by(user_id=user_id).all()
    shared = SharedFile.query.filter_by(shared_with_user_id=user_id).all()

    owned_list = [{
        'id': f.id,
        'filename': f.filename,
        's3_key': f.s3_key,
        'upload_time': f.upload_time.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'shared_with_users': [
            {
                'id': sf.shared_with_user.id,
                'email': sf.shared_with_user.email,
                'username': sf.shared_with_user.username
            }
            for sf in f.shared_with
        ]
    } for f in owned_files]

    shared_list = [{
        'id': share.file.id,
        'filename': share.file.filename,
        's3_key': share.file.s3_key,
        'shared_by': share.file.owner.username if share.file.owner else str(share.file.user_id),
        'shared_at': share.share_timestamp.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'access_level': share.access_level
    } for share in shared]

    return jsonify({'owned_files': owned_list, 'shared_files': shared_list}), 200


@api_bp.route('/download/<int:file_id>', methods=['GET'])
@jwt_required()
def download_file(file_id):
    file_obj = File.query.get_or_404(file_id)
    try:
        url = generate_presigned_url(file_obj.s3_key)
    except Exception as e:
        current_app.logger.error(f"Error generating URL: {e}")
        return error_response("Error generating URL", 500)
    return jsonify({'download_url': url}), 200


@api_bp.route('/share', methods=['POST'])
@jwt_required()
def share_file():
    data = request.get_json(silent=True)
    if not data:
        return error_response('Invalid JSON input', 400)
    file_id = data.get('file_id')
    recipient_email = data.get('recipient_email')
    access_level = data.get('access_level', 'read')
    if not file_id or not recipient_email:
        return error_response('Missing file_id or recipient_email', 400)

    file_obj = File.query.get_or_404(file_id)
    current_user_id = int(get_jwt_identity())
    if file_obj.user_id != current_user_id:
        return error_response('Only owners can share files', 403)

    recipient = User.query.filter_by(email=recipient_email).first()
    if not recipient:
        return error_response('Recipient not found', 404)
    if recipient.id == current_user_id:
        return error_response('The recipient already has access to this file', 400)

    existing_share = SharedFile.query.filter_by(file_id=file_id, shared_with_user_id=recipient.id).first()
    if existing_share:
        return error_response('The recipient already has access to this file', 400)

    shared_file = SharedFile(file_id=file_id, shared_with_user_id=recipient.id, access_level=access_level)
    db.session.add(shared_file)
    db.session.commit()

    return success_response('File shared successfully')


@api_bp.route('/unshare', methods=['POST'])
@jwt_required()
def unshare_file():
    data = request.get_json(silent=True)
    if not data:
        return error_response('Invalid JSON input', 400)
    file_id = data.get('file_id')
    user_id_to_remove = data.get('user_id')
    if not file_id or not user_id_to_remove:
        return error_response('Missing file_id or user_id', 400)

    file_obj = File.query.get_or_404(file_id)

    current_user_id = int(get_jwt_identity())
    if file_obj.user_id != current_user_id:
        return error_response('Only owners can unshare files', 403)

    shared_record = SharedFile.query.filter_by(file_id=file_id, shared_with_user_id=user_id_to_remove).first()
    if not shared_record:
        return error_response('User does not have access or it was never shared with them', 404)

    db.session.delete(shared_record)
    db.session.commit()
    return success_response('User has been removed from the file collaboration')


@api_bp.route('/files/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    user_id = int(get_jwt_identity())
    file_obj = File.query.get_or_404(file_id)
    if file_obj.user_id != user_id:
        return error_response('You cannot delete a file that you do not own', 403)
    db.session.delete(file_obj)
    db.session.commit()
    return success_response('File deleted successfully')


@api_bp.route('/files/<int:file_id>/leave', methods=['POST'])
@jwt_required()
def leave_collaboration(file_id):
    user_id = int(get_jwt_identity())
    shared_record = SharedFile.query.filter_by(file_id=file_id, shared_with_user_id=user_id).first()
    if not shared_record:
        return error_response('You do not have access to this file or it was never shared with you', 404)
    db.session.delete(shared_record)
    db.session.commit()
    return success_response('You have left the collaboration')
