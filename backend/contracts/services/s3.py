import uuid
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from django.conf import settings

class S3:
    def __init__(self):
        self.client = boto3.client(service_name='s3',
                                   aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                   aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                                   region_name=settings.AWS_S3_REGION_NAME,
                                   config=Config(signature_version='s3v4'))
        self.expiresIn = settings.AWS_PRESIGNED_EXPIRY

    def generate_presigned_post_url(self, key=None, file_type="application/pdf"):
        try:
            current_time = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S') 
            object_name = f'{uuid.uuid4()}_{current_time}'
            bucket_name = settings.AWS_STORAGE_BUCKET_NAME

            response = self.client.generate_presigned_post(
                bucket_name,
                object_name if key is None else key,
                Fields={"Content-Type": file_type},
                Conditions=[{"Content-Type": file_type}],
                ExpiresIn=self.expiresIn
            )
            return response
        except ClientError as e:
            return None
    
    def generate_presigned_url_expanded(self, client_method_name, key):
        try:
            response = self.client.generate_presigned_url(
                ClientMethod=client_method_name,
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': key,
                },
                ExpiresIn=self.expiresIn
            )
            return response
        except ClientError as e:
            return None
    
    def check_object_exists(self, key):
        try:
            self.client.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise

    def delete_object(self, key):
        try:
            response = self.client.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
            print(response)
            return True
        except ClientError as e:
            return False
