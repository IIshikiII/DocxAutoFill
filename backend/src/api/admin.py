"""Admin endpoints: manage users and inspect their templates (Stage 12).

Every route requires an administrator (``require_admin``).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.deps import require_admin
from api.dto import (
    AdminTemplateDTO,
    CreateUserRequest,
    SetPasswordRequest,
    UserWithStats,
)
from db.base import get_db
from db.models import Role, Template, User
from services import auth_service, template_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


def _require_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.get("/users", response_model=list[UserWithStats])
def list_users(db: Session = Depends(get_db)) -> list[UserWithStats]:
    rows = db.execute(
        select(Template.user_id, func.count(Template.id)).group_by(Template.user_id)
    ).all()
    counts: dict[int, int] = {user_id: count for user_id, count in rows}
    users = db.scalars(select(User).order_by(User.created_at)).all()
    return [
        UserWithStats(
            id=u.id,
            username=u.username,
            role=u.role.value,
            is_active=u.is_active,
            template_count=counts.get(u.id, 0),
        )
        for u in users
    ]


@router.post("/users", response_model=UserWithStats, status_code=201)
def create_user(payload: CreateUserRequest, db: Session = Depends(get_db)) -> UserWithStats:
    user = auth_service.create_user(db, payload.username, payload.password, role=Role.user)
    logger.info("Admin created user '%s'", user.username)
    return UserWithStats(
        id=user.id,
        username=user.username,
        role=user.role.value,
        is_active=user.is_active,
        template_count=0,
    )


@router.post("/users/{user_id}/password")
def reset_password(
    user_id: int,
    payload: SetPasswordRequest,
    db: Session = Depends(get_db),
) -> dict:
    user = _require_user(db, user_id)
    auth_service.set_password(db, user, payload.password)
    logger.info("Admin reset password for user '%s'", user.username)
    return {"status": "ok"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    user = _require_user(db, user_id)
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить собственную учётную запись")
    if user.role == Role.admin:
        admin_count = db.scalar(select(func.count(User.id)).where(User.role == Role.admin))
        if (admin_count or 0) <= 1:
            raise HTTPException(status_code=400, detail="Нельзя удалить последнего администратора")
    auth_service.delete_user(db, user)
    logger.info("Admin deleted user '%s'", user.username)
    return {"status": "deleted"}


@router.get("/users/{user_id}/templates", response_model=list[AdminTemplateDTO])
def list_user_templates(user_id: int, db: Session = Depends(get_db)) -> list[AdminTemplateDTO]:
    user = _require_user(db, user_id)
    return [
        AdminTemplateDTO(id=t.id, name=t.name, connection_count=len(t.connections))
        for t in template_service.list_user_templates(db, user)
    ]


@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)) -> dict:
    existed = template_service.delete_template_by_id(db, template_id)
    if not existed:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    return {"status": "deleted"}
