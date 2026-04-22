from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlmodel import Session, select

from app.core.config import DATA_DIR
from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.club import (
    Club,
    ClubCategory,
    ClubEvent,
    ClubEventType,
    ClubMembership,
    ClubPost,
    ClubPostLike,
    ClubPostType,
    EventRegistration,
    MembershipRole,
    MembershipStatus,
    RegistrationStatus,
    _next_available_slug,
    _slugify,
)
from app.models.user import User
from app.services.club_feed import build_user_club_feed

router = APIRouter(prefix="/clubs", tags=["clubs"])

SessionDep = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def ensure_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès admin requis.")


def role_weight(role: str) -> int:
    order = {
        MembershipRole.MEMBER: 1,
        MembershipRole.OFFICER: 2,
        MembershipRole.VICE_PRESIDENT: 3,
        MembershipRole.PRESIDENT: 4,
    }
    return order.get(role, 0)


def get_club_or_404(session: Session, slug: str) -> Club:
    club = session.exec(select(Club).where(Club.slug == slug)).first()
    if club is None:
        raise HTTPException(status_code=404, detail=f"Club '{slug}' introuvable.")
    return club


def get_membership(session: Session, club_id: int, user_id: int) -> Optional[ClubMembership]:
    return session.exec(
        select(ClubMembership).where(
            ClubMembership.club_id == club_id,
            ClubMembership.user_id == user_id,
        )
    ).first()


def require_min_role(
    session: Session,
    *,
    club: Club,
    user: User,
    minimum_role: str,
) -> ClubMembership:
    membership = get_membership(session, club.id or 0, user.id or 0)
    if membership is None or membership.status != MembershipStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre actif de ce club.")

    if role_weight(membership.role) < role_weight(minimum_role):
        raise HTTPException(status_code=403, detail="Permissions insuffisantes.")

    return membership


class ClubCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=20)
    short_description: Optional[str] = Field(default=None, max_length=300)
    category: str = Field(...)
    logo_url: Optional[str] = Field(default=None, max_length=1024)
    cover_image_url: Optional[str] = Field(default=None, max_length=1024)
    contact_email: Optional[str] = Field(default=None, max_length=255)
    instagram_url: Optional[str] = Field(default=None, max_length=1024)
    linkedin_url: Optional[str] = Field(default=None, max_length=1024)
    facebook_url: Optional[str] = Field(default=None, max_length=1024)
    founded_year: Optional[int] = Field(default=None, ge=1950, le=2100)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        upper = value.upper()
        if upper not in ClubCategory.ALL:
            raise ValueError("category invalide")
        return upper


class ClubUpdateRequest(BaseModel):
    description: Optional[str] = Field(default=None, min_length=20)
    short_description: Optional[str] = Field(default=None, max_length=300)
    category: Optional[str] = None
    logo_url: Optional[str] = Field(default=None, max_length=1024)
    cover_image_url: Optional[str] = Field(default=None, max_length=1024)
    contact_email: Optional[str] = Field(default=None, max_length=255)
    instagram_url: Optional[str] = Field(default=None, max_length=1024)
    linkedin_url: Optional[str] = Field(default=None, max_length=1024)
    facebook_url: Optional[str] = Field(default=None, max_length=1024)
    founded_year: Optional[int] = Field(default=None, ge=1950, le=2100)
    is_active: Optional[bool] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        upper = value.upper()
        if upper not in ClubCategory.ALL:
            raise ValueError("category invalide")
        return upper


class ClubResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    short_description: Optional[str]
    category: str
    logo_url: Optional[str]
    cover_image_url: Optional[str]
    president_id: Optional[int]
    contact_email: Optional[str]
    instagram_url: Optional[str]
    linkedin_url: Optional[str]
    facebook_url: Optional[str]
    member_count: int
    founded_year: Optional[int]
    is_active: bool
    is_verified: bool
    created_at: datetime


class MembershipResponse(BaseModel):
    id: int
    club_id: int
    user_id: int
    role: str
    status: str
    joined_at: datetime


