"""Database initialization: create tables and seed the admin (Stage 12)."""

from __future__ import annotations

import logging
import time

from sqlalchemy.exc import OperationalError

from db import base, models  # noqa: F401  (import models to register tables)
from services.auth_service import seed_admin

logger = logging.getLogger(__name__)


def init_db(retries: int = 15, delay: float = 2.0) -> None:
    """Create tables (waiting for the DB to come up) and seed the admin.

    The retry loop matters in docker-compose, where the backend can start
    before PostgreSQL is ready to accept connections.
    """
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            base.Base.metadata.create_all(bind=base.engine)
            break
        except OperationalError as exc:  # DB not ready yet
            last_exc = exc
            logger.warning(
                "Database not ready (attempt %d/%d): %s",
                attempt,
                retries,
                base.safe_url(str(base.engine.url)),
            )
            time.sleep(delay)
    else:
        assert last_exc is not None
        raise last_exc

    with base.SessionLocal() as db:
        seed_admin(db)
