"""Shared fixtures for API integration tests.

An isolated SQLite database is configured via env vars *before* the app (and
its settings/engine) are imported, so tests never touch a real database. Each
test starts from clean tables with a freshly seeded admin account.
"""

import io
import os
import tempfile

import pandas as pd
import pytest
from docx import Document

# --- Configure an isolated test database before importing the app ---
_TMP_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_TMP_DB.close()
os.environ["DOCXAUTOFILL_DATABASE_URL"] = f"sqlite:///{_TMP_DB.name}"
os.environ["DOCXAUTOFILL_ADMIN_USERNAME"] = "admin"
os.environ["DOCXAUTOFILL_ADMIN_PASSWORD"] = "admin-password-123"
os.environ["DOCXAUTOFILL_CORS_ORIGINS"] = '["http://testserver"]'

from fastapi.testclient import TestClient  # noqa: E402

from app import app  # noqa: E402
from db import base, models  # noqa: E402,F401  (register tables)
from services.auth_service import seed_admin  # noqa: E402

ADMIN_PASSWORD = "admin-password-123"


@pytest.fixture(autouse=True)
def _fresh_db():
    """Reset tables and reseed the admin before every test."""
    base.Base.metadata.drop_all(bind=base.engine)
    base.Base.metadata.create_all(bind=base.engine)
    with base.SessionLocal() as db:
        seed_admin(db)
    yield
    base.Base.metadata.drop_all(bind=base.engine)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_client(client: TestClient) -> TestClient:
    """A client logged in as the seeded admin (cookie persists on the client)."""
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 200, response.text
    return client


@pytest.fixture
def excel_bytes() -> bytes:
    df = pd.DataFrame({"ФИО": ["Иванов", "Петров"], "Группа": ["A", "B"]})
    buffer = io.BytesIO()
    df.to_excel(buffer, index=False)
    return buffer.getvalue()


@pytest.fixture
def docx_bytes() -> bytes:
    """A template with a single Jinja variable ``name``."""
    document = Document()
    document.add_paragraph("{{ name }}")
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


@pytest.fixture
def upload_files(excel_bytes: bytes, docx_bytes: bytes):
    """Multipart ``files`` payload with one Excel and one Word template."""
    return [
        (
            "excel",
            (
                "data.xlsx",
                excel_bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ),
        ),
        (
            "words[]",
            (
                "tpl.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ),
        ),
    ]
