"""Filesystem isolation helpers (Stage 3 — request isolation).

Each request that needs to write files gets its own temporary workspace, so
concurrent requests never share fixed-name files (``uploaded_words/``,
``archive.zip``). Workspaces are created on demand and removed afterwards.
"""

import shutil
import tempfile
from pathlib import Path

_WORKSPACE_PREFIX = "docxautofill_"


def create_workspace() -> Path:
    """Create and return a fresh, isolated temporary directory for one request."""
    return Path(tempfile.mkdtemp(prefix=_WORKSPACE_PREFIX))


def cleanup(workspace: Path) -> None:
    """Remove a workspace and all its contents; never raises."""
    shutil.rmtree(workspace, ignore_errors=True)
