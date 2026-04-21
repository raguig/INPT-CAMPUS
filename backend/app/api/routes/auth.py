from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.security import (
    ACCESS_TOKEN_EXPIRE_SECONDS,
    INVALID_CREDENTIALS_MESSAGE,
    INVALID_TOKEN_MESSAGE,
    LOGGED_OUT_TOKEN_MESSAGE,
    create_access_token,
    create_refresh_token,
    decode_token_with_errors,
    hash_password,
    payload_expiration,
    verify_password,
)
from app.models.schemas import (
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.models.user import RefreshTokenBlacklist, User


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: RegisterRequest,
    session: Session = Depends(get_session),
) -> User:
    email = payload.email.lower().strip()
    student_id = payload.student_id.strip()

    existing_user = session.exec(
        select(User).where(or_(User.email == email, User.student_id == student_id))
    ).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Compte déjà existant / الحساب موجود بالفعل",
        )

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        student_id=student_id,
        filiere=payload.filiere.strip().upper(),
        cycle=payload.cycle,
        year=payload.year,
        role="student",
        password_hash=hash_password(payload.password),
    )

    session.add(user)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible de créer le compte / تعذر إنشاء الحساب",
        ) from exc

    session.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login_user(
    payload: LoginRequest,
    session: Session = Depends(get_session),
) -> TokenResponse:
    email = payload.email.lower().strip()
    user = session.exec(select(User).where(User.email == email)).first()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS_MESSAGE,
        )

    access_token = create_access_token(user_id=user.id, email=user.email, role=user.role)
    refresh_token = create_refresh_token(user_id=user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_in=ACCESS_TOKEN_EXPIRE_SECONDS,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(
    payload: RefreshTokenRequest,
    session: Session = Depends(get_session),
) -> TokenResponse:
    try:
        token_payload = decode_token_with_errors(payload.refresh_token, expected_type="refresh")
        user_id = int(token_payload.get("sub", 0))
        jti = token_payload.get("jti")
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_TOKEN_MESSAGE,
        )

    if not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_TOKEN_MESSAGE,
        )

    blacklisted_token = session.exec(
        select(RefreshTokenBlacklist).where(RefreshTokenBlacklist.jti == jti)
    ).first()
    if blacklisted_token is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=LOGGED_OUT_TOKEN_MESSAGE,
        )

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_TOKEN_MESSAGE,
        )

    access_token = create_access_token(user_id=user.id, email=user.email, role=user.role)
    return TokenResponse(
        access_token=access_token,
        access_token_expires_in=ACCESS_TOKEN_EXPIRE_SECONDS,
    )


@router.post("/logout", response_model=MessageResponse)
def logout_user(
    payload: RefreshTokenRequest,
    session: Session = Depends(get_session),
) -> MessageResponse:
    try:
        token_payload = decode_token_with_errors(payload.refresh_token, expected_type="refresh")
        user_id = int(token_payload.get("sub", 0))
        jti = token_payload.get("jti")
        expires_at = payload_expiration(token_payload)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_TOKEN_MESSAGE,
        )

    if not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_TOKEN_MESSAGE,
        )

    existing_entry = session.exec(
        select(RefreshTokenBlacklist).where(RefreshTokenBlacklist.jti == jti)
    ).first()
    if existing_entry is None:
        session.add(
            RefreshTokenBlacklist(
                jti=jti,
                user_id=user_id,
                expires_at=expires_at,
            )
        )
        session.commit()

    return MessageResponse(message="Déconnexion réussie / تم تسجيل الخروج بنجاح")


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
