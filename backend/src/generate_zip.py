from docxtpl import DocxTemplate
import os
import pandas as pd
import re

def generate_context(file: str, req: dict) -> dict:
    context = {}
    for node in req["nodes"]:
        if node["type"] == "blue":
            if node['data']['category'] == file:
                for connection in req["connections"]:
                    if connection["target"] == node["id"]:
                        source_node_id = connection["source"]
                        source_node = next(n for n in req["nodes"] if n["id"] == source_node_id)
                        context[node['data']['label']] = source_node['data']['label']
    
    return context


def get_folder_key(req):
    for node in req["nodes"]:
        if node["type"] == "orange":
            for connection in req["connections"]:
                if connection["target"] == node["id"]:
                    source_node_id = connection["source"]
                    source_node = next(n for n in req["nodes"] if n["id"] == source_node_id)
                    return source_node['data']['label']


def get_file_name_key(file: str, req: dict) -> str:
    for node in req["nodes"]:
        if node["type"] == "violet" and node['data']['category'] == file:
            for connection in req["connections"]:
                if connection["target"] == node["id"]:
                    source_node_id = connection["source"]
                    source_node = next(n for n in req["nodes"] if n["id"] == source_node_id)
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
    
    in_path = os.path.join(zip_dir, folder_name)
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
        df.apply(fill_template_with_docxtpl, axis=1, file=file_name, req=req, zip_dir = ZIP_DIR, folder_key=folder_key, file_name_key=file_name_key)


def get_file_names(req):
    file_names = []
    for node in req["nodes"]:
        if node["type"] == "violet":
            file_names.append(node['data']['category'])
    return file_names



