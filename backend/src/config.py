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

    # Default names used when building the output archive tree. Both are
    # overridable per request via the graph's ``options`` (see ArchiveOptions);
    # these are the fallbacks when the request omits them.
    merged_dir_name: str = "1_объединенные файлы"
    # Template for a merged file's name; the ``<…>`` placeholder is replaced
    # with the source template's base name (without ``.docx``).
    merged_file_template: str = "Объединённый_<файл>.docx"


settings = Settings()