class MemberListItem(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    status: str
    joined_at: datetime


class EventCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=10)
    event_type: str = Field(default=ClubEventType.OTHER)
    location: Optional[str] = Field(default=None, max_length=255)
    is_online: bool = False
    starts_at: datetime
    ends_at: datetime
    max_participants: Optional[int] = Field(default=None, ge=1, le=10000)
    cover_image_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("event_type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        upper = value.upper()
        if upper not in ClubEventType.ALL:
            raise ValueError("event_type invalide")
        return upper


class EventUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, min_length=10)
    event_type: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=255)
    is_online: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    max_participants: Optional[int] = Field(default=None, ge=1, le=10000)
    cover_image_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("event_type")
    @classmethod
    def validate_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        upper = value.upper()
        if upper not in ClubEventType.ALL:
            raise ValueError("event_type invalide")
        return upper


class EventResponse(BaseModel):
    id: int
    club_id: int
    title: str
    description: str
    event_type: str
    location: Optional[str]
    is_online: bool
    starts_at: datetime
    ends_at: datetime
    max_participants: Optional[int]
    registered_count: int
    cover_image_url: Optional[str]
    created_at: datetime


class ClubEventsResponse(BaseModel):
    upcoming: list[EventResponse]
    past: list[EventResponse]


class EventRegistrationResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    registered_at: datetime
    status: str


class PostCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content: str = Field(..., min_length=2)
    image_url: Optional[str] = Field(default=None, max_length=1024)
    post_type: str = Field(default=ClubPostType.ANNOUNCEMENT)

    @field_validator("post_type")
    @classmethod
    def validate_post_type(cls, value: str) -> str:
        upper = value.upper()
        if upper not in ClubPostType.ALL:
            raise ValueError("post_type invalide")
        return upper


class PostResponse(BaseModel):
    id: int
    club_id: int
    author_id: int
    title: str
    content: str
    image_url: Optional[str]
    post_type: str
    likes_count: int
    created_at: datetime


class MembershipRoleUpdateRequest(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        upper = value.upper()
        if upper not in MembershipRole.ALL:
            raise ValueError("role invalide")
        return upper


class AskClubRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1500)


class AskClubResponse(BaseModel):
    answer: str
    sources: list[str]


class ClubRequestResponse(BaseModel):
    club: ClubResponse
    membership: MembershipResponse


def to_club_response(club: Club) -> ClubResponse:
    return ClubResponse(
        id=club.id or 0,
        name=club.name,
        slug=club.slug,
        description=club.description,
        short_description=club.short_description,
        category=club.category,
        logo_url=club.logo_url,
        cover_image_url=club.cover_image_url,
        president_id=club.president_id,
        contact_email=club.contact_email,
        instagram_url=club.instagram_url,
        linkedin_url=club.linkedin_url,
        facebook_url=club.facebook_url,
        member_count=club.member_count,
        founded_year=club.founded_year,
        is_active=club.is_active,
        is_verified=club.is_verified,
        created_at=club.created_at,
    )


def to_membership_response(membership: ClubMembership) -> MembershipResponse:
    return MembershipResponse(
        id=membership.id or 0,
        club_id=membership.club_id,
        user_id=membership.user_id,
        role=membership.role,
        status=membership.status,
        joined_at=membership.joined_at,
    )


def to_event_response(event: ClubEvent) -> EventResponse:
    return EventResponse(
        id=event.id or 0,
        club_id=event.club_id,
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        location=event.location,
        is_online=event.is_online,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        max_participants=event.max_participants,
        registered_count=event.registered_count,
        cover_image_url=event.cover_image_url,
        created_at=event.created_at,
    )


def to_post_response(post: ClubPost) -> PostResponse:
    return PostResponse(
        id=post.id or 0,
        club_id=post.club_id,
        author_id=post.author_id,
        title=post.title,
        content=post.content,
        image_url=post.image_url,
        post_type=post.post_type,
        likes_count=post.likes_count,
        created_at=post.created_at,
    )


@router.get("/", response_model=list[ClubResponse])
def list_clubs(
    session: SessionDep,
    _user: CurrentUser,
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
) -> list[ClubResponse]:
    query = select(Club).where(Club.is_active.is_(True))

    if category:
        category_upper = category.upper()
        if category_upper not in ClubCategory.ALL:
            raise HTTPException(status_code=400, detail="Catégorie invalide.")
        query = query.where(Club.category == category_upper)

    clubs = list(session.exec(query.order_by(Club.member_count.desc())).all())

    if search:
        needle = search.lower().strip()
        clubs = [club for club in clubs if needle in club.name.lower()]

    return [to_club_response(club) for club in clubs]


@router.get("/featured", response_model=list[ClubResponse])
def featured_clubs(session: SessionDep, _user: CurrentUser) -> list[ClubResponse]:
    clubs = session.exec(
        select(Club)
        .where(Club.is_active.is_(True))
        .order_by(Club.member_count.desc(), Club.created_at.asc())
        .limit(4)
    ).all()
    return [to_club_response(club) for club in clubs]


@router.get("/my-clubs", response_model=list[ClubResponse])
def my_clubs(session: SessionDep, current_user: CurrentUser) -> list[ClubResponse]:
    memberships = session.exec(
        select(ClubMembership).where(
            ClubMembership.user_id == (current_user.id or 0),
            ClubMembership.status == MembershipStatus.APPROVED,
        )
    ).all()

    club_ids = [membership.club_id for membership in memberships]
    if not club_ids:
        return []

    clubs = session.exec(select(Club).where(Club.id.in_(club_ids))).all()
    return [to_club_response(club) for club in clubs]


@router.get("/my-requests", response_model=list[ClubRequestResponse])
def my_requests(session: SessionDep, current_user: CurrentUser) -> list[ClubRequestResponse]:
    memberships = session.exec(
        select(ClubMembership).where(
            ClubMembership.user_id == (current_user.id or 0),
            ClubMembership.status == MembershipStatus.PENDING,
        )
    ).all()

    results: list[ClubRequestResponse] = []
    for membership in memberships:
        club = session.get(Club, membership.club_id)
        if club is None:
            continue
        results.append(
            ClubRequestResponse(
                club=to_club_response(club),
                membership=to_membership_response(membership),
            )
        )

    return results


@router.post("/", response_model=ClubResponse, status_code=201)
def create_club(
    payload: ClubCreateRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> ClubResponse:
    base_slug = _slugify(payload.name)
    slug = _next_available_slug(session, base_slug)

    club = Club(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description.strip(),
        short_description=(payload.short_description or "").strip() or None,
        category=payload.category,
        logo_url=(payload.logo_url or "").strip() or None,
        cover_image_url=(payload.cover_image_url or "").strip() or None,
        president_id=current_user.id,
        contact_email=(payload.contact_email or "").strip() or None,
        instagram_url=(payload.instagram_url or "").strip() or None,
        linkedin_url=(payload.linkedin_url or "").strip() or None,
        facebook_url=(payload.facebook_url or "").strip() or None,
        member_count=1,
        founded_year=payload.founded_year,
        is_active=True,
        is_verified=False,
    )
    session.add(club)
    session.flush()

    session.add(
        ClubMembership(
            club_id=club.id or 0,
            user_id=current_user.id or 0,
            role=MembershipRole.PRESIDENT,
            status=MembershipStatus.APPROVED,
        )
    )
    session.commit()
    session.refresh(club)

    try:
        import chromadb

        chroma_dir = DATA_DIR / "chroma"
        chroma_dir.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(chroma_dir.resolve()))
        client.get_or_create_collection(club.slug)
    except Exception:
        pass

    return to_club_response(club)


@router.get("/events/upcoming", response_model=list[EventResponse])
def upcoming_events(session: SessionDep, _user: CurrentUser) -> list[EventResponse]:
    events = session.exec(
        select(ClubEvent)
        .where(ClubEvent.starts_at >= now_utc())
        .order_by(ClubEvent.starts_at.asc())
    ).all()
    return [to_event_response(event) for event in events]


@router.get("/events/my-events", response_model=list[EventResponse])
def my_events(session: SessionDep, current_user: CurrentUser) -> list[EventResponse]:
    registrations = session.exec(
        select(EventRegistration).where(
            EventRegistration.user_id == (current_user.id or 0),
            EventRegistration.status == RegistrationStatus.CONFIRMED,
        )
    ).all()
    event_ids = [registration.event_id for registration in registrations]
    if not event_ids:
        return []

    events = session.exec(select(ClubEvent).where(ClubEvent.id.in_(event_ids))).all()
    return [to_event_response(event) for event in events]


@router.post("/events/{event_id}/register", response_model=EventRegistrationResponse, status_code=201)
def register_event(
    event_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    current_user: CurrentUser,
) -> EventRegistrationResponse:
    event = session.get(ClubEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Événement introuvable.")

    existing = session.exec(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == (current_user.id or 0),
        )
    ).first()

    if existing and existing.status == RegistrationStatus.CONFIRMED:
        raise HTTPException(status_code=409, detail="Déjà inscrit à cet événement.")

    if event.max_participants is not None and event.registered_count >= event.max_participants:
        raise HTTPException(status_code=400, detail="Événement complet.")

    if existing:
        existing.status = RegistrationStatus.CONFIRMED
        existing.registered_at = now_utc()
        session.add(existing)
        registration = existing
    else:
        registration = EventRegistration(
            event_id=event_id,
            user_id=current_user.id or 0,
            status=RegistrationStatus.CONFIRMED,
        )
        session.add(registration)

    event.registered_count += 1
    session.add(event)
    session.commit()
    session.refresh(registration)

    return EventRegistrationResponse(
        id=registration.id or 0,
        event_id=registration.event_id,
        user_id=registration.user_id,
        registered_at=registration.registered_at,
        status=registration.status,
    )


@router.delete("/events/{event_id}/register", status_code=204)
def cancel_event_registration(
    event_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    current_user: CurrentUser,
) -> None:
    registration = session.exec(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == (current_user.id or 0),
            EventRegistration.status == RegistrationStatus.CONFIRMED,
        )
    ).first()
    if registration is None:
        raise HTTPException(status_code=404, detail="Inscription introuvable.")

    event = session.get(ClubEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Événement introuvable.")

    registration.status = RegistrationStatus.CANCELLED
    event.registered_count = max(0, event.registered_count - 1)
    session.add(registration)
    session.add(event)
    session.commit()


@router.get("/feed", response_model=list[PostResponse])
def my_clubs_feed(
    session: SessionDep,
    current_user: CurrentUser,
    limit: int = Query(default=30, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PostResponse]:
    posts = build_user_club_feed(session, user_id=current_user.id or 0, limit=limit, offset=offset)
    return [to_post_response(post) for post in posts]


@router.post("/posts/{post_id}/like", response_model=dict)
def toggle_post_like(
    post_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    current_user: CurrentUser,
) -> dict:
    post = session.get(ClubPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post introuvable.")

    existing = session.exec(
        select(ClubPostLike).where(
            ClubPostLike.post_id == post_id,
            ClubPostLike.user_id == (current_user.id or 0),
        )
    ).first()

    if existing:
        session.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        session.add(ClubPostLike(post_id=post_id, user_id=current_user.id or 0))
        post.likes_count += 1
        liked = True

    session.add(post)
    session.commit()

    return {"liked": liked, "likes_count": post.likes_count}


@router.post("/{slug}/join", response_model=MembershipResponse, status_code=201)
def join_club(slug: str, session: SessionDep, current_user: CurrentUser) -> MembershipResponse:
    club = get_club_or_404(session, slug)
    membership = get_membership(session, club.id or 0, current_user.id or 0)

    if membership and membership.status == MembershipStatus.APPROVED:
        raise HTTPException(status_code=409, detail="Vous êtes déjà membre.")
    if membership and membership.status == MembershipStatus.PENDING:
        raise HTTPException(status_code=409, detail="Demande déjà en attente.")

    next_status = MembershipStatus.APPROVED if club.is_verified else MembershipStatus.PENDING

    if membership:
        membership.status = next_status
        membership.role = MembershipRole.MEMBER
        membership.joined_at = now_utc()
        session.add(membership)
        target = membership
    else:
        target = ClubMembership(
            club_id=club.id or 0,
            user_id=current_user.id or 0,
            role=MembershipRole.MEMBER,
            status=next_status,
        )
        session.add(target)

    if next_status == MembershipStatus.APPROVED:
        club.member_count += 1
        session.add(club)

    session.commit()
    session.refresh(target)
    return to_membership_response(target)


@router.delete("/{slug}/leave", status_code=204)
def leave_club(slug: str, session: SessionDep, current_user: CurrentUser) -> None:
    club = get_club_or_404(session, slug)
    membership = get_membership(session, club.id or 0, current_user.id or 0)
    if membership is None:
        raise HTTPException(status_code=404, detail="Adhésion introuvable.")

    if club.president_id == current_user.id and membership.status == MembershipStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Le président ne peut pas quitter le club directement.")

    if membership.status == MembershipStatus.APPROVED:
        club.member_count = max(0, club.member_count - 1)
        session.add(club)

    session.delete(membership)
    session.commit()


@router.get("/{slug}", response_model=ClubResponse)
def club_profile(slug: str, session: SessionDep, _user: CurrentUser) -> ClubResponse:
    club = get_club_or_404(session, slug)
    return to_club_response(club)


@router.patch("/{slug}", response_model=ClubResponse)
def update_club(
    slug: str,
    payload: ClubUpdateRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> ClubResponse:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.PRESIDENT)

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(club, key, value)

    session.add(club)
    session.commit()
    session.refresh(club)
    return to_club_response(club)


@router.get("/{slug}/members", response_model=list[MemberListItem])
def list_members(
    slug: str,
    session: SessionDep,
    _user: CurrentUser,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[MemberListItem]:
    club = get_club_or_404(session, slug)
    query = select(ClubMembership).where(ClubMembership.club_id == (club.id or 0))

    if status_filter:
        status_upper = status_filter.upper()
        if status_upper not in MembershipStatus.ALL:
            raise HTTPException(status_code=400, detail="status invalide")
        query = query.where(ClubMembership.status == status_upper)

    memberships = session.exec(query.offset(offset).limit(limit)).all()

    result: list[MemberListItem] = []
    for membership in memberships:
        user = session.get(User, membership.user_id)
        if user is None:
            continue
        result.append(
            MemberListItem(
                user_id=user.id or 0,
                full_name=user.full_name,
                email=user.email,
                role=membership.role,
                status=membership.status,
                joined_at=membership.joined_at,
            )
        )

    return result


@router.post("/{slug}/members/{user_id}/approve", response_model=MembershipResponse)
def approve_member(
    slug: str,
    user_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    current_user: CurrentUser,
) -> MembershipResponse:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.OFFICER)

    membership = get_membership(session, club.id or 0, user_id)
    if membership is None:
        raise HTTPException(status_code=404, detail="Demande introuvable.")

    if membership.status != MembershipStatus.APPROVED:
        membership.status = MembershipStatus.APPROVED
        membership.joined_at = now_utc()
        club.member_count += 1
        session.add(club)

    session.add(membership)
    session.commit()
    session.refresh(membership)
    return to_membership_response(membership)


@router.delete("/{slug}/members/{user_id}", status_code=204)
def remove_member(
    slug: str,
    user_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    current_user: CurrentUser,
) -> None:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.OFFICER)

    membership = get_membership(session, club.id or 0, user_id)
    if membership is None:
        raise HTTPException(status_code=404, detail="Membre introuvable.")

    if membership.role == MembershipRole.PRESIDENT:
        raise HTTPException(status_code=400, detail="Impossible de supprimer le président.")

    if membership.status == MembershipStatus.APPROVED:
        club.member_count = max(0, club.member_count - 1)
        session.add(club)

    session.delete(membership)
    session.commit()


@router.patch("/{slug}/members/{user_id}/role", response_model=MembershipResponse)
def update_member_role(
    slug: str,
    user_id: Annotated[int, Path(ge=1)],
    payload: MembershipRoleUpdateRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> MembershipResponse:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.OFFICER)

    membership = get_membership(session, club.id or 0, user_id)
    if membership is None:
        raise HTTPException(status_code=404, detail="Membre introuvable.")
    if membership.status != MembershipStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Le membre doit être approuvé.")

    if payload.role == MembershipRole.PRESIDENT:
        old_president = get_membership(session, club.id or 0, club.president_id or -1)
        if old_president and old_president.id != membership.id:
            old_president.role = MembershipRole.VICE_PRESIDENT
            session.add(old_president)

        club.president_id = membership.user_id
        session.add(club)

    membership.role = payload.role
    session.add(membership)
    session.commit()
    session.refresh(membership)
    return to_membership_response(membership)


@router.get("/{slug}/events", response_model=ClubEventsResponse)
def club_events(slug: str, session: SessionDep, _user: CurrentUser) -> ClubEventsResponse:
    club = get_club_or_404(session, slug)
    events = session.exec(
        select(ClubEvent)
        .where(ClubEvent.club_id == (club.id or 0))
        .order_by(ClubEvent.starts_at.desc())
    ).all()

    now = now_utc()
    upcoming = [to_event_response(event) for event in events if event.starts_at >= now]
    past = [to_event_response(event) for event in events if event.starts_at < now]

    return ClubEventsResponse(upcoming=upcoming, past=past)


@router.post("/{slug}/events/", response_model=EventResponse, status_code=201)
def create_event(
    slug: str,
    payload: EventCreateRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> EventResponse:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.OFFICER)

    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=400, detail="La date de fin doit être après la date de début.")

    event = ClubEvent(
        club_id=club.id or 0,
        title=payload.title.strip(),
        description=payload.description.strip(),
        event_type=payload.event_type,
        location=(payload.location or "").strip() or None,
        is_online=payload.is_online,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        max_participants=payload.max_participants,
        cover_image_url=(payload.cover_image_url or "").strip() or None,
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return to_event_response(event)


@router.patch("/{slug}/events/{event_id}", response_model=EventResponse)
def update_event(
    slug: str,
    event_id: Annotated[int, Path(ge=1)],
    payload: EventUpdateRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> EventResponse:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.OFFICER)

    event = session.exec(
        select(ClubEvent).where(ClubEvent.id == event_id, ClubEvent.club_id == (club.id or 0))
    ).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Événement introuvable.")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(event, key, value)

    if event.ends_at <= event.starts_at:
        raise HTTPException(status_code=400, detail="La date de fin doit être après la date de début.")

    session.add(event)
    session.commit()
    session.refresh(event)
    return to_event_response(event)


@router.delete("/{slug}/events/{event_id}", status_code=204)
def delete_event(
    slug: str,
    event_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    current_user: CurrentUser,
) -> None:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.OFFICER)

    event = session.exec(
        select(ClubEvent).where(ClubEvent.id == event_id, ClubEvent.club_id == (club.id or 0))
    ).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Événement introuvable.")

    registrations = session.exec(
        select(EventRegistration).where(EventRegistration.event_id == event_id)
    ).all()
    for registration in registrations:
        session.delete(registration)

    session.delete(event)
    session.commit()


@router.get("/{slug}/posts", response_model=list[PostResponse])
def club_posts(
    slug: str,
    session: SessionDep,
    _user: CurrentUser,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PostResponse]:
    club = get_club_or_404(session, slug)
    posts = session.exec(
        select(ClubPost)
        .where(ClubPost.club_id == (club.id or 0))
        .order_by(ClubPost.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return [to_post_response(post) for post in posts]


@router.post("/{slug}/posts/", response_model=PostResponse, status_code=201)
def create_post(
    slug: str,
    payload: PostCreateRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> PostResponse:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.OFFICER)

    post = ClubPost(
        club_id=club.id or 0,
        author_id=current_user.id or 0,
        title=payload.title.strip(),
        content=payload.content.strip(),
        image_url=(payload.image_url or "").strip() or None,
        post_type=payload.post_type,
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    return to_post_response(post)


@router.delete("/{slug}/posts/{post_id}", status_code=204)
def delete_post(
    slug: str,
    post_id: Annotated[int, Path(ge=1)],
    session: SessionDep,
    current_user: CurrentUser,
) -> None:
    club = get_club_or_404(session, slug)
    require_min_role(session, club=club, user=current_user, minimum_role=MembershipRole.OFFICER)

    post = session.exec(
        select(ClubPost).where(ClubPost.id == post_id, ClubPost.club_id == (club.id or 0))
    ).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post introuvable.")

    likes = session.exec(select(ClubPostLike).where(ClubPostLike.post_id == post_id)).all()
    for like in likes:
        session.delete(like)

    session.delete(post)
    session.commit()


@router.post("/{slug}/ask", response_model=AskClubResponse)
def ask_club_rag(
    slug: str,
    payload: AskClubRequest,
    session: SessionDep,
    _user: CurrentUser,
) -> AskClubResponse:
    _ = get_club_or_404(session, slug)

    sources: list[str] = []
    snippets: list[str] = []

    try:
        import chromadb

        chroma_dir = DATA_DIR / "chroma"
        chroma_dir.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(chroma_dir.resolve()))
        collection = client.get_or_create_collection(slug)
        result = collection.query(
            query_texts=[payload.question],
            n_results=5,
            include=["documents", "metadatas"],
        )

        documents = (result.get("documents") or [[]])[0]
        metadatas = (result.get("metadatas") or [[]])[0]

        for index, document in enumerate(documents):
            if not document:
                continue
            snippets.append(str(document))
            metadata = metadatas[index] if index < len(metadatas) else {}
            if isinstance(metadata, dict):
                source_label = metadata.get("source") or metadata.get("filename")
                if source_label:
                    sources.append(str(source_label))
    except Exception:
        pass

    if snippets:
        context = "\n\n".join(snippets[:3])
        answer = (
            "Voici ce que j'ai trouvé dans la base documentaire du club:\n\n"
            f"{context[:1600]}"
        )
    else:
        answer = (
            "Aucune information documentaire n'a été trouvée pour ce club. "
            "Ajoutez des documents dans la collection du club pour enrichir les réponses."
        )

    return AskClubResponse(answer=answer, sources=sorted(set(sources)))


@router.post("/{slug}/verify", response_model=ClubResponse)
def verify_club(
    slug: str,
    session: SessionDep,
    current_user: CurrentUser,
) -> ClubResponse:
    ensure_admin(current_user)
    club = get_club_or_404(session, slug)
    club.is_verified = True
    session.add(club)
    session.commit()
    session.refresh(club)
    return to_club_response(club)


@router.delete("/{slug}", status_code=204)
def delete_club_as_admin(
    slug: str,
    session: SessionDep,
    current_user: CurrentUser,
) -> None:
    ensure_admin(current_user)
    club = get_club_or_404(session, slug)

    memberships = session.exec(select(ClubMembership).where(ClubMembership.club_id == (club.id or 0))).all()
    events = session.exec(select(ClubEvent).where(ClubEvent.club_id == (club.id or 0))).all()
    posts = session.exec(select(ClubPost).where(ClubPost.club_id == (club.id or 0))).all()

    for membership in memberships:
        session.delete(membership)

    for event in events:
        registrations = session.exec(
            select(EventRegistration).where(EventRegistration.event_id == (event.id or 0))
        ).all()
        for registration in registrations:
            session.delete(registration)
        session.delete(event)

    for post in posts:
        likes = session.exec(select(ClubPostLike).where(ClubPostLike.post_id == (post.id or 0))).all()
        for like in likes:
            session.delete(like)
        session.delete(post)

    session.delete(club)
    session.commit()

    try:
        import chromadb

        chroma_dir = DATA_DIR / "chroma"
        client = chromadb.PersistentClient(path=str(chroma_dir.resolve()))
        client.delete_collection(slug)
    except Exception:
        pass
