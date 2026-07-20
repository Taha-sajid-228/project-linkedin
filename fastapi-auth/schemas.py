from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ==========================
# User Schemas
# ==========================

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


# Lightweight public user schema.
# We use this in followers/following lists instead of returning
# private fields such as email, role, provider and verification status.
class PublicUserResponse(BaseModel):
    id: int
    username: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True


# User data returned by GET /users for the Discover People page.
class DiscoverUserResponse(PublicUserResponse):
    is_following: bool = False
    followers_count: int = 0


class DiscoverUsersResponse(BaseModel):
    users: List[DiscoverUserResponse] = Field(default_factory=list)
    total: int
    limit: int
    offset: int
    has_more: bool


class PostAuthorResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================
# Follow Schemas
# ==========================

class FollowActionResponse(BaseModel):
    message: str
    is_following: bool
    followers_count: int


class FollowStatusResponse(BaseModel):
    user_id: int
    is_following: bool
    followers_count: int
    following_count: int


class FollowListItemResponse(BaseModel):
    relationship_id: int
    followed_at: datetime
    user: PublicUserResponse


class FollowListResponse(BaseModel):
    users: List[FollowListItemResponse] = Field(default_factory=list)
    total: int
    limit: int
    offset: int
    has_more: bool


# ==========================
# Post Media Schemas
# ==========================

class PostMediaResponse(BaseModel):
    id: int
    file_url: str
    file_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================
# Comment Schemas
# ==========================

class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentAuthorResponse(BaseModel):
    id: int
    username: str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: int
    content: str
    author_id: int
    post_id: int
    created_at: datetime
    updated_at: datetime
    author: CommentAuthorResponse

    class Config:
        from_attributes = True


# ==========================
# Post Schemas
# ==========================

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
    original_post: Optional["PostResponse"] = None
    created_at: datetime
    updated_at: datetime
    media: List[PostMediaResponse] = Field(default_factory=list)
    likes_count: int = 0
    is_liked_by_me: bool = False
    comments_count: int = 0
    reshare_count: int = 0

    class Config:
        from_attributes = True


PostResponse.model_rebuild()