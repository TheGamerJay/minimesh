from __future__ import annotations
from pydantic import BaseModel

VALID_CATEGORIES = {"generation", "rigging", "animation", "materials", "exports", "bonus", "admin"}

DEFAULT_BALANCE = 1000

DEFAULT_PRICING = {
    "generation_cost": 25,
    "rigging_cost": 10,
    "animation_cost": 8,
    "export_cost": 5,
    "material_preset_cost": 2,
}


class CreditWallet(BaseModel):
    balance: int = DEFAULT_BALANCE
    total_spent: int = 0
    total_added: int = DEFAULT_BALANCE
    updated_at: str = ""


class LedgerEntry(BaseModel):
    id: str
    category: str
    action: str
    amount: int          # negative = spend, positive = add
    balance_after: int
    description: str
    created_at: str


class PricingConfig(BaseModel):
    generation_cost: int = 25
    rigging_cost: int = 10
    animation_cost: int = 8
    export_cost: int = 5
    material_preset_cost: int = 2
