from __future__ import annotations
import hashlib
import json
import os
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

from app.services.project_context import PROJECT_ROOT

_AUTH_DIR = PROJECT_ROOT / "storage" / "auth"
_USERS_FILE = _AUTH_DIR / "users.json"
_SESSIONS_FILE = _AUTH_DIR / "sessions.json"
_SESSION_TTL_DAYS = 30

DEFAULT_USER_ID = "default_local_user"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Password hashing (bcrypt preferred, PBKDF2 fallback) ─────────────────────

try:
    import bcrypt as _bcrypt_lib

    def _hash_password(password: str) -> str:
        return _bcrypt_lib.hashpw(password.encode(), _bcrypt_lib.gensalt()).decode()

    def _verify_password(password: str, hashed: str) -> bool:
        try:
            return _bcrypt_lib.checkpw(password.encode(), hashed.encode())
        except Exception:
            return False

except ImportError:
    def _hash_password(password: str) -> str:
        salt = os.urandom(32)
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
        return "pbkdf2:" + salt.hex() + ":" + key.hex()

    def _verify_password(password: str, hashed: str) -> bool:
        try:
            if hashed.startswith("pbkdf2:"):
                _, salt_hex, key_hex = hashed.split(":")
                salt = bytes.fromhex(salt_hex)
                key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
                return secrets.compare_digest(key.hex(), key_hex)
            return False
        except Exception:
            return False


# ── Storage helpers ───────────────────────────────────────────────────────────

def _load_users() -> list[dict]:
    if not _USERS_FILE.exists():
        return []
    try:
        return json.loads(_USERS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_users(users: list[dict]) -> None:
    _AUTH_DIR.mkdir(parents=True, exist_ok=True)
    _USERS_FILE.write_text(json.dumps(users, indent=2, ensure_ascii=False), encoding="utf-8")


def _load_sessions() -> dict:
    if not _SESSIONS_FILE.exists():
        return {}
    try:
        return json.loads(_SESSIONS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_sessions(sessions: dict) -> None:
    _AUTH_DIR.mkdir(parents=True, exist_ok=True)
    _SESSIONS_FILE.write_text(json.dumps(sessions, indent=2, ensure_ascii=False), encoding="utf-8")


# ── Token helpers ─────────────────────────────────────────────────────────────

def _create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    sessions = _load_sessions()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=_SESSION_TTL_DAYS)).isoformat()
    sessions[token] = {"user_id": user_id, "created_at": _now(), "expires_at": expires_at}
    _save_sessions(sessions)
    return token


def _find_user_dict(username_or_email: str) -> dict | None:
    lo = username_or_email.strip().lower()
    for u in _load_users():
        if u.get("username", "").lower() == lo or u.get("email", "").lower() == lo:
            return u
    return None


# ── Public API ────────────────────────────────────────────────────────────────

def register(username: str, email: str, password: str):
    from app.models.auth import AuthResponse, SessionUser
    from fastapi import HTTPException

    username = username.strip()
    email = email.strip().lower()

    if len(username) < 3:
        raise HTTPException(400, "Username must be at least 3 characters")
    if len(password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(400, "Invalid email address")

    users = _load_users()
    lo_u = username.lower()
    lo_e = email.lower()
    for u in users:
        if u.get("username", "").lower() == lo_u:
            raise HTTPException(409, "Username already taken")
        if u.get("email", "").lower() == lo_e:
            raise HTTPException(409, "Email already registered")

    user_id = str(uuid.uuid4())
    now = _now()
    user_dict = {
        "id": user_id,
        "username": username,
        "email": email,
        "password_hash": _hash_password(password),
        "created_at": now,
        "last_login": now,
    }
    users.append(user_dict)
    _save_users(users)

    token = _create_session(user_id)
    return AuthResponse(token=token, user=SessionUser(id=user_id, username=username, email=email))


def login(username_or_email: str, password: str):
    from app.models.auth import AuthResponse, SessionUser
    from fastapi import HTTPException

    user = _find_user_dict(username_or_email)
    if not user or not _verify_password(password, user.get("password_hash", "")):
        raise HTTPException(401, "Invalid credentials")

    users = _load_users()
    for u in users:
        if u["id"] == user["id"]:
            u["last_login"] = _now()
            break
    _save_users(users)

    token = _create_session(user["id"])
    return AuthResponse(
        token=token,
        user=SessionUser(id=user["id"], username=user["username"], email=user["email"]),
    )


def logout(token: str) -> None:
    sessions = _load_sessions()
    sessions.pop(token, None)
    _save_sessions(sessions)


def validate_token(token: str):
    from app.models.auth import SessionUser

    if not token:
        return None
    sessions = _load_sessions()
    session = sessions.get(token)
    if not session:
        return None

    try:
        expires_at = datetime.fromisoformat(session["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            sessions.pop(token, None)
            _save_sessions(sessions)
            return None
    except Exception:
        return None

    user_id = session.get("user_id")
    user = next((u for u in _load_users() if u["id"] == user_id), None)
    if not user:
        return None
    return SessionUser(id=user["id"], username=user["username"], email=user["email"])


def auth_storage_ready() -> bool:
    return _USERS_FILE.exists()


# ── Migration ─────────────────────────────────────────────────────────────────

def ensure_migration() -> None:
    """Create default_local_user if legacy data exists and no users are registered."""
    users = _load_users()
    if users:
        return

    legacy_markers = [
        PROJECT_ROOT / "storage" / "projects_registry.json",
        PROJECT_ROOT / "storage" / "projects",
        PROJECT_ROOT / "storage" / "uploads",
    ]
    if not any(p.exists() for p in legacy_markers):
        return

    now = _now()
    default_user: dict = {
        "id": DEFAULT_USER_ID,
        "username": "local",
        "email": "local@localhost",
        "password_hash": _hash_password("local"),
        "created_at": now,
        "last_login": None,
        "is_legacy": True,
    }
    _save_users([default_user])
    print(
        "\n[MiniMesh Auth] Legacy data detected — created default local account:\n"
        "  username : local\n"
        "  password : local\n"
        "  Change your password after first login.\n"
    )
