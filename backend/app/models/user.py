from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, Integer, String
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(
        sa_column=Column(String(255), unique=True, index=True, nullable=False),
    )
    full_name: str = Field(sa_column=Column(String(255), nullable=False))
    student_id: str = Field(
        sa_column=Column(String(64), unique=True, index=True, nullable=False),
    )
    filiere: str = Field(sa_column=Column(String(100), nullable=False))
    cycle: str = Field(sa_column=Column(String(32), nullable=False))
    year: int = Field(sa_column=Column(Integer, nullable=False))
    role: str = Field(
        default="student",
        sa_column=Column(String(32), nullable=False, server_default="student"),
    )
    password_hash: str = Field(sa_column=Column(String(255), nullable=False))
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class RefreshTokenBlacklist(SQLModel, table=True):
    __tablename__ = "refresh_token_blacklist"

    id: Optional[int] = Field(default=None, primary_key=True)
    jti: str = Field(
        sa_column=Column(String(64), unique=True, index=True, nullable=False),
    )
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
