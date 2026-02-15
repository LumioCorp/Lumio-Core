"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Users, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { events, myInvestments } from "@/data/mock";
import { formatUSDC, formatDate, fundingPercent, getCategoryGradient } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ProgressBar from "@/components/dashboard/ProgressBar";
import InvestmentPanel from "@/components/investor/InvestmentPanel";
import { cn } from "@/lib/utils";

export default function InvestorEventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = events.find((e) => e.id === id);
  const investment = myInvestments.find((inv) => inv.eventId === id);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-secondary">Event not found.</p>
        <Link href="/dashboard/investor/explore" className="mt-2 text-sm text-accent-blue hover:underline">
          Back to Explore
        </Link>
      </div>
    );
  }

  const pct = fundingPercent(event.totalFunded, event.fundingTarget);
  const hasRevenue = event.status === "event_executed" || event.status === "distribution_executed" || event.status === "liquidation_countdown";
  const hasDist = event.status === "distribution_executed" && event.distribution;

  const projectedPayoutPerToken = hasRevenue && event.tokenSupply > 0
    ? ((event.totalRevenue * (event.revenueSharePercent / 100)) * (1 - event.lumioFeePercent / 100)) / event.tokenSupply
    : 0;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/investor/explore" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to Explore
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className={`relative h-48 overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br ${getCategoryGradient(event.category)}`}>
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", CATEGORY_COLORS[event.category])}>
                {event.category}
              </span>
              <StatusBadge status={event.status} size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">{event.name}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(event.eventDate)}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
              <span>{event.organizer.name}</span>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{event.organizer.rating}</span>
              <span className="text-text-tertiary">({event.organizer.eventsCompleted} events)</span>
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
            <h3 className="text-base font-bold text-text-primary mb-3">Description</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{event.description}</p>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
            <h3 className="text-base font-bold text-text-primary mb-4">Financial Parameters</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">Funding Target</span><span className="font-medium">{formatUSDC(event.fundingTarget)} USDC</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Token Supply</span><span className="font-medium">{event.tokenSupply}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Price per Token</span><span className="font-medium">{event.pricePerToken} USDC</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Revenue Share</span><span className="font-medium">{event.revenueSharePercent}%</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Collateral</span><span className="font-medium">{formatUSDC(event.collateralAmount)} USDC ({event.collateralPercent}%)</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Lumio Fee</span><span className="font-medium">{event.lumioFeePercent}%</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Max per Wallet</span><span className="font-medium">{event.maxPerWalletPercent}%</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Funding Deadline</span><span className="font-medium">{formatDate(event.fundingDeadline)}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Liquidation Deadline</span><span className="font-medium">{formatDate(event.liquidationDeadline)}</span></div>
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
            <h3 className="text-base font-bold text-text-primary mb-4">Funding Progress</h3>
            <ProgressBar value={pct} />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-text-secondary">{formatUSDC(event.totalFunded)} / {formatUSDC(event.fundingTarget)} USDC</span>
              <span className="font-medium text-text-primary">{pct}%</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
              <Users className="h-4 w-4" />
              {event.investorCount} investors
            </div>
          </div>

          {hasRevenue && (
            <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
              <h3 className="text-base font-bold text-text-primary mb-4">Revenue</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Revenue Collected</span><span className="font-medium">{formatUSDC(event.totalRevenue)} USDC</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Tickets Sold</span><span className="font-medium">{event.ticketsSold}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Projected Payout per Token</span><span className="font-medium">{formatUSDC(projectedPayoutPerToken)} USDC</span></div>
              </div>
            </div>
          )}

          {hasDist && event.distribution && (
            <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card">
              <h3 className="text-base font-bold text-text-primary mb-4">Distribution</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Total Distributed</span><span className="font-medium">{formatUSDC(event.distribution.totalDistributed)} USDC</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Payout per Token</span><span className="font-medium">{formatUSDC(event.distribution.payoutPerToken)} USDC</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Lumio Fee</span><span className="font-medium">{formatUSDC(event.distribution.lumioFee)} USDC</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Organizer Received</span><span className="font-medium">{formatUSDC(event.distribution.organizerReceived)} USDC</span></div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-6">
            <InvestmentPanel event={event} investment={investment} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
