"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { LumioEvent, Investment } from "@/types";
import { formatUSDC } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface InvestmentPanelProps {
  event: LumioEvent;
  investment?: Investment;
}

export default function InvestmentPanel({ event, investment }: InvestmentPanelProps) {
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const maxTokens = Math.floor(event.tokenSupply * (event.maxPerWalletPercent / 100));
  const remaining = event.tokenSupply - event.tokensSold;

  if (event.status === "distribution_executed" && investment) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
        <h3 className="text-base font-bold text-text-primary mb-4">Investment Complete</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Tokens Held</span>
            <span className="font-medium">{investment.tokensOwned}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Amount Invested</span>
            <span className="font-medium">{formatUSDC(investment.totalInvested)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Payout Received</span>
            <span className="font-medium">{formatUSDC(investment.actualPayout ?? 0)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">ROI</span>
            <span className={`font-bold ${(investment.roi ?? 0) >= 0 ? "text-success" : "text-danger"}`}>
              {(investment.roi ?? 0) >= 0 ? "+" : ""}{investment.roi?.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  if ((event.status === "funding_successful" || event.status === "event_executed") && investment) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
        <h3 className="text-base font-bold text-text-primary mb-4">Your Investment</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Tokens Owned</span>
            <span className="font-medium">{investment.tokensOwned}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Amount Invested</span>
            <span className="font-medium">{formatUSDC(investment.totalInvested)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Estimated Payout</span>
            <span className="font-medium">{formatUSDC(investment.estimatedPayout)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Status</span>
            <span className="font-medium capitalize">{event.status.replace(/_/g, " ")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (event.status === "funding_open") {
    const total = quantity * event.pricePerToken;
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
        <h3 className="text-base font-bold text-text-primary mb-4">Invest in this event</h3>

        <div className="mb-4 text-sm text-text-secondary">
          Token Price: <span className="font-medium text-text-primary">{event.pricePerToken} USDC</span>
        </div>

        <div className="mb-4">
          <label className="text-sm text-text-secondary mb-1.5 block">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-bg-primary"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-lg font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(Math.min(maxTokens, remaining), quantity + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-bg-primary"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-text-tertiary">{remaining} tokens remaining</p>
        </div>

        <div className="mb-4 flex justify-between rounded-lg bg-bg-primary p-3 text-sm">
          <span className="text-text-secondary">Total Cost</span>
          <span className="font-bold text-text-primary">{formatUSDC(total)} USDC</span>
        </div>

        <button
          onClick={() => showToast(`Successfully purchased ${quantity} token${quantity > 1 ? "s" : ""}!`)}
          className="w-full rounded-[var(--radius-btn)] bg-dominant py-3 text-sm font-bold text-white transition-colors hover:bg-dominant-hover"
        >
          Buy
        </button>

        <p className="mt-3 text-xs text-text-tertiary leading-relaxed">
          This is not equity. Tokens represent a right to revenue share only.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
      <p className="text-sm text-text-secondary">You haven&apos;t invested in this event.</p>
    </div>
  );
}
