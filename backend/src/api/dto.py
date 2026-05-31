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


class GraphRequest(BaseModel):
    """Canvas graph sent by the frontend: nodes plus their connections."""

    nodes: list[NodeDTO] = Field(default_factory=list)
    connections: list[EdgeDTO] = Field(default_factory=list)


class ArchiveItem(BaseModel):
    label: str
    type: Literal["folder", "file"]
    children: list[ArchiveItem] = Field(default_factory=list)


class ImportResponse(BaseModel):
    status: str
    received: dict
    nodes: list[NodeDTO]
