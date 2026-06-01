"""Request/response models shared by the API layer (Stage 4 — validation)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

NodeType = Literal["green", "blue", "violet", "orange"]


class NodeDTO(BaseModel):
    id: str
    type: str
    data: dict


class EdgeDTO(BaseModel):
    source: str
    target: str


class ArchiveOptionsDTO(BaseModel):
    """Configurable, non-data-derived archive names (Stage 10).

    Empty/omitted fields fall back to the server defaults (see ``config``).
    """

    merged_dir_name: str | None = None
    merged_file_template: str | None = None


class GraphRequest(BaseModel):
    """Canvas graph sent by the frontend: nodes plus their connections."""

    nodes: list[NodeDTO] = Field(default_factory=list)
    connections: list[EdgeDTO] = Field(default_factory=list)
    options: ArchiveOptionsDTO | None = None


class ArchiveItem(BaseModel):
    label: str
    type: Literal["folder", "file"]
    children: list[ArchiveItem] = Field(default_factory=list)


class ImportResponse(BaseModel):
    status: str
    received: dict
    nodes: list[NodeDTO]


class TemplateTargetDTO(BaseModel):
    """Signature of a connection's target node within a template."""

    type: str
    label: str | None = None
    category: str | None = None


class TemplateConnectionDTO(BaseModel):
    """A single connection captured by node signature (green source → target)."""

    source_label: str
    target: TemplateTargetDTO


class SaveTemplateRequest(BaseModel):
    """Save the current graph's connections as a named template (Stage 11)."""

    name: str
    graph: GraphRequest


class TemplateSummary(BaseModel):
    name: str
    connection_count: int


class ApplyTemplateRequest(BaseModel):
    """Resolve a saved template against the current canvas nodes."""

    name: str
    nodes: list[NodeDTO] = Field(default_factory=list)


class ApplyTemplateResponse(BaseModel):
    connections: list[EdgeDTO] = Field(default_factory=list)
    matched: int
    total: int
