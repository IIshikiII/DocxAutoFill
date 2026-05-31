import base64
import io
import json
import zipfile


def test_import_nodes_ok(client, upload_files):
    response = client.post("/api/import-nodes", files=upload_files)
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "success"
    assert body["received"]["excel"] == "data.xlsx"

    types = {n["type"] for n in body["nodes"]}
    assert {"green", "violet", "blue", "orange"} <= types

    blue = next(n for n in body["nodes"] if n["type"] == "blue")
    assert blue["data"]["label"] == "name"
    assert blue["data"]["category"] == "tpl.docx"


def test_import_nodes_missing_excel_returns_400(client, docx_bytes):
    files = [("words[]", ("tpl.docx", docx_bytes, "application/octet-stream"))]
    response = client.post("/api/import-nodes", files=files)
    assert response.status_code == 400
    assert "Excel" in response.json()["detail"]


def test_archive_model_ok(client):
    graph = {
        "nodes": [
            {"id": "g1", "type": "green", "data": {"label": "Группа"}},
            {"id": "g0", "type": "green", "data": {"label": "ФИО"}},
            {
                "id": "v0",
                "type": "violet",
                "data": {"label": "tpl <название>.docx", "category": "tpl.docx"},
            },
            {"id": "o1", "type": "orange", "data": {"label": "folders"}},
        ],
        "connections": [
            {"source": "g0", "target": "v0"},
            {"source": "g1", "target": "o1"},
        ],
    }
    response = client.post("/api/archive-model", json=graph)
    assert response.status_code == 200
    assert response.json()["label"] == "Архив"


def test_archive_model_unconnected_orange_returns_400(client):
    graph = {
        "nodes": [{"id": "o1", "type": "orange", "data": {"label": "folders"}}],
        "connections": [],
    }
    response = client.post("/api/archive-model", json=graph)
    assert response.status_code == 400


def _wire_full_graph(imported):
    """Build a complete graph (green→blue/violet/orange) from imported nodes."""

    def node_id(node_type, label=None, category=None):
        for n in imported:
            if n["type"] != node_type:
                continue
            if label is not None and n["data"].get("label") != label:
                continue
            if category is not None and n["data"].get("category") != category:
                continue
            return n["id"]
        raise AssertionError(f"node not found: {node_type} {label} {category}")

    return {
        "nodes": imported,
        "connections": [
            {
                "source": node_id("green", label="ФИО"),
                "target": node_id("blue", category="tpl.docx"),
            },
            {
                "source": node_id("green", label="ФИО"),
                "target": node_id("violet", category="tpl.docx"),
            },
            {"source": node_id("green", label="Группа"), "target": node_id("orange")},
        ],
    }


def test_process_returns_zip(client, upload_files):
    imported = client.post("/api/import-nodes", files=upload_files).json()["nodes"]
    graph = _wire_full_graph(imported)

    response = client.post(
        "/api/process",
        files=upload_files,
        data={"graph": json.dumps(graph)},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert response.content[:2] == b"PK"  # zip magic bytes


def test_process_lays_files_directly_in_grouping_folders(client, upload_files):
    """Rendered files sit at <group>/<file>.docx, not in a <template>.docx subfolder."""
    imported = client.post("/api/import-nodes", files=upload_files).json()["nodes"]
    graph = _wire_full_graph(imported)

    response = client.post(
        "/api/process",
        files=upload_files,
        data={"graph": json.dumps(graph)},
    )
    names = zipfile.ZipFile(io.BytesIO(response.content)).namelist()

    # Files land one level below the grouping folder, e.g. "A/tpl Иванов.docx".
    rendered = [n for n in names if not n.startswith("1_объединенные файлы/")]
    assert rendered, names
    assert all(n.count("/") == 1 for n in rendered), names
    # No intermediate folder named after the template ("tpl.docx/").
    assert not any("tpl.docx/" in n for n in names), names
    # The merged archive folder and a merged file are present.
    assert any(n.startswith("1_объединенные файлы/") for n in names), names
    assert any("Объединённый_tpl.docx" in n for n in names), names


def test_process_honours_custom_archive_options(client, upload_files):
    imported = client.post("/api/import-nodes", files=upload_files).json()["nodes"]
    graph = _wire_full_graph(imported)
    graph["options"] = {
        "merged_dir_name": "Сводные",
        "merged_file_template": "Все_<файл>.docx",
    }

    response = client.post(
        "/api/process",
        files=upload_files,
        data={"graph": json.dumps(graph)},
    )
    names = zipfile.ZipFile(io.BytesIO(response.content)).namelist()
    assert any(n.startswith("Сводные/") for n in names), names
    assert any("Все_tpl.docx" in n for n in names), names


def test_process_uses_per_node_merged_label(client, upload_files):
    imported = client.post("/api/import-nodes", files=upload_files).json()["nodes"]
    for node in imported:
        if node["type"] == "violet":
            node["data"]["merged_label"] = "Все дипломы.docx"
    graph = _wire_full_graph(imported)

    response = client.post(
        "/api/process",
        files=upload_files,
        data={"graph": json.dumps(graph)},
    )
    names = zipfile.ZipFile(io.BytesIO(response.content)).namelist()
    assert "1_объединенные файлы/Все дипломы.docx" in names, names


def _parse_sse(text):
    """Parse an SSE stream body into a list of (event, json-data) pairs."""
    events = []
    for frame in text.strip().split("\n\n"):
        event, data = None, None
        for line in frame.splitlines():
            if line.startswith("event:"):
                event = line[len("event:") :].strip()
            elif line.startswith("data:"):
                data = line[len("data:") :].strip()
        if event:
            events.append((event, json.loads(data) if data else None))
    return events


def test_process_stream_emits_progress_then_archive(client, upload_files):
    imported = client.post("/api/import-nodes", files=upload_files).json()["nodes"]
    graph = _wire_full_graph(imported)

    response = client.post(
        "/api/process/stream",
        files=upload_files,
        data={"graph": json.dumps(graph)},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")

    events = _parse_sse(response.text)
    kinds = [e[0] for e in events]
    assert "progress" in kinds
    assert kinds[-1] == "done"

    # Progress percentages are monotonic and bounded.
    percents = [e[1]["percent"] for e in events if e[0] == "progress"]
    assert percents == sorted(percents)
    assert max(percents) <= 100

    # The final event carries a valid base64 zip.
    payload = events[-1][1]
    assert payload["filename"] == "archive.zip"
    assert base64.b64decode(payload["data"])[:2] == b"PK"


def test_process_stream_reports_errors_inline(client, upload_files):
    # A graph with no orange→green link fails inside generation -> SSE error event.
    imported = client.post("/api/import-nodes", files=upload_files).json()["nodes"]
    graph = {"nodes": imported, "connections": []}

    response = client.post(
        "/api/process/stream",
        files=upload_files,
        data={"graph": json.dumps(graph)},
    )
    assert response.status_code == 200
    events = _parse_sse(response.text)
    assert events[-1][0] == "error"
    assert "detail" in events[-1][1]
