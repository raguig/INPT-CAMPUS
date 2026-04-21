"""Connector CRUD + sync endpoints for Campus INPT."""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.connector import Connector, SyncLog
from app.services.mcp_client import (
    CONNECTOR_TYPE_META,
    get_connector_instance,
    get_sync_progress,
    run_sync,
)

router = APIRouter(prefix="/connectors", tags=["connectors"])


class ConnectorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    connector_type: str = Field(..., min_length=1, max_length=32)
    config: dict = Field(default_factory=dict)
    sync_interval: str = Field(default="manual")
    created_by: Optional[int] = None


class ConnectorUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    config: Optional[dict] = None
    sync_interval: Optional[str] = Field(default=None)


class ConnectorResponse(BaseModel):
    id: int
    name: str
    connector_type: str
    config: dict
    status: str
    sync_interval: str
    documents_count: int
    last_synced: Optional[str]
    created_by: Optional[int]
    created_at: str


class SyncLogResponse(BaseModel):
    id: int
    connector_id: int
    filename: str
    file_hash: Optional[str]
    status: str
    message: str
    created_at: str


class ConnectorTypeResponse(BaseModel):
    type: str
    label: str
    icon: str
    description: str
    config_schema: str


class MessageResponse(BaseModel):
    message: str


class ConnectorTestRequest(BaseModel):
    connector_type: str = Field(..., min_length=1, max_length=32)
    config: dict = Field(default_factory=dict)


class ConnectorTestResponse(BaseModel):
    ok: bool
    message: str


def _connector_to_response(connector: Connector) -> ConnectorResponse:
    return ConnectorResponse(
        id=connector.id,
        name=connector.name,
        connector_type=connector.connector_type,
        config=connector.get_config(),
        status=connector.status,
        sync_interval=connector.sync_interval,
        documents_count=connector.documents_count,
        last_synced=connector.last_synced.isoformat() if connector.last_synced else None,
        created_by=connector.created_by,
        created_at=connector.created_at.isoformat() if connector.created_at else "",
    )


def _log_to_response(log: SyncLog) -> SyncLogResponse:
    return SyncLogResponse(
        id=log.id,
        connector_id=log.connector_id,
        filename=log.filename,
        file_hash=log.file_hash,
        status=log.status,
        message=log.message,
        created_at=log.created_at.isoformat() if log.created_at else "",
    )


def _validate_connector_type(connector_type: str) -> None:
    valid_types = {meta["type"] for meta in CONNECTOR_TYPE_META}
    if connector_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de connecteur invalide. Valides : {', '.join(sorted(valid_types))}",
        )


def _get_connector_or_404(connector_id: int, session: Session) -> Connector:
    connector = session.get(Connector, connector_id)
    if connector is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connecteur {connector_id} introuvable.",
        )
    return connector


def _run_sync_background(connector_id: int, session: Session) -> None:
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(run_sync(connector_id, session))
    finally:
        loop.close()


@router.get("/types", response_model=list[ConnectorTypeResponse])
def list_connector_types():
    return [ConnectorTypeResponse(**meta) for meta in CONNECTOR_TYPE_META]


@router.get("/", response_model=list[ConnectorResponse])
def list_connectors(session: Session = Depends(get_session)):
    connectors = session.exec(select(Connector)).all()
    return [_connector_to_response(connector) for connector in connectors]


@router.post("/", response_model=ConnectorResponse, status_code=status.HTTP_201_CREATED)
async def create_connector(
    body: ConnectorCreate,
    session: Session = Depends(get_session),
):
    _validate_connector_type(body.connector_type)

    connector = Connector(
        name=body.name,
        connector_type=body.connector_type,
        sync_interval=body.sync_interval,
        created_by=body.created_by,
    )
    connector.set_config(body.config)

    if body.connector_type != "MANUAL_UPLOAD":
        try:
            impl = get_connector_instance(connector)
            ok = await impl.test_connection()
            connector.status = "connected" if ok else "error"
        except Exception:
            connector.status = "error"
    else:
        connector.status = "connected"

    session.add(connector)
    session.commit()
    session.refresh(connector)
    return _connector_to_response(connector)


@router.post("/test", response_model=ConnectorTestResponse)
async def test_connector_connection(body: ConnectorTestRequest):
    _validate_connector_type(body.connector_type)

    if body.connector_type == "MANUAL_UPLOAD":
        return ConnectorTestResponse(
            ok=True,
            message="Le connecteur manuel est valide par defaut.",
        )

    connector = Connector(
        name="Test Connector",
        connector_type=body.connector_type,
        sync_interval="manual",
    )
    connector.set_config(body.config)

    try:
        impl = get_connector_instance(connector)
        ok = await impl.test_connection()
    except Exception as exc:
        return ConnectorTestResponse(
            ok=False,
            message=f"Connexion impossible : {exc}",
        )

    return ConnectorTestResponse(
        ok=ok,
        message="Connexion reussie." if ok else "La connexion a echoue.",
    )


@router.patch("/{connector_id}", response_model=ConnectorResponse)
async def update_connector(
    connector_id: int,
    body: ConnectorUpdate,
    session: Session = Depends(get_session),
):
    connector = _get_connector_or_404(connector_id, session)

    if body.name is not None:
        connector.name = body.name
    if body.sync_interval is not None:
        connector.sync_interval = body.sync_interval
    if body.config is not None:
        connector.set_config(body.config)

    if connector.connector_type != "MANUAL_UPLOAD":
        try:
            impl = get_connector_instance(connector)
            ok = await impl.test_connection()
            connector.status = "connected" if ok else "error"
        except Exception:
            connector.status = "error"

    session.add(connector)
    session.commit()
    session.refresh(connector)
    return _connector_to_response(connector)


@router.delete("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connector(connector_id: int, session: Session = Depends(get_session)):
    connector = _get_connector_or_404(connector_id, session)

    logs = session.exec(
        select(SyncLog).where(SyncLog.connector_id == connector_id)
    ).all()
    for log in logs:
        session.delete(log)

    session.delete(connector)
    session.commit()


@router.post("/{connector_id}/sync", response_model=MessageResponse)
def trigger_sync(
    connector_id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    connector = _get_connector_or_404(connector_id, session)

    if connector.connector_type == "MANUAL_UPLOAD":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les connecteurs MANUAL_UPLOAD ne supportent pas la synchronisation automatique.",
        )

    if connector.status == "syncing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Une synchronisation est deja en cours pour ce connecteur.",
        )

    background_tasks.add_task(_run_sync_background, connector_id, session)

    return MessageResponse(
        message=f"Synchronisation demarree pour le connecteur '{connector.name}'."
    )


@router.get("/{connector_id}/logs", response_model=list[SyncLogResponse])
def list_sync_logs(
    connector_id: int,
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, alias="status"),
    session: Session = Depends(get_session),
):
    _get_connector_or_404(connector_id, session)

    stmt = select(SyncLog).where(SyncLog.connector_id == connector_id)
    if status_filter:
        stmt = stmt.where(SyncLog.status == status_filter)

    stmt = stmt.order_by(SyncLog.created_at.desc()).limit(limit)  # type: ignore[union-attr]
    logs = session.exec(stmt).all()
    response_logs = [_log_to_response(log) for log in logs]

    progress = get_sync_progress(connector_id)
    if progress and progress.get("status") == "syncing":
        response_logs.insert(
            0,
            SyncLogResponse(
                id=0,
                connector_id=connector_id,
                filename="__progress__",
                file_hash=None,
                status="progress",
                message=json.dumps(progress, ensure_ascii=False),
                created_at=progress.get("updated_at", ""),
            ),
        )

    return response_logs
