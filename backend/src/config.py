from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, overridable via ``DOCXAUTOFILL_*`` env vars."""

    model_config = SettingsConfigDict(env_prefix="DOCXAUTOFILL_", env_file=".env")

    host: str = "0.0.0.0"
    port: int = 3000

    # CORS allowed origins. Defaults to "*" for local dev; set an explicit list in prod.
    cors_origins: list[str] = ["*"]

    # Upload limits and recognized extensions.
    max_upload_bytes: int = 50 * 1024 * 1024
    excel_extensions: tuple[str, ...] = (".xls", ".xlsx")
    word_extensions: tuple[str, ...] = (".doc", ".docx")

    # Names used when building the output archive tree.
    merged_dir_name: str = "1_объединенные файлы"


settings = Settings()
