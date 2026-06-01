from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, overridable via ``DOCXAUTOFILL_*`` env vars."""

    model_config = SettingsConfigDict(env_prefix="DOCXAUTOFILL_", env_file=".env")

    host: str = "0.0.0.0"
    port: int = 3000

    # CORS allowed origins. Must list explicit origins (not "*") because the
    # frontend sends credentials (the session cookie) — browsers reject "*"
    # with credentialed requests. Defaults to the local Vite dev server.
    cors_origins: list[str] = ["http://localhost:5173"]

    # Upload limits and recognized extensions.
    max_upload_bytes: int = 50 * 1024 * 1024
    excel_extensions: tuple[str, ...] = (".xls", ".xlsx")
    word_extensions: tuple[str, ...] = (".doc", ".docx")

    # Default names used when building the output archive tree. Both are
    # overridable per request via the graph's ``options`` (see ArchiveOptions);
    # these are the fallbacks when the request omits them.
    merged_dir_name: str = "1_объединенные файлы"
    # Template for a merged file's name; the ``<…>`` placeholder is replaced
    # with the source template's base name (without ``.docx``).
    merged_file_template: str = "Объединённый_<файл>.docx"

    # --- Persistence (Stage 12) ---
    # SQLAlchemy database URL. Defaults to a local SQLite file for development;
    # docker-compose sets a PostgreSQL URL. The SQLite path is relative to the
    # process working directory (``backend/src`` in local dev).
    database_url: str = "sqlite:///./data/app.db"

    # --- Auth / sessions (Stage 12) ---
    # Bootstrap admin account, created on startup if it does not exist yet.
    admin_username: str = "admin"
    admin_password: str = "change-me-now"

    # Session cookie settings. ``cookie_secure`` must be True in production
    # (HTTPS behind nginx); keep it False for local http development.
    session_ttl_seconds: int = 7 * 24 * 60 * 60  # 7 days
    cookie_name: str = "docxautofill_session"
    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    # Login throttling: lock an account/IP after this many failed attempts
    # within the rolling window (defense-in-depth against brute force).
    login_max_attempts: int = 10
    login_window_seconds: int = 300


settings = Settings()
