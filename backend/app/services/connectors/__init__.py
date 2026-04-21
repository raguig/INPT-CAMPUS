"""Base connector interface and shared utilities."""

from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class FetchedFile:
    """Represents a single file discovered by a connector."""

    filename: str
    content: bytes
    mime_type: str = "application/octet-stream"
    metadata: dict[str, Any] | None = None

    @property
    def content_hash(self) -> str:
        return hashlib.sha256(self.content).hexdigest()


class BaseConnector(ABC):
    """Abstract base for all connector implementations.

    Subclasses must implement ``fetch_files`` which yields discovered files
    so the sync loop can ingest them one by one.
    """

    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config

    @abstractmethod
    async def fetch_files(self) -> list[FetchedFile]:
        """Return all files found by this connector."""
        ...

    @abstractmethod
    async def test_connection(self) -> bool:
        """Return True if the connection / credentials are valid."""
        ...
