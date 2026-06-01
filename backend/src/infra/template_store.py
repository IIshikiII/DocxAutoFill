"""In-memory store for connection templates (Stage 11).

A connection template is a named set of canvas connections, captured by node
*signature* (label/category) rather than by node id, so it can be re-applied to
a fresh import where ids differ.

The store keeps templates in process memory only — they are intentionally lost
when the container restarts. This is a deliberate first iteration: no database
or file persistence is involved. Access is guarded by a lock so concurrent API
requests never corrupt the dictionary.
"""

from __future__ import annotations

import threading
from dataclasses import dataclass, field


@dataclass
class ConnectionTemplate:
    """A saved set of connections, addressable by ``name``."""

    name: str
    connections: list[dict] = field(default_factory=list)


class TemplateStore:
    """Thread-safe, in-memory dictionary of templates keyed by name."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._templates: dict[str, ConnectionTemplate] = {}

    def save(self, template: ConnectionTemplate) -> None:
        """Insert or overwrite a template under its name."""
        with self._lock:
            self._templates[template.name] = template

    def list(self) -> list[ConnectionTemplate]:
        with self._lock:
            return list(self._templates.values())

    def get(self, name: str) -> ConnectionTemplate | None:
        with self._lock:
            return self._templates.get(name)

    def delete(self, name: str) -> bool:
        """Remove a template; returns whether it existed."""
        with self._lock:
            return self._templates.pop(name, None) is not None

    def clear(self) -> None:
        """Drop all templates (used by tests)."""
        with self._lock:
            self._templates.clear()


# Module-level singleton shared across requests for the lifetime of the process.
store = TemplateStore()
