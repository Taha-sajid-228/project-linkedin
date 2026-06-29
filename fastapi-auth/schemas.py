from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    name: Optional[str] = None
    role: str
    is_verified: bool
    provider: str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True