"""SQLModel tables for the Internships / PFE subsystem."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Internship  –  an internship / PFE offer
# ---------------------------------------------------------------------------


class Internship(SQLModel, table=True):
    __tablename__ = "internships"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(sa_column=Column(String(255), nullable=False))
    company: str = Field(sa_column=Column(String(255), nullable=False))
    company_logo: Optional[str] = Field(
        default=None, sa_column=Column(String(512), nullable=True),
    )
    location: str = Field(
        default="Rabat", sa_column=Column(String(255), nullable=False),
    )
    remote: str = Field(
        default="presentiel",
        sa_column=Column(String(32), nullable=False, server_default="presentiel"),
    )  # presentiel | distanciel | hybride
    description: str = Field(
        default="", sa_column=Column(Text, nullable=False, server_default=""),
    )
    # JSON-encoded arrays
    required_skills: str = Field(
        default="[]", sa_column=Column(Text, nullable=False, server_default="[]"),
    )
    filieres: str = Field(
        default="[]", sa_column=Column(Text, nullable=False, server_default="[]"),
    )  # e.g. ["RST","SSI","GL"]
    duration: str = Field(
        default="2 mois", sa_column=Column(String(64), nullable=False),
    )
    offer_type: str = Field(
        default="stage",
        sa_column=Column(String(32), nullable=False, server_default="stage"),
    )  # stage | pfe
    deadline: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    # JSON helpers
    def get_skills(self) -> list[str]:
        return json.loads(self.required_skills) if self.required_skills else []

    def set_skills(self, skills: list[str]) -> None:
        self.required_skills = json.dumps(skills, ensure_ascii=False)

    def get_filieres(self) -> list[str]:
        return json.loads(self.filieres) if self.filieres else []

    def set_filieres(self, f: list[str]) -> None:
        self.filieres = json.dumps(f, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Application  –  a student's application to an internship
# ---------------------------------------------------------------------------


class Application(SQLModel, table=True):
    __tablename__ = "applications"

    id: Optional[int] = Field(default=None, primary_key=True)
    internship_id: int = Field(sa_column=Column(Integer, nullable=False, index=True))
    user_id: int = Field(sa_column=Column(Integer, nullable=False, index=True))
    cover_letter: str = Field(
        default="", sa_column=Column(Text, nullable=False, server_default=""),
    )
    status: str = Field(
        default="pending",
        sa_column=Column(String(32), nullable=False, server_default="pending"),
    )  # pending | accepted | rejected
    applied_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


# ---------------------------------------------------------------------------
# StudentProfile  –  extended profile for matching
# ---------------------------------------------------------------------------


class StudentProfile(SQLModel, table=True):
    __tablename__ = "student_profiles"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        sa_column=Column(Integer, unique=True, nullable=False, index=True),
    )
    bio: str = Field(
        default="", sa_column=Column(Text, nullable=False, server_default=""),
    )
    skills: str = Field(
        default="[]", sa_column=Column(Text, nullable=False, server_default="[]"),
    )
    languages: str = Field(
        default="[]", sa_column=Column(Text, nullable=False, server_default="[]"),
    )
    cv_filename: Optional[str] = Field(
        default=None, sa_column=Column(String(512), nullable=True),
    )
    linkedin_url: Optional[str] = Field(
        default=None, sa_column=Column(String(512), nullable=True),
    )
    avatar_url: Optional[str] = Field(
        default=None, sa_column=Column(String(512), nullable=True),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    def get_skills(self) -> list[str]:
        return json.loads(self.skills) if self.skills else []

    def set_skills(self, s: list[str]) -> None:
        self.skills = json.dumps(s, ensure_ascii=False)

    def get_languages(self) -> list[str]:
        return json.loads(self.languages) if self.languages else []

    def set_languages(self, l: list[str]) -> None:
        self.languages = json.dumps(l, ensure_ascii=False)
