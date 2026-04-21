"""Moodle connector – fetches course resources via the Moodle REST API.

Uses the ``core_course_get_contents`` web-service function to discover
PDFs, announcements, and downloadable resource files.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.services.connectors import BaseConnector, FetchedFile

logger = logging.getLogger(__name__)

# File extensions we care about
_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".txt"}


class MoodleConnector(BaseConnector):
    """Config schema::

        {
            "moodle_url": "https://moodle.inpt.ac.ma",
            "token": "<ws-token>",
            "course_ids": [2, 5, 12]
        }
    """

    def __init__(self, config: dict[str, Any]) -> None:
        super().__init__(config)
        self.base_url = config["moodle_url"].rstrip("/")
        self.token = config["token"]
        self.course_ids: list[int] = config.get("course_ids", [])

    # ------------------------------------------------------------------ #
    # Public API                                                          #
    # ------------------------------------------------------------------ #

    async def test_connection(self) -> bool:
        """Hit ``core_webservice_get_site_info`` to validate the token."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{self.base_url}/webservice/rest/server.php",
                    params={
                        "wstoken": self.token,
                        "wsfunction": "core_webservice_get_site_info",
                        "moodlewsrestformat": "json",
                    },
                )
                data = resp.json()
                return "sitename" in data
        except Exception as exc:
            logger.warning("Moodle connection test failed: %s", exc)
            return False

    async def fetch_files(self) -> list[FetchedFile]:
        files: list[FetchedFile] = []

        async with httpx.AsyncClient(timeout=30) as client:
            for course_id in self.course_ids:
                try:
                    sections = await self._get_course_contents(client, course_id)
                    for section in sections:
                        for module in section.get("modules", []):
                            for content in module.get("contents", []):
                                fname = content.get("filename", "")
                                file_url = content.get("fileurl", "")
                                if not any(fname.lower().endswith(ext) for ext in _ALLOWED_EXTENSIONS):
                                    continue
                                if not file_url:
                                    continue

                                raw = await self._download(client, file_url)
                                if raw:
                                    files.append(
                                        FetchedFile(
                                            filename=fname,
                                            content=raw,
                                            mime_type=content.get("mimetype", "application/octet-stream"),
                                            metadata={
                                                "course_id": course_id,
                                                "section": section.get("name", ""),
                                                "module": module.get("name", ""),
                                                "source": "moodle",
                                            },
                                        )
                                    )
                except Exception as exc:
                    logger.error("Moodle fetch error for course %s: %s", course_id, exc)

        return files

    # ------------------------------------------------------------------ #
    # Internals                                                           #
    # ------------------------------------------------------------------ #

    async def _get_course_contents(self, client: httpx.AsyncClient, course_id: int) -> list[dict]:
        resp = await client.get(
            f"{self.base_url}/webservice/rest/server.php",
            params={
                "wstoken": self.token,
                "wsfunction": "core_course_get_contents",
                "moodlewsrestformat": "json",
                "courseid": course_id,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and "exception" in data:
            raise RuntimeError(f"Moodle API error: {data.get('message', data)}")
        return data

    async def _download(self, client: httpx.AsyncClient, url: str) -> bytes | None:
        try:
            # Moodle file URLs need the token appended
            sep = "&" if "?" in url else "?"
            full_url = f"{url}{sep}token={self.token}"
            resp = await client.get(full_url, follow_redirects=True)
            resp.raise_for_status()
            return resp.content
        except Exception as exc:
            logger.warning("Failed to download %s: %s", url, exc)
            return None
