from domain.graph import NodeGraph


def _graph() -> NodeGraph:
    nodes = [
        {"id": "g0", "type": "green", "data": {"label": "ФИО"}},
        {"id": "g1", "type": "green", "data": {"label": "Группа"}},
        {"id": "b0", "type": "blue", "data": {"label": "name", "category": "t.docx"}},
        {"id": "o1", "type": "orange", "data": {"label": "разбивать на папки"}},
    ]
    connections = [
        {"source": "g0", "target": "b0"},
        {"source": "g1", "target": "o1"},
    ]
    return NodeGraph(nodes, connections)


def test_nodes_by_type():
    graph = _graph()
    assert [n.id for n in graph.nodes_by_type("green")] == ["g0", "g1"]
    assert [n.id for n in graph.nodes_by_type("orange")] == ["o1"]
    assert graph.nodes_by_type("violet") == []


def test_has_incoming():
    graph = _graph()
    assert graph.has_incoming("b0") is True
    assert graph.has_incoming("o1") is True
    assert graph.has_incoming("g0") is False


def test_source_of():
    graph = _graph()
    src = graph.source_of("b0")
    assert src is not None and src.id == "g0"
    assert graph.source_of("g0") is None


def test_green_source_label():
    graph = _graph()
    assert graph.green_source_label("b0") == "ФИО"
    assert graph.green_source_label("o1") == "Группа"
    # no incoming edge -> no label
    assert graph.green_source_label("g0") is None
