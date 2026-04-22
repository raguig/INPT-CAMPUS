import json
import logging
import os
from typing import List

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    collections: List[str] = []
    message: str
    model: str = "mistral-small-latest"
    session_id: str
    stream: bool = True


def _retrieve_context(query: str, collection_names: List[str]) -> str:
    """Query ChromaDB PersistentClient for relevant chunks."""
    try:
        import chromadb
        from app.core.config import DATA_DIR

        chroma_dir = DATA_DIR / "chroma"
        if not chroma_dir.exists():
            return ""

        client = chromadb.PersistentClient(path=str(chroma_dir.resolve()))
        existing = {c.name for c in client.list_collections()}

        targets = [n for n in collection_names if n in existing] if collection_names else list(existing)
        if not targets:
            return ""

        all_chunks: list[str] = []
        for coll_name in targets:
            try:
                col = client.get_collection(coll_name)
                if col.count() == 0:
                    continue
                results = col.query(query_texts=[query], n_results=5)
                docs = results.get("documents", [[]])[0]
                all_chunks.extend(docs)
            except Exception as exc:
                logger.warning("ChromaDB query failed on '%s': %s", coll_name, exc)

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
async def chat_stream(body: ChatRequest):
    async def _event_generator():
        try:
            from langchain_mistralai import ChatMistralAI
            from langchain_core.messages import HumanMessage, SystemMessage

            # 1. Retrieve context from ChromaDB
            context = _retrieve_context(body.message, body.collections)
            prompt = _build_prompt(body.message, context)

            # 2. Call Mistral with context-enriched prompt
            llm = ChatMistralAI(
                model=os.getenv("LLM_MODEL", "mistral-small-latest"),
                temperature=0.3,
                streaming=True,
                api_key=os.getenv("MISTRAL_API_KEY", ""),
            )

            messages = [HumanMessage(content=prompt)]
            async for chunk in llm.astream(messages):
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
            # Detect common transient errors and give a clean user-facing message
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
