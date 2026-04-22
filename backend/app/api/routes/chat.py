from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import os
from typing import List, Optional

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    collections: List[str] = []
    message: str
    model: str = "gpt-4o-mini"
    session_id: str
    stream: bool = True

@router.post("/stream")
async def chat_stream(body: ChatRequest):
    async def _event_generator():
        try:
            from langchain_mistralai import ChatMistralAI
            from langchain_core.messages import HumanMessage
            
            llm = ChatMistralAI(
                model=os.getenv("LLM_MODEL", "mistral-small-latest"),
                temperature=0.3,
                streaming=True,
                api_key=os.getenv("MISTRAL_API_KEY", "dummy_key"),
            )
            
            async for chunk in llm.astream([HumanMessage(content=body.message)]):
                event = {"type": "token", "content": chunk.content, "session_id": body.session_id}
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            
            # Send done event
            yield f"data: {json.dumps({'type': 'done', 'session_id': body.session_id}, ensure_ascii=False)}\n\n"
        except Exception as e:
            # Fallback to simple echo if LLM fails (e.g. no API key)
            err_msg = f"Je suis un assistant local. (Erreur LLM: {str(e)}) Voici votre message : {body.message}"
            yield f"data: {json.dumps({'type': 'token', 'content': err_msg}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'session_id': body.session_id}, ensure_ascii=False)}\n\n"

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
    # Allow frontend to fallback to localStorage
    return []

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    # Allow frontend to fallback to localStorage
    return {"title": "Nouvelle conversation", "messages": []}
