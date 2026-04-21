"""Internship + Application + Profile endpoints for Campus INPT."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.internship import Application, Internship, StudentProfile

router = APIRouter(tags=["internships"])


# ──────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────────────────────────────────


class InternshipResponse(BaseModel):
    id: int
    title: str
    company: str
    company_logo: Optional[str]
    location: str
    remote: str
    description: str
    required_skills: list[str]
    filieres: list[str]
    duration: str
    offer_type: str
    deadline: Optional[str]
    created_at: str
    match_score: Optional[float] = None


class InternshipCreate(BaseModel):
    title: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)
    company_logo: Optional[str] = None
    location: str = "Rabat"
    remote: str = "presentiel"
    description: str = ""
    required_skills: list[str] = []
    filieres: list[str] = []
    duration: str = "2 mois"
    offer_type: str = "stage"
    deadline: Optional[str] = None


class ApplicationCreate(BaseModel):
    cover_letter: str = ""


class ApplicationResponse(BaseModel):
    id: int
    internship_id: int
    user_id: int
    cover_letter: str
    status: str
    applied_at: str
    internship_title: Optional[str] = None
    internship_company: Optional[str] = None


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    skills: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    cv_filename: Optional[str] = None
    linkedin_url: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: str
    skills: list[str]
    languages: list[str]
    cv_filename: Optional[str]
    linkedin_url: Optional[str]
    avatar_url: Optional[str]
    updated_at: str


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def _internship_to_response(i: Internship, match_score: float | None = None) -> InternshipResponse:
    return InternshipResponse(
        id=i.id,
        title=i.title,
        company=i.company,
        company_logo=i.company_logo,
        location=i.location,
        remote=i.remote,
        description=i.description,
        required_skills=i.get_skills(),
        filieres=i.get_filieres(),
        duration=i.duration,
        offer_type=i.offer_type,
        deadline=i.deadline.isoformat() if i.deadline else None,
        created_at=i.created_at.isoformat() if i.created_at else "",
        match_score=match_score,
    )


# ──────────────────────────────────────────────────────────────────────
# Internship CRUD
# ──────────────────────────────────────────────────────────────────────

internships_router = APIRouter(prefix="/internships")


@internships_router.get("/", response_model=list[InternshipResponse])
def list_internships(
    filiere: Optional[str] = Query(None),
    remote: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    stmt = select(Internship).order_by(Internship.created_at.desc())  # type: ignore
    internships = session.exec(stmt).all()
    results = []
    for i in internships:
        if filiere and filiere != "all":
            if filiere.upper() not in [f.upper() for f in i.get_filieres()]:
                continue
        if remote and remote != "all" and i.remote != remote:
            continue
        if search:
            haystack = f"{i.title} {i.company} {i.description}".lower()
            if search.lower() not in haystack:
                continue
        results.append(_internship_to_response(i))
    return results


@internships_router.post("/", response_model=InternshipResponse, status_code=201)
def create_internship(body: InternshipCreate, session: Session = Depends(get_session)):
    i = Internship(
        title=body.title,
        company=body.company,
        company_logo=body.company_logo,
        location=body.location,
        remote=body.remote,
        description=body.description,
        duration=body.duration,
        offer_type=body.offer_type,
    )
    i.set_skills(body.required_skills)
    i.set_filieres(body.filieres)
    if body.deadline:
        try:
            i.deadline = datetime.fromisoformat(body.deadline)
        except ValueError:
            pass
    session.add(i)
    session.commit()
    session.refresh(i)
    return _internship_to_response(i)


@internships_router.get("/{internship_id}", response_model=InternshipResponse)
def get_internship(internship_id: int, session: Session = Depends(get_session)):
    i = session.get(Internship, internship_id)
    if not i:
        raise HTTPException(404, "Offre introuvable.")
    return _internship_to_response(i)


# ──────────────────────────────────────────────────────────────────────
# Applications
# ──────────────────────────────────────────────────────────────────────


@internships_router.post("/{internship_id}/apply", response_model=ApplicationResponse, status_code=201)
def apply_to_internship(
    internship_id: int,
    body: ApplicationCreate,
    user_id: int = Query(...),
    session: Session = Depends(get_session),
):
    i = session.get(Internship, internship_id)
    if not i:
        raise HTTPException(404, "Offre introuvable.")
    existing = session.exec(
        select(Application)
        .where(Application.internship_id == internship_id)
        .where(Application.user_id == user_id)
    ).first()
    if existing:
        raise HTTPException(409, "Vous avez déjà postulé à cette offre.")
    app = Application(
        internship_id=internship_id,
        user_id=user_id,
        cover_letter=body.cover_letter,
    )
    session.add(app)
    session.commit()
    session.refresh(app)
    return ApplicationResponse(
        id=app.id,
        internship_id=app.internship_id,
        user_id=app.user_id,
        cover_letter=app.cover_letter,
        status=app.status,
        applied_at=app.applied_at.isoformat(),
        internship_title=i.title,
        internship_company=i.company,
    )


@internships_router.get("/applications/mine", response_model=list[ApplicationResponse])
def my_applications(user_id: int = Query(...), session: Session = Depends(get_session)):
    apps = session.exec(
        select(Application).where(Application.user_id == user_id).order_by(Application.applied_at.desc())  # type: ignore
    ).all()
    results = []
    for a in apps:
        i = session.get(Internship, a.internship_id)
        results.append(
            ApplicationResponse(
                id=a.id,
                internship_id=a.internship_id,
                user_id=a.user_id,
                cover_letter=a.cover_letter,
                status=a.status,
                applied_at=a.applied_at.isoformat(),
                internship_title=i.title if i else None,
                internship_company=i.company if i else None,
            )
        )
    return results


# ──────────────────────────────────────────────────────────────────────
# Student Profile
# ──────────────────────────────────────────────────────────────────────

profile_router = APIRouter(prefix="/profile")


@profile_router.get("/", response_model=ProfileResponse)
def get_profile(user_id: int = Query(...), session: Session = Depends(get_session)):
    p = session.exec(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    ).first()
    if not p:
        p = StudentProfile(user_id=user_id)
        session.add(p)
        session.commit()
        session.refresh(p)
    return ProfileResponse(
        id=p.id,
        user_id=p.user_id,
        bio=p.bio,
        skills=p.get_skills(),
        languages=p.get_languages(),
        cv_filename=p.cv_filename,
        linkedin_url=p.linkedin_url,
        avatar_url=p.avatar_url,
        updated_at=p.updated_at.isoformat(),
    )


@profile_router.patch("/", response_model=ProfileResponse)
def update_profile(
    body: ProfileUpdate,
    user_id: int = Query(...),
    session: Session = Depends(get_session),
):
    p = session.exec(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    ).first()
    if not p:
        p = StudentProfile(user_id=user_id)
        session.add(p)
        session.commit()
        session.refresh(p)

    if body.bio is not None:
        p.bio = body.bio
    if body.skills is not None:
        p.set_skills(body.skills)
    if body.languages is not None:
        p.set_languages(body.languages)
    if body.cv_filename is not None:
        p.cv_filename = body.cv_filename
    if body.linkedin_url is not None:
        p.linkedin_url = body.linkedin_url
    if body.avatar_url is not None:
        p.avatar_url = body.avatar_url
    p.updated_at = datetime.now(timezone.utc)
    session.add(p)
    session.commit()
    session.refresh(p)
    return ProfileResponse(
        id=p.id,
        user_id=p.user_id,
        bio=p.bio,
        skills=p.get_skills(),
        languages=p.get_languages(),
        cv_filename=p.cv_filename,
        linkedin_url=p.linkedin_url,
        avatar_url=p.avatar_url,
        updated_at=p.updated_at.isoformat(),
    )


# Combine both routers
router = APIRouter()
router.include_router(internships_router)
router.include_router(profile_router)
