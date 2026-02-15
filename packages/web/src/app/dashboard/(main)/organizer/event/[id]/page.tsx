"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { events } from "@/data/mock";
import { formatUSDC, formatDate, fundingPercent } from "@/lib/utils";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ProgressBar from "@/components/dashboard/ProgressBar";
import { useToast } from "@/components/ui/Toast";

export default function OrganizerEventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = events.find((e) => e.id === id);
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-secondary">Event not found.</p>
        <Link href="/dashboard/organizer/events" className="mt-2 text-sm text-accent-blue hover:underline">
          Back to My Events
        </Link>
      </div>
    );
  }

  const pct = fundingPercent(event.totalFunded, event.fundingTarget);
  const hasRevenue = event.status === "event_executed" || event.status === "distribution_executed" || event.status === "liquidation_countdown";
  const hasDist = event.status === "distribution_executed" && event.distribution;
  const payLink = `/dashboard/pay/${event.id}`;

  const investorPool = event.totalRevenue * (event.revenueSharePercent / 100);
  const lumioFeeOnRevenue = investorPool * (event.lumioFeePercent / 100);
  const organizerPayout = event.totalRevenue - investorPool + event.collateralAmount;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin + payLink);
    setCopied(true);
    showToast("Pay link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/organizer/events" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to My Events
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{event.name}</h2>
            <p className="text-sm text-text-secondary">{event.location} &middot; {formatDate(event.eventDate)}</p>
          </div>
          <StatusBadge status={event.status} size="lg" />
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
          <h3 className="text-base font-bold text-text-primary mb-4">Funding</h3>
          <ProgressBar value={pct} />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-text-secondary">{formatUSDC(event.totalFunded)} / {formatUSDC(event.fundingTarget)} USDC</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-sm text-text-secondary">
            <Users className="h-4 w-4" /> {event.investorCount} investors
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            Funding Deadline: <span className="font-medium text-text-primary">{formatDate(event.fundingDeadline)}</span>
          </p>
        </div>

        {hasRevenue && (
          <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
            <h3 className="text-base font-bold text-text-primary mb-4">Revenue</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">Total Revenue</span><span className="font-medium">{formatUSDC(event.totalRevenue)} USDC</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Tickets Sold</span><span className="font-medium">{event.ticketsSold}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Investor Pool ({event.revenueSharePercent}%)</span><span className="font-medium">{formatUSDC(investorPool)} USDC</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Lumio Fee</span><span className="font-medium">{formatUSDC(lumioFeeOnRevenue)} USDC</span></div>
            </div>
            {event.status === "event_executed" && (
              <button
                onClick={() => showToast("Event marked as executed! Distribution will be processed.")}
                className="mt-4 w-full rounded-[var(--radius-btn)] bg-dominant py-2.5 text-sm font-bold text-white hover:bg-dominant-hover transition-colors"
              >
                Mark Event as Executed
              </button>
            )}
          </div>
        )}

        {hasDist && event.distribution && (
          <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
            <h3 className="text-base font-bold text-text-primary mb-4">Distribution Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">Revenue Total</span><span className="font-medium">{formatUSDC(event.totalRevenue)} USDC</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Investor Pool ({event.revenueSharePercent}%)</span><span className="font-medium">{formatUSDC(investorPool)} USDC</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Total Distributed to Investors</span><span className="font-medium">{formatUSDC(event.distribution.totalDistributed)} USDC</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Lumio Fee</span><span className="font-medium">{formatUSDC(event.distribution.lumioFee)} USDC</span></div>
              <div className="flex justify-between border-t border-border pt-3"><span className="text-text-secondary">Your Payout (remaining + collateral)</span><span className="font-bold">{formatUSDC(event.distribution.organizerReceived)} USDC</span></div>
            </div>
          </div>
        )}

        <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
          <h3 className="text-base font-bold text-text-primary mb-3">Lumio Pay Link</h3>
          <p className="text-sm text-text-secondary mb-3">Share this link for ticket sales:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-bg-primary px-4 py-2.5 text-sm font-mono text-text-primary truncate">
              {payLink}
            </div>
            <button
              onClick={handleCopy}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-bg-primary transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-text-secondary" />}
            </button>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
          <h3 className="text-base font-bold text-text-primary mb-2">Investors</h3>
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Users className="h-4 w-4" /> {event.investorCount} investors (anonymized)
          </div>
        </div>
      </motion.div>
    </div>
  );
}
