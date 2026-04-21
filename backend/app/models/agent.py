"""SQLModel tables for the AI-agent subsystem."""

import json
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------


class Agent(SQLModel, table=True):
    __tablename__ = "agents"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String(255), nullable=False))
    description: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )
    system_prompt: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )

    # Stored as JSON-encoded strings
    collection_ids: str = Field(
        default="[]",
        sa_column=Column(Text, nullable=False, server_default="[]"),
    )
    tools: str = Field(
        default="[]",
        sa_column=Column(Text, nullable=False, server_default="[]"),
    )

    created_by: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, nullable=True),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    is_active: bool = Field(default=True)

    # -- helpers to work with JSON columns --

    def get_collection_ids(self) -> list[str]:
        return json.loads(self.collection_ids) if self.collection_ids else []

    def set_collection_ids(self, ids: list[str]) -> None:
        self.collection_ids = json.dumps(ids)

    def get_tools(self) -> list[str]:
        return json.loads(self.tools) if self.tools else []

    def set_tools(self, tool_names: list[str]) -> None:
        self.tools = json.dumps(tool_names)


# ---------------------------------------------------------------------------
# AgentRun  –  one invocation of an agent
# ---------------------------------------------------------------------------


class AgentRun(SQLModel, table=True):
    __tablename__ = "agent_runs"

    id: Optional[int] = Field(default=None, primary_key=True)
    agent_id: int = Field(sa_column=Column(Integer, nullable=False, index=True))
    user_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, nullable=True),
    )
    query: str = Field(sa_column=Column(Text, nullable=False))
    final_answer: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )
    status: str = Field(
        default="running",
        sa_column=Column(String(32), nullable=False, server_default="running"),
    )
    started_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    finished_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )


# ---------------------------------------------------------------------------
# AgentStep  –  individual step inside a run (thought / tool_call / …)
# ---------------------------------------------------------------------------


class AgentStep(SQLModel, table=True):
    __tablename__ = "agent_steps"

    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: int = Field(sa_column=Column(Integer, nullable=False, index=True))
    step_order: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False),
    )
    step_type: str = Field(
        sa_column=Column(String(32), nullable=False),
    )  # thought | tool_call | tool_result | token
    content: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )
    tool_name: Optional[str] = Field(
        default=None,
        sa_column=Column(String(128), nullable=True),
    )
    tool_input: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
