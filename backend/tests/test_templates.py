"""Tests for connection templates: domain build/resolve + API endpoints."""

import pytest

from domain.connection_template import (
    build_template_connections,
    resolve_template_connections,
)
from infra.template_store import store as template_store


@pytest.fixture(autouse=True)
def _clear_store():
    """Keep the in-memory store isolated between tests."""
    template_store.clear()
    yield
    template_store.clear()


# A small graph reused across tests: one green column connected to a blue
# variable, a violet output-name node and the orange folder key.
GRAPH = {
    "nodes": [
        {"id": "g0", "type": "green", "data": {"label": "ФИО"}},
        {"id": "g1", "type": "green", "data": {"label": "Группа"}},
        {"id": "b0", "type": "blue", "data": {"label": "name", "category": "tpl.docx"}},
        {
            "id": "v0",
            "type": "violet",
            "data": {"label": "tpl <название>.docx", "category": "tpl.docx"},
        },
        {"id": "o1", "type": "orange", "data": {"label": "folders"}},
    ],
    "connections": [
        {"source": "g0", "target": "b0"},
        {"source": "g0", "target": "v0"},
        {"source": "g1", "target": "o1"},
    ],
}


def test_build_captures_signatures():
    conns = build_template_connections(GRAPH["nodes"], GRAPH["connections"])
    assert len(conns) == 3

    blue = next(c for c in conns if c["target"]["type"] == "blue")
    assert blue["source_label"] == "ФИО"
    assert blue["target"] == {"type": "blue", "label": "name", "category": "tpl.docx"}

    violet = next(c for c in conns if c["target"]["type"] == "violet")
    assert violet["target"] == {"type": "violet", "category": "tpl.docx"}

    orange = next(c for c in conns if c["target"]["type"] == "orange")
    assert orange["source_label"] == "Группа"


def test_resolve_matches_fresh_ids():
    conns = build_template_connections(GRAPH["nodes"], GRAPH["connections"])
    # Same labels/categories, brand new ids and a violet renamed in the tree.
    fresh = [
        {"id": "x9", "type": "green", "data": {"label": "ФИО"}},
        {"id": "x8", "type": "green", "data": {"label": "Группа"}},
        {"id": "x7", "type": "blue", "data": {"label": "name", "category": "tpl.docx"}},
        {"id": "x6", "type": "violet", "data": {"label": "renamed", "category": "tpl.docx"}},
        {"id": "x5", "type": "orange", "data": {"label": "folders"}},
    ]
    result = resolve_template_connections(conns, fresh)
    assert result["matched"] == 3
    assert result["total"] == 3
    assert {"source": "x9", "target": "x7"} in result["connections"]
    assert {"source": "x9", "target": "x6"} in result["connections"]
    assert {"source": "x8", "target": "x5"} in result["connections"]


def test_resolve_skips_unmatched_targets():
    conns = build_template_connections(GRAPH["nodes"], GRAPH["connections"])
    # Different file name → blue/violet no longer match; the column still does.
    partial = [
        {"id": "x9", "type": "green", "data": {"label": "ФИО"}},
        {"id": "x8", "type": "green", "data": {"label": "Группа"}},
        {"id": "x7", "type": "blue", "data": {"label": "name", "category": "other.docx"}},
        {"id": "x5", "type": "orange", "data": {"label": "folders"}},
    ]
    result = resolve_template_connections(conns, partial)
    assert result["total"] == 3
    assert result["matched"] == 1
    assert result["connections"] == [{"source": "x8", "target": "x5"}]


def test_save_list_apply_delete_roundtrip(client):
    save = client.post("/api/templates", json={"name": "Дипломы", "graph": GRAPH})
    assert save.status_code == 200
    assert save.json() == {"name": "Дипломы", "connection_count": 3}

    listing = client.get("/api/templates")
    assert listing.json()["templates"] == [{"name": "Дипломы", "connection_count": 3}]

    apply = client.post(
        "/api/templates/apply",
        json={"name": "Дипломы", "nodes": GRAPH["nodes"]},
    )
    body = apply.json()
    assert body["matched"] == 3
    assert body["total"] == 3
    assert {"source": "g0", "target": "b0"} in body["connections"]

    deleted = client.delete("/api/templates", params={"name": "Дипломы"})
    assert deleted.status_code == 200
    assert client.get("/api/templates").json()["templates"] == []


def test_save_without_connections_returns_400(client):
    graph = {"nodes": GRAPH["nodes"], "connections": []}
    response = client.post("/api/templates", json={"name": "Пусто", "graph": graph})
    assert response.status_code == 400


def test_apply_unknown_template_returns_400(client):
    response = client.post("/api/templates/apply", json={"name": "нет", "nodes": []})
    assert response.status_code == 400
