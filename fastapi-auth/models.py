from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    name = Column(
        String,
        nullable=True
    )

    password = Column(
        String,
        nullable=True
    )

    role = Column(
        String,
        default="user",
        nullable=False
    )

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False
    )

    otp_code = Column(
        String,
        nullable=True
    )

    otp_expires_at = Column(
        DateTime,
        nullable=True
    )

    reset_otp = Column(
        String,
        nullable=True
    )

    reset_otp_expires_at = Column(
        DateTime,
        nullable=True
    )

    provider = Column(
        String,
        default="email",
        nullable=False
    )

    provider_id = Column(
        String,
        nullable=True
    )

    profile_picture = Column(
        String,
        nullable=True
    )

    bio = Column(
        Text,
        nullable=True
    )

    posts = relationship(
        "Post",
        back_populates="author",
        cascade="all, delete"
    )

    likes = relationship(
        "Like",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    comments = relationship(
        "Comment",
        back_populates="author",
        cascade="all, delete-orphan"
    )

    # Records where this user follows another user.
    # Example:
    # current_user.following_relationships
    following_relationships = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan"
    )

    # Records where another user follows this user.
    # Example:
    # current_user.follower_relationships
    follower_relationships = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following",
        cascade="all, delete-orphan"
    )


class Follow(Base):
    __tablename__ = "follows"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # The user who presses the Follow button.
    follower_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    # The user who is being followed.
    following_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    follower = relationship(
        "User",
        foreign_keys=[follower_id],
        back_populates="following_relationships"
    )

    following = relationship(
        "User",
        foreign_keys=[following_id],
        back_populates="follower_relationships"
    )

    __table_args__ = (
        # One user cannot follow the same user more than once.
        UniqueConstraint(
            "follower_id",
            "following_id",
            name="unique_follower_following"
        ),

        # Makes follower-list queries faster.
        Index(
            "index_follows_follower_id",
            "follower_id"
        ),

        # Makes following-list queries faster.
        Index(
            "index_follows_following_id",
            "following_id"
        ),
    )


class Post(Base):
    __tablename__ = "posts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    content = Column(
        Text,
        nullable=True
    )

    author_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    is_archived = Column(
        Boolean,
        default=False,
        nullable=False
    )

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False
    )

    # A repost stores the ID of its original post here.
    # Original posts have original_post_id = None.
    original_post_id = Column(
        Integer,
        ForeignKey("posts.id"),
        nullable=True,
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    author = relationship(
        "User",
        foreign_keys=[author_id],
        back_populates="posts"
    )

    # From a repost, access its original post:
    # repost.original_post
    original_post = relationship(
        "Post",
        remote_side=[id],
        foreign_keys=[original_post_id],
        back_populates="reposts"
    )

    # From an original post, access all of its reposts:
    # original_post.reposts
    reposts = relationship(
        "Post",
        foreign_keys=[original_post_id],
        back_populates="original_post"
    )

    media = relationship(
        "PostMedia",
        back_populates="post",
        cascade="all, delete-orphan"
    )

    likes = relationship(
        "Like",
        back_populates="post",
        cascade="all, delete-orphan"
    )

    comments = relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan"
    )


class PostMedia(Base):
    __tablename__ = "post_media"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    post_id = Column(
        Integer,
        ForeignKey("posts.id"),
        nullable=False
    )

    file_url = Column(
        String,
        nullable=False
    )

    file_type = Column(
        String,
        nullable=False,
        default="image"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    post = relationship(
        "Post",
        back_populates="media"
    )


class Like(Base):
    __tablename__ = "likes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    post_id = Column(
        Integer,
        ForeignKey("posts.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="likes"
    )

    post = relationship(
        "Post",
        back_populates="likes"
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "post_id",
            name="unique_user_post_like"
        ),
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    content = Column(
        Text,
        nullable=False
    )

    author_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    post_id = Column(
        Integer,
        ForeignKey("posts.id"),
        nullable=False
    )

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    author = relationship(
        "User",
        back_populates="comments"
    )

    post = relationship(
        "Post",
        back_populates="comments"
    )