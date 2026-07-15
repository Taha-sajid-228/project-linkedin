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

ALLOWED_MEDIA_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
]

ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
]

ALLOWED_EXTENSIONS = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "heic",
    "heif",
    "mp4",
    "webm",
    "mov",
]

ALLOWED_IMAGE_EXTENSIONS = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "heic",
    "heif",
]

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)


def validate_media_file(file: UploadFile, file_extension: str):
    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only image and video files are allowed"
        )

    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only image and video files are allowed"
        )


def validate_image_file(file: UploadFile, file_extension: str):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed"
        )

    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed"
        )


def upload_file_to_s3(file: UploadFile, folder: str, image_only: bool = False):
    try:
        original_filename = file.filename or ""

        if "." not in original_filename:
            raise HTTPException(
                status_code=400,
                detail="File must have a valid extension"
            )

        file_extension = original_filename.split(".")[-1].lower()

        if image_only:
            validate_image_file(file, file_extension)
        else:
            validate_media_file(file, file_extension)

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

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")