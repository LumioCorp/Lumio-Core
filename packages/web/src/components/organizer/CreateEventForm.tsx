"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import EventPreviewCard from "./EventPreviewCard";
import { formatUSDC } from "@/lib/utils";

export default function CreateEventForm() {
  const { showToast } = useToast();

  const [name, setName] = useState("My New Event");
  const [description, setDescription] = useState("An exciting event powered by Lumio.");
  const [category, setCategory] = useState("gastronomy");
  const [location, setLocation] = useState("San José, Costa Rica");
  const [eventDate, setEventDate] = useState("2026-06-15");
  const [fundingTarget, setFundingTarget] = useState(5000);
  const [pricePerToken, setPricePerToken] = useState(100);
  const [revenueSharePercent, setRevenueSharePercent] = useState(30);

  const computed = useMemo(() => {
    const tokenSupply = pricePerToken > 0 ? Math.floor(fundingTarget / pricePerToken) : 0;
    const collateralAmount = fundingTarget * 0.15;
    const maxPerWallet = Math.floor(tokenSupply * 0.4);

    const evDate = new Date(eventDate);
    const fundingDeadline = new Date(evDate);
    fundingDeadline.setDate(fundingDeadline.getDate() - 14);
    const liquidationDeadline = new Date(evDate);
    liquidationDeadline.setDate(liquidationDeadline.getDate() + 7);

    return {
      tokenSupply,
      collateralAmount,
      maxPerWallet,
      fundingDeadline: fundingDeadline.toISOString().split("T")[0],
      liquidationDeadline: liquidationDeadline.toISOString().split("T")[0],
    };
  }, [fundingTarget, pricePerToken, eventDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Event created successfully!");
  };

  const inputClass = "w-full rounded-[var(--radius-btn)] border border-border bg-white px-4 py-2.5 text-sm text-text-primary focus:border-accent-blue focus:outline-none";
  const labelClass = "block text-sm font-medium text-text-primary mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
        <h3 className="text-base font-bold text-text-primary mb-4">Event Details</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Event Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="gastronomy">Gastronomy</option>
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="culture">Culture</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Event Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Event Image</label>
              <div className="flex h-[42px] items-center rounded-[var(--radius-btn)] border border-dashed border-border px-4 text-sm text-text-tertiary">
                Upload image (demo only)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
        <h3 className="text-base font-bold text-text-primary mb-4">Financial Parameters</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Funding Target (USDC)</label>
              <input type="number" value={fundingTarget} onChange={(e) => setFundingTarget(Number(e.target.value))} min={100} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Price per Token (USDC)</label>
              <input type="number" value={pricePerToken} onChange={(e) => setPricePerToken(Number(e.target.value))} min={1} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Revenue Share: {revenueSharePercent}%</label>
            <input
              type="range"
              min={10}
              max={50}
              value={revenueSharePercent}
              onChange={(e) => setRevenueSharePercent(Number(e.target.value))}
              className="w-full accent-dominant"
            />
            <div className="flex justify-between text-xs text-text-tertiary"><span>10%</span><span>50%</span></div>
          </div>

          <div className="rounded-lg bg-bg-primary p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Token Supply</span><span className="font-medium">{computed.tokenSupply}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Collateral (15%)</span><span className="font-medium">{formatUSDC(computed.collateralAmount)} USDC</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Max per Wallet (40%)</span><span className="font-medium">{computed.maxPerWallet} tokens</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Lumio Fee</span><span className="font-medium">3% on funding + 2% on distributions</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Funding Deadline</span><span className="font-medium">{computed.fundingDeadline}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Liquidation Deadline</span><span className="font-medium">{computed.liquidationDeadline}</span></div>
          </div>
        </div>
      </div>

      <EventPreviewCard
        data={{
          name,
          category,
          location,
          eventDate,
          fundingTarget,
          pricePerToken,
          revenueSharePercent,
          ...computed,
        }}
      />

      <div>
        <button
          type="submit"
          className="w-full rounded-[var(--radius-btn)] bg-dominant py-3 text-sm font-bold text-white hover:bg-dominant-hover transition-colors"
        >
          Create Event &amp; Deposit Collateral
        </button>
        <p className="mt-2 text-xs text-text-tertiary text-center">
          Creating an event requires depositing {formatUSDC(computed.collateralAmount)} USDC as collateral.
        </p>
      </div>
    </form>
  );
}
