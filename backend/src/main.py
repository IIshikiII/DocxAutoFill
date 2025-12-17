from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Request, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

import pandas as pd
import openpyxl
import io
from gegerate_model import archive_model
from generate_zip import generate_zip, get_file_names
import os
from docxtpl import DocxTemplate
import shutil
import os
import zipfile


app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)


@app.post("/api/import-nodes")
async def import_nodes(request: Request):
    """Accept files posted as multipart/form-data.

    Frontend sends:
      - excel -> single Excel file
      - words[] -> multiple Word files (field name with brackets)

    We read the raw form so we accept both `words[]` and `words` field names.
    """
    SAVE_DIR = "uploaded_words"
    os.makedirs(SAVE_DIR, exist_ok=True)
    form = await request.form()

    # Excel file (may be missing)
    excel = form.get("excel")
    contents = await excel.read()
    df = pd.read_excel(io.BytesIO(contents))
    excel_path = os.path.join(SAVE_DIR, "excel.xlsx")
    df.to_excel(excel_path)
    cols = df.columns.tolist()
    print(cols)

    # Try to get multiple word files sent under 'words[]' (front uses this).
    words: List[UploadFile] = []

    # FormData supports getlist for repeated fields; try that first.
    try:
        words = form.getlist("words[]")
    except Exception:
        # Fallback: collect items manually
        words = [v for k, v in form.multi_items() if k == "words[]"]
    print(words)

    file_names = [file.filename for file in words]

    excel_name: Optional[str] = None
    if excel is not None and isinstance(excel, UploadFile):
        excel_name = excel.filename

    words_nodes = [{"id": f"v{id}", "type": "violet", "data": {
        "label": f"{name[:-5]} <название>.docx", "category": name}} for id, name in enumerate(file_names)]
    cols_nodes = [{"id": f"g{id}", "type": "green", "data": {
        "label": value}} for id, value in enumerate(cols)]

    word_fill_nodes = []

    for id, word_file in enumerate(words):
        content = await word_file.read()
        file_path = os.path.join(SAVE_DIR, word_file.filename)
        with open(file_path, "wb") as f:
            f.write(content)
        print(f"Сохранён: {file_path}")

        file_stream = io.BytesIO(content)
        doc = DocxTemplate(file_stream)
        for id2, elem in enumerate(doc.get_undeclared_template_variables()):
            word_fill_nodes.append({"id": str(id) + str(id2), "type": "blue", "data": {
                                   "label": elem, "category": word_file.filename, }})
    print(word_fill_nodes)

    return {
        "status": "success",
        "received": {
            "excel": excel_name,
            "words": file_names,
        },
        "nodes": [*words_nodes, *cols_nodes, *word_fill_nodes,
                  {"id": "o1", "type": "orange", "data": {
                      "label": "разбивать на папки"}},

                  ]
    }


@app.post("/api/archive-model")
async def create_model(request: Request):
    res = archive_model(await request.json())
    return res


@app.post("/api/process")
async def create_model(request: Request):
    req = await request.json()
    ZIP_DIR = "generated_zip"
    generate_zip(get_file_names(req), req, ZIP_DIR)

    zip_filename = "archive.zip"
    shutil.make_archive("archive", "zip", ZIP_DIR)
    shutil.rmtree(ZIP_DIR, ignore_errors=True)
    response = FileResponse(
        zip_filename,
        media_type="application/zip",
        filename=zip_filename,
        headers={
            "Content-Disposition": 'attachment; filename="archive.zip"'
        },
    )

    return response


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=3000)
