import io
import os
from typing import Optional

import pandas as pd
from docxtpl import DocxTemplate
from fastapi import UploadFile

SAVE_DIR = "uploaded_words"


async def import_nodes(excel: UploadFile, words: list[UploadFile]) -> dict:
    os.makedirs(SAVE_DIR, exist_ok=True)

    contents = await excel.read()
    df = pd.read_excel(io.BytesIO(contents), dtype=str)
    df.to_excel(os.path.join(SAVE_DIR, "excel.xlsx"))
    cols = df.columns.tolist()

    file_names = [w.filename for w in words]
    excel_name: Optional[str] = excel.filename

    words_nodes = [
        {
            "id": f"v{i}",
            "type": "violet",
            "data": {"label": f"{name[:-5]} <название>.docx", "category": name},
        }
        for i, name in enumerate(file_names)
    ]
    cols_nodes = [
        {"id": f"g{i}", "type": "green", "data": {"label": col}}
        for i, col in enumerate(cols)
    ]

    word_fill_nodes = []
    for i, word_file in enumerate(words):
        content = await word_file.read()
        with open(os.path.join(SAVE_DIR, word_file.filename), "wb") as f:
            f.write(content)
        doc = DocxTemplate(io.BytesIO(content))
        for j, var in enumerate(doc.get_undeclared_template_variables()):
            word_fill_nodes.append(
                {
                    "id": f"{i}{j}",
                    "type": "blue",
                    "data": {"label": var, "category": word_file.filename},
                }
            )

    return {
        "status": "success",
        "received": {"excel": excel_name, "words": file_names},
        "nodes": [
            *words_nodes,
            *cols_nodes,
            *word_fill_nodes,
            {"id": "o1", "type": "orange", "data": {"label": "разбивать на папки"}},
        ],
    }
