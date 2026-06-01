"""Build and resolve connection templates (Stage 11).

A template stores each connection by *node signature* instead of by node id:

* the source is always a green node — captured by its column label;
* a blue target (template variable) is captured by ``label`` + ``category``
  (the variable name within a specific template file);
* a violet target (output-name node) is captured by ``category`` (the file
  name) — its visible label is editable, so the file name is the stable key;
* an orange target (the folder key) is a single constant node, captured by type.

This lets a template be re-applied after a fresh import: signatures are matched
against the new nodes, so connections survive id changes. Targets that have no
counterpart in the current graph are simply skipped (left unconnected).
"""

from __future__ import annotations


def build_template_connections(nodes: list[dict], connections: list[dict]) -> list[dict]:
    """Convert id-based canvas connections into signature-based template entries."""
    by_id = {n["id"]: n for n in nodes}
    result: list[dict] = []

    for conn in connections:
        src = by_id.get(conn["source"])
        tgt = by_id.get(conn["target"])
        if src is None or tgt is None or src.get("type") != "green":
            continue

        target: dict = {"type": tgt.get("type")}
        if tgt.get("type") == "blue":
            target["label"] = str(tgt.get("data", {}).get("label", ""))
            target["category"] = tgt.get("data", {}).get("category")
        elif tgt.get("type") == "violet":
            target["category"] = tgt.get("data", {}).get("category")
        # orange: type alone identifies the single folder-key node

        result.append(
            {
                "source_label": str(src.get("data", {}).get("label", "")),
                "target": target,
            }
        )

    return result


def resolve_template_connections(template_connections: list[dict], nodes: list[dict]) -> dict:
    """Match template signatures against ``nodes`` and return concrete edges.

    Returns ``{"connections": [{source, target}], "matched": N, "total": M}``
    where ``matched`` is how many template entries found both endpoints and
    ``total`` is the number of entries in the template. Each target receives at
    most one incoming edge (mirrors the canvas one-incoming rule).
    """
    greens: dict[str, str] = {}
    blues: dict[tuple, str] = {}
    violets: dict[object, str] = {}
    orange_id: str | None = None

    for node in nodes:
        ntype = node.get("type")
        nid = node["id"]
        data = node.get("data", {})
        if ntype == "green":
            greens.setdefault(str(data.get("label", "")), nid)
        elif ntype == "blue":
            blues.setdefault((data.get("category"), str(data.get("label", ""))), nid)
        elif ntype == "violet":
            violets.setdefault(data.get("category"), nid)
        elif ntype == "orange" and orange_id is None:
            orange_id = nid

    edges: list[dict] = []
    used_targets: set[str] = set()

    for entry in template_connections:
        src_id = greens.get(entry["source_label"])
        target = entry["target"]
        ttype = target.get("type")
        if ttype == "blue":
            tgt_id = blues.get((target.get("category"), target.get("label", "")))
        elif ttype == "violet":
            tgt_id = violets.get(target.get("category"))
        elif ttype == "orange":
            tgt_id = orange_id
        else:
            tgt_id = None

        if src_id is None or tgt_id is None or tgt_id in used_targets:
            continue

        used_targets.add(tgt_id)
        edges.append({"source": src_id, "target": tgt_id})

    return {"connections": edges, "matched": len(edges), "total": len(template_connections)}
