from datetime import datetime, timezone
from . import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    files = db.relationship('File', backref='owner', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class File(db.Model):
    __tablename__ = 'file'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    s3_key = db.Column(db.String(255), nullable=False)
    size = db.Column(db.Integer)
    upload_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_modified = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Define a bidirectional relationship with SharedFile.
    shared_with = db.relationship('SharedFile', back_populates='file', cascade="all, delete-orphan", lazy=True)


class SharedFile(db.Model):
    __tablename__ = 'sharedfile'
    id = db.Column(db.Integer, primary_key=True)
    file_id = db.Column(db.Integer, db.ForeignKey('file.id'), nullable=False)
    shared_with_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    access_level = db.Column(db.String(20), default='read')
    share_timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    file = db.relationship('File', back_populates='shared_with')
    # Add a relationship to fetch the user object for 'shared_with_user_id'
    shared_with_user = db.relationship('User', backref='shared_files')
