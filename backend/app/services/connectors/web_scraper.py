"""Web scraper connector – crawls INPT website pages and converts to text.

Uses httpx + BeautifulSoup to scrape pages like
``inpt.ac.ma/actualites``, ``/formation``, ``/stages`` etc.
Supports configurable crawl depth (1 or 2 levels).
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.services.connectors import BaseConnector, FetchedFile

logger = logging.getLogger(__name__)


class WebScraperConnector(BaseConnector):
    """Config schema::

        {
            "urls": ["https://inpt.ac.ma/actualites", "https://inpt.ac.ma/formation"],
            "depth": 1
        }
    """

    def __init__(self, config: dict[str, Any]) -> None:
        super().__init__(config)
        self.seed_urls: list[str] = config.get("urls", [])
        self.depth: int = min(config.get("depth", 1), 2)  # cap at 2
        self._visited: set[str] = set()

    # ------------------------------------------------------------------ #
    # Public API                                                          #
    # ------------------------------------------------------------------ #

    async def test_connection(self) -> bool:
        if not self.seed_urls:
            return False
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.head(self.seed_urls[0])
                return resp.status_code < 400
        except Exception as exc:
            logger.warning("Web scraper connection test failed: %s", exc)
            return False

    async def fetch_files(self) -> list[FetchedFile]:
        files: list[FetchedFile] = []
        self._visited.clear()

        async with httpx.AsyncClient(
            timeout=20,
            follow_redirects=True,
            headers={"User-Agent": "CampusINPT-Bot/1.0"},
        ) as client:
            for url in self.seed_urls:
                await self._crawl(client, url, current_depth=0, out=files)

        return files

    # ------------------------------------------------------------------ #
    # Internals                                                           #
    # ------------------------------------------------------------------ #

    async def _crawl(
        self,
        client: httpx.AsyncClient,
        url: str,
        current_depth: int,
        out: list[FetchedFile],
    ) -> None:
        normalized = self._normalize(url)
        if normalized in self._visited:
            return
        self._visited.add(normalized)

        try:
            resp = await client.get(url)
            if resp.status_code >= 400:
                return

            content_type = resp.headers.get("content-type", "")

            # Direct PDF download
            if "application/pdf" in content_type:
                fname = urlparse(url).path.split("/")[-1] or "page.pdf"
                out.append(
                    FetchedFile(
                        filename=fname,
                        content=resp.content,
                        mime_type="application/pdf",
                        metadata={"url": url, "source": "web_scraper"},
                    )
                )
                return

            if "text/html" not in content_type:
                return

            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove script / style / nav tags for cleaner text
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()

            title = soup.title.string.strip() if soup.title and soup.title.string else urlparse(url).path
            text = soup.get_text(separator="\n", strip=True)

            if len(text) > 100:  # skip near-empty pages
                safe_name = title[:80].replace("/", "_").replace("\\", "_")
                out.append(
                    FetchedFile(
                        filename=f"{safe_name}.txt",
                        content=text.encode("utf-8"),
                        mime_type="text/plain",
                        metadata={"url": url, "title": title, "source": "web_scraper"},
                    )
                )

            # Follow links for deeper crawling
            if current_depth < self.depth:
                base_domain = urlparse(url).netloc
                for anchor in soup.find_all("a", href=True):
                    href = anchor["href"]
                    full = urljoin(url, href)
                    if urlparse(full).netloc == base_domain:
                        await self._crawl(client, full, current_depth + 1, out)

        except Exception as exc:
            logger.warning("Web scraper error for %s: %s", url, exc)

    @staticmethod
    def _normalize(url: str) -> str:
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/").lower()
