import pytest

from domain.archive_model import build_archive_model


def _graph(connect_orange: bool = True) -> dict:
    nodes = [
        {"id": "g0", "type": "green", "data": {"label": "ФИО"}},
        {"id": "g1", "type": "green", "data": {"label": "Группа"}},
        {
            "id": "v0",
            "type": "violet",
            "data": {"label": "tpl <название>.docx", "category": "tpl.docx"},
        },
        {"id": "o1", "type": "orange", "data": {"label": "разбивать на папки"}},
    ]
    connections = [{"source": "g0", "target": "v0"}]
    if connect_orange:
        connections.append({"source": "g1", "target": "o1"})
    return {"nodes": nodes, "connections": connections}


def test_build_archive_model_happy_path():
    model = build_archive_model(_graph())

    assert model["label"] == "Архив"
    assert model["type"] == "folder"

    labels = [child["label"] for child in model["children"]]
    assert "1_объединенные файлы" in labels
    assert "Группа-1" in labels

    group_folder = next(c for c in model["children"] if c["label"] == "Группа-1")
    assert group_folder["children"] == [{"label": "tpl ФИО.docx", "type": "file"}]


def test_orange_without_green_raises():
    with pytest.raises(ValueError, match="Оранжевый узел"):
        build_archive_model(_graph(connect_orange=False))
