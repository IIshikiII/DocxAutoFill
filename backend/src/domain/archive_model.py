import re
from dataclasses import dataclass

from config import settings

from .graph import NodeGraph
from .naming import apply_template

_PLACEHOLDER_RE = re.compile(r"<[^<>]*>")
_DOCX_EXT = ".docx"


@dataclass(frozen=True)
class ArchiveOptions:
    """User-configurable names for the output archive structure.

    Only names that are *not* derived from the data are configurable: the
    grouping folders (orange node) and the substituted ``<…>`` part of file
    names come from the Excel values and are never overridden here.
    """

    merged_dir_name: str
    merged_file_template: str

    @staticmethod
    def resolve(graph_data: dict) -> "ArchiveOptions":
        """Build options from a graph payload, falling back to config defaults."""
        raw = graph_data.get("options") or {}
        merged_dir = str(raw.get("merged_dir_name") or "").strip() or settings.merged_dir_name
        merged_file = (
            str(raw.get("merged_file_template") or "").strip() or settings.merged_file_template
        )
        return ArchiveOptions(merged_dir_name=merged_dir, merged_file_template=merged_file)


def _name_segments(
    template: str, value: str | None, *, freeze_substitution: bool = True
) -> list[dict]:
    """Split a name template into editable text + frozen segments.

    A trailing ``.docx`` always becomes a frozen ``ext`` segment. When
    ``freeze_substitution`` is set, the first ``<…>`` placeholder becomes a
    frozen ``lock`` segment (the Excel substitution, displayed as ``value``) —
    used for per-row file names. Otherwise the whole base is a single editable
    ``text`` segment (used for merged-file names, where the placeholder is just
    the template name, not Excel data). Frozen segments keep the original
    token/extension so the template can be reconstructed verbatim.
    """
    rest = template
    ext = ""
    if rest.lower().endswith(_DOCX_EXT):
        ext = rest[-len(_DOCX_EXT) :]
        rest = rest[: -len(_DOCX_EXT)]

    segments: list[dict] = []
    match = _PLACEHOLDER_RE.search(rest)
    if freeze_substitution and match is not None and value is not None:
        before, after = rest[: match.start()], rest[match.end() :]
        if before:
            segments.append({"kind": "text", "value": before})
        segments.append({"kind": "lock", "value": value, "token": match.group(0)})
        if after:
            segments.append({"kind": "text", "value": after})
    else:
        segments.append({"kind": "text", "value": rest})

    if ext:
        segments.append({"kind": "ext", "value": ext})
    return segments


def _strip_docx(name: str) -> str:
    return name[: -len(_DOCX_EXT)] if name.lower().endswith(_DOCX_EXT) else name


def merged_file_name(violet_data: dict, options: ArchiveOptions) -> str:
    """Resolve the merged-file name for one template.

    A per-node override (``data['merged_label']``, set by editing the name in
    the archive tree) wins; otherwise the default substitutes the template's
    base name into ``options.merged_file_template`` (so the name says *which*
    template was merged, e.g. ``Объединённый_1. Макет.docx``).
    """
    custom = str(violet_data.get("merged_label") or "").strip()
    if custom:
        return custom
    base = _strip_docx(str(violet_data.get("category") or ""))
    return apply_template(options.merged_file_template, base)


def build_archive_model(graph_data: dict) -> dict:
    graph = NodeGraph(graph_data["nodes"], graph_data["connections"])
    options = ArchiveOptions.resolve(graph_data)

    files: list[dict] = []
    merged_files: list[dict] = []
    for violet in graph.nodes_by_type("violet"):
        if not graph.has_incoming(violet.id):
            continue
        file_label = graph.green_source_label(violet.id)
        if file_label is None:
            continue

        template = str(violet.data["label"])
        files.append(
            {
                "label": apply_template(template, file_label),
                "type": "file",
                "edit": {
                    "target": {"kind": "file", "nodeId": violet.id},
                    "segments": _name_segments(template, file_label),
                },
            }
        )

        merged_name = merged_file_name(violet.data, options)
        merged_files.append(
            {
                "label": merged_name,
                "type": "file",
                "edit": {
                    "target": {"kind": "merged_file", "nodeId": violet.id},
                    "segments": _name_segments(merged_name, None, freeze_substitution=False),
                },
            }
        )

    folder_name: str | None = None
    for orange in graph.nodes_by_type("orange"):
        folder_name = graph.green_source_label(orange.id)

    if folder_name is None:
        raise ValueError("Оранжевый узел не соединён с зелёным узлом (колонкой Excel)")

    return {
        "label": "Архив",
        "type": "folder",
        "children": [
            {
                "label": options.merged_dir_name,
                "type": "folder",
                "edit": {
                    "target": {"kind": "merged_dir"},
                    "segments": _name_segments(options.merged_dir_name, None),
                },
                "children": merged_files,
            },
            {
                "label": folder_name + "-1",
                "type": "folder",
                "children": files,
            },
            {"label": folder_name + "-2", "type": "folder", "children": []},
            {"label": "...", "type": "folder", "children": []},
        ],
    }
