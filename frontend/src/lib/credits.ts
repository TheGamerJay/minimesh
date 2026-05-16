export interface CreditWallet {
  balance: number;
  total_spent: number;
  total_added: number;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  category: string;
  action: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface PricingConfig {
  generation_cost: number;
  rigging_cost: number;
  animation_cost: number;
  export_cost: number;
  material_preset_cost: number;
}

export const ACTION_LABELS: Record<string, string> = {
  create_job: "Generate Draft Mesh",
  create_rig_job: "Create Rig Job",
  create_animation_job: "Preview Animation Clip",
  create_export: "Create Export Package",
  save_material_preset: "Save Material Preset",
  mock_add: "Mock Credit Top-up",
};

export async function getWallet(): Promise<CreditWallet> {
  const res = await fetch("/api/credits/wallet");
  if (!res.ok) throw new Error("Failed to fetch wallet");
  return res.json();
}

export async function getLedger(): Promise<LedgerEntry[]> {
  const res = await fetch("/api/credits/ledger");
  if (!res.ok) throw new Error("Failed to fetch ledger");
  return res.json();
}

export async function getPricing(): Promise<PricingConfig> {
  const res = await fetch("/api/credits/pricing");
  if (!res.ok) throw new Error("Failed to fetch pricing");
  return res.json();
}

export async function mockAddCredits(amount: number): Promise<CreditWallet> {
  const res = await fetch("/api/credits/mock-add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error("Failed to add credits");
  return res.json();
}

export function isCreditError(message: string): boolean {
  return message.toLowerCase().includes("insufficient credits");
}

export function parseCreditError(message: string): { need: number; have: number } | null {
  const m = message.match(/Need (\d+), have (\d+)/i);
  if (!m) return null;
  return { need: parseInt(m[1]), have: parseInt(m[2]) };
}
