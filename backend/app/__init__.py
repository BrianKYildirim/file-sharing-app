from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app():
    app = Flask(__name__)

    CORS(app)

    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app
