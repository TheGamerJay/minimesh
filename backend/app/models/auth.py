from __future__ import annotations
from pydantic import BaseModel


class User(BaseModel):
    id: str
    username: str
    email: str
    password_hash: str
    created_at: str
    last_login: str | None = None
    is_legacy: bool = False
    is_admin: bool = False


class SessionUser(BaseModel):
    id: str
    username: str
    email: str
    is_admin: bool = False


class AuthResponse(BaseModel):
    token: str
    user: SessionUser
