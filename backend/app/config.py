import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("No SECRET_KEY provided in environment variables.")

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError("No DATABASE_URL provided in environment variables.")

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        raise ValueError("No JWT_SECRET_KEY provided in environment variables.")

    AWS_S3_BUCKET = os.environ.get('AWS_S3_BUCKET')
    AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY')
    AWS_SECRET_KEY = os.environ.get('AWS_SECRET_KEY')
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-2')

    SMTP_HOST = os.environ.get('SMTP_HOST')
    if not SMTP_HOST:
        raise ValueError("No SMTP_HOST provided in environment variables.")

    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))

    SMTP_USER = os.environ.get('SMTP_USER')
    if not SMTP_USER:
        raise ValueError("No SMTP_USER provided in environment variables.")

    SMTP_PASS = os.environ.get('SMTP_PASS')
    if not SMTP_PASS:
        raise ValueError("No SMTP_PASS provided in environment variables.")

    EMAIL_SENDER = os.environ.get('EMAIL_SENDER')
    if not EMAIL_SENDER:
        raise ValueError("No EMAIL_SENDER provided in environment variables.")

    ALPHAVANTAGE_API_KEY = (
            os.environ.get('ALPHAVANTAGE_API_KEY')
            or os.environ.get('ALPHAVANTAGE_API_KEY2'))

    if not ALPHAVANTAGE_API_KEY:
        raise ValueError("No ALPHAVANTAGE_API_KEY in env variables.")
