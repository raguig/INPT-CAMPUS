"""SQLModel tables for platform settings (global + per-user)."""

from __future__ import annotations

import base64
import hashlib
import os
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# GlobalSetting — key/value store for platform-wide configuration
# ---------------------------------------------------------------------------


class GlobalSetting(SQLModel, table=True):
    __tablename__ = "global_settings"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(
        sa_column=Column(String(128), unique=True, nullable=False, index=True),
    )
    value: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=""),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


# Default global settings with their initial values
GLOBAL_DEFAULTS: dict[str, str] = {
    "llm_provider": "mistral",
    "default_model": "mistral-small-latest",
    "embed_model": "mistral-embed",
    "mistral_api_key": "",
    "max_tokens_per_query": "4096",
    "rag_top_k": "5",
    "rag_similarity_threshold": "0.7",
    "allow_registration": "true",
    "maintenance_mode": "false",
}


# ---------------------------------------------------------------------------
# UserSetting — per-user preferences
# ---------------------------------------------------------------------------


class UserSetting(SQLModel, table=True):
    __tablename__ = "user_settings"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        sa_column=Column(Integer, unique=True, nullable=False, index=True),
    )
    language: str = Field(
        default="fr",
        sa_column=Column(String(8), nullable=False, server_default="fr"),
    )  # fr | en | ar
    theme: str = Field(
        default="light",
        sa_column=Column(String(16), nullable=False, server_default="light"),
    )  # light | dark
    notification_email: bool = Field(default=True)
    default_collection_id: Optional[str] = Field(
        default=None,
        sa_column=Column(String(128), nullable=True),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


# ---------------------------------------------------------------------------
# Encryption helpers for API key storage
# ---------------------------------------------------------------------------

# In production, use a proper secret from env; this is a demo fallback.
_ENCRYPTION_KEY = os.getenv("SETTINGS_ENCRYPTION_KEY", "campus-inpt-settings-key-2025")


def _derive_key(passphrase: str) -> bytes:
    """Derive a 32-byte key from a passphrase using SHA-256."""
    return hashlib.sha256(passphrase.encode()).digest()


def encrypt_value(plaintext: str) -> str:
    """Simple XOR-based obfuscation + base64 (demo-grade).
    In production, use Fernet or AES-GCM.
    """
    if not plaintext:
        return ""
    key = _derive_key(_ENCRYPTION_KEY)
    encrypted = bytes(
        b ^ key[i % len(key)] for i, b in enumerate(plaintext.encode())
    )
    return base64.b64encode(encrypted).decode()


def decrypt_value(ciphertext: str) -> str:
    """Reverse of encrypt_value."""
    if not ciphertext:
        return ""
    key = _derive_key(_ENCRYPTION_KEY)
    encrypted = base64.b64decode(ciphertext)
    decrypted = bytes(
        b ^ key[i % len(key)] for i, b in enumerate(encrypted)
    )
    return decrypted.decode()


def mask_api_key(key: str) -> str:
    """Return masked version: sk-...xxxx"""
    if not key or len(key) < 8:
        return "••••••••"
    return f"{key[:3]}...{key[-4:]}"
