from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)

    password = Column(String, nullable=True)

    role = Column(String, default="user", nullable=False)

    is_verified = Column(Boolean, default=False, nullable=False)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    reset_otp = Column(String, nullable=True)
    reset_otp_expires_at = Column(DateTime, nullable=True)

    provider = Column(String, default="email", nullable=False)
    provider_id = Column(String, nullable=True)

    profile_picture = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    posts = relationship(
        "Post",
        back_populates="author",
        cascade="all, delete"
    )


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    content = Column(Text, nullable=True)

    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    is_archived = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    original_post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    author = relationship(
        "User",
        foreign_keys=[author_id],
        back_populates="posts"
    )

    original_post = relationship(
        "Post",
        remote_side=[id],
        foreign_keys=[original_post_id]
    )

    media = relationship(
        "PostMedia",
        back_populates="post",
        cascade="all, delete-orphan"
    )


class PostMedia(Base):
    __tablename__ = "post_media"

    id = Column(Integer, primary_key=True, index=True)

    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)

    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=False, default="image")

    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship(
        "Post",
        back_populates="media"
    )
