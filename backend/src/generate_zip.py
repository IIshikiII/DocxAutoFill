from docxtpl import DocxTemplate
import os
import pandas as pd
import re
from docxcompose.composer import Composer
from docx import Document
from pathlib import Path


def generate_context(file: str, req: dict) -> dict:
    context = {}
    for node in req["nodes"]:
        if node["type"] == "blue":
            if node['data']['category'] == file:
                for connection in req["connections"]:
                    if connection["target"] == node["id"]:
                        source_node_id = connection["source"]
                        source_node = next(
                            n for n in req["nodes"] if n["id"] == source_node_id)
                        context[node['data']['label']
                                ] = source_node['data']['label']

    return context


def get_folder_key(req):
    for node in req["nodes"]:
        if node["type"] == "orange":
            for connection in req["connections"]:
                if connection["target"] == node["id"]:
                    source_node_id = connection["source"]
                    source_node = next(
                        n for n in req["nodes"] if n["id"] == source_node_id)
                    return source_node['data']['label']


def get_file_name_key(file: str, req: dict) -> str:
    for node in req["nodes"]:
        if node["type"] == "violet" and node['data']['category'] == file:
            for connection in req["connections"]:
                if connection["target"] == node["id"]:
                    source_node_id = connection["source"]
                    source_node = next(
                        n for n in req["nodes"] if n["id"] == source_node_id)
                    return source_node['data']['label'], node['data']['label']


def fill_template_with_docxtpl(row, file, req, zip_dir, folder_key, file_name_key):
    SAVE_DIR = "uploaded_words"
    template_path = os.path.join(SAVE_DIR, file)
    template = DocxTemplate(template_path)

    contex_x = generate_context(file, req)
    context = {}
    for key in contex_x:
        context[key] = row[contex_x[key]]
    # print(context)
    template.render(context)

    folder_name = row[folder_key]

    elem = file  # Use full file name as elem
    in_path = os.path.join(zip_dir, folder_name, elem)
    os.makedirs(in_path, exist_ok=True)

    file_name = re.sub(r'<[^<>]*>', row[file_name_key[0]], file_name_key[1])
    print(file_name)
    save_path = os.path.join(in_path, file_name)
    template.save(save_path)


def generate_zip(file_names, req, ZIP_DIR):
    SAVE_DIR = "uploaded_words"
    excel_path = os.path.join(SAVE_DIR, "excel.xlsx")
    df = pd.read_excel(excel_path)
    folder_key = get_folder_key(req)

    os.makedirs(ZIP_DIR, exist_ok=True)

    for file_name in file_names:
        file_name_key = get_file_name_key(file_name, req)
        df.apply(fill_template_with_docxtpl, axis=1, file=file_name, req=req,
                 zip_dir=ZIP_DIR, folder_key=folder_key, file_name_key=file_name_key)

    # New code for merging documents
    merged_dir = os.path.join(ZIP_DIR, "1_объединенные файлы")
    os.makedirs(merged_dir, exist_ok=True)
    for elem in file_names:  # Use file_names directly
        all_files = []
        for program in os.listdir(ZIP_DIR):
            program_path = os.path.join(ZIP_DIR, program)
            if os.path.isdir(program_path):
                elem_path = os.path.join(program_path, elem)
                if os.path.exists(elem_path):
                    all_files.extend(sorted(Path(elem_path).glob("*.docx")))
        if all_files:
            master = Document(all_files[0])
            composer = Composer(master)
            for file in all_files[1:]:
                # if True:  # Check if '12' is in elem for page break
                #     master.add_page_break()
                composer.append(Document(file))
            out_file = os.path.join(
                merged_dir, f"Объединённый_{elem.replace('.docx', '')}.docx")
            composer.save(out_file)
            print(f"Создано объединённый файл: {out_file}")


def get_file_names(req):
    file_names = []
    for node in req["nodes"]:
        if node["type"] == "violet":
            file_names.append(node['data']['category'])
    return file_names
