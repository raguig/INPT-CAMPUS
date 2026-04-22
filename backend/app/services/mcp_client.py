"""MCP client - connector orchestration layer."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models.connector import Connector, SyncLog
from app.services.connectors import BaseConnector, FetchedFile
from app.services.connectors.google_drive import GoogleDriveConnector
from app.services.connectors.moodle import MoodleConnector
from app.services.connectors.web_scraper import WebScraperConnector

logger = logging.getLogger(__name__)

CONNECTOR_TYPE_META: list[dict[str, str]] = [
    {
        "type": "MOODLE",
        "label": "Moodle LMS",
        "icon": "📚",
        "description": "Synchronise les cours, PDFs et annonces depuis Moodle INPT.",
        "config_schema": '{"moodle_url": "string", "token": "string", "course_ids": "int[]"}',
    },
    {
        "type": "GOOGLE_DRIVE",
        "label": "Google Drive",
        "icon": "📁",
        "description": "Importe des documents PDF et DOCX depuis Google Drive.",
        "config_schema": '{"oauth_token": "string", "folder_ids": "string[]"}',
    },
    {
        "type": "WEB_SCRAPER",
        "label": "Scraper Web",
        "icon": "🌐",
        "description": "Extrait le contenu textuel des pages du site de l'INPT.",
        "config_schema": '{"urls": "string[]", "depth": "1|2"}',
    },
    {
        "type": "MANUAL_UPLOAD",
        "label": "Upload manuel",
        "icon": "📤",
        "description": "Documents telecharges manuellement via l'interface /ingest.",
        "config_schema": "{}",
    },
]

SYNC_PROGRESS: dict[int, dict[str, Any]] = {}

_CLASS_MAP: dict[str, type[BaseConnector]] = {
    "MOODLE": MoodleConnector,
    "GOOGLE_DRIVE": GoogleDriveConnector,
    "WEB_SCRAPER": WebScraperConnector,
}


def get_connector_instance(connector: Connector) -> BaseConnector:
    """Instantiate the appropriate connector class for a DB record."""
    cls = _CLASS_MAP.get(connector.connector_type)
    if cls is None:
        raise ValueError(f"Unknown connector type: {connector.connector_type}")
    return cls(connector.get_config())


def get_sync_progress(connector_id: int) -> dict[str, Any] | None:
    progress = SYNC_PROGRESS.get(connector_id)
    if progress is None:
        return None
    return dict(progress)


async def run_sync(connector_id: int, session: Session) -> None:
    """Execute a full sync cycle for a connector."""
    connector = session.get(Connector, connector_id)
    if connector is None:
        logger.error("Connector %s not found", connector_id)
        return

    connector.status = "syncing"
    session.add(connector)
    session.commit()

    SYNC_PROGRESS[connector_id] = {
        "connector_name": connector.name,
        "connector_type": connector.connector_type,
        "processed": 0,
        "total": 0,
        "status": "syncing",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        impl = get_connector_instance(connector)

        logger.info("Sync started for connector %s (%s)", connector.id, connector.connector_type)
        fetched_files = await impl.fetch_files()
        logger.info("Fetched %d files from connector %s", len(fetched_files), connector.id)

        SYNC_PROGRESS[connector_id]["total"] = len(fetched_files)
        SYNC_PROGRESS[connector_id]["updated_at"] = datetime.now(timezone.utc).isoformat()

        existing_logs = session.exec(
            select(SyncLog)
            .where(SyncLog.connector_id == connector_id)
            .where(SyncLog.status == "synced")
        ).all()
        existing_hashes: set[str] = {
            log.file_hash for log in existing_logs if log.file_hash
        }

        synced_count = 0

        for fetched_file in fetched_files:
            file_hash = fetched_file.content_hash

            if file_hash in existing_hashes:
                _log_sync(
                    session,
                    connector_id,
                    fetched_file.filename,
                    file_hash,
                    "skipped",
                    "Inchange (hash identique)",
                )
                _mark_progress(connector_id)
                continue

            try:
                await _ingest_file(fetched_file, connector)
                _log_sync(
                    session,
                    connector_id,
                    fetched_file.filename,
                    file_hash,
                    "synced",
                    "Ingere avec succes",
                )
                existing_hashes.add(file_hash)
                synced_count += 1
            except Exception as exc:
                _log_sync(
                    session,
                    connector_id,
                    fetched_file.filename,
                    file_hash,
                    "error",
                    str(exc),
                )
                logger.error("Ingest error for %s: %s", fetched_file.filename, exc)
            finally:
                _mark_progress(connector_id)

        connector.documents_count = (connector.documents_count or 0) + synced_count
        connector.last_synced = datetime.now(timezone.utc)
        connector.status = "connected"
        session.add(connector)
        session.commit()

        SYNC_PROGRESS[connector_id]["status"] = "connected"
        SYNC_PROGRESS[connector_id]["updated_at"] = datetime.now(timezone.utc).isoformat()

        logger.info(
            "Sync completed for connector %s: %d new, %d total files",
            connector.id,
            synced_count,
            len(fetched_files),
        )
    except Exception as exc:
        connector.status = "error"
        session.add(connector)
        session.commit()

        if connector_id in SYNC_PROGRESS:
            SYNC_PROGRESS[connector_id]["status"] = "error"
            SYNC_PROGRESS[connector_id]["updated_at"] = datetime.now(timezone.utc).isoformat()

        logger.exception("Sync failed for connector %s: %s", connector_id, exc)


def _mark_progress(connector_id: int) -> None:
    progress = SYNC_PROGRESS.get(connector_id)
    if progress is None:
        return
    progress["processed"] = int(progress.get("processed", 0)) + 1
    progress["updated_at"] = datetime.now(timezone.utc).isoformat()


def _log_sync(
    session: Session,
    connector_id: int,
    filename: str,
    file_hash: str | None,
    status: str,
    message: str,
) -> None:
    log = SyncLog(
        connector_id=connector_id,
        filename=filename,
        file_hash=file_hash,
        status=status,
        message=message,
    )
    session.add(log)
    session.commit()


async def _ingest_file(fetched_file: FetchedFile, connector: Connector) -> None:
    """Push a file into ChromaDB through the ingestion pipeline."""
    try:
        import chromadb
        from app.core.config import DATA_DIR

        chroma_dir = DATA_DIR / "chroma"
        chroma_dir.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(chroma_dir.resolve()))

        collection_name = _collection_for(connector.connector_type)
        collection = client.get_or_create_collection(collection_name)

        if (
            fetched_file.mime_type.startswith("text/")
            or fetched_file.mime_type == "application/json"
        ):
            text = fetched_file.content.decode("utf-8", errors="replace")
        else:
            text = (
                f"[Document: {fetched_file.filename}] "
                f"(Type: {fetched_file.mime_type}, Hash: {fetched_file.content_hash})"
            )

        doc_id = f"connector_{connector.id}_{fetched_file.content_hash[:16]}"
        metadata = {
            "filename": fetched_file.filename,
            "connector_id": connector.id,
            "connector_type": connector.connector_type,
            "mime_type": fetched_file.mime_type,
            "hash": fetched_file.content_hash,
            **(fetched_file.metadata or {}),
        }

        collection.upsert(
            documents=[text],
            ids=[doc_id],
            metadatas=[metadata],
        )
    except Exception as exc:
        raise RuntimeError(
            f"ChromaDB ingestion failed for {fetched_file.filename}: {exc}"
        ) from exc


def _collection_for(connector_type: str) -> str:
    """Map connector type to a default ChromaDB collection name."""
    return {
        "MOODLE": "academic",
        "GOOGLE_DRIVE": "documents",
        "WEB_SCRAPER": "web_content",
        "MANUAL_UPLOAD": "uploads",
    }.get(connector_type, "general")
