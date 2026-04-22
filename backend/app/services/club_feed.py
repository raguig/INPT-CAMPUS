from __future__ import annotations

from sqlmodel import Session, select

from app.models.club import ClubMembership, ClubPost, MembershipStatus


def build_user_club_feed(
    session: Session,
    *,
    user_id: int,
    limit: int = 50,
    offset: int = 0,
) -> list[ClubPost]:
    memberships = session.exec(
        select(ClubMembership).where(
            ClubMembership.user_id == user_id,
            ClubMembership.status == MembershipStatus.APPROVED,
        )
    ).all()

    club_ids = [membership.club_id for membership in memberships]
    if not club_ids:
        return []

    posts = session.exec(
        select(ClubPost)
        .where(ClubPost.club_id.in_(club_ids))
        .order_by(ClubPost.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(posts)
