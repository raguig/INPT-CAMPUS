"""SQLModel table for generated documents."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class GeneratedDocument(SQLModel, table=True):
    __tablename__ = "generated_documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(sa_column=Column(Integer, nullable=False, index=True))
    template_type: str = Field(
        sa_column=Column(String(64), nullable=False),
    )  # ATTESTATION_SCOLARITE | LETTRE_MOTIVATION | DEMANDE_CONGE | RAPPORT_STAGE_OUTLINE
    variables: str = Field(
        default="{}",
        sa_column=Column(Text, nullable=False, server_default="{}"),
    )
    file_path: Optional[str] = Field(
        default=None,
        sa_column=Column(String(512), nullable=True),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    def get_variables(self) -> dict[str, Any]:
        return json.loads(self.variables) if self.variables else {}

    def set_variables(self, v: dict[str, Any]) -> None:
        self.variables = json.dumps(v, ensure_ascii=False)
