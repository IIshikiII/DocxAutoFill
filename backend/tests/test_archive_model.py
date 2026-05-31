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
    [file_item] = group_folder["children"]
    assert file_item["label"] == "tpl ФИО.docx"
    assert file_item["type"] == "file"
    assert file_item["edit"]["target"] == {"kind": "file", "nodeId": "v0"}


def test_file_segments_freeze_substitution_and_extension():
    model = build_archive_model(_graph())
    group_folder = next(c for c in model["children"] if c["label"] == "Группа-1")
    segments = group_folder["children"][0]["edit"]["segments"]

    # "tpl <название>.docx" with the column "ФИО" → editable text, locked value, frozen ext.
    assert segments == [
        {"kind": "text", "value": "tpl "},
        {"kind": "lock", "value": "ФИО", "token": "<название>"},
        {"kind": "ext", "value": ".docx"},
    ]


def test_merged_folder_holds_editable_merged_files():
    model = build_archive_model(_graph())
    merged = next(c for c in model["children"] if c["label"] == "1_объединенные файлы")

    assert merged["edit"]["target"] == {"kind": "merged_dir"}
    [merged_file] = merged["children"]
    assert merged_file["label"] == "Объединённый_tpl.docx"
    assert merged_file["edit"]["target"] == {"kind": "merged_file", "nodeId": "v0"}
    # The default name says which template was merged; only the extension is frozen.
    assert merged_file["edit"]["segments"] == [
        {"kind": "text", "value": "Объединённый_tpl"},
        {"kind": "ext", "value": ".docx"},
    ]


def test_per_node_merged_label_overrides_default():
    graph = _graph()
    violet = next(n for n in graph["nodes"] if n["type"] == "violet")
    violet["data"]["merged_label"] = "Все дипломы.docx"
    model = build_archive_model(graph)

    merged = next(c for c in model["children"] if c["label"] == "1_объединенные файлы")
    [merged_file] = merged["children"]
    assert merged_file["label"] == "Все дипломы.docx"
    assert merged_file["edit"]["segments"] == [
        {"kind": "text", "value": "Все дипломы"},
        {"kind": "ext", "value": ".docx"},
    ]


def test_orange_without_green_raises():
    with pytest.raises(ValueError, match="Оранжевый узел"):
        build_archive_model(_graph(connect_orange=False))


def test_custom_merged_dir_name_in_model():
    graph = _graph()
    graph["options"] = {"merged_dir_name": "Сводные"}
    model = build_archive_model(graph)

    labels = [child["label"] for child in model["children"]]
    assert "Сводные" in labels
    assert "1_объединенные файлы" not in labels
