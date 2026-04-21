"""Agent CRUD + run endpoints for Campus INPT."""

from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.agent import Agent, AgentRun, AgentStep
from app.services.agent import run_agent_stream

router = APIRouter(prefix="/agents", tags=["agents"])


# ──────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────────────────────────────────────


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    system_prompt: str = ""
    collection_ids: list[str] = []
    tools: list[str] = []
    created_by: Optional[int] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    collection_ids: Optional[list[str]] = None
    tools: Optional[list[str]] = None
    is_active: Optional[bool] = None


class AgentResponse(BaseModel):
    id: int
    name: str
    description: str
    system_prompt: str
    collection_ids: list[str]
    tools: list[str]
    created_by: Optional[int]
    created_at: str
    is_active: bool


class RunRequest(BaseModel):
    query: str = Field(..., min_length=1)
    user_id: Optional[int] = None


class StepResponse(BaseModel):
    id: int
    step_order: int
    step_type: str
    content: str
    tool_name: Optional[str]
    tool_input: Optional[str]
    created_at: str


class RunResponse(BaseModel):
    id: int
    agent_id: int
    user_id: Optional[int]
    query: str
    final_answer: str
    status: str
    started_at: str
    finished_at: Optional[str]


class RunDetailResponse(RunResponse):
    steps: list[StepResponse]


# ──────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────


def _agent_to_response(agent: Agent) -> AgentResponse:
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        system_prompt=agent.system_prompt,
        collection_ids=agent.get_collection_ids(),
        tools=agent.get_tools(),
        created_by=agent.created_by,
        created_at=agent.created_at.isoformat() if agent.created_at else "",
        is_active=agent.is_active,
    )


def _run_to_response(run: AgentRun) -> RunResponse:
    return RunResponse(
        id=run.id,
        agent_id=run.agent_id,
        user_id=run.user_id,
        query=run.query,
        final_answer=run.final_answer,
        status=run.status,
        started_at=run.started_at.isoformat() if run.started_at else "",
        finished_at=run.finished_at.isoformat() if run.finished_at else None,
    )


def _step_to_response(step: AgentStep) -> StepResponse:
    return StepResponse(
        id=step.id,
        step_order=step.step_order,
        step_type=step.step_type,
        content=step.content,
        tool_name=step.tool_name,
        tool_input=step.tool_input,
        created_at=step.created_at.isoformat() if step.created_at else "",
    )


def _get_agent_or_404(agent_id: int, session: Session) -> Agent:
    agent = session.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} introuvable.",
        )
    return agent


# ──────────────────────────────────────────────────────────────────────────
# CRUD endpoints
# ──────────────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[AgentResponse])
def list_agents(
    is_active: Optional[bool] = Query(None),
    session: Session = Depends(get_session),
):
    """List all agents, optionally filtered by active status."""
    stmt = select(Agent)
    if is_active is not None:
        stmt = stmt.where(Agent.is_active == is_active)
    agents = session.exec(stmt).all()
    return [_agent_to_response(a) for a in agents]


@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(body: AgentCreate, session: Session = Depends(get_session)):
    """Create a new agent."""
    agent = Agent(
        name=body.name,
        description=body.description,
        system_prompt=body.system_prompt,
        created_by=body.created_by,
    )
    agent.set_collection_ids(body.collection_ids)
    agent.set_tools(body.tools)

    session.add(agent)
    session.commit()
    session.refresh(agent)
    return _agent_to_response(agent)


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int, session: Session = Depends(get_session)):
    """Get a single agent by ID."""
    return _agent_to_response(_get_agent_or_404(agent_id, session))


@router.patch("/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: int,
    body: AgentUpdate,
    session: Session = Depends(get_session),
):
    """Partially update an agent."""
    agent = _get_agent_or_404(agent_id, session)

    if body.name is not None:
        agent.name = body.name
    if body.description is not None:
        agent.description = body.description
    if body.system_prompt is not None:
        agent.system_prompt = body.system_prompt
    if body.collection_ids is not None:
        agent.set_collection_ids(body.collection_ids)
    if body.tools is not None:
        agent.set_tools(body.tools)
    if body.is_active is not None:
        agent.is_active = body.is_active

    session.add(agent)
    session.commit()
    session.refresh(agent)
    return _agent_to_response(agent)


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(agent_id: int, session: Session = Depends(get_session)):
    """Delete an agent."""
    agent = _get_agent_or_404(agent_id, session)
    session.delete(agent)
    session.commit()


# ──────────────────────────────────────────────────────────────────────────
# Run endpoints
# ──────────────────────────────────────────────────────────────────────────


@router.post("/{agent_id}/run")
async def run_agent(
    agent_id: int,
    body: RunRequest,
    session: Session = Depends(get_session),
):
    """Run an agent with SSE streaming.

    Streams events as ``text/event-stream``::

        data: {"type": "thought",      "content": "..."}
        data: {"type": "tool_call",    "tool": "...", "input": "..."}
        data: {"type": "tool_result",  "content": "..."}
        data: {"type": "token",        "content": "..."}
        data: {"type": "done",         "run_id": 123}
    """
    agent = _get_agent_or_404(agent_id, session)

    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet agent est désactivé.",
        )

    async def _event_generator():
        async for event in run_agent_stream(
            agent=agent,
            query=body.query,
            session=session,
            user_id=body.user_id,
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{agent_id}/runs", response_model=list[RunResponse])
def list_runs(
    agent_id: int,
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
):
    """List run history for an agent."""
    _get_agent_or_404(agent_id, session)
    stmt = (
        select(AgentRun)
        .where(AgentRun.agent_id == agent_id)
        .order_by(AgentRun.started_at.desc())  # type: ignore[union-attr]
        .limit(limit)
    )
    runs = session.exec(stmt).all()
    return [_run_to_response(r) for r in runs]


@router.get("/{agent_id}/runs/{run_id}", response_model=RunDetailResponse)
def get_run_detail(
    agent_id: int,
    run_id: int,
    session: Session = Depends(get_session),
):
    """Full run detail including all steps."""
    _get_agent_or_404(agent_id, session)

    run = session.get(AgentRun, run_id)
    if run is None or run.agent_id != agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} introuvable pour l'agent {agent_id}.",
        )

    steps = session.exec(
        select(AgentStep)
        .where(AgentStep.run_id == run_id)
        .order_by(AgentStep.step_order)
    ).all()

    return RunDetailResponse(
        **_run_to_response(run).model_dump(),
        steps=[_step_to_response(s) for s in steps],
    )
