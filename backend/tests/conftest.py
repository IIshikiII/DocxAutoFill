"""Shared fixtures for API integration tests.

Builds tiny in-memory Excel and Word files so the endpoints can be exercised
end-to-end without checked-in binary fixtures.
"""

import io

import pandas as pd
import pytest
from docx import Document
from fastapi.testclient import TestClient

from app import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


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
