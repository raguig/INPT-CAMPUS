"""Analytics API endpoints for Campus INPT.

Provides platform-wide and per-user analytics including:
  - Overview (total queries, users, top questions, avg response time)
  - Queries per day (chart data, last 30 days)
  - Collection popularity
  - Feedback summary (thumbs up/down ratio)
  - Cost tracking (tokens + USD estimate, admin-only)

Access control:
  - /analytics/overview, /analytics/costs → admin only
  - /analytics/queries, /analytics/collections, /analytics/feedback → admin gets global,
    students get their own data only
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.agent import AgentRun, AgentStep
from app.models.analytics import Feedback, UsageLog
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def _require_admin(user: User) -> None:
    """Raise 403 if user is not an admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ──────────────────────────────────────────────────────────────────────
# Response schemas
# ──────────────────────────────────────────────────────────────────────


class OverviewResponse(BaseModel):
    total_queries: int
    total_users: int
    top_questions: list[dict[str, Any]]
    avg_response_time_ms: float


class DayCount(BaseModel):
    date: str
    count: int


class QueriesResponse(BaseModel):
    days: list[DayCount]
    total: int


class CollectionStat(BaseModel):
    collection: str
    query_count: int


class FeedbackResponse(BaseModel):
    thumbs_up: int
    thumbs_down: int
    total: int
    ratio: float


class CostResponse(BaseModel):
    period: str
    total_tokens_in: int
    total_tokens_out: int
    total_tokens: int
    estimated_cost_usd: float
    calls_count: int
    by_model: list[dict[str, Any]]


class FeedbackCreate(BaseModel):
    run_id: int
    rating: str  # "up" | "down"
    comment: str = ""


class FeedbackOut(BaseModel):
    id: int
    run_id: Optional[int]
    rating: str
    comment: str
    created_at: str


# ──────────────────────────────────────────────────────────────────────
# GET /analytics/overview  (admin only)
# ──────────────────────────────────────────────────────────────────────


@router.get("/overview", response_model=OverviewResponse)
def analytics_overview(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _require_admin(user)

    # Total queries
    total_queries = session.exec(
        select(func.count(AgentRun.id))
    ).one()

    # Total distinct users
    total_users = session.exec(
        select(func.count(func.distinct(AgentRun.user_id)))
    ).one()

    # Top 10 questions
    runs = session.exec(
        select(AgentRun.query)
        .order_by(AgentRun.started_at.desc())  # type: ignore[union-attr]
        .limit(200)
    ).all()
    question_counts = Counter(runs)
    top_questions = [
        {"question": q, "count": c}
        for q, c in question_counts.most_common(10)
    ]

    # Average response time (for finished runs)
    finished_runs = session.exec(
        select(AgentRun)
        .where(AgentRun.status == "done")
        .where(AgentRun.finished_at.isnot(None))  # type: ignore[union-attr]
        .limit(500)
    ).all()
    if finished_runs:
        durations = [
            (r.finished_at - r.started_at).total_seconds() * 1000
            for r in finished_runs
            if r.finished_at and r.started_at
        ]
        avg_ms = sum(durations) / len(durations) if durations else 0
    else:
        avg_ms = 0

    return OverviewResponse(
        total_queries=total_queries or 0,
        total_users=total_users or 0,
        top_questions=top_questions,
        avg_response_time_ms=round(avg_ms, 1),
    )


# ──────────────────────────────────────────────────────────────────────
# GET /analytics/queries   (admin → global, student → own)
# ──────────────────────────────────────────────────────────────────────


@router.get("/queries", response_model=QueriesResponse)
def analytics_queries(
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    cutoff = _utc_now() - timedelta(days=days)

    stmt = select(AgentRun).where(AgentRun.started_at >= cutoff)  # type: ignore[union-attr]
    if user.role != "admin":
        stmt = stmt.where(AgentRun.user_id == user.id)

    runs = session.exec(stmt).all()

    # Group by date
    day_counts: dict[str, int] = defaultdict(int)
    for r in runs:
        key = r.started_at.strftime("%Y-%m-%d") if r.started_at else "unknown"
        day_counts[key] += 1

    # Fill missing days with 0
    result_days: list[DayCount] = []
    for i in range(days):
        d = (_utc_now() - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        result_days.append(DayCount(date=d, count=day_counts.get(d, 0)))

    return QueriesResponse(days=result_days, total=len(runs))


# ──────────────────────────────────────────────────────────────────────
# GET /analytics/collections
# ──────────────────────────────────────────────────────────────────────


@router.get("/collections", response_model=list[CollectionStat])
def analytics_collections(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Count tool_call steps where tool_name = "rag_search" and extract collection from tool_input
    stmt = select(AgentStep).where(AgentStep.tool_name == "rag_search")

    # If student, limit to their runs
    if user.role != "admin":
        run_ids = session.exec(
            select(AgentRun.id).where(AgentRun.user_id == user.id)
        ).all()
        stmt = stmt.where(AgentStep.run_id.in_(run_ids))  # type: ignore[union-attr]

    steps = session.exec(stmt).all()

    import json
    collection_counter: Counter[str] = Counter()
    for step in steps:
        try:
            inp = json.loads(step.tool_input or "{}")
            cols = inp.get("collection_ids", [])
            if isinstance(cols, list):
                for c in cols:
                    collection_counter[c] += 1
            elif isinstance(cols, str):
                collection_counter[cols] += 1
        except (json.JSONDecodeError, TypeError):
            pass

    return [
        CollectionStat(collection=name, query_count=count)
        for name, count in collection_counter.most_common(20)
    ]


# ──────────────────────────────────────────────────────────────────────
# GET /analytics/feedback
# ──────────────────────────────────────────────────────────────────────


@router.get("/feedback", response_model=FeedbackResponse)
def analytics_feedback(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(Feedback)
    if user.role != "admin":
        stmt = stmt.where(Feedback.user_id == user.id)

    all_fb = session.exec(stmt).all()
    up = sum(1 for f in all_fb if f.rating == "up")
    down = sum(1 for f in all_fb if f.rating == "down")
    total = up + down
    ratio = round(up / total, 3) if total > 0 else 0.0

    return FeedbackResponse(
        thumbs_up=up,
        thumbs_down=down,
        total=total,
        ratio=ratio,
    )


# ──────────────────────────────────────────────────────────────────────
# POST /analytics/feedback  (submit feedback)
# ──────────────────────────────────────────────────────────────────────


@router.post("/feedback", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    body: FeedbackCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if body.rating not in ("up", "down"):
        raise HTTPException(400, "rating doit être 'up' ou 'down'.")

    fb = Feedback(
        run_id=body.run_id,
        user_id=user.id,
        rating=body.rating,
        comment=body.comment,
    )
    session.add(fb)
    session.commit()
    session.refresh(fb)

    return FeedbackOut(
        id=fb.id,
        run_id=fb.run_id,
        rating=fb.rating,
        comment=fb.comment,
        created_at=fb.created_at.isoformat() if fb.created_at else "",
    )


# ──────────────────────────────────────────────────────────────────────
# GET /analytics/costs   (admin only)
# ──────────────────────────────────────────────────────────────────────


@router.get("/costs", response_model=CostResponse)
def analytics_costs(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _require_admin(user)

    # Current month
    now = _utc_now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    logs = session.exec(
        select(UsageLog).where(UsageLog.created_at >= month_start)  # type: ignore[union-attr]
    ).all()

    total_in = sum(l.tokens_in for l in logs)
    total_out = sum(l.tokens_out for l in logs)
    total_cost = sum(l.cost_estimate for l in logs)

    # Group by model
    by_model: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"tokens_in": 0, "tokens_out": 0, "cost": 0.0, "calls": 0}
    )
    for l in logs:
        m = by_model[l.model]
        m["tokens_in"] += l.tokens_in
        m["tokens_out"] += l.tokens_out
        m["cost"] += l.cost_estimate
        m["calls"] += 1

    return CostResponse(
        period=f"{now.strftime('%B %Y')}",
        total_tokens_in=total_in,
        total_tokens_out=total_out,
        total_tokens=total_in + total_out,
        estimated_cost_usd=round(total_cost, 4),
        calls_count=len(logs),
        by_model=[
            {"model": model, **stats}
            for model, stats in sorted(by_model.items())
        ],
    )


# ──────────────────────────────────────────────────────────────────────
# POST /analytics/usage-log  (internal — log an LLM call)
# ──────────────────────────────────────────────────────────────────────


class UsageLogCreate(BaseModel):
    user_id: Optional[int] = None
    model: str = "gpt-4o-mini"
    tokens_in: int = 0
    tokens_out: int = 0
    context: str = ""


@router.post("/usage-log", status_code=201)
def log_usage(
    body: UsageLogCreate,
    session: Session = Depends(get_session),
):
    """Internal endpoint to log LLM usage from services."""
    from app.models.analytics import estimate_cost

    cost = estimate_cost(body.model, body.tokens_in, body.tokens_out)
    log = UsageLog(
        user_id=body.user_id,
        model=body.model,
        tokens_in=body.tokens_in,
        tokens_out=body.tokens_out,
        cost_estimate=cost,
        context=body.context,
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return {"id": log.id, "cost_estimate": cost}
