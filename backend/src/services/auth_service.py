"""Authentication and account management (Stage 12).

Security model:
* Passwords are hashed with Argon2id (``argon2-cffi``), never stored in clear.
* Sessions are opaque random tokens; only their SHA-256 is stored, so the DB
  alone cannot be turned into a valid session.
* Login errors are deliberately generic (no username enumeration).
"""

from __future__ import annotations

import datetime as dt
import hashlib
import logging
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from db.models import Role, SessionToken, User

logger = logging.getLogger(__name__)

_hasher = PasswordHasher()


def _utcnow() -> dt.datetime:
    # Naive UTC to match the DateTime columns (see db/models.py).
    return dt.datetime.now(dt.UTC).replace(tzinfo=None)


# --- passwords ---------------------------------------------------------------


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (Argon2Error, ValueError):
        return False


def validate_password_strength(password: str) -> None:
    """Reject obviously weak passwords. Raises ValueError on failure."""
    if len(password) < 8:
        raise ValueError("Пароль должен содержать минимум 8 символов")


# --- session tokens ----------------------------------------------------------


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(db: Session, user: User) -> str:
    """Create a session for ``user`` and return the raw cookie token."""
    token = secrets.token_urlsafe(32)
    record = SessionToken(
        token_hash=_hash_token(token),
        user_id=user.id,
        expires_at=_utcnow() + dt.timedelta(seconds=settings.session_ttl_seconds),
    )
    db.add(record)
    db.commit()
    return token


def get_session_user(db: Session, token: str) -> User | None:
    """Resolve a cookie token to its active user, or None if invalid/expired."""
    if not token:
        return None
    record = db.scalar(select(SessionToken).where(SessionToken.token_hash == _hash_token(token)))
    if record is None:
        return None
    if record.expires_at <= _utcnow():
        db.delete(record)
        db.commit()
        return None
    user = record.user
    if user is None or not user.is_active:
        return None
    return user


def delete_session(db: Session, token: str) -> None:
    """Invalidate a single session (logout)."""
    if not token:
        return
    record = db.scalar(select(SessionToken).where(SessionToken.token_hash == _hash_token(token)))
    if record is not None:
        db.delete(record)
        db.commit()


# --- user management ---------------------------------------------------------


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username))


def authenticate(db: Session, username: str, password: str) -> User | None:
    """Return the user on valid credentials, else None (generic failure)."""
    user = get_user_by_username(db, username)
    if user is None or not user.is_active:
        # Still run a hash to keep timing roughly constant against enumeration.
        _hasher.hash(password)
        return None
    if not verify_password(user.password_hash, password):
        return None
    return user


def create_user(db: Session, username: str, password: str, role: Role = Role.user) -> User:
    username = username.strip()
    if not username:
        raise ValueError("Не указан логин")
    validate_password_strength(password)
    if get_user_by_username(db, username) is not None:
        raise ValueError("Пользователь с таким логином уже существует")
    user = User(username=username, password_hash=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def set_password(db: Session, user: User, password: str) -> None:
    validate_password_strength(password)
    user.password_hash = hash_password(password)
    # Invalidate existing sessions so a reset password forces re-login.
    for record in list(user.sessions):
        db.delete(record)
    db.commit()


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def seed_admin(db: Session) -> None:
    """Ensure the bootstrap admin account exists (created once, never reset)."""
    existing = get_user_by_username(db, settings.admin_username)
    if existing is not None:
        if existing.role != Role.admin:
            existing.role = Role.admin
            db.commit()
        return
    admin = User(
        username=settings.admin_username,
        password_hash=hash_password(settings.admin_password),
        role=Role.admin,
    )
    db.add(admin)
    db.commit()
    logger.info("Seeded bootstrap admin account '%s'", settings.admin_username)
