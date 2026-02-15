import { formatUSDC } from "@/lib/utils";

interface PreviewData {
  name: string;
  category: string;
  location: string;
  eventDate: string;
  fundingTarget: number;
  pricePerToken: number;
  revenueSharePercent: number;
  tokenSupply: number;
  collateralAmount: number;
  maxPerWallet: number;
  fundingDeadline: string;
  liquidationDeadline: string;
}

export default function EventPreviewCard({ data }: { data: PreviewData }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg-primary p-6">
      <h4 className="text-base font-bold text-text-primary mb-4">Summary Preview</h4>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between"><span className="text-text-secondary">Event Name</span><span className="font-medium">{data.name || "—"}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Category</span><span className="font-medium capitalize">{data.category || "—"}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Location</span><span className="font-medium">{data.location || "—"}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Event Date</span><span className="font-medium">{data.eventDate || "—"}</span></div>
        <div className="border-t border-border my-2" />
        <div className="flex justify-between"><span className="text-text-secondary">Funding Target</span><span className="font-medium">{formatUSDC(data.fundingTarget)} USDC</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Price per Token</span><span className="font-medium">{data.pricePerToken} USDC</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Token Supply</span><span className="font-medium">{data.tokenSupply}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Revenue Share</span><span className="font-medium">{data.revenueSharePercent}%</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Collateral (15%)</span><span className="font-medium">{formatUSDC(data.collateralAmount)} USDC</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Max per Wallet (40%)</span><span className="font-medium">{data.maxPerWallet} tokens</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Lumio Fee</span><span className="font-medium">3% funding + 2% distributions</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Funding Deadline</span><span className="font-medium">{data.fundingDeadline || "—"}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Liquidation Deadline</span><span className="font-medium">{data.liquidationDeadline || "—"}</span></div>
      </div>
    </div>
  );
}
