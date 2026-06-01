"""Shared FastAPI dependencies for authentication (Stage 12)."""

from __future__ import annotations

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from config import settings
from db.base import get_db
from db.models import Role, User
from services import auth_service


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Resolve the session cookie to the current user, or 401."""
    token = request.cookies.get(settings.cookie_name, "")
    user = auth_service.get_session_user(db, token)
    if user is None:
        raise HTTPException(status_code=401, detail="Требуется вход в систему")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Like ``get_current_user`` but restricted to administrators (403 else)."""
    if user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Доступ только для администратора")
    return user
