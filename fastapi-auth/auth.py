from fastapi import APIRouter, Form, HTTPException, Depends
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models import User

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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

    # Username validation
    if len(username.strip()) < 6:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 6 characters long."
        )

    # Email validation
    if "@" not in email or not email.endswith(".com"):
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
    # Check if user already exists
    # ==========================
    existing_user = db.query(User).filter(User.email == email).first()

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
        username=username,
        email=email,
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
    user = db.query(User).filter(User.email == email).first()

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

    return {
        "message": "Login successful.",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }