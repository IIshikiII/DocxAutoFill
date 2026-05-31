import io
from typing import cast

from fastapi import APIRouter, Request, UploadFile
from fastapi.responses import StreamingResponse

from api.dto import GraphRequest
from domain.archive_model import build_archive_model
from infra.storage import cleanup, create_workspace
from services.import_service import import_nodes as _import_nodes
from services.process_service import run_process
from services.validation import validate_excel, validate_words

router = APIRouter(prefix="/api")


@router.post("/import-nodes")
async def import_nodes(request: Request):
    form = await request.form()
    excel = cast("UploadFile | None", form.get("excel"))
    words = cast("list[UploadFile]", form.getlist("words[]"))
    return await _import_nodes(excel, words)


@router.post("/archive-model")
async def get_archive_model(graph: GraphRequest):
    return build_archive_model(graph.model_dump())


@router.post("/process")
async def process_documents(request: Request):
    form = await request.form()
    excel = cast("UploadFile | None", form.get("excel"))
    words = cast("list[UploadFile]", form.getlist("words[]"))
    validate_excel(excel)
    validate_words(words)
    assert excel is not None  # guaranteed by validate_excel

    graph_raw = form.get("graph")
    if not graph_raw or not isinstance(graph_raw, str):
        raise ValueError("Не передан граф (поле 'graph')")
    graph = GraphRequest.model_validate_json(graph_raw)

    excel_bytes = await excel.read()
    templates = {(w.filename or ""): await w.read() for w in words}

    workspace = create_workspace()
    try:
        zip_bytes = run_process(graph.model_dump(), excel_bytes, templates, workspace)
    finally:
        cleanup(workspace)

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="archive.zip"'},
    )
