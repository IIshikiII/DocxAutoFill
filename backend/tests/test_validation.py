from types import SimpleNamespace

import pytest

from services.validation import validate_excel, validate_words


def _file(filename):
    return SimpleNamespace(filename=filename)


def test_validate_excel_accepts_xlsx():
    validate_excel(_file("data.xlsx"))  # should not raise


def test_validate_excel_rejects_missing():
    with pytest.raises(ValueError, match="Не приложен файл Excel"):
        validate_excel(None)


def test_validate_excel_rejects_wrong_extension():
    with pytest.raises(ValueError, match="расширение"):
        validate_excel(_file("data.csv"))


def test_validate_words_accepts_docx():
    validate_words([_file("a.docx"), _file("b.doc")])  # should not raise


def test_validate_words_rejects_empty():
    with pytest.raises(ValueError, match="ни один файл Word"):
        validate_words([])


def test_validate_words_rejects_wrong_extension():
    with pytest.raises(ValueError, match="расширение"):
        validate_words([_file("a.docx"), _file("notes.txt")])
