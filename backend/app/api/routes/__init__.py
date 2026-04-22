from app.api.routes.agents import router as agents_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router
from app.api.routes.clubs import router as clubs_router
from app.api.routes.connectors import router as connectors_router
from app.api.routes.documents import router as documents_router
from app.api.routes.internships import router as internships_router
from app.api.routes.settings import router as settings_router


__all__ = [
    "agents_router", "analytics_router", "auth_router",
    "clubs_router", "connectors_router", "documents_router",
    "internships_router", "settings_router",
]
