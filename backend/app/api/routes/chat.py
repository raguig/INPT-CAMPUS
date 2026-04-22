import json
import logging
import os
from typing import Annotated, List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.document import Collection
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

SessionDep = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


class ChatRequest(BaseModel):
    collections: List[str] = []   # numeric IDs as strings from frontend e.g. ["1", "2"]
    message: str
    model: str = "mistral-small-latest"
    session_id: str
    stream: bool = True


def _resolve_chroma_names(session: Session, collection_ids: List[str]) -> List[str]:
    """Convert numeric collection IDs → chroma_collection_name strings."""
    if not collection_ids:
        # No filter: use ALL collections
        rows = session.exec(select(Collection)).all()
        return [r.chroma_collection_name for r in rows if r.chroma_collection_name]

    ids_int: list[int] = []
    for cid in collection_ids:
        try:
            ids_int.append(int(cid))
        except (ValueError, TypeError):
            # Already a name string (fallback collections like "reglement")
            pass

    if not ids_int:
        return collection_ids  # legacy string names, pass through

    rows = session.exec(select(Collection).where(Collection.id.in_(ids_int))).all()
    return [r.chroma_collection_name for r in rows if r.chroma_collection_name]


def _retrieve_context(query: str, chroma_names: List[str]) -> str:
    """Query ChromaDB PersistentClient for relevant chunks."""
    if not chroma_names:
        return ""
    try:
        import chromadb
        from app.core.config import DATA_DIR

        chroma_dir = DATA_DIR / "chroma"
        if not chroma_dir.exists():
            logger.warning("ChromaDB directory does not exist yet.")
            return ""

        client = chromadb.PersistentClient(path=str(chroma_dir.resolve()))
        # v0.6+: list_collections() returns names directly
        try:
            existing = set(client.list_collections())
        except Exception:
            existing = set()

        all_chunks: list[str] = []
        for name in chroma_names:
            if name not in existing:
                logger.warning("ChromaDB collection '%s' not found.", name)
                continue
            try:
                col = client.get_collection(name)
                count = col.count()
                if count == 0:
                    logger.info("Collection '%s' is empty.", name)
                    continue
                n_results = min(5, count)
                results = col.query(query_texts=[query], n_results=n_results)
                docs = results.get("documents", [[]])[0]
                all_chunks.extend(docs)
                logger.info("Got %d chunks from '%s'.", len(docs), name)
            except Exception as exc:
                logger.warning("ChromaDB query failed on '%s': %s", name, exc)

        if not all_chunks:
            return ""

        return "\n\n---\n\n".join(all_chunks[:8])

    except Exception as exc:
        logger.warning("RAG retrieval failed: %s", exc)
        return ""


def _build_prompt(user_message: str, context: str) -> str:
    if context:
        return (
            "Tu es un assistant universitaire pour les étudiants de l'INPT. "
            "Réponds en te basant sur le contexte fourni ci-dessous. "
            "Si le contexte ne contient pas l'information, dis-le clairement.\n\n"
            f"=== CONTEXTE ===\n{context}\n=== FIN CONTEXTE ===\n\n"
            f"Question : {user_message}"
        )
    return (
        "Tu es un assistant universitaire pour les étudiants de l'INPT. "
        f"Réponds à la question suivante : {user_message}"
    )


@router.post("/stream")
async def chat_stream(body: ChatRequest, session: SessionDep):
    async def _event_generator():
        try:
            from langchain_mistralai import ChatMistralAI
            from langchain_core.messages import HumanMessage

            # 1. Resolve collection IDs → ChromaDB names
            chroma_names = _resolve_chroma_names(session, body.collections)
            logger.info("Chat: collections=%s → chroma=%s", body.collections, chroma_names)

            # 2. Retrieve relevant context
            context = _retrieve_context(body.message, chroma_names)
            logger.info("Chat: retrieved context length=%d", len(context))

            prompt = _build_prompt(body.message, context)

            # 3. Stream Mistral response
            llm = ChatMistralAI(
                model=os.getenv("LLM_MODEL", "mistral-small-latest"),
                temperature=0.3,
                streaming=True,
                api_key=os.getenv("MISTRAL_API_KEY", ""),
            )

            async for chunk in llm.astream([HumanMessage(content=prompt)]):
                if chunk.content:
                    event = {
                        "type": "token",
                        "content": chunk.content,
                        "session_id": body.session_id,
                    }
                    yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'session_id': body.session_id})}\n\n"

        except Exception as exc:
            err_str = str(exc)
            if "503" in err_str or "unreachable_backend" in err_str:
                user_msg = "Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants."
            elif "401" in err_str or "api_key" in err_str.lower():
                user_msg = "Clé API Mistral invalide ou manquante."
            elif "429" in err_str:
                user_msg = "Limite de requêtes atteinte. Veuillez patienter avant de réessayer."
            else:
                user_msg = "Une erreur est survenue. Veuillez réessayer."
            logger.error("Chat stream error: %s", exc)
            yield f"data: {json.dumps({'type': 'token', 'content': user_msg}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'session_id': body.session_id})}\n\n"

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/sessions")
async def get_sessions():
    return []


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    return {"title": "Nouvelle conversation", "messages": []}
