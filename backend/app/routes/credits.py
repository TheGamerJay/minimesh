from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.credits import CreditWallet, LedgerEntry, PricingConfig
from app.services import credit_service

router = APIRouter(prefix="/api/credits", tags=["credits"])


class MockAddRequest(BaseModel):
    amount: int = 500


@router.get("/wallet", response_model=CreditWallet)
async def get_wallet():
    return credit_service.load_wallet()


@router.get("/ledger", response_model=list[LedgerEntry])
async def get_ledger():
    return credit_service.list_ledger()


@router.get("/pricing", response_model=PricingConfig)
async def get_pricing():
    return credit_service.get_pricing()


@router.post("/mock-add", response_model=CreditWallet)
async def mock_add_credits(body: MockAddRequest):
    """Development-only: add mock credits to the local wallet."""
    return credit_service.add_credits(body.amount, f"Dev mock top-up (+{body.amount})")
