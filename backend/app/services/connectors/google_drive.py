"""Google Drive connector – fetches documents from specified Drive folders.

Uses Google Drive API v3 to list and download PDFs / DOCX files from
user-specified folder IDs.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.services.connectors import BaseConnector, FetchedFile

logger = logging.getLogger(__name__)

# Mime types we'll export from Google Docs → PDF
_GOOGLE_DOC_TYPES = {
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
}

# Native file types we download as-is
_DOWNLOAD_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
}

_DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files"


class GoogleDriveConnector(BaseConnector):
    """Config schema::

        {
            "oauth_token": "<access-token>",
            "folder_ids": ["1abc...", "2def..."]
        }
    """

    def __init__(self, config: dict[str, Any]) -> None:
        super().__init__(config)
        self.oauth_token: str = config["oauth_token"]
        self.folder_ids: list[str] = config.get("folder_ids", [])

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.oauth_token}"}

    # ------------------------------------------------------------------ #
    # Public API                                                          #
    # ------------------------------------------------------------------ #

    async def test_connection(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    "https://www.googleapis.com/drive/v3/about",
                    params={"fields": "user"},
                    headers=self._headers,
                )
                return resp.status_code == 200
        except Exception as exc:
            logger.warning("Google Drive connection test failed: %s", exc)
            return False

    async def fetch_files(self) -> list[FetchedFile]:
        files: list[FetchedFile] = []

        async with httpx.AsyncClient(timeout=30) as client:
            for folder_id in self.folder_ids:
                try:
                    items = await self._list_folder(client, folder_id)
                    for item in items:
                        fetched = await self._download_item(client, item)
                        if fetched:
                            files.append(fetched)
                except Exception as exc:
                    logger.error("Google Drive error for folder %s: %s", folder_id, exc)

        return files

    # ------------------------------------------------------------------ #
    # Internals                                                           #
    # ------------------------------------------------------------------ #

    async def _list_folder(self, client: httpx.AsyncClient, folder_id: str) -> list[dict]:
        all_items: list[dict] = []
        page_token: str | None = None

        while True:
            params: dict[str, Any] = {
                "q": f"'{folder_id}' in parents and trashed = false",
                "fields": "nextPageToken, files(id, name, mimeType, size)",
                "pageSize": 100,
            }
            if page_token:
                params["pageToken"] = page_token

            resp = await client.get(
                _DRIVE_FILES_URL,
                params=params,
                headers=self._headers,
            )
            resp.raise_for_status()
            data = resp.json()
            all_items.extend(data.get("files", []))

            page_token = data.get("nextPageToken")
            if not page_token:
                break

        return all_items

    async def _download_item(self, client: httpx.AsyncClient, item: dict) -> FetchedFile | None:
        mime = item.get("mimeType", "")
        name = item.get("name", "unknown")
        file_id = item["id"]

        try:
            if mime in _GOOGLE_DOC_TYPES:
                # Export Google Docs as PDF
                resp = await client.get(
                    f"{_DRIVE_FILES_URL}/{file_id}/export",
                    params={"mimeType": "application/pdf"},
                    headers=self._headers,
                    follow_redirects=True,
                )
                resp.raise_for_status()
                return FetchedFile(
                    filename=f"{name}.pdf",
                    content=resp.content,
                    mime_type="application/pdf",
                    metadata={"drive_id": file_id, "source": "google_drive"},
                )

            elif mime in _DOWNLOAD_MIME_TYPES:
                resp = await client.get(
                    f"{_DRIVE_FILES_URL}/{file_id}",
                    params={"alt": "media"},
                    headers=self._headers,
                    follow_redirects=True,
                )
                resp.raise_for_status()
                return FetchedFile(
                    filename=name,
                    content=resp.content,
                    mime_type=mime,
                    metadata={"drive_id": file_id, "source": "google_drive"},
                )

        except Exception as exc:
            logger.warning("Failed to download Drive file %s: %s", name, exc)

        return None
