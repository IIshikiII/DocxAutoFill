import re
def condition(connections, node):
    for connection in connections["connections"]:
        if connection["target"] == node["id"]:
            return True
        

def archive_model(connections):
    files = []
    for node in connections["nodes"]:
        if node["type"] == "violet" and condition(connections, node):
            file = node["data"]["label"]
            file_id = node["id"]

            for connection in connections["connections"]:
                if connection["target"] == file_id:
                    source_id = connection["source"]
                    for source in connections["nodes"]:
                        if source["id"] == source_id and source["type"] == "green":
                            file_label = source["data"]["label"]
            file_name = re.sub(r'<[^<>]*>', file_label, file)
            files.append(file_name)
    folder_name = None
    for node in connections["nodes"]:
        if node["type"] == "orange":
            folder_id = node["id"]
            for connection in connections["connections"]:
                if connection["target"] == folder_id:
                    source_id = connection["source"]
                    for source in connections["nodes"]:
                        if source["id"] == source_id and source["type"] == "green":
                            folder_name = source["data"]["label"]

    return {
        "label": "Архив",
        "type": "folder",
        "children": [
        {
            "label": "1_объединенные файлы",
            "type": "folder",
            "children": []
        },
        {
            "label": folder_name+"-1",
            "type": "folder",
            "children": [
                {
                "label": obj,
                "type": "file"
            } for obj in files
            ]
        }, 
        {
            "label": folder_name+"-2",
            "type": "folder",
            "children": []
        }, 
        {
            "label": "...",
            "type": "folder",
            "children": []
        }, 
        ]
    }
