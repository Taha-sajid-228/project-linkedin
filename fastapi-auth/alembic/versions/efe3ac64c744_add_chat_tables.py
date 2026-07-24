"""add chat tables

Revision ID: efe3ac64c744
Revises: 65c696ffaf3c
Create Date: 2026-07-24 12:22:21.305255
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Revision identifiers used by Alembic.
revision: str = "efe3ac64c744"
down_revision: Union[str, Sequence[str], None] = "65c696ffaf3c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create chat-related tables."""

    # ==========================
    # Conversations
    # ==========================

    op.create_table(
        "conversations",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now()
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now()
        ),

        sa.PrimaryKeyConstraint("id")
    )

    op.create_index(
        "ix_conversations_id",
        "conversations",
        ["id"],
        unique=False
    )

    # ==========================
    # Conversation Participants
    # ==========================

    op.create_table(
        "conversation_participants",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "conversation_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "joined_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now()
        ),

        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE"
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE"
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint(
            "conversation_id",
            "user_id",
            name="unique_conversation_participant"
        )
    )

    op.create_index(
        "ix_conversation_participants_id",
        "conversation_participants",
        ["id"],
        unique=False
    )

    op.create_index(
        "index_conversation_participants_conversation_id",
        "conversation_participants",
        ["conversation_id"],
        unique=False
    )

    op.create_index(
        "index_conversation_participants_user_id",
        "conversation_participants",
        ["user_id"],
        unique=False
    )

    # ==========================
    # Messages
    # ==========================

    op.create_table(
        "messages",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "conversation_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "sender_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "content",
            sa.Text(),
            nullable=False
        ),

        sa.Column(
            "is_delivered",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        ),

        sa.Column(
            "delivered_at",
            sa.DateTime(),
            nullable=True
        ),

        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        ),

        sa.Column(
            "read_at",
            sa.DateTime(),
            nullable=True
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now()
        ),

        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE"
        ),

        sa.ForeignKeyConstraint(
            ["sender_id"],
            ["users.id"],
            ondelete="CASCADE"
        ),

        sa.PrimaryKeyConstraint("id")
    )

    op.create_index(
        "ix_messages_id",
        "messages",
        ["id"],
        unique=False
    )

    op.create_index(
        "index_messages_conversation_id",
        "messages",
        ["conversation_id"],
        unique=False
    )

    op.create_index(
        "index_messages_sender_id",
        "messages",
        ["sender_id"],
        unique=False
    )

    op.create_index(
        "index_messages_conversation_created_at",
        "messages",
        ["conversation_id", "created_at"],
        unique=False
    )

    op.create_index(
        "index_messages_conversation_read_status",
        "messages",
        ["conversation_id", "is_read"],
        unique=False
    )


def downgrade() -> None:
    """Remove chat-related tables."""

    op.drop_index(
        "index_messages_conversation_read_status",
        table_name="messages"
    )

    op.drop_index(
        "index_messages_conversation_created_at",
        table_name="messages"
    )

    op.drop_index(
        "index_messages_sender_id",
        table_name="messages"
    )

    op.drop_index(
        "index_messages_conversation_id",
        table_name="messages"
    )

    op.drop_index(
        "ix_messages_id",
        table_name="messages"
    )

    op.drop_table("messages")

    op.drop_index(
        "index_conversation_participants_user_id",
        table_name="conversation_participants"
    )

    op.drop_index(
        "index_conversation_participants_conversation_id",
        table_name="conversation_participants"
    )

    op.drop_index(
        "ix_conversation_participants_id",
        table_name="conversation_participants"
    )

    op.drop_table("conversation_participants")

    op.drop_index(
        "ix_conversations_id",
        table_name="conversations"
    )

    op.drop_table("conversations")