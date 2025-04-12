# backend/app/services.py
import boto3
from botocore.config import Config as BotoConfig
from flask import current_app


def get_s3_client():
    aws_access_key = current_app.config.get('AWS_ACCESS_KEY')
    aws_secret_key = current_app.config.get('AWS_SECRET_KEY')
    if not aws_access_key or not aws_secret_key:
        raise ValueError("AWS credentials are not properly configured.")
    s3_config = BotoConfig(signature_version='s3v4')
    return boto3.client(
        's3',
        region_name=current_app.config['AWS_REGION'],
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        config=s3_config,
        endpoint_url=f"https://s3.{current_app.config['AWS_REGION']}.amazonaws.com"
    )


def upload_file_to_s3(file_obj, s3_key):
    s3_client = get_s3_client()
    bucket_name = current_app.config.get('AWS_S3_BUCKET')
    if not bucket_name:
        raise ValueError("AWS S3 bucket name is not set in configuration.")
    s3_client.upload_fileobj(file_obj, bucket_name, s3_key)
    return True


def generate_presigned_url(s3_key, expiration=3600):
    s3_client = get_s3_client()
    bucket_name = current_app.config.get('AWS_S3_BUCKET')
    if not bucket_name:
        raise ValueError("AWS S3 bucket name is not set in configuration.")
    return s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={'Bucket': bucket_name, 'Key': s3_key},
        ExpiresIn=expiration
    )
