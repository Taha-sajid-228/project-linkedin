"""add admin user management fields

Revision ID: f8e8d33d52c8
Revises: efe3ac64c744
Create Date: 2026-07-28 17:01:41.935950

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f8e8d33d52c8"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "efe3ac64c744"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    """Add fields required for admin user management."""

    # Boolean fields use temporary database defaults so that
    # existing users receive valid values during migration.
    op.add_column(
        "users",
        sa.Column(
            "is_blocked",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "blocked_at",
            sa.DateTime(),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "deleted_at",
            sa.DateTime(),
            nullable=True,
        ),
    )

    # created_at and updated_at use NOW() so existing users
    # receive a timestamp instead of causing a NOT NULL error.
    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # Remove temporary defaults.
    # Future values will be handled by the SQLAlchemy model.
    op.alter_column(
        "users",
        "is_blocked",
        server_default=None,
    )

    op.alter_column(
        "users",
        "is_deleted",
        server_default=None,
    )

    op.alter_column(
        "users",
        "created_at",
        server_default=None,
    )

    op.alter_column(
        "users",
        "updated_at",
        server_default=None,
    )

    # Useful for admin filters and signup statistics.
    op.create_index(
        "ix_users_is_blocked",
        "users",
        ["is_blocked"],
        unique=False,
    )

    op.create_index(
        "ix_users_is_deleted",
        "users",
        ["is_deleted"],
        unique=False,
    )

    op.create_index(
        "ix_users_created_at",
        "users",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    """Remove admin user management fields."""

    op.drop_index(
        "ix_users_created_at",
        table_name="users",
    )

    op.drop_index(
        "ix_users_is_deleted",
        table_name="users",
    )

    op.drop_index(
        "ix_users_is_blocked",
        table_name="users",
    )

    op.drop_column(
        "users",
        "updated_at",
    )

    op.drop_column(
        "users",
        "created_at",
    )

    op.drop_column(
        "users",
        "deleted_at",
    )

    op.drop_column(
        "users",
        "blocked_at",
    )

    op.drop_column(
        "users",
        "is_deleted",
    )

    op.drop_column(
        "users",
        "is_blocked",
    )