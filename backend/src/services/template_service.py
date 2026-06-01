"""Per-user connection templates, backed by the database (Stage 12).

Replaces the previous in-memory store: templates now belong to a user and
persist across restarts. The signature build/resolve logic still lives in
``domain/connection_template.py``.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from db.models import Template, User
from domain.connection_template import (
    build_template_connections,
    resolve_template_connections,
)


def list_templates(db: Session, user: User) -> list[Template]:
    return list(
        db.scalars(select(Template).where(Template.user_id == user.id).order_by(Template.name))
    )


def get_template(db: Session, user: User, name: str) -> Template | None:
    return db.scalar(select(Template).where(Template.user_id == user.id, Template.name == name))


def save_template(db: Session, user: User, name: str, graph: dict) -> Template:
    """Create or overwrite the user's template built from the given graph."""
    name = name.strip()
    if not name:
        raise ValueError("Не указано название шаблона")

    connections = build_template_connections(graph["nodes"], graph["connections"])
    if not connections:
        raise ValueError("Нет связей для сохранения в шаблон")

    template = get_template(db, user, name)
    if template is None:
        template = Template(user_id=user.id, name=name, connections=connections)
        db.add(template)
    else:
        template.connections = connections
    db.commit()
    db.refresh(template)
    return template


def apply_template(db: Session, user: User, name: str, nodes: list[dict]) -> dict:
    """Resolve a stored template against the current nodes into concrete edges."""
    template = get_template(db, user, name)
    if template is None:
        raise ValueError(f"Шаблон «{name}» не найден")
    return resolve_template_connections(template.connections, nodes)


def delete_template(db: Session, user: User, name: str) -> None:
    template = get_template(db, user, name)
    if template is not None:
        db.delete(template)
        db.commit()


# --- admin-only access across users ------------------------------------------


def list_user_templates(db: Session, owner: User) -> list[Template]:
    """List a specific user's templates (admin view)."""
    return list_templates(db, owner)


def delete_template_by_id(db: Session, template_id: int) -> bool:
    """Delete any template by id (admin). Returns whether it existed."""
    template = db.get(Template, template_id)
    if template is None:
        return False
    db.delete(template)
    db.commit()
    return True
