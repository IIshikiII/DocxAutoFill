import json


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


def test_process_returns_zip(client, upload_files):
    # First import to learn the node ids, then wire a complete graph.
    imported = client.post("/api/import-nodes", files=upload_files).json()["nodes"]

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

    green_fio = node_id("green", label="ФИО")
    green_group = node_id("green", label="Группа")
    blue_var = node_id("blue", category="tpl.docx")
    violet = node_id("violet", category="tpl.docx")
    orange = node_id("orange")

    graph = {
        "nodes": imported,
        "connections": [
            {"source": green_fio, "target": blue_var},
            {"source": green_fio, "target": violet},
            {"source": green_group, "target": orange},
        ],
    }

    response = client.post(
        "/api/process",
        files=upload_files,
        data={"graph": json.dumps(graph)},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert response.content[:2] == b"PK"  # zip magic bytes
