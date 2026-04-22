import io
import logging
from datetime import datetime, timezone
from typing import Annotated, List

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

CHUNK_SIZE = 800   # characters per chunk
CHUNK_OVERLAP = 100  # overlap between chunks


def _extract_text(content: bytes, filename: str) -> str:
    """Extract plain text from file bytes. Handles PDF and plain text."""
    name_lower = filename.lower()
    if name_lower.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            pages_text = []
            for page in reader.pages:
                page_text = page.extract_text() or ""
                pages_text.append(page_text)
            extracted = "\n\n".join(pages_text).strip()
            if extracted:
                return extracted
            logger.warning("PDF '%s' yielded no extractable text (may be scanned/image-only).", filename)
            return f"[PDF sans texte extractible : {filename}]"
        except Exception as exc:
            logger.warning("pypdf failed on '%s': %s", filename, exc)
            return f"[Erreur extraction PDF : {filename}]"
    # Fallback: try utf-8, then latin-1
    for encoding in ("utf-8", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return f"[Document binaire non lisible : {filename}]"


def _split_chunks(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks."""
    if not text.strip():
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start += chunk_size - overlap
    return chunks


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
    filename = file.filename or "unnamed"

    # --- Extract text ---
    text = _extract_text(content, filename)
    chunks = _split_chunks(text)
    chunk_count = len(chunks)

    doc = Document(
        collection_id=collection_id,
        filename=filename,
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

    # --- Index into ChromaDB ---
    indexed_chunks = 0
    if chunks:
        try:
            import chromadb
            from app.core.config import DATA_DIR
            chroma_dir = DATA_DIR / "chroma"
            chroma_dir.mkdir(parents=True, exist_ok=True)
            client = chromadb.PersistentClient(path=str(chroma_dir.resolve()))
            chroma_col = client.get_or_create_collection(col.chroma_collection_name)

            ids = [f"doc_{doc.id}_chunk_{i}" for i in range(chunk_count)]
            metadatas = [
                {
                    "filename": filename,
                    "source": "MANUAL_UPLOAD",
                    "doc_id": doc.id,
                    "collection_id": col.id,
                    "chunk_index": i,
                }
                for i in range(chunk_count)
            ]
            chroma_col.upsert(documents=chunks, ids=ids, metadatas=metadatas)
            indexed_chunks = chunk_count
            logger.info("Indexed %d chunks from '%s' into collection '%s'.", chunk_count, filename, col.chroma_collection_name)
        except Exception as exc:
            logger.warning("Failed to index '%s' to ChromaDB: %s", filename, exc)
    else:
        logger.warning("No text extracted from '%s'; skipping ChromaDB indexing.", filename)

    return {
        "id": doc.id,
        "filename": doc.filename,
        "source_type": doc.source_type,
        "file_size": doc.file_size,
        "status": doc.status,
        "chunks_indexed": indexed_chunks,
    }
