import os
from pathlib import Path
from typing import Optional

import pandas as pd
from docx import Document
from docxcompose.composer import Composer
from docxtpl import DocxTemplate

from domain.graph import NodeGraph
from domain.naming import apply_template

SAVE_DIR = "uploaded_words"


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
    file: str,
    context_map: dict[str, str],
    zip_dir: str,
    folder_key: str,
    file_name_mapping: tuple[str, str],
) -> None:
    template = DocxTemplate(os.path.join(SAVE_DIR, file))
    template.render({var: row[col] for var, col in context_map.items()})

    folder_name = row[folder_key]
    in_path = os.path.join(zip_dir, folder_name, file)
    os.makedirs(in_path, exist_ok=True)

    file_name = apply_template(file_name_mapping[1], row[file_name_mapping[0]])
    template.save(os.path.join(in_path, file_name))


def _merge_documents(file_names: list[str], zip_dir: str) -> None:
    merged_dir = os.path.join(zip_dir, "1_объединенные файлы")
    os.makedirs(merged_dir, exist_ok=True)

    for template_file in file_names:
        all_files: list[Path] = []
        for program in sorted(os.listdir(zip_dir)):
            program_path = os.path.join(zip_dir, program)
            if not os.path.isdir(program_path):
                continue
            elem_path = os.path.join(program_path, template_file)
            if os.path.exists(elem_path):
                all_files.extend(sorted(Path(elem_path).glob("*.docx")))

        if not all_files:
            continue

        master = Document(all_files[0])
        composer = Composer(master)
        for f in all_files[1:]:
            composer.append(Document(f))
        out_name = f"Объединённый_{template_file.replace('.docx', '')}.docx"
        composer.save(os.path.join(merged_dir, out_name))


def generate_zip(req: dict, zip_dir: str) -> None:
    graph = NodeGraph(req["nodes"], req["connections"])
    file_names = [n.data["category"] for n in graph.nodes_by_type("violet")]

    df = pd.read_excel(os.path.join(SAVE_DIR, "excel.xlsx"), dtype=str).fillna("")
    folder_key = _get_folder_key(graph)

    os.makedirs(zip_dir, exist_ok=True)

    for file_name in file_names:
        context_map = _build_context_map(graph, file_name)
        file_name_mapping = _get_file_name_mapping(graph, file_name)
        df.apply(
            _fill_template,
            axis=1,
            file=file_name,
            context_map=context_map,
            zip_dir=zip_dir,
            folder_key=folder_key,
            file_name_mapping=file_name_mapping,
        )

    _merge_documents(file_names, zip_dir)
