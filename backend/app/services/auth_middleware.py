from __future__ import annotations

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.services import auth_service
from app.services.project_context import _current_user_id

# Paths that don't require authentication
_PUBLIC_PREFIXES = ("/health", "/api/auth/")
_PUBLIC_EXACT = {"/", "/health"}


def _extract_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:].strip()
        return token if token else None
    return None


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        token = _extract_token(request)
        user = auth_service.validate_token(token) if token else None

        request.state.user = user
        ctx_token = None
        if user:
            ctx_token = _current_user_id.set(user.id)

        path = request.url.path
        needs_auth = (
            path.startswith("/api/")
            and not any(path.startswith(p) for p in _PUBLIC_PREFIXES)
        )

        if needs_auth and not user:
            origin = request.headers.get("origin", "")
            cors_headers = {"Access-Control-Allow-Origin": origin} if origin else {}
            return JSONResponse(
                {"detail": "Authentication required"},
                status_code=401,
                headers=cors_headers,
            )

        try:
            response = await call_next(request)
        finally:
            if ctx_token is not None:
                _current_user_id.reset(ctx_token)

        return response


# ── FastAPI dependency ────────────────────────────────────────────────────────

async def get_current_user(request: Request):
    from app.models.auth import SessionUser
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
