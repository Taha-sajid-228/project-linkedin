from fastapi import APIRouter, Form, HTTPException, Depends
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

load_dotenv()

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt-signing")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
OTP_EXPIRE_MINUTES = 5

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_email(to_email: str, otp: str):
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_email or not smtp_password:
        raise HTTPException(
            status_code=500,
            detail="SMTP email credentials are not configured."
        )

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
        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP email. Please check SMTP settings."
        )


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
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 6 characters long."
        )

    if not EMAIL_REGEX.match(email_stripped):
        raise HTTPException(
            status_code=400,
            detail="Enter a valid email address."
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long."
        )

    existing_username = db.query(User).filter(User.username == username_stripped).first()
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username is already taken."
        )

    existing_user = db.query(User).filter(User.email == email_stripped).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists."
        )

    hashed_password = pwd_context.hash(password)
    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    new_user = User(
        username=username_stripped,
        email=email_stripped,
        password=hashed_password,
        is_verified=False,
        otp_code=otp,
        otp_expires_at=otp_expiry
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_otp_email(new_user.email, otp)

    return {
        "message": "Registration successful. OTP sent to your email.",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
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

    send_otp_email(user.email, otp)

    return {"message": "New OTP sent to your email."}


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    email_stripped = email.strip().lower()
    user = db.query(User).filter(User.email == email_stripped).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="User not found."
        )

    if not pwd_context.verify(password, user.password):
        raise HTTPException(
            status_code=400,
            detail="Invalid password."
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Please verify your email with OTP first."
        )

    access_token = create_access_token(data={"sub": user.email, "id": user.id})

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_verified": user.is_verified
        }
    }
