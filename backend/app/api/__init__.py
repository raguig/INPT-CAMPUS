from fastapi import APIRouter

from app.api.routes import (
    agents_router,
    analytics_router,
    auth_router,
    clubs_router,
    connectors_router,
    documents_router,
    internships_router,
    settings_router,
)
from app.api.routes.chat import router as chat_router
from app.api.routes.collections import router as collections_router
from app.api.routes.ingest import router as ingest_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(agents_router)
api_router.include_router(analytics_router)
api_router.include_router(clubs_router)
api_router.include_router(connectors_router)
api_router.include_router(documents_router)
api_router.include_router(internships_router)
api_router.include_router(settings_router)
api_router.include_router(chat_router)
api_router.include_router(collections_router)
api_router.include_router(ingest_router)


__all__ = ["api_router"]

