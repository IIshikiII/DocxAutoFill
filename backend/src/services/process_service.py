"""Render templates, lay them out into folders, merge and zip them.

Stateless (Stage 3): the caller provides the uploaded bytes and an isolated
output workspace; nothing is read from or written to fixed-name shared paths.

Generation is exposed as an iterator (:func:`iter_process`) that yields progress
events followed by a single result event, so the API layer can stream progress
for long jobs (Stage 10). :func:`run_process` is a thin non-streaming wrapper.
"""

import io
import logging
import shutil
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union

import pandas as pd
from docx import Document
from docxcompose.composer import Composer
from docxtpl import DocxTemplate

from domain.archive_model import ArchiveOptions, merged_file_name
from domain.graph import NodeGraph
from domain.naming import apply_template

logger = logging.getLogger(__name__)


@dataclass
class ProcessProgress:
    """A progress tick emitted while documents are generated."""

    done: int
    total: int
    message: str


@dataclass
class ProcessResult:
    """The final archive, emitted once at the end of generation."""

    zip_bytes: bytes


ProcessEvent = Union[ProcessProgress, ProcessResult]


def _build_context_map(graph: NodeGraph, file: str) -> dict[str, str]:
    """Return {template_variable: excel_column_label} for a given template file."""
    result: dict[str, str] = {}
    for blue in graph.nodes_by_type("blue"):
        if blue.data["category"] != file:
            continue
        col_label = graph.green_source_label(blue.id)
        if col_label is not None:
            result[blue.data["label"]] = col_label
    return result


def _get_folder_key(graph: NodeGraph) -> Optional[str]:
    for orange in graph.nodes_by_type("orange"):
        return graph.green_source_label(orange.id)
    return None


def _get_file_name_mapping(graph: NodeGraph, file: str) -> Optional[tuple[str, str]]:
    """Return (excel_col_label, violet_label) used to derive the output file name."""
    for violet in graph.nodes_by_type("violet"):
        if violet.data["category"] != file:
            continue
        col_label = graph.green_source_label(violet.id)
        if col_label is not None:
            return col_label, violet.data["label"]
    return None


def _fill_template(
    row,
    *,
    template_bytes: bytes,
    context_map: dict[str, str],
    out_dir: Path,
    folder_key: str,
    file_name_mapping: tuple[str, str],
) -> Path:
    """Render one template for one row directly into its grouping folder.

    The file lands at ``out_dir/<grouping value>/<file name>`` — no extra
    per-template subfolder. Returns the path of the saved document.
    """
    template = DocxTemplate(io.BytesIO(template_bytes))
    template.render({var: row[col] for var, col in context_map.items()})

    folder_name = str(row[folder_key])
    target_dir = out_dir / folder_name
    target_dir.mkdir(parents=True, exist_ok=True)

    file_name = apply_template(file_name_mapping[1], row[file_name_mapping[0]])
    out_path = target_dir / file_name
    template.save(str(out_path))
    return out_path


def _merge_template(files: list[Path], merged_dir: Path, out_name: str) -> None:
    """Concatenate every rendered copy of one template into a single document."""
    paths = [p for p in sorted(files, key=str) if p.exists()]
    if not paths:
        return

    master = Document(str(paths[0]))
    composer = Composer(master)
    for f in paths[1:]:
        composer.append(Document(str(f)))
    composer.save(str(merged_dir / out_name))


def iter_process(
    graph_data: dict,
    excel_bytes: bytes,
    templates: dict[str, bytes],
    workspace: Path,
) -> Iterator[ProcessEvent]:
    """Generate documents into ``workspace``, yielding progress then the result."""
    graph = NodeGraph(graph_data["nodes"], graph_data["connections"])
    options = ArchiveOptions.resolve(graph_data)
    file_names = [n.data["category"] for n in graph.nodes_by_type("violet")]

    folder_key = _get_folder_key(graph)
    if folder_key is None:
        raise ValueError("Оранжевый узел не соединён с зелёным узлом (колонкой Excel)")

    missing = [name for name in file_names if name not in templates]
    if missing:
        raise ValueError(f"Не приложены файлы Word: {', '.join(missing)}")

    df = pd.read_excel(io.BytesIO(excel_bytes), dtype=str).fillna("")

    out_dir = workspace / "tree"
    out_dir.mkdir(parents=True, exist_ok=True)

    # Resolve (and validate) the per-template plan up front.
    plans: list[tuple[str, tuple[str, str], dict[str, str]]] = []
    for file_name in file_names:
        mapping = _get_file_name_mapping(graph, file_name)
        if mapping is None:
            raise ValueError(
                f"Фиолетовый узел '{file_name}' не соединён с зелёным узлом (колонкой Excel)"
            )
        plans.append((file_name, mapping, _build_context_map(graph, file_name)))

    rows = len(df)
    total = max(len(file_names) * rows + len(file_names), 1)
    done = 0
    yield ProcessProgress(done, total, "Подготовка…")

    rendered: dict[str, list[Path]] = {name: [] for name, _, _ in plans}
    for file_name, mapping, context_map in plans:
        for _, row in df.iterrows():
            out_path = _fill_template(
                row,
                template_bytes=templates[file_name],
                context_map=context_map,
                out_dir=out_dir,
                folder_key=folder_key,
                file_name_mapping=mapping,
            )
            rendered[file_name].append(out_path)
            done += 1
            yield ProcessProgress(done, total, f"Заполнение шаблона «{file_name}»")

    merged_names = {
        str(v.data["category"]): merged_file_name(v.data, options)
        for v in graph.nodes_by_type("violet")
        if v.data.get("category")
    }
    merged_dir = out_dir / options.merged_dir_name
    merged_dir.mkdir(parents=True, exist_ok=True)
    for file_name, _, _ in plans:
        _merge_template(rendered[file_name], merged_dir, merged_names[file_name])
        done += 1
        yield ProcessProgress(done, total, f"Объединение «{file_name}»")

    archive_base = workspace / "archive"
    shutil.make_archive(str(archive_base), "zip", out_dir)
    logger.info("Generated archive for %d template(s)", len(file_names))
    yield ProcessResult((workspace / "archive.zip").read_bytes())


def run_process(
    graph_data: dict,
    excel_bytes: bytes,
    templates: dict[str, bytes],
    workspace: Path,
) -> bytes:
    """Render everything into ``workspace`` and return the zip archive bytes."""
    result = b""
    for event in iter_process(graph_data, excel_bytes, templates, workspace):
        if isinstance(event, ProcessResult):
            result = event.zip_bytes
    return result
