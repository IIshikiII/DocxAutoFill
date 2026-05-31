from .graph import NodeGraph
from .naming import apply_template


def build_archive_model(graph_data: dict) -> dict:
    graph = NodeGraph(graph_data["nodes"], graph_data["connections"])

    files: list[str] = []
    for violet in graph.nodes_by_type("violet"):
        if not graph.has_incoming(violet.id):
            continue
        file_label = graph.green_source_label(violet.id)
        if file_label is None:
            continue
        files.append(apply_template(violet.data["label"], file_label))

    folder_name: str | None = None
    for orange in graph.nodes_by_type("orange"):
        folder_name = graph.green_source_label(orange.id)

    if folder_name is None:
        raise ValueError("Orange node is not connected to a green (Excel column) node")

    return {
        "label": "Архив",
        "type": "folder",
        "children": [
            {"label": "1_объединенные файлы", "type": "folder", "children": []},
            {
                "label": folder_name + "-1",
                "type": "folder",
                "children": [{"label": f, "type": "file"} for f in files],
            },
            {"label": folder_name + "-2", "type": "folder", "children": []},
            {"label": "...", "type": "folder", "children": []},
        ],
    }
