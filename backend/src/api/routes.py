import shutil

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse

from domain.archive_model import build_archive_model
from services.import_service import import_nodes as _import_nodes
from services.process_service import generate_zip

router = APIRouter(prefix="/api")


@router.post("/import-nodes")
async def import_nodes(request: Request):
    form = await request.form()
    excel = form.get("excel")
    try:
        words = form.getlist("words[]")
    except Exception:
        words = [v for k, v in form.multi_items() if k == "words[]"]
    return await _import_nodes(excel, words)


@router.post("/archive-model")
async def get_archive_model(request: Request):
    return build_archive_model(await request.json())


@router.post("/process")
async def process_documents(request: Request):
    req = await request.json()
    ZIP_DIR = "generated_zip"
    generate_zip(req, ZIP_DIR)

    zip_filename = "archive.zip"
    shutil.make_archive("archive", "zip", ZIP_DIR)
    shutil.rmtree(ZIP_DIR, ignore_errors=True)
    return FileResponse(
        zip_filename,
        media_type="application/zip",
        filename=zip_filename,
        headers={"Content-Disposition": 'attachment; filename="archive.zip"'},
    )
