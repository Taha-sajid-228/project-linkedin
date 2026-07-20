"""create friendships table

Revision ID: 65c696ffaf3c
Revises: 2b9f8c1d4e5a
Create Date: 2026-07-20 15:39:58.885265
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Revision identifiers used by Alembic.
revision: str = "65c696ffaf3c"
down_revision: Union[str, Sequence[str], None] = "2b9f8c1d4e5a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the friendships table."""

    op.create_table(
        "friendships",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "sender_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "receiver_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "status",
            sa.String(),
            nullable=False,
            server_default="pending"
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

        sa.CheckConstraint(
            "sender_id != receiver_id",
            name="check_friendship_not_self"
        ),

        sa.CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name="check_friendship_valid_status"
        ),

        sa.ForeignKeyConstraint(
            ["sender_id"],
            ["users.id"],
            ondelete="CASCADE"
        ),

        sa.ForeignKeyConstraint(
            ["receiver_id"],
            ["users.id"],
            ondelete="CASCADE"
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "sender_id",
            "receiver_id",
            name="unique_friendship_sender_receiver"
        )
    )

    op.create_index(
        "index_friendships_sender_id",
        "friendships",
        ["sender_id"],
        unique=False
    )

    op.create_index(
        "index_friendships_receiver_id",
        "friendships",
        ["receiver_id"],
        unique=False
    )

    op.create_index(
        "index_friendships_status",
        "friendships",
        ["status"],
        unique=False
    )


def downgrade() -> None:
    """Remove the friendships table."""

    op.drop_index(
        "index_friendships_status",
        table_name="friendships"
    )

    op.drop_index(
        "index_friendships_receiver_id",
        table_name="friendships"
    )

    op.drop_index(
        "index_friendships_sender_id",
        table_name="friendships"
    )

    op.drop_table(
        "friendships"
    )