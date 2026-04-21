"""Settings API for Campus INPT.

Provides:
  - Global platform settings (admin-only write, encrypted API keys)
  - Per-user preferences (language, theme, notifications)
  - Available OpenAI models listing
  - API key connectivity test
  - Per-user monthly usage summary
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.analytics import UsageLog
from app.models.settings import (
    GLOBAL_DEFAULTS,
    GlobalSetting,
    UserSetting,
    decrypt_value,
    encrypt_value,
    mask_api_key,
)
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["settings"])


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────

SENSITIVE_KEYS = {"openai_api_key"}


def _require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )


def _get_global_dict(session: Session, unmask: bool = False) -> dict[str, str]:
    """Load all global settings into a dict, applying defaults for missing keys."""
    rows = session.exec(select(GlobalSetting)).all()
    stored = {r.key: r.value for r in rows}

    result: dict[str, str] = {}
    for key, default in GLOBAL_DEFAULTS.items():
        raw = stored.get(key, default)
        if key in SENSITIVE_KEYS and not unmask:
            result[key] = mask_api_key(decrypt_value(raw)) if raw else ""
        else:
            result[key] = raw
    return result


def _set_global(session: Session, key: str, value: str) -> None:
    """Upsert a single global setting."""
    row = session.exec(
        select(GlobalSetting).where(GlobalSetting.key == key)
    ).first()
    if row:
        row.value = value
        row.updated_at = datetime.now(timezone.utc)
        session.add(row)
    else:
        session.add(GlobalSetting(key=key, value=value))


# ──────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────


class GlobalSettingsResponse(BaseModel):
    llm_provider: str
    default_model: str
    embed_model: str
    openai_api_key: str  # masked
    max_tokens_per_query: str
    rag_top_k: str
    rag_similarity_threshold: str
    allow_registration: str
    maintenance_mode: str


class GlobalSettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    default_model: Optional[str] = None
    embed_model: Optional[str] = None
    openai_api_key: Optional[str] = None  # plaintext on input → encrypted at rest
    max_tokens_per_query: Optional[str] = None
    rag_top_k: Optional[str] = None
    rag_similarity_threshold: Optional[str] = None
    allow_registration: Optional[str] = None
    maintenance_mode: Optional[str] = None


class UserSettingsResponse(BaseModel):
    user_id: int
    language: str
    theme: str
    notification_email: bool
    default_collection_id: Optional[str]
    updated_at: str


class UserSettingsUpdate(BaseModel):
    language: Optional[str] = None
    theme: Optional[str] = None
    notification_email: Optional[bool] = None
    default_collection_id: Optional[str] = None


class SettingsResponse(BaseModel):
    """Combined response for GET /settings/"""
    global_settings: Optional[GlobalSettingsResponse] = None  # only for admins
    user_settings: UserSettingsResponse


class ModelInfo(BaseModel):
    id: str
    name: str
    context_window: int
    input_price: float  # per 1M tokens
    output_price: float


class TestKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=1)
    provider: str = "openai"


class TestKeyResponse(BaseModel):
    success: bool
    latency_ms: float
    message: str


class UsageSummary(BaseModel):
    period: str
    total_tokens_in: int
    total_tokens_out: int
    total_tokens: int
    estimated_cost_usd: float
    calls_count: int


# ──────────────────────────────────────────────────────────────────────
# GET /settings/  — combined global + user settings
# ──────────────────────────────────────────────────────────────────────


@router.get("/", response_model=SettingsResponse)
def get_settings(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # User settings (create if missing)
    us = session.exec(
        select(UserSetting).where(UserSetting.user_id == user.id)
    ).first()
    if not us:
        us = UserSetting(user_id=user.id)
        session.add(us)
        session.commit()
        session.refresh(us)

    user_resp = UserSettingsResponse(
        user_id=us.user_id,
        language=us.language,
        theme=us.theme,
        notification_email=us.notification_email,
        default_collection_id=us.default_collection_id,
        updated_at=us.updated_at.isoformat() if us.updated_at else "",
    )

    # Global settings — only for admin
    global_resp = None
    if user.role == "admin":
        gd = _get_global_dict(session)
        global_resp = GlobalSettingsResponse(**gd)

    return SettingsResponse(global_settings=global_resp, user_settings=user_resp)


# ──────────────────────────────────────────────────────────────────────
# PATCH /settings/  — update settings
# ──────────────────────────────────────────────────────────────────────


class SettingsUpdateBody(BaseModel):
    global_settings: Optional[GlobalSettingsUpdate] = None
    user_settings: Optional[UserSettingsUpdate] = None


@router.patch("/", response_model=SettingsResponse)
def update_settings(
    body: SettingsUpdateBody,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Global settings update — admin only
    if body.global_settings is not None:
        _require_admin(user)
        updates = body.global_settings.dict(exclude_none=True)
        for key, value in updates.items():
            if key in SENSITIVE_KEYS:
                value = encrypt_value(value)
            _set_global(session, key, value)
        session.commit()

    # User settings update
    if body.user_settings is not None:
        us = session.exec(
            select(UserSetting).where(UserSetting.user_id == user.id)
        ).first()
        if not us:
            us = UserSetting(user_id=user.id)

        upd = body.user_settings
        if upd.language is not None:
            if upd.language not in ("fr", "en", "ar"):
                raise HTTPException(400, "Langue invalide. Options : fr, en, ar")
            us.language = upd.language
        if upd.theme is not None:
            if upd.theme not in ("light", "dark"):
                raise HTTPException(400, "Thème invalide. Options : light, dark")
            us.theme = upd.theme
        if upd.notification_email is not None:
            us.notification_email = upd.notification_email
        if upd.default_collection_id is not None:
            us.default_collection_id = upd.default_collection_id

        us.updated_at = datetime.now(timezone.utc)
        session.add(us)
        session.commit()
        session.refresh(us)

    return get_settings(user=user, session=session)


# ──────────────────────────────────────────────────────────────────────
# GET /settings/models  — available LLM models
# ──────────────────────────────────────────────────────────────────────

AVAILABLE_MODELS: list[ModelInfo] = [
    ModelInfo(id="gpt-4o-mini", name="GPT-4o Mini", context_window=128000, input_price=0.15, output_price=0.60),
    ModelInfo(id="gpt-4o", name="GPT-4o", context_window=128000, input_price=2.50, output_price=10.00),
    ModelInfo(id="gpt-4-turbo", name="GPT-4 Turbo", context_window=128000, input_price=10.00, output_price=30.00),
    ModelInfo(id="gpt-3.5-turbo", name="GPT-3.5 Turbo", context_window=16385, input_price=0.50, output_price=1.50),
    ModelInfo(id="text-embedding-3-small", name="Embedding 3 Small", context_window=8191, input_price=0.02, output_price=0.0),
    ModelInfo(id="text-embedding-3-large", name="Embedding 3 Large", context_window=8191, input_price=0.13, output_price=0.0),
]


@router.get("/models", response_model=list[ModelInfo])
def list_models(user: User = Depends(get_current_user)):
    return AVAILABLE_MODELS


# ──────────────────────────────────────────────────────────────────────
# POST /settings/models/test  — test API key connectivity
# ──────────────────────────────────────────────────────────────────────


@router.post("/models/test", response_model=TestKeyResponse)
async def test_api_key(
    body: TestKeyRequest,
    user: User = Depends(get_current_user),
):
    _require_admin(user)

    if body.provider != "openai":
        raise HTTPException(400, f"Fournisseur non supporté : {body.provider}")

    start = time.monotonic()
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=body.api_key)
        # Minimal request — list models (cheapest call)
        await client.models.list()

        latency = (time.monotonic() - start) * 1000
        return TestKeyResponse(
            success=True,
            latency_ms=round(latency, 1),
            message="Clé API valide. Connexion établie.",
        )
    except Exception as exc:
        latency = (time.monotonic() - start) * 1000
        return TestKeyResponse(
            success=False,
            latency_ms=round(latency, 1),
            message=f"Erreur : {exc}",
        )


# ──────────────────────────────────────────────────────────────────────
# GET /settings/usage  — current user's monthly token usage
# ──────────────────────────────────────────────────────────────────────


@router.get("/usage", response_model=UsageSummary)
def user_usage(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    logs = session.exec(
        select(UsageLog)
        .where(UsageLog.user_id == user.id)
        .where(UsageLog.created_at >= month_start)  # type: ignore[union-attr]
    ).all()

    total_in = sum(l.tokens_in for l in logs)
    total_out = sum(l.tokens_out for l in logs)
    total_cost = sum(l.cost_estimate for l in logs)

    return UsageSummary(
        period=now.strftime("%B %Y"),
        total_tokens_in=total_in,
        total_tokens_out=total_out,
        total_tokens=total_in + total_out,
        estimated_cost_usd=round(total_cost, 4),
        calls_count=len(logs),
    )
