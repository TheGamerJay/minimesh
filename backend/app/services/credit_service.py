from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models.credits import (
    DEFAULT_BALANCE,
    DEFAULT_PRICING,
    CreditWallet,
    LedgerEntry,
    PricingConfig,
)
from app.services.project_context import PROJECT_ROOT

_CREDITS_DIR = PROJECT_ROOT / "storage" / "credits"
_WALLET_FILE = _CREDITS_DIR / "wallet.json"
_LEDGER_DIR = _CREDITS_DIR / "ledger"


def _ensure_dirs() -> None:
    _CREDITS_DIR.mkdir(parents=True, exist_ok=True)
    _LEDGER_DIR.mkdir(parents=True, exist_ok=True)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# â”€â”€ Wallet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def load_wallet() -> CreditWallet:
    _ensure_dirs()
    if _WALLET_FILE.exists():
        try:
            return CreditWallet.model_validate_json(_WALLET_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    wallet = CreditWallet(
        balance=DEFAULT_BALANCE,
        total_spent=0,
        total_added=DEFAULT_BALANCE,
        updated_at=_now(),
    )
    _save_wallet(wallet)
    return wallet


def _save_wallet(wallet: CreditWallet) -> None:
    _ensure_dirs()
    wallet.updated_at = _now()
    _WALLET_FILE.write_text(wallet.model_dump_json(indent=2), encoding="utf-8")


# â”€â”€ Ledger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _create_entry(category: str, action: str, amount: int, balance_after: int, description: str) -> LedgerEntry:
    entry = LedgerEntry(
        id=str(uuid.uuid4()),
        category=category,
        action=action,
        amount=amount,
        balance_after=balance_after,
        description=description,
        created_at=_now(),
    )
    (_LEDGER_DIR / f"{entry.id}.json").write_text(entry.model_dump_json(indent=2), encoding="utf-8")
    return entry


def list_ledger(limit: int = 50) -> list[LedgerEntry]:
    _ensure_dirs()
    files = sorted(_LEDGER_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    result = []
    for f in files[:limit]:
        try:
            result.append(LedgerEntry.model_validate_json(f.read_text(encoding="utf-8")))
        except Exception:
            continue
    return result


# â”€â”€ Pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def get_pricing() -> PricingConfig:
    return PricingConfig(**DEFAULT_PRICING)


# â”€â”€ Spend / Add â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def spend_credits(amount: int, category: str, action: str, description: str) -> CreditWallet:
    """Deduct credits. Raises HTTP 402 if balance insufficient."""
    wallet = load_wallet()
    if wallet.balance < amount:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Need {amount}, have {wallet.balance}.",
        )
    wallet.balance -= amount
    wallet.total_spent += amount
    _save_wallet(wallet)
    _create_entry(category, action, -amount, wallet.balance, description)
    return wallet


def add_credits(amount: int, description: str = "Mock credit top-up") -> CreditWallet:
    """Add credits (mock checkout / admin)."""
    if amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be positive.")
    wallet = load_wallet()
    wallet.balance += amount
    wallet.total_added += amount
    _save_wallet(wallet)
    _create_entry("bonus", "mock_add", amount, wallet.balance, description)
    return wallet
