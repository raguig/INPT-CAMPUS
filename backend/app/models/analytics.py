"""SQLModel tables for analytics: usage logs and feedback."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# UsageLog — every LLM call is tracked here
# ---------------------------------------------------------------------------


class UsageLog(SQLModel, table=True):
    __tablename__ = "usage_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(
        default=None, sa_column=Column(Integer, nullable=True, index=True),
    )
    model: str = Field(
        default="mistral-small-latest",
        sa_column=Column(String(64), nullable=False, server_default="mistral-small-latest"),
    )
    tokens_in: int = Field(
        default=0, sa_column=Column(Integer, nullable=False, server_default="0"),
    )
    tokens_out: int = Field(
        default=0, sa_column=Column(Integer, nullable=False, server_default="0"),
    )
    cost_estimate: float = Field(
        default=0.0,
        sa_column=Column(Float, nullable=False, server_default="0.0"),
    )
    context: str = Field(
        default="",
        sa_column=Column(String(128), nullable=False, server_default=""),
    )  # e.g. "agent_run", "document_gen", "chat"
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


# ---------------------------------------------------------------------------
# Feedback — thumbs up / thumbs down on agent responses
# ---------------------------------------------------------------------------


class Feedback(SQLModel, table=True):
    __tablename__ = "feedback"

    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: Optional[int] = Field(
        default=None, sa_column=Column(Integer, nullable=True, index=True),
    )
    user_id: Optional[int] = Field(
        default=None, sa_column=Column(Integer, nullable=True, index=True),
    )
    rating: str = Field(
        sa_column=Column(String(16), nullable=False),
    )  # "up" | "down"
    comment: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


# ---------------------------------------------------------------------------
# Cost helpers
# ---------------------------------------------------------------------------

# Pricing per 1M tokens (USD) — Mistral models
PRICING = {
    "mistral-small-latest": {"input": 0.10, "output": 0.30},
    "mistral-medium-latest": {"input": 2.70, "output": 8.10},
    "mistral-large-latest": {"input": 2.00, "output": 6.00},
    "open-mistral-nemo": {"input": 0.15, "output": 0.15},
    "codestral-latest": {"input": 0.30, "output": 0.90},
}


def estimate_cost(model: str, tokens_in: int, tokens_out: int) -> float:
    """Return estimated USD cost for a single LLM call."""
    prices = PRICING.get(model, PRICING["mistral-small-latest"])
    return (tokens_in * prices["input"] + tokens_out * prices["output"]) / 1_000_000
