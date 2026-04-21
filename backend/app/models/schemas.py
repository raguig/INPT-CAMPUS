from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

try:
    from pydantic import ConfigDict
except ImportError:  # pragma: no cover
    ConfigDict = None


class ORMBaseModel(BaseModel):
    if ConfigDict is not None:
        model_config = ConfigDict(from_attributes=True)

    class Config:
        orm_mode = True


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    student_id: str = Field(..., min_length=1, max_length=64)
    filiere: str = Field(..., min_length=2, max_length=100)
    cycle: Literal["ingenieur", "master", "doctorat"]
    year: int = Field(..., ge=1, le=3)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    access_token_expires_in: int


class UserResponse(ORMBaseModel):
    id: int
    email: EmailStr
    full_name: str
    student_id: str
    filiere: str
    cycle: str
    year: int
    role: str
    created_at: datetime


class MessageResponse(BaseModel):
    message: str
