from fastapi import APIRouter, Form, HTTPException, Depends
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import re
import os
from datetime import datetime, timedelta
from jose import jwt

from database import get_db
from models import User

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt-signing")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.post("/register")
def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # ==========================
    # Input Validation
    # ==========================

    username_stripped = username.strip()
    email_stripped = email.strip()

    # Username validation
    if len(username_stripped) < 6:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 6 characters long."
        )

    # Email validation
    if not EMAIL_REGEX.match(email_stripped):
        raise HTTPException(
            status_code=400,
            detail="Enter a valid email address."
        )

    # Password validation
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long."
        )

    # ==========================
    # Check if username already exists
    # ==========================
    existing_username = db.query(User).filter(User.username == username_stripped).first()
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username is already taken."
        )

    # ==========================
    # Check if email already exists
    # ==========================
    existing_user = db.query(User).filter(User.email == email_stripped).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists."
        )

    # ==========================
    # Hash Password
    # ==========================
    hashed_password = pwd_context.hash(password)

    # ==========================
    # Create New User
    # ==========================
    new_user = User(
        username=username_stripped,
        email=email_stripped,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully.",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email
        }
    }


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    email_stripped = email.strip()
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

    # Generate JWT access token
    access_token = create_access_token(data={"sub": user.email, "id": user.id})

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }