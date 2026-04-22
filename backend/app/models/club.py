from __future__ import annotations

import re
import unicodedata
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlmodel import Field, Session, SQLModel, select

from app.core.config import DATA_DIR


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ClubCategory:
    TECH = "TECH"
    SPORT = "SPORT"
    ART = "ART"
    SCIENCE = "SCIENCE"
    SOCIAL = "SOCIAL"
    ENTREPRENEURSHIP = "ENTREPRENEURSHIP"

    ALL = {TECH, SPORT, ART, SCIENCE, SOCIAL, ENTREPRENEURSHIP}


class MembershipRole:
    MEMBER = "MEMBER"
    OFFICER = "OFFICER"
    VICE_PRESIDENT = "VICE_PRESIDENT"
    PRESIDENT = "PRESIDENT"

    ALL = {MEMBER, OFFICER, VICE_PRESIDENT, PRESIDENT}


class MembershipStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

    ALL = {PENDING, APPROVED, REJECTED}


class ClubEventType:
    WORKSHOP = "WORKSHOP"
    COMPETITION = "COMPETITION"
    MEETUP = "MEETUP"
    HACKATHON = "HACKATHON"
    OTHER = "OTHER"

    ALL = {WORKSHOP, COMPETITION, MEETUP, HACKATHON, OTHER}


class RegistrationStatus:
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

    ALL = {CONFIRMED, CANCELLED}


class ClubPostType:
    ANNOUNCEMENT = "ANNOUNCEMENT"
    ACHIEVEMENT = "ACHIEVEMENT"
    RECRUITMENT = "RECRUITMENT"
    PROJECT = "PROJECT"

    ALL = {ANNOUNCEMENT, ACHIEVEMENT, RECRUITMENT, PROJECT}


class Club(SQLModel, table=True):
    __tablename__ = "clubs"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String(255), nullable=False, unique=True, index=True))
    slug: str = Field(sa_column=Column(String(255), nullable=False, unique=True, index=True))
    description: str = Field(sa_column=Column(Text, nullable=False))
    short_description: Optional[str] = Field(default=None, sa_column=Column(String(300), nullable=True))
    category: str = Field(sa_column=Column(String(32), nullable=False, index=True))
    logo_url: Optional[str] = Field(default=None, sa_column=Column(String(1024), nullable=True))
    cover_image_url: Optional[str] = Field(default=None, sa_column=Column(String(1024), nullable=True))
    president_id: Optional[int] = Field(default=None, sa_column=Column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True))
    contact_email: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))
    instagram_url: Optional[str] = Field(default=None, sa_column=Column(String(1024), nullable=True))
    linkedin_url: Optional[str] = Field(default=None, sa_column=Column(String(1024), nullable=True))
    facebook_url: Optional[str] = Field(default=None, sa_column=Column(String(1024), nullable=True))
    member_count: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default="0"))
    founded_year: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    is_active: bool = Field(default=True, sa_column=Column(Boolean, nullable=False, server_default="1"))
    is_verified: bool = Field(default=False, sa_column=Column(Boolean, nullable=False, server_default="0"))
    created_at: datetime = Field(default_factory=utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))


class ClubMembership(SQLModel, table=True):
    __tablename__ = "club_memberships"
    __table_args__ = (
        UniqueConstraint("club_id", "user_id", name="uq_club_memberships_club_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: int = Field(sa_column=Column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True))
    user_id: int = Field(sa_column=Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True))
    role: str = Field(default=MembershipRole.MEMBER, sa_column=Column(String(32), nullable=False, server_default=MembershipRole.MEMBER))
    status: str = Field(default=MembershipStatus.PENDING, sa_column=Column(String(32), nullable=False, server_default=MembershipStatus.PENDING, index=True))
    joined_at: datetime = Field(default_factory=utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))


class ClubEvent(SQLModel, table=True):
    __tablename__ = "club_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: int = Field(sa_column=Column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True))
    title: str = Field(sa_column=Column(String(255), nullable=False, index=True))
    description: str = Field(sa_column=Column(Text, nullable=False))
    event_type: str = Field(default=ClubEventType.OTHER, sa_column=Column(String(32), nullable=False, server_default=ClubEventType.OTHER, index=True))
    location: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))
    is_online: bool = Field(default=False, sa_column=Column(Boolean, nullable=False, server_default="0"))
    starts_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False, index=True))
    ends_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    max_participants: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    registered_count: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default="0"))
    cover_image_url: Optional[str] = Field(default=None, sa_column=Column(String(1024), nullable=True))
    created_at: datetime = Field(default_factory=utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))


class EventRegistration(SQLModel, table=True):
    __tablename__ = "event_registrations"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_registrations_event_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(sa_column=Column(ForeignKey("club_events.id", ondelete="CASCADE"), nullable=False, index=True))
    user_id: int = Field(sa_column=Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True))
    registered_at: datetime = Field(default_factory=utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))
    status: str = Field(default=RegistrationStatus.CONFIRMED, sa_column=Column(String(32), nullable=False, server_default=RegistrationStatus.CONFIRMED, index=True))


class ClubPost(SQLModel, table=True):
    __tablename__ = "club_posts"

    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: int = Field(sa_column=Column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True))
    author_id: int = Field(sa_column=Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True))
    title: str = Field(sa_column=Column(String(255), nullable=False))
    content: str = Field(sa_column=Column(Text, nullable=False))
    image_url: Optional[str] = Field(default=None, sa_column=Column(String(1024), nullable=True))
    post_type: str = Field(default=ClubPostType.ANNOUNCEMENT, sa_column=Column(String(32), nullable=False, server_default=ClubPostType.ANNOUNCEMENT, index=True))
    likes_count: int = Field(default=0, sa_column=Column(Integer, nullable=False, server_default="0"))
    created_at: datetime = Field(default_factory=utc_now, sa_column=Column(DateTime(timezone=True), nullable=False, index=True))


class ClubPostLike(SQLModel, table=True):
    __tablename__ = "club_post_likes"
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_club_post_likes_post_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(sa_column=Column(ForeignKey("club_posts.id", ondelete="CASCADE"), nullable=False, index=True))
    user_id: int = Field(sa_column=Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True))
    created_at: datetime = Field(default_factory=utc_now, sa_column=Column(DateTime(timezone=True), nullable=False))


def _slugify(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text.lower()).strip("-")
    return slug or "club"


def _next_available_slug(session: Session, base_slug: str) -> str:
    existing = {
        row[0]
        for row in session.exec(select(Club.slug).where(Club.slug.like(f"{base_slug}%"))).all()
    }
    if base_slug not in existing:
        return base_slug

    index = 2
    while True:
        candidate = f"{base_slug}-{index}"
        if candidate not in existing:
            return candidate
        index += 1


SEEDED_CLUBS = [
    {
        "name": "CIT",
        "description": "Le Club Informatique et Télécommunications de l'INPT. Organise des ateliers, hackathons et projets collaboratifs autour du développement logiciel, réseaux et technologies de l'information.",
        "short_description": "Informatique, télécoms et projets tech.",
        "category": ClubCategory.TECH,
        "contact_email": "cit@inpt.ac.ma",
        "founded_year": 2012,
        "is_verified": True,
    },
    {
        "name": "ENACTUS",
        "description": "Enactus INPT développe des projets d'entrepreneuriat social avec un impact positif sur la communauté. Innovation sociale, leadership et développement durable.",
        "short_description": "Entrepreneuriat social & projets à impact.",
        "category": ClubCategory.ENTREPRENEURSHIP,
        "contact_email": "enactus@inpt.ac.ma",
        "founded_year": 2014,
        "is_verified": True,
    },
    {
        "name": "A2S",
        "description": "L'Association des Activités Sportives de l'INPT. Organise des tournois, entraînements et activités sportives pour la communauté étudiante.",
        "short_description": "Sport, tournois et esprit d'équipe.",
        "category": ClubCategory.SPORT,
        "contact_email": "a2s@inpt.ac.ma",
        "founded_year": 2010,
        "is_verified": True,
    },
    {
        "name": "IBC",
        "description": "L'INPT Business Club accompagne les étudiants dans leurs projets entrepreneuriaux avec du mentorat, des ateliers business et des compétitions.",
        "short_description": "Business, entrepreneuriat et innovation.",
        "category": ClubCategory.ENTREPRENEURSHIP,
        "contact_email": "ibc@inpt.ac.ma",
        "founded_year": 2016,
        "is_verified": True,
    },
    {
        "name": "ARTY",
        "description": "Le club artistique et culturel de l'INPT. Photographie, design, vidéo, musique et événements culturels pour célébrer la créativité.",
        "short_description": "Art, culture et créativité.",
        "category": ClubCategory.ART,
        "contact_email": "arty@inpt.ac.ma",
        "founded_year": 2015,
        "is_verified": True,
    },
    {
        "name": "CESE",
        "description": "Le Club des Étudiants en Sciences et Environnement mène des projets de sensibilisation et de recherche sur le développement durable et l'écologie.",
        "short_description": "Sciences, environnement et développement durable.",
        "category": ClubCategory.SCIENCE,
        "contact_email": "cese@inpt.ac.ma",
        "founded_year": 2018,
        "is_verified": True,
    },
    {
        "name": "MSC",
        "description": "Le Microsoft Student Club de l'INPT. Formations sur les technologies Microsoft, certifications Azure, ateliers .NET et événements tech.",
        "short_description": "Technologies Microsoft, Azure et certifications.",
        "category": ClubCategory.TECH,
        "contact_email": "msc@inpt.ac.ma",
        "founded_year": 2017,
        "is_verified": True,
    },
    {
        "name": "IEEE",
        "description": "La branche étudiante IEEE INPT organise des conférences, workshops et compétitions dans le domaine de l'ingénierie électrique, électronique et informatique.",
        "short_description": "Ingénierie, recherche et standards internationaux.",
        "category": ClubCategory.SCIENCE,
        "contact_email": "ieee@inpt.ac.ma",
        "founded_year": 2013,
        "is_verified": True,
    },
]


def seed_clubs_on_startup(session: Session) -> None:
    from app.models.user import User

    first_admin = session.exec(
        select(User).where(User.role == "admin").order_by(User.id)
    ).first()

    created_slugs: list[str] = []

    for seed in SEEDED_CLUBS:
        base_slug = _slugify(seed["name"])
        existing = session.exec(select(Club).where(Club.slug == base_slug)).first()
        if existing is not None:
            created_slugs.append(existing.slug)
            continue

        slug = _next_available_slug(session, base_slug)
        club = Club(
            name=seed["name"],
            slug=slug,
            description=seed["description"],
            short_description=seed["short_description"],
            category=seed["category"],
            president_id=first_admin.id if first_admin else None,
            contact_email=seed["contact_email"],
            member_count=0,
            founded_year=seed["founded_year"],
            is_active=True,
            is_verified=seed["is_verified"],
        )
        session.add(club)
        session.flush()

        if first_admin and first_admin.id:
            session.add(
                ClubMembership(
                    club_id=club.id or 0,
                    user_id=first_admin.id,
                    role=MembershipRole.PRESIDENT,
                    status=MembershipStatus.APPROVED,
                )
            )
            club.member_count = 1

        created_slugs.append(slug)

    session.commit()

    try:
        import chromadb

        chroma_dir = DATA_DIR / "chroma"
        chroma_dir.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(chroma_dir.resolve()))
        for slug in created_slugs:
            client.get_or_create_collection(slug)
    except Exception:
        # Chroma seeding is best-effort.
        pass
