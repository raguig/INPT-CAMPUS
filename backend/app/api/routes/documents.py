"""Document generation endpoints for Campus INPT."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.document import GeneratedDocument
from app.models.user import User
from app.services.document_generator import TEMPLATE_META, generate_document

router = APIRouter(prefix="/documents", tags=["documents"])


# ──────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────


class TemplateResponse(BaseModel):
    type: str
    label: str
    icon: str
    description: str
    fields: list[str]
    ai_powered: bool


class GenerateRequest(BaseModel):
    template_type: str = Field(..., min_length=1)
    variables: dict[str, Any] = Field(default_factory=dict)


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    template_type: str
    variables: dict[str, Any]
    file_path: Optional[str]
    created_at: str


class MessageResponse(BaseModel):
    message: str


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def _doc_to_response(doc: GeneratedDocument) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        template_type=doc.template_type,
        variables=doc.get_variables(),
        file_path=doc.file_path,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )


# ──────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────


@router.get("/templates", response_model=list[TemplateResponse])
def list_templates():
    """List available document templates with their metadata."""
    return [TemplateResponse(**meta) for meta in TEMPLATE_META]


@router.post("/generate", response_model=DocumentResponse, status_code=201)
async def generate_doc(
    body: GenerateRequest,
    user_id: int = Query(...),
    session: Session = Depends(get_session),
):
    """Generate a document from a template.

    For simple templates (ATTESTATION_SCOLARITE, DEMANDE_CONGE):
      Fills Jinja2 with student data → renders HTML → converts to PDF.

    For AI templates (LETTRE_MOTIVATION, RAPPORT_STAGE_OUTLINE):
      Builds prompt from student profile → calls Mistral → merges into template → PDF.
    """

    # Validate template type
    valid_types = {m["type"] for m in TEMPLATE_META}
    if body.template_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de template invalide. Valides : {', '.join(sorted(valid_types))}",
        )

    # Fetch user data for auto-fill
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable.")

    student_info: dict[str, Any] = {
        "full_name": user.full_name,
        "student_id": user.student_id,
        "email": user.email,
        "filiere": user.filiere,
        "year": user.year,
    }

    # Try to enrich with student profile (skills, bio)
    try:
        from app.models.internship import StudentProfile

        profile = session.exec(
            select(StudentProfile).where(StudentProfile.user_id == user_id)
        ).first()
        if profile:
            import json
            student_info["skills"] = json.loads(profile.skills) if profile.skills else []
            student_info["bio"] = profile.bio or ""
    except Exception:
        pass  # Profile enrichment is best-effort

    # Generate the document
    try:
        file_path = await generate_document(
            template_type=body.template_type,
            variables=body.variables,
            student_info=student_info,
        )
    except Exception as exc:
        raise HTTPException(500, f"Erreur de génération : {exc}")

    # Save to DB
    doc = GeneratedDocument(
        user_id=user_id,
        template_type=body.template_type,
        file_path=file_path,
    )
    doc.set_variables(body.variables)
    session.add(doc)
    session.commit()
    session.refresh(doc)

    return _doc_to_response(doc)


@router.get("/history", response_model=list[DocumentResponse])
def document_history(
    user_id: int = Query(...),
    session: Session = Depends(get_session),
):
    """Get the user's generated document history."""
    docs = session.exec(
        select(GeneratedDocument)
        .where(GeneratedDocument.user_id == user_id)
        .order_by(GeneratedDocument.created_at.desc())  # type: ignore[union-attr]
    ).all()
    return [_doc_to_response(d) for d in docs]


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    session: Session = Depends(get_session),
):
    """Download a generated document as a file."""
    doc = session.get(GeneratedDocument, doc_id)
    if not doc:
        raise HTTPException(404, "Document introuvable.")

    if not doc.file_path:
        raise HTTPException(404, "Fichier non disponible.")

    path = Path(doc.file_path)
    if not path.exists():
        raise HTTPException(404, "Fichier supprimé ou introuvable sur le disque.")

    # Determine media type
    media_type = "application/pdf" if path.suffix == ".pdf" else "text/html"
    filename = f"{doc.template_type.lower()}_{doc.id}{path.suffix}"

    return FileResponse(
        path=str(path),
        media_type=media_type,
        filename=filename,
    )
