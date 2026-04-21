from fastapi import FastAPI

from app.api import api_router
from app.core.database import init_db


app = FastAPI(title="Campus INPT API", version="1.0.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "app": "Campus INPT"}


app.include_router(api_router)
