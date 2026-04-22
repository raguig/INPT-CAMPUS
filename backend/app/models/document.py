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


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)

class CategoryEnum:
    GENERAL = "GENERAL"
    ACADEMIQUE = "ACADEMIQUE"
    ADMINISTRATIF = "ADMINISTRATIF"
    CARRIERE = "CARRIERE"
    ALL = {GENERAL, ACADEMIQUE, ADMINISTRATIF, CARRIERE}

class DocStatus:
    PROCESSING = "PROCESSING"
    READY = "READY"
    ERROR = "ERROR"

class Collection(SQLModel, table=True):
    __tablename__ = "collections"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String(255), nullable=False, unique=True))
    description: Optional[str] = Field(sa_column=Column(Text, nullable=True))
    category: str = Field(default=CategoryEnum.GENERAL, sa_column=Column(String(50), nullable=False))
    doc_count: int = Field(default=0, sa_column=Column(Integer, nullable=False))
    chroma_collection_name: str = Field(sa_column=Column(String(100), nullable=False, unique=True))
    created_at: datetime = Field(default_factory=_utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))
    updated_at: datetime = Field(default_factory=_utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))

class Document(SQLModel, table=True):
    __tablename__ = "documents"
    id: Optional[int] = Field(default=None, primary_key=True)
    collection_id: int = Field(foreign_key="collections.id", nullable=False)
    filename: str = Field(sa_column=Column(String(255), nullable=False))
    source_type: str = Field(sa_column=Column(String(50), nullable=False))
    file_size: int = Field(default=0, sa_column=Column(Integer, nullable=False))
    chunk_count: int = Field(default=0, sa_column=Column(Integer, nullable=False))
    status: str = Field(default=DocStatus.PROCESSING, sa_column=Column(String(50), nullable=False))
    uploaded_at: datetime = Field(default_factory=_utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))
    updated_at: datetime = Field(default_factory=_utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))

class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunks"
    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int = Field(foreign_key="documents.id", nullable=False)
    collection_id: int = Field(foreign_key="collections.id", nullable=False)
    chroma_id: str = Field(sa_column=Column(String(255), nullable=False, unique=True))
    chunk_index: int = Field(sa_column=Column(Integer, nullable=False))
    page_number: Optional[int] = Field(sa_column=Column(Integer, nullable=True))
    text_preview: Optional[str] = Field(sa_column=Column(Text, nullable=True))

