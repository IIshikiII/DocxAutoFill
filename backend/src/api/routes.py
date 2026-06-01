import base64
import io
import json
import logging
from typing import cast

from fastapi import APIRouter, Request, UploadFile
from fastapi.responses import StreamingResponse

from api.dto import (
    ApplyTemplateRequest,
    ApplyTemplateResponse,
    GraphRequest,
    SaveTemplateRequest,
    TemplateSummary,
)
from domain.archive_model import build_archive_model
from domain.connection_template import (
    build_template_connections,
    resolve_template_connections,
)
from infra.storage import cleanup, create_workspace
from infra.template_store import ConnectionTemplate
from infra.template_store import store as template_store
from services.import_service import import_nodes as _import_nodes
from services.process_service import (
    ProcessProgress,
    ProcessResult,
    iter_process,
    run_process,
)
from services.validation import validate_excel, validate_words

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


async def _read_process_request(request: Request) -> tuple[dict, bytes, dict[str, bytes]]:
    """Parse and validate a multipart process request into (graph, excel, templates)."""
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
    return graph.model_dump(), excel_bytes, templates


def _sse(event: str, data: dict) -> str:
    """Format a single Server-Sent Event frame."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/import-nodes")
async def import_nodes(request: Request):
    form = await request.form()
    excel = cast("UploadFile | None", form.get("excel"))
    words = cast("list[UploadFile]", form.getlist("words[]"))
    return await _import_nodes(excel, words)


@router.post("/archive-model")
async def get_archive_model(graph: GraphRequest):
    return build_archive_model(graph.model_dump())


@router.get("/templates")
def list_templates() -> dict:
    """List saved connection templates with their connection counts."""
    return {
        "templates": [
            TemplateSummary(name=t.name, connection_count=len(t.connections)).model_dump()
            for t in template_store.list()
        ]
    }


@router.post("/templates")
def save_template(req: SaveTemplateRequest) -> dict:
    """Capture the current graph's connections as a named template.

    Connections are stored by node signature (label/category), not id, so the
    template survives a fresh import. Overwrites any template with the same name.
    """
    name = req.name.strip()
    if not name:
        raise ValueError("Не указано название шаблона")

    graph = req.graph.model_dump()
    connections = build_template_connections(graph["nodes"], graph["connections"])
    if not connections:
        raise ValueError("Нет связей для сохранения в шаблон")

    template_store.save(ConnectionTemplate(name=name, connections=connections))
    return TemplateSummary(name=name, connection_count=len(connections)).model_dump()


@router.post("/templates/apply")
def apply_template(req: ApplyTemplateRequest) -> ApplyTemplateResponse:
    """Resolve a saved template against the current nodes into concrete edges."""
    template = template_store.get(req.name)
    if template is None:
        raise ValueError(f"Шаблон «{req.name}» не найден")

    nodes = [n.model_dump() for n in req.nodes]
    result = resolve_template_connections(template.connections, nodes)
    return ApplyTemplateResponse(**result)


@router.delete("/templates")
def delete_template(name: str) -> dict:
    """Delete a template by name (idempotent)."""
    template_store.delete(name)
    return {"status": "deleted", "name": name}


@router.post("/process")
async def process_documents(request: Request):
    graph, excel_bytes, templates = await _read_process_request(request)

    workspace = create_workspace()
    try:
        zip_bytes = run_process(graph, excel_bytes, templates, workspace)
    finally:
        cleanup(workspace)

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="archive.zip"'},
    )


@router.post("/process/stream")
async def process_documents_stream(request: Request):
    """Generate documents while streaming progress as Server-Sent Events.

    Emits ``progress`` events during generation, a final ``done`` event carrying
    the base64-encoded archive, or an ``error`` event on failure.
    """
    graph, excel_bytes, templates = await _read_process_request(request)

    def event_stream():
        workspace = create_workspace()
        try:
            for event in iter_process(graph, excel_bytes, templates, workspace):
                if isinstance(event, ProcessProgress):
                    yield _sse(
                        "progress",
                        {
                            "done": event.done,
                            "total": event.total,
                            "percent": round(event.done / event.total * 100),
                            "message": event.message,
                        },
                    )
                elif isinstance(event, ProcessResult):
                    yield _sse(
                        "done",
                        {
                            "filename": "archive.zip",
                            "data": base64.b64encode(event.zip_bytes).decode("ascii"),
                        },
                    )
        except ValueError as exc:
            yield _sse("error", {"detail": str(exc)})
        except Exception:
            logger.exception("Streaming process failed")
            yield _sse("error", {"detail": "Внутренняя ошибка сервера"})
        finally:
            cleanup(workspace)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
