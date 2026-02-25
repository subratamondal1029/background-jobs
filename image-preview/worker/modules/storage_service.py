import uuid
from modules.getenv import getenv
import boto3
from botocore.config import Config

class Storage_service:

    def __init__(self) -> None:
        self._s3 = boto3.client(
            "s3",
            endpoint_url=getenv("S3_ENDPOINT"),
            region_name=getenv("S3_REGION"),
            aws_access_key_id=getenv("S3_ACCESS_KEY"),
            aws_secret_access_key=getenv("S3_SECRET_KEY"),
            config=Config(s3={"addressing_style": getenv("S3_ADDRESSING_STYLE")})  # required for MinIO
        )
        self._bucket = getenv("S3_BUCKET")
    
    def read_image(self, key):
        obj = self._s3.get_object(Bucket=self._bucket, Key=key)
        return obj["Body"].read()
    
    def upload_image(self, image_data):
        key = f"uploads/preview/{uuid.uuid4()}.jpg"
        self._s3.put_object(Bucket=self._bucket, Key=key, Body=image_data, ContentType="image/jpeg")
        return key
        