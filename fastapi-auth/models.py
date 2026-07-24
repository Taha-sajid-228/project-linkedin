from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
    CheckConstraint,
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
    following_relationships = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan"
    )

    # Records where another user follows this user.
    follower_relationships = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following",
        cascade="all, delete-orphan"
    )

    # Friend requests sent by this user.
    # Example:
    # current_user.sent_friend_requests
    sent_friend_requests = relationship(
        "Friendship",
        foreign_keys="Friendship.sender_id",
        back_populates="sender",
        cascade="all, delete-orphan"
    )

    # Friend requests received by this user.
    # Example:
    # current_user.received_friend_requests
    received_friend_requests = relationship(
        "Friendship",
        foreign_keys="Friendship.receiver_id",
        back_populates="receiver",
        cascade="all, delete-orphan"
    )


    # Conversations this user participates in.
    conversation_participations = relationship(
        "ConversationParticipant",
        foreign_keys="ConversationParticipant.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Messages sent by this user.
    sent_messages = relationship(
        "Message",
        foreign_keys="Message.sender_id",
        back_populates="sender",
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


class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # The user who sends the friend request.
    sender_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    # The user who receives the friend request.
    receiver_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    # Possible values:
    # pending, accepted, rejected
    status = Column(
        String,
        default="pending",
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

    sender = relationship(
        "User",
        foreign_keys=[sender_id],
        back_populates="sent_friend_requests"
    )

    receiver = relationship(
        "User",
        foreign_keys=[receiver_id],
        back_populates="received_friend_requests"
    )

    __table_args__ = (
        # Stops duplicate rows in the same direction.
        # Example:
        # User 1 -> User 2 cannot be stored twice.
        UniqueConstraint(
            "sender_id",
            "receiver_id",
            name="unique_friendship_sender_receiver"
        ),

        # A user cannot send a friend request to themselves.
        CheckConstraint(
            "sender_id != receiver_id",
            name="check_friendship_not_self"
        ),

        # Only these three statuses are allowed.
        CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name="check_friendship_valid_status"
        ),

        # Makes sent request queries faster.
        Index(
            "index_friendships_sender_id",
            "sender_id"
        ),

        # Makes received request queries faster.
        Index(
            "index_friendships_receiver_id",
            "receiver_id"
        ),

        # Makes queries filtered by status faster.
        Index(
            "index_friendships_status",
            "status"
        ),
    )


# ==========================
# Chat Models
# ==========================

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(
        Integer,
        primary_key=True,
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

    participants = relationship(
        "ConversationParticipant",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )

    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    conversation_id = Column(
        Integer,
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    joined_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    conversation = relationship(
        "Conversation",
        back_populates="participants"
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="conversation_participations"
    )

    __table_args__ = (
        # A user can only appear once in the same conversation.
        UniqueConstraint(
            "conversation_id",
            "user_id",
            name="unique_conversation_participant"
        ),

        Index(
            "index_conversation_participants_conversation_id",
            "conversation_id"
        ),

        Index(
            "index_conversation_participants_user_id",
            "user_id"
        ),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    conversation_id = Column(
        Integer,
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    sender_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )

    is_delivered = Column(
        Boolean,
        default=False,
        nullable=False
    )

    delivered_at = Column(
        DateTime,
        nullable=True
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False
    )

    read_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    conversation = relationship(
        "Conversation",
        back_populates="messages"
    )

    sender = relationship(
        "User",
        foreign_keys=[sender_id],
        back_populates="sent_messages"
    )

    __table_args__ = (
        Index(
            "index_messages_conversation_id",
            "conversation_id"
        ),

        Index(
            "index_messages_sender_id",
            "sender_id"
        ),

        # Useful for loading messages in chronological order.
        Index(
            "index_messages_conversation_created_at",
            "conversation_id",
            "created_at"
        ),

        # Useful for unread message queries.
        Index(
            "index_messages_conversation_read_status",
            "conversation_id",
            "is_read"
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