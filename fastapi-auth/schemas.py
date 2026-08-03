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


class PublicUserResponse(BaseModel):
    id: int
    username: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True


class DiscoverUserResponse(PublicUserResponse):
    is_following: bool = False
    follows_you: bool = False
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
    follows_you: bool = False
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


class FriendRequestListResponse(BaseModel):
    requests: List[FriendshipResponse] = Field(default_factory=list)
    total: int


class FriendListItemResponse(BaseModel):
    friendship_id: int
    friends_since: datetime
    user: PublicUserResponse


class FriendsListResponse(BaseModel):
    friends: List[FriendListItemResponse] = Field(default_factory=list)
    total: int


class FriendshipActionResponse(BaseModel):
    message: str
    friendship_id: Optional[int] = None
    status: Optional[str] = None


# ==========================
# Chat Schemas
# ==========================

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class MessageSenderResponse(BaseModel):
    id: int
    username: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_delivered: bool
    delivered_at: Optional[datetime] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    sender: MessageSenderResponse

    class Config:
        from_attributes = True


class ConversationUserResponse(BaseModel):
    id: int
    username: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True


class LastMessageResponse(BaseModel):
    id: int
    sender_id: int
    content: str
    is_delivered: bool
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    other_user: ConversationUserResponse
    last_message: Optional[LastMessageResponse] = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse] = Field(default_factory=list)
    total: int


class MessagesListResponse(BaseModel):
    messages: List[MessageResponse] = Field(default_factory=list)
    conversation_id: int
    limit: int
    has_more: bool
    next_before_id: Optional[int] = None


class ConversationActionResponse(BaseModel):
    message: str
    conversation: ConversationResponse


class MarkMessagesReadResponse(BaseModel):
    message: str
    conversation_id: int
    marked_read_count: int


class WebSocketMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class WebSocketEventResponse(BaseModel):
    type: str
    message: Optional[MessageResponse] = None
    conversation_id: Optional[int] = None
    detail: Optional[str] = None


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