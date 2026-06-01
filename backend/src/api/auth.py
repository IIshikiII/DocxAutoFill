"""Authentication endpoints: login, logout, current user (Stage 12)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from api.deps import get_current_user
from api.dto import LoginRequest, UserDTO
from config import settings
from db.base import get_db
from db.models import User
from infra.rate_limit import LoginRateLimiter
from services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth")

_limiter = LoginRateLimiter(
    max_attempts=settings.login_max_attempts,
    window_seconds=settings.login_window_seconds,
)


def _user_dto(user: User) -> UserDTO:
    return UserDTO(
        id=user.id,
        username=user.username,
        role=user.role.value,
        is_active=user.is_active,
    )


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.cookie_name,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )


@router.post("/login", response_model=UserDTO)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> UserDTO:
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{payload.username}|{client_ip}"

    if _limiter.is_blocked(rate_key):
        raise HTTPException(
            status_code=429,
            detail="Слишком много попыток входа. Повторите позже.",
        )

    user = auth_service.authenticate(db, payload.username, payload.password)
    if user is None:
        _limiter.record_failure(rate_key)
        # Generic message — do not reveal whether the username exists.
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    _limiter.reset(rate_key)
    token = auth_service.create_session(db, user)
    _set_session_cookie(response, token)
    logger.info("User '%s' logged in", user.username)
    return _user_dto(user)


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    token = request.cookies.get(settings.cookie_name, "")
    auth_service.delete_session(db, token)
    _clear_session_cookie(response)
    return {"status": "ok"}


@router.get("/me", response_model=UserDTO)
def me(user: User = Depends(get_current_user)) -> UserDTO:
    return _user_dto(user)
