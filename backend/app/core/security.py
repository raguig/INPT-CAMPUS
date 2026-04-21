from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

import bcrypt
from jose import JWTError, ExpiredSignatureError, jwt

from app.core.config import settings


ACCESS_TOKEN_EXPIRE_SECONDS = settings.access_token_expire_days * 24 * 60 * 60
INVALID_CREDENTIALS_MESSAGE = (
    "Email ou mot de passe incorrect / البريد الإلكتروني أو كلمة المرور غير صحيحة"
)
INVALID_TOKEN_MESSAGE = "Jeton invalide ou expiré / الرمز غير صالح أو منتهي الصلاحية"
LOGGED_OUT_TOKEN_MESSAGE = "Session expirée ou fermée / انتهت الجلسة أو تم تسجيل الخروج"


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _build_token(
    *,
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(*, user_id: int, email: str, role: str) -> str:
    return _build_token(
        subject=str(user_id),
        token_type="access",
        expires_delta=timedelta(days=settings.access_token_expire_days),
        extra_claims={"email": email, "role": role},
    )


def create_refresh_token(*, user_id: int) -> str:
    return _build_token(
        subject=str(user_id),
        token_type="refresh",
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        extra_claims={"jti": uuid4().hex},
    )


def decode_token(token: str, expected_type: Optional[str] = None) -> Dict[str, Any]:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    token_type = payload.get("type")
    if expected_type and token_type != expected_type:
        raise JWTError("Unexpected token type")
    return payload


def decode_token_with_errors(token: str, expected_type: Optional[str] = None) -> Dict[str, Any]:
    try:
        return decode_token(token, expected_type=expected_type)
    except ExpiredSignatureError as exc:
        raise ValueError(INVALID_TOKEN_MESSAGE) from exc
    except JWTError as exc:
        raise ValueError(INVALID_TOKEN_MESSAGE) from exc


def payload_expiration(payload: Dict[str, Any]) -> datetime:
    exp = payload.get("exp")
    if exp is None:
        raise ValueError(INVALID_TOKEN_MESSAGE)
    return datetime.fromtimestamp(int(exp), tz=timezone.utc)
