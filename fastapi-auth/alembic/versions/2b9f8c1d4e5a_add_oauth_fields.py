"""add oauth fields

Revision ID: 2b9f8c1d4e5a
Revises: 1741c87de1ab
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2b9f8c1d4e5a"
down_revision: Union[str, Sequence[str], None] = "1741c87de1ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "password", existing_type=sa.String(), nullable=True)
    op.alter_column("users", "username", existing_type=sa.String(), nullable=False)

    op.add_column("users", sa.Column("provider", sa.String(), nullable=False, server_default="email"))
    op.add_column("users", sa.Column("provider_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("profile_picture", sa.String(), nullable=True))

    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.alter_column("users", "provider", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")

    op.drop_column("users", "profile_picture")
    op.drop_column("users", "provider_id")
    op.drop_column("users", "provider")

    op.alter_column("users", "password", existing_type=sa.String(), nullable=False)
