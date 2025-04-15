# backend/app/routes.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .models import User, File, SharedFile
from . import db
from .services import upload_file_to_s3, generate_presigned_url
import uuid
from datetime import timezone
import traceback

api_bp = Blueprint('api_bp', __name__)


def error_response(message, code):
    return jsonify({'msg': message}), code


def success_response(message, code=200, **kwargs):
    resp = {'msg': message}
    resp.update(kwargs)
    return jsonify(resp), code


@api_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json(silent=True)
        if not data:
            return error_response('Invalid JSON input', 400)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        if not username or not email or not password:
            return error_response('Missing required data', 400)

        if User.query.filter((User.username == username) | (User.email == email)).first():
            return error_response('User already exists', 409)

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return success_response('User registered', 201)

    except Exception as e:
        current_app.logger.error("Registration error: %s", str(e), exc_info=True)
        print("DEBUG TRACEBACK:\n", traceback.format_exc())
        return error_response("Internal server error", 500)


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
        'shared_with_users': [sf.shared_with_user.username for sf in f.shared_with]
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
        return error_response('Cannot share file with yourself', 400)

    existing_share = SharedFile.query.filter_by(file_id=file_id, shared_with_user_id=recipient.id).first()
    if existing_share:
        return error_response('The recipient already has access to this file', 400)

    shared_file = SharedFile(file_id=file_id, shared_with_user_id=recipient.id, access_level=access_level)
    db.session.add(shared_file)
    db.session.commit()

    return success_response('File shared successfully')


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
