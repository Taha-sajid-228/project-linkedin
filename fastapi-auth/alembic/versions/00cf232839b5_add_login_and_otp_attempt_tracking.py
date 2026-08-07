"""add login and otp attempt tracking

Revision ID: 00cf232839b5
Revises: f8e8d33d52c8
Create Date: 2026-08-06 17:23:43.138585

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '00cf232839b5'
down_revision: Union[str, Sequence[str], None] = 'f8e8d33d52c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('account_locked_until', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('otp_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('reset_otp_attempts', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'reset_otp_attempts')
    op.drop_column('users', 'otp_attempts')
    op.drop_column('users', 'account_locked_until')
    op.drop_column('users', 'failed_login_attempts')