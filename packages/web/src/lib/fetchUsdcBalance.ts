import { HORIZON_URL, USDC_ASSET_CODE, USDC_ISSUER } from "./stellar";

interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

interface HorizonAccount {
  balances: HorizonBalance[];
}

export async function fetchUsdcBalance(address: string): Promise<number> {
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (!res.ok) return 0;

  const data: HorizonAccount = await res.json();

  const usdc = data.balances.find(
    (b) => b.asset_code === USDC_ASSET_CODE && b.asset_issuer === USDC_ISSUER,
  );

  return usdc ? parseFloat(usdc.balance) : 0;
}
