"""SQLAlchemy engine, session factory and declarative base (Stage 12).

The database URL comes from ``settings.database_url`` (Postgres in docker, a
local SQLite file in development). ``get_db`` is the FastAPI dependency that
yields a request-scoped session and always closes it.
"""

from __future__ import annotations

import logging
import os
from collections.abc import Iterator
from urllib.parse import urlparse

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def _ensure_sqlite_dir(url: str) -> None:
    """Create the parent directory for a file-based SQLite database."""
    path = url.split("sqlite:///", 1)[-1]
    if path and path != ":memory:":
        directory = os.path.dirname(path)
        if directory:
            os.makedirs(directory, exist_ok=True)


def make_engine(url: str) -> Engine:
    """Build an engine with sensible per-backend options."""
    if url.startswith("sqlite"):
        _ensure_sqlite_dir(url)
        # check_same_thread=False lets the connection be used across the
        # threadpool FastAPI runs sync endpoints in.
        return create_engine(url, connect_args={"check_same_thread": False})
    # pool_pre_ping avoids handing out stale connections (e.g. after the DB
    # container restarts) — important for the "survives recreation" guarantee.
    return create_engine(url, pool_pre_ping=True)


engine: Engine = make_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def configure(url: str) -> None:
    """Rebind the engine/session factory to a new URL (used by tests)."""
    global engine, SessionLocal
    engine = make_engine(url)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: a request-scoped session, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def safe_url(url: str) -> str:
    """Return the URL with any password redacted, for logging."""
    try:
        parsed = urlparse(url)
        if parsed.password:
            return url.replace(parsed.password, "***")
    except ValueError:
        pass
    return url
