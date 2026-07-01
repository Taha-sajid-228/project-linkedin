
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


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
    bio: Optional[str] = None

    class Config:
        from_attributes = True


# Small user object used inside posts
class PostAuthorResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True


class PostMediaResponse(BaseModel):
    id: int
    file_url: str
    file_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    content: Optional[str] = None
    original_post_id: Optional[int] = None


class PostUpdate(BaseModel):
    content: Optional[str] = None
    is_archived: Optional[bool] = None


class PostResponse(BaseModel):
    id: int
    content: Optional[str] = None

    author_id: int
    author: PostAuthorResponse

    is_archived: bool
    is_deleted: bool

    original_post_id: Optional[int] = None

    created_at: datetime
    updated_at: datetime

    media: List[PostMediaResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
