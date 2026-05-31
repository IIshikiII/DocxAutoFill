"""Parse an Excel sheet and Word templates into canvas nodes.

Stateless (Stage 3): files are read in memory only; nothing is persisted to
disk, so concurrent imports never interfere with one another.
"""

import io
import logging

import pandas as pd
from docxtpl import DocxTemplate
from fastapi import UploadFile

from services.validation import validate_excel, validate_words

logger = logging.getLogger(__name__)


async def import_nodes(excel: UploadFile | None, words: list[UploadFile]) -> dict:
    validate_excel(excel)
    validate_words(words)
    assert excel is not None  # guaranteed by validate_excel

    contents = await excel.read()
    df = pd.read_excel(io.BytesIO(contents), dtype=str)
    cols = df.columns.tolist()

    file_names = [w.filename for w in words]

    words_nodes = [
        {
            "id": f"v{i}",
            "type": "violet",
            "data": {"label": f"{name[:-5]} <название>.docx", "category": name},
        }
        for i, name in enumerate(file_names)
    ]
    cols_nodes = [
        {"id": f"g{i}", "type": "green", "data": {"label": col}} for i, col in enumerate(cols)
    ]

    word_fill_nodes = []
    for i, word_file in enumerate(words):
        content = await word_file.read()
        doc = DocxTemplate(io.BytesIO(content))
        for j, var in enumerate(doc.get_undeclared_template_variables()):
            word_fill_nodes.append(
                {
                    "id": f"{i}{j}",
                    "type": "blue",
                    "data": {"label": var, "category": word_file.filename},
                }
            )

    logger.info("Imported %d columns and %d templates", len(cols_nodes), len(file_names))

    return {
        "status": "success",
        "received": {"excel": excel.filename, "words": file_names},
        "nodes": [
            *words_nodes,
            *cols_nodes,
            *word_fill_nodes,
            {"id": "o1", "type": "orange", "data": {"label": "разбивать на папки"}},
        ],
    }
