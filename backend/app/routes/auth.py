from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.models.auth import AuthResponse, SessionUser
from app.services import auth_service
from app.services.auth_middleware import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str  # accepts username or email
    password: str


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest) -> AuthResponse:
    return auth_service.register(body.username, body.email, body.password)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest) -> AuthResponse:
    return auth_service.login(body.username, body.password)


@router.post("/logout")
async def logout(request: Request, user: SessionUser = Depends(get_current_user)):
    token = request.headers.get("Authorization", "")[7:].strip()
    auth_service.logout(token)
    return {"detail": "Logged out"}


@router.get("/me", response_model=SessionUser)
async def me(user: SessionUser = Depends(get_current_user)) -> SessionUser:
    return user
