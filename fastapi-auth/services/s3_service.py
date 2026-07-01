import os
import uuid
import boto3
from io import BytesIO
from PIL import Image
from pillow_heif import register_heif_opener
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

load_dotenv()
register_heif_opener()

AWS_REGION = os.getenv("AWS_REGION")
AWS_BUCKET = os.getenv("AWS_S3_BUCKET_NAME")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)


def upload_file_to_s3(file: UploadFile, folder: str):
    try:
        original_filename = file.filename or ""
        file_extension = original_filename.split(".")[-1].lower()

        is_heic = file_extension in ["heic", "heif"]

        if is_heic:
            image = Image.open(file.file)

            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            output_buffer = BytesIO()
            image.save(output_buffer, format="JPEG", quality=90)
            output_buffer.seek(0)

            file_name = f"{folder}/{uuid.uuid4()}.jpg"

            s3_client.upload_fileobj(
                output_buffer,
                AWS_BUCKET,
                file_name,
                ExtraArgs={"ContentType": "image/jpeg"}
            )

            return f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{file_name}"

        file_name = f"{folder}/{uuid.uuid4()}.{file_extension}"

        s3_client.upload_fileobj(
            file.file,
            AWS_BUCKET,
            file_name,
            ExtraArgs={"ContentType": file.content_type}
        )

        return f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{file_name}"

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")