from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.api import api_router
from app.core.database import engine, init_db
from app.models.club import seed_clubs_on_startup


app = FastAPI(title="Campus INPT API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    with Session(engine) as session:
        seed_clubs_on_startup(session)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "app": "Campus INPT"}


app.include_router(api_router)
