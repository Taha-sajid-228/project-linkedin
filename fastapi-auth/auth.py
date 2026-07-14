from fastapi import APIRouter, Form, HTTPException, Depends, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import re
import os
import random
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import jwt

from database import get_db
from models import User
from services.s3_service import upload_file_to_s3

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

load_dotenv()

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt-signing")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
OTP_EXPIRE_MINUTES = 5

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_email(to_email: str, otp: str):
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_email or not smtp_password:
        raise HTTPException(status_code=500, detail="SMTP email credentials are not configured.")

    msg = EmailMessage()
    msg["Subject"] = "Your LinkLoop OTP Code"
    msg["From"] = smtp_email
    msg["To"] = to_email
    msg.set_content(
        f"Your LinkLoop OTP code is: {otp}\n\n"
        f"This code will expire in {OTP_EXPIRE_MINUTES} minutes."
    )

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(smtp_email, smtp_password)
            smtp.send_message(msg)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Please check SMTP settings.")


@router.post("/register")
def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    username_stripped = username.strip()
    email_stripped = email.strip().lower()

    if len(username_stripped) < 6:
        raise HTTPException(status_code=400, detail="Username must be at least 6 characters long.")

    if not EMAIL_REGEX.match(email_stripped):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    existing_user = db.query(User).filter(User.email == email_stripped).first()

    if existing_user:
        if existing_user.provider != "email":
            raise HTTPException(
                status_code=400,
                detail=f"This email is already registered with {existing_user.provider}. Please continue with {existing_user.provider}."
            )

        if existing_user.is_verified:
            raise HTTPException(status_code=400, detail="User already exists.")

        existing_username = db.query(User).filter(User.username == username_stripped).first()

        if existing_username and existing_username.id != existing_user.id:
            raise HTTPException(status_code=400, detail="Username is already taken.")

        otp = generate_otp()

        existing_user.username = username_stripped
        existing_user.password = pwd_context.hash(password)
        existing_user.role = "user"
        existing_user.otp_code = otp
        existing_user.otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
        existing_user.provider = "email"
        existing_user.provider_id = None
        existing_user.profile_picture = None

        db.commit()
        db.refresh(existing_user)

        try:
            send_otp_email(existing_user.email, otp)
        except Exception as e:
            print("OTP Email Error:", str(e))
            raise HTTPException(status_code=500, detail="User updated but OTP email could not be sent.")

        return {
            "message": "Registration successful. OTP sent to your email.",
            "user": {
                "id": existing_user.id,
                "username": existing_user.username,
                "email": existing_user.email,
                "role": existing_user.role,
                "is_verified": existing_user.is_verified
            }
        }

    existing_username = db.query(User).filter(User.username == username_stripped).first()

    if existing_username:
        raise HTTPException(status_code=400, detail="Username is already taken.")

    otp = generate_otp()

    new_user = User(
        username=username_stripped,
        email=email_stripped,
        password=pwd_context.hash(password),
        role="user",
        is_verified=False,
        otp_code=otp,
        otp_expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
        provider="email",
        provider_id=None,
        profile_picture=None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    try:
        send_otp_email(new_user.email, otp)
    except Exception as e:
        print("OTP Email Error:", str(e))
        raise HTTPException(status_code=500, detail="User created but OTP email could not be sent.")

    return {
        "message": "Registration successful. OTP sent to your email.",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "is_verified": new_user.is_verified
        }
    }


@router.post("/verify-otp")
def verify_otp(
    email: str = Form(...),
    otp: str = Form(...),
    db: Session = Depends(get_db)
):
    email_stripped = email.strip().lower()
    otp_stripped = otp.strip()

    user = db.query(User).filter(User.email == email_stripped).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    if user.is_verified:
        return {"message": "Email is already verified."}

    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No OTP found. Please resend OTP.")

    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please resend OTP.")

    if user.otp_code != otp_stripped:
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None

    db.commit()
    db.refresh(user)

    return {"message": "Email verified successfully. You can now login."}


@router.post("/resend-otp")
def resend_otp(
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    email_stripped = email.strip().lower()
    user = db.query(User).filter(User.email == email_stripped).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified.")

    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    db.commit()
    db.refresh(user)

    try:
        send_otp_email(user.email, otp)
    except Exception as e:
        print("OTP Email Error:", str(e))
        raise HTTPException(status_code=500, detail="OTP updated but email could not be sent.")

    return {"message": "New OTP sent to your email."}


@router.post("/forgot-password")
def forgot_password(
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    email_stripped = email.strip().lower()

    if not EMAIL_REGEX.match(email_stripped):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")

    user = db.query(User).filter(User.email == email_stripped).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    if user.provider != "email":
        raise HTTPException(
            status_code=400,
            detail=f"This account uses {user.provider} login. Password reset is not available."
        )

    otp = generate_otp()

    user.reset_otp = otp
    user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    db.commit()
    db.refresh(user)

    try:
        send_otp_email(user.email, otp)
    except Exception as e:
        print("Password Reset OTP Email Error:", str(e))
        raise HTTPException(status_code=500, detail="Reset OTP created but email could not be sent.")

    return {"message": "Password reset OTP sent to your email."}


@router.post("/reset-password")
def reset_password(
    email: str = Form(...),
    otp: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    email_stripped = email.strip().lower()
    otp_stripped = otp.strip()

    user = db.query(User).filter(User.email == email_stripped).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    if user.provider != "email":
        raise HTTPException(
            status_code=400,
            detail=f"This account uses {user.provider} login. Password reset is not available."
        )

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    if not user.reset_otp or not user.reset_otp_expires_at:
        raise HTTPException(status_code=400, detail="No reset OTP found. Please request again.")

    if datetime.utcnow() > user.reset_otp_expires_at:
        raise HTTPException(status_code=400, detail="Reset OTP has expired. Please request again.")

    if user.reset_otp != otp_stripped:
        raise HTTPException(status_code=400, detail="Invalid reset OTP.")

    user.password = pwd_context.hash(new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None

    db.commit()
    db.refresh(user)

    return {"message": "Password reset successfully. You can now login."}


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    email_stripped = email.strip().lower()
    user = db.query(User).filter(User.email == email_stripped).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    if user.provider != "email":
        raise HTTPException(
            status_code=400,
            detail=f"This account uses {user.provider} login. Please continue with {user.provider}."
        )

    if not user.password or not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid password.")

    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email with OTP first.")

    access_token = create_access_token(
        data={
            "sub": user.email,
            "id": user.id,
            "role": user.role
        }
    )

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified
        }
    }


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token credentials")

    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")

    return current_user


@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "bio": current_user.bio,
        "profile_picture": current_user.profile_picture,
        "provider": current_user.provider,
        "is_verified": current_user.is_verified
    }


@router.put("/me/bio")
def update_my_bio(
    bio: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.bio = bio

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Bio updated successfully.",
        "bio": current_user.bio
    }


@router.put("/me/profile-picture")
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    image_url = upload_file_to_s3(
        file=file,
        folder="profile-pictures",
        image_only=True
    )

    current_user.profile_picture = image_url

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile picture updated successfully.",
        "profile_picture": current_user.profile_picture
    }


@router.get("/users/{user_id}")
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "bio": user.bio,
        "profile_picture": user.profile_picture,
    }


@router.get("/admin-only")
def admin_only_route(current_user: User = Depends(get_admin_user)):
    return {
        "message": "Welcome admin.",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role
        }
    }


   