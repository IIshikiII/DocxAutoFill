"""Input validation for uploaded files (Stage 4).

Raises ``ValueError`` with a human-readable message; the API layer maps these
to ``400 Bad Request`` responses.
"""

from fastapi import UploadFile

from config import settings


def _has_allowed_extension(filename: str | None, extensions: tuple[str, ...]) -> bool:
    if not filename:
        return False
    return filename.lower().endswith(extensions)


def validate_excel(excel: UploadFile | None) -> None:
    if excel is None or not excel.filename:
        raise ValueError("Не приложен файл Excel")
    if not _has_allowed_extension(excel.filename, settings.excel_extensions):
        allowed = ", ".join(settings.excel_extensions)
        raise ValueError(f"Файл Excel должен иметь расширение {allowed}")


def validate_words(words: list[UploadFile]) -> None:
    if not words:
        raise ValueError("Не приложен ни один файл Word")
    for word in words:
        if not _has_allowed_extension(word.filename, settings.word_extensions):
            allowed = ", ".join(settings.word_extensions)
            raise ValueError(f"Файл Word '{word.filename}' должен иметь расширение {allowed}")
