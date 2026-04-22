"""
app/api/routes/collections.py
==============================
CRUD endpoints for Collections and their Documents.

Routes:
  GET    /collections/                              list all collections
  POST   /collections/                              create collection
  GET    /collections/{id}                          detail + stats
  PATCH  /collections/{id}                          update name/description
  DELETE /collections/{id}                          delete + wipe ChromaDB

  GET    /collections/{id}/documents                list documents
  DELETE /collections/{id}/documents/{doc_id}       delete doc + vectors
  GET    /collections/{id}/documents/{doc_id}/chunks return chunk metadata

All endpoints require Bearer-token auth.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlmodel import Session, func, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.document import (
    CategoryEnum,
    Collection,
    Document,
    DocumentChunk,
    DocStatus,
    _utc_now,
)
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/collections", tags=["collections"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slug(name: str) -> str:
    """Convert a collection name to a safe ChromaDB collection name."""
    normalized = unicodedata.normalize("NFKD", name)
    ascii_str = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9_-]", "_", ascii_str).strip("_").lower()
    slug = re.sub(r"_+", "_", slug)
    # ChromaDB names must be 3-63 chars
    slug = slug[:60] or "collection"
    return f"campus_{slug}"


def _get_collection_or_404(session: Session, collection_id: int) -> Collection:
    col = session.get(Collection, collection_id)
    if col is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection {collection_id} introuvable.",
        )
    return col


def _utc_now_tz() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    category: str = Field(default=CategoryEnum.GENERAL)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        v = v.upper()
        if v not in CategoryEnum.ALL:
            raise ValueError(
                f"category must be one of: {', '.join(sorted(CategoryEnum.ALL))}"
            )
        return v


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)


class CollectionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    doc_count: int
    chroma_collection_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CollectionDetail(CollectionResponse):
    chunk_count: int
    total_size_bytes: int


class DocumentResponse(BaseModel):
    id: int
    filename: str
    source_type: str
    file_size: int
    chunk_count: int
    status: str
    uploaded_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChunkResponse(BaseModel):
    id: int
    chroma_id: str
    chunk_index: int
    page_number: Optional[int]
    text_preview: Optional[str]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Collection endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[CollectionResponse], summary="Lister les collections")
def list_collections(
    session: SessionDep,
    _user: CurrentUser,
    category: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Collection]:
    query = select(Collection)
    if category:
        query = query.where(Collection.category == category.upper())
    query = query.order_by(Collection.updated_at.desc()).offset(offset).limit(limit)  # type: ignore[arg-type]
    return list(session.exec(query).all())


@router.post(
    "/",
    response_model=CollectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une collection",
)
def create_collection(
    payload: CollectionCreate,
    session: SessionDep,
    _user: CurrentUser,
) -> Collection:
    # Check uniqueness
    existing = session.exec(
        select(Collection).where(Collection.name == payload.name)
    ).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Une collection nommée '{payload.name}' existe déjà.",
        )

    chroma_name = _slug(payload.name)
    col = Collection(
        name=payload.name,
        description=payload.description,
        category=payload.category,
        chroma_collection_name=chroma_name,
    )
    session.add(col)
    session.commit()
    session.refresh(col)

    # Eagerly create the ChromaDB collection (best-effort)
    try:
        from app.services.rag import get_or_create_chroma_collection
        get_or_create_chroma_collection(chroma_name)
    except Exception as exc:
        logger.warning("Could not pre-create ChromaDB collection: %s", exc)

    return col


@router.get(
    "/{collection_id}",
    response_model=CollectionDetail,
    summary="Détail d'une collection",
)
def get_collection(
    collection_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    _user: CurrentUser,
) -> CollectionDetail:
    col = _get_collection_or_404(session, collection_id)

    chunk_count = session.exec(
        select(func.count(DocumentChunk.id)).where(
            DocumentChunk.collection_id == collection_id
        )
    ).one_or_none() or 0

    total_size = session.exec(
        select(func.sum(Document.file_size)).where(
            Document.collection_id == collection_id
        )
    ).one_or_none() or 0

    return CollectionDetail(
        id=col.id,  # type: ignore[arg-type]
        name=col.name,
        description=col.description,
        category=col.category,
        doc_count=col.doc_count,
        chroma_collection_name=col.chroma_collection_name,
        created_at=col.created_at,
        updated_at=col.updated_at,
        chunk_count=chunk_count,
        total_size_bytes=int(total_size),
    )


@router.patch(
    "/{collection_id}",
    response_model=CollectionResponse,
    summary="Mettre à jour une collection",
)
def update_collection(
    collection_id: Annotated[int, Path(ge=1)],
    payload: CollectionUpdate,
    session: SessionDep,
    _user: CurrentUser,
) -> Collection:
    col = _get_collection_or_404(session, collection_id)

    if payload.name is not None:
        # Check uniqueness (excluding self)
        existing = session.exec(
            select(Collection).where(
                Collection.name == payload.name,
                Collection.id != collection_id,
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Une collection nommée '{payload.name}' existe déjà.",
            )
        col.name = payload.name

    if payload.description is not None:
        col.description = payload.description

    col.updated_at = _utc_now_tz()
    session.add(col)
    session.commit()
    session.refresh(col)
    return col


@router.delete(
    "/{collection_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer une collection et ses vecteurs",
)
def delete_collection(
    collection_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    _user: CurrentUser,
) -> None:
    col = _get_collection_or_404(session, collection_id)
    chroma_name = col.chroma_collection_name

    # Delete ChromaDB collection (best-effort)
    try:
        from app.services.rag import delete_chroma_collection
        delete_chroma_collection(chroma_name)
    except Exception as exc:
        logger.warning("ChromaDB delete failed for %s: %s", chroma_name, exc)

    # Cascade SQLite: chunks → documents → collection
    session.exec(  # type: ignore[call-overload]
        select(DocumentChunk).where(DocumentChunk.collection_id == collection_id)
    )
    chunks = session.exec(
        select(DocumentChunk).where(DocumentChunk.collection_id == collection_id)
    ).all()
    for chunk in chunks:
        session.delete(chunk)

    docs = session.exec(
        select(Document).where(Document.collection_id == collection_id)
    ).all()
    for doc in docs:
        session.delete(doc)

    session.delete(col)
    session.commit()


# ---------------------------------------------------------------------------
# Document sub-endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/{collection_id}/documents",
    response_model=list[DocumentResponse],
    summary="Lister les documents d'une collection",
)
def list_documents(
    collection_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    _user: CurrentUser,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Document]:
    _get_collection_or_404(session, collection_id)
    query = select(Document).where(Document.collection_id == collection_id)
    if status_filter:
        query = query.where(Document.status == status_filter)
    query = query.order_by(Document.uploaded_at.desc()).offset(offset).limit(limit)  # type: ignore[arg-type]
    return list(session.exec(query).all())


@router.delete(
    "/{collection_id}/documents/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un document et ses chunks",
)
def delete_document(
    collection_id: Annotated[int, Path(ge=1)],
    doc_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    _user: CurrentUser,
) -> None:
    col = _get_collection_or_404(session, collection_id)
    doc = session.exec(
        select(Document).where(
            Document.id == doc_id,
            Document.collection_id == collection_id,
        )
    ).first()
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {doc_id} introuvable dans la collection {collection_id}.",
        )

    # Delete chunks from ChromaDB
    try:
        from app.services.rag import delete_document_vectors
        delete_document_vectors(col.chroma_collection_name, doc_id)
    except Exception as exc:
        logger.warning("ChromaDB vector delete failed: %s", exc)

    # Delete local chunks
    chunks = session.exec(
        select(DocumentChunk).where(DocumentChunk.document_id == doc_id)
    ).all()
    for chunk in chunks:
        session.delete(chunk)

    # Update collection counter
    col.doc_count = max(0, col.doc_count - 1)
    col.updated_at = _utc_now_tz()
    session.add(col)

    session.delete(doc)
    session.commit()


@router.get(
    "/{collection_id}/documents/{doc_id}/chunks",
    response_model=list[ChunkResponse],
    summary="Lister les chunks d'un document",
)
def list_document_chunks(
    collection_id: Annotated[int, Path(ge=1)],
    doc_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    _user: CurrentUser,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[DocumentChunk]:
    _get_collection_or_404(session, collection_id)
    doc = session.exec(
        select(Document).where(
            Document.id == doc_id,
            Document.collection_id == collection_id,
        )
    ).first()
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {doc_id} introuvable.",
        )

    chunks = session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == doc_id)
        .order_by(DocumentChunk.chunk_index)  # type: ignore[arg-type]
        .offset(offset)
        .limit(limit)
    ).all()
    return list(chunks)
