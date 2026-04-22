import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.document import Collection, Document, DocStatus
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["ingest"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/file", status_code=status.HTTP_201_CREATED)
async def ingest_file(
    file: UploadFile,
    session: SessionDep,
    user: CurrentUser,
    collection_id: int = Form(...),
):
    col = session.get(Collection, collection_id)
    if not col:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection introuvable.",
        )

    content = await file.read()
    file_size = len(content)

    doc = Document(
        collection_id=collection_id,
        filename=file.filename or "unnamed",
        source_type="MANUAL_UPLOAD",
        file_size=file_size,
        status=DocStatus.READY,
    )
    session.add(doc)

    col.doc_count = (col.doc_count or 0) + 1
    col.updated_at = datetime.now(timezone.utc)
    session.add(col)

    session.commit()
    session.refresh(doc)

    try:
        import chromadb
        client = chromadb.HttpClient(host="localhost", port=8000)
        collection = client.get_or_create_collection(col.chroma_collection_name)
        
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = f"[Binary Document: {doc.filename}]"
            
        doc_id_str = f"manual_{doc.id}"
        collection.upsert(
            documents=[text],
            ids=[doc_id_str],
            metadatas=[{
                "filename": doc.filename, 
                "source": "MANUAL_UPLOAD", 
                "doc_id": doc.id,
                "collection_id": col.id
            }],
        )
    except Exception as exc:
        logger.warning(f"Failed to index to ChromaDB: {exc}")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "source_type": doc.source_type,
        "file_size": doc.file_size,
        "status": doc.status,
    }
