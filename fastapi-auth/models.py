from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # OAuth + normal signup fields
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)

    # Null for Google/GitHub users
    password = Column(String, nullable=True)

    # Role
    role = Column(String, default="user", nullable=False)

    # OTP verification
    is_verified = Column(Boolean, default=False, nullable=False)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # Password reset
    reset_otp = Column(String, nullable=True)
    reset_otp_expires_at = Column(DateTime, nullable=True)

    # OAuth
    provider = Column(String, default="email", nullable=False)
    provider_id = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)