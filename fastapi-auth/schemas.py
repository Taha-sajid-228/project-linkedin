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
# We use this in followers/following and friendship lists
# instead of returning private fields such as email and role.
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
# Friendship Schemas
# ==========================

# Used when sending, receiving, accepting or rejecting
# a friend request.
class FriendshipResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    sender: PublicUserResponse
    receiver: PublicUserResponse

    class Config:
        from_attributes = True


# Used for received and sent friend-request lists.
class FriendRequestListResponse(BaseModel):
    requests: List[FriendshipResponse] = Field(default_factory=list)
    total: int


# One item returned inside GET /friends.
class FriendListItemResponse(BaseModel):
    friendship_id: int
    friends_since: datetime
    user: PublicUserResponse


# Complete response returned by GET /friends.
class FriendsListResponse(BaseModel):
    friends: List[FriendListItemResponse] = Field(default_factory=list)
    total: int


# Simple response for actions such as:
# request sent, request accepted, request rejected,
# request cancelled and friend removed.
class FriendshipActionResponse(BaseModel):
    message: str
    friendship_id: Optional[int] = None
    status: Optional[str] = None


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


class FeedResponse(BaseModel):
    posts: List[PostResponse] = Field(default_factory=list)
    page: int
    limit: int
    has_more: bool
    next_page: Optional[int] = None


PostResponse.model_rebuild()