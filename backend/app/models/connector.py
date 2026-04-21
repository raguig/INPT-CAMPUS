"""SQLModel tables for the MCP connector subsystem."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Connector  –  a configured data source
# ---------------------------------------------------------------------------


class Connector(SQLModel, table=True):
    __tablename__ = "connectors"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String(255), nullable=False))
    connector_type: str = Field(
        sa_column=Column(String(32), nullable=False),
    )  # MOODLE | GOOGLE_DRIVE | WEB_SCRAPER | MANUAL_UPLOAD

    # JSON-encoded configuration blob (token, urls, course_ids, etc.)
    config: str = Field(
        default="{}",
        sa_column=Column(Text, nullable=False, server_default="{}"),
    )

    status: str = Field(
        default="connected",
        sa_column=Column(String(32), nullable=False, server_default="connected"),
    )  # connected | syncing | error | disconnected

    sync_interval: str = Field(
        default="manual",
        sa_column=Column(String(32), nullable=False, server_default="manual"),
    )  # manual | hourly | daily

    documents_count: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False, server_default="0"),
    )
    last_synced: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    created_by: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, nullable=True),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    # -- JSON helpers --

    def get_config(self) -> dict[str, Any]:
        return json.loads(self.config) if self.config else {}

    def set_config(self, cfg: dict[str, Any]) -> None:
        self.config = json.dumps(cfg, ensure_ascii=False)


# ---------------------------------------------------------------------------
# SyncLog  –  per-file sync result log entry
# ---------------------------------------------------------------------------


class SyncLog(SQLModel, table=True):
    __tablename__ = "sync_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    connector_id: int = Field(sa_column=Column(Integer, nullable=False, index=True))
    filename: str = Field(sa_column=Column(String(512), nullable=False))
    file_hash: Optional[str] = Field(
        default=None,
        sa_column=Column(String(128), nullable=True),
    )
    status: str = Field(
        sa_column=Column(String(32), nullable=False),
    )  # synced | skipped | error
    message: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
