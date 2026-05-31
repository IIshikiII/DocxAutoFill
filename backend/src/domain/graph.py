from dataclasses import dataclass
from typing import Optional


@dataclass
class Node:
    id: str
    type: str
    data: dict


@dataclass
class Edge:
    source: str
    target: str


class NodeGraph:
    def __init__(self, nodes: list[dict], connections: list[dict]) -> None:
        self._nodes: dict[str, Node] = {
            n["id"]: Node(n["id"], n["type"], n["data"]) for n in nodes
        }
        self._edges: list[Edge] = [Edge(c["source"], c["target"]) for c in connections]

    def nodes_by_type(self, t: str) -> list[Node]:
        return [n for n in self._nodes.values() if n.type == t]

    def has_incoming(self, node_id: str) -> bool:
        return any(e.target == node_id for e in self._edges)

    def source_of(self, node_id: str) -> Optional[Node]:
        for edge in self._edges:
            if edge.target == node_id:
                return self._nodes.get(edge.source)
        return None

    def green_source_label(self, target_id: str) -> Optional[str]:
        src = self.source_of(target_id)
        if src is not None and src.type == "green":
            return src.data["label"]
        return None
