"""ORM models: users, sessions and per-user connection templates (Stage 12)."""

from __future__ import annotations

import datetime as dt
import enum

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


def _utcnow() -> dt.datetime:
    # Naive UTC: stored and compared consistently across SQLite (which drops
    # tzinfo) and PostgreSQL, avoiding aware/naive comparison errors.
    return dt.datetime.now(dt.UTC).replace(tzinfo=None)


class Role(str, enum.Enum):
    """Access role. ``admin`` can manage users; both roles use the app."""

    admin = "admin"
    user = "user"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role, native_enum=False), default=Role.user)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_utcnow)

    templates: Mapped[list[Template]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    sessions: Mapped[list[SessionToken]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class SessionToken(Base):
    """A server-side session. Only the SHA-256 of the cookie token is stored,
    so a database leak does not expose usable session tokens."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_utcnow)
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime)

    user: Mapped[User] = relationship(back_populates="sessions")


class Template(Base):
    """A named connection template owned by a single user."""

    __tablename__ = "templates"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_template_owner_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    # List of signature-based connections (see domain/connection_template.py).
    connections: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    owner: Mapped[User] = relationship(back_populates="templates")
