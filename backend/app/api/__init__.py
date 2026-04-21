from fastapi import APIRouter

from app.api.routes import (
    agents_router,
    analytics_router,
    auth_router,
    connectors_router,
    documents_router,
    internships_router,
    settings_router,
)


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(agents_router)
api_router.include_router(analytics_router)
api_router.include_router(connectors_router)
api_router.include_router(documents_router)
api_router.include_router(internships_router)
api_router.include_router(settings_router)


__all__ = ["api_router"]


