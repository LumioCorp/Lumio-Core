"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Users, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import * as api from "@/lib/api";
import { events as mockEvents, myInvestments as mockInvestments } from "@/data/mock";
import type { LumioEvent, Investment } from "@/types";
import { formatUSDC, formatDate, fundingPercent, getCategoryGradient } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ProgressBar from "@/components/dashboard/ProgressBar";
import InvestmentPanel from "@/components/investor/InvestmentPanel";
import { cn } from "@/lib/utils";

export default function InvestorEventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [event, setEvent] = useState<LumioEvent | null>(
    () => mockEvents.find((e) => e.id === id) ?? null
  );
  const [investment, setInvestment] = useState<Investment | undefined>(
    () => mockInvestments.find((inv) => inv.eventId === id)
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchEvent() {
      try {
        const data = await api.getEventFull(id);

        if (cancelled) return;

        const mapped: LumioEvent = {
          id: data.id as string,
          name: data.name as string,
          description: (data.description as string) ?? "",
          category: (data.category as LumioEvent["category"]) ?? "other",
          location: (data.location as string) ?? "",
          imageUrl: (data.imageUrl as string) ?? "",
          organizer: {
            name: (data.organizerName as string) ?? (data.organizer as Record<string, unknown>)?.name as string ?? "",
            walletAddress: (data.organizerAddress as string) ?? (data.organizer as Record<string, unknown>)?.walletAddress as string ?? "",
            rating: Number((data.organizer as Record<string, unknown>)?.rating ?? 0),
            eventsCompleted: Number((data.organizer as Record<string, unknown>)?.eventsCompleted ?? 0),
          },
          eventDate: (data.eventDate as string) ?? "",
          fundingDeadline: (data.fundingDeadline as string) ?? "",
          liquidationDeadline: (data.liquidationDeadline as string) ?? "",
          fundingTarget: Number(data.fundingGoal ?? data.fundingTarget ?? 0),
          tokenSupply: Number(data.tokenSupply ?? 0),
          pricePerToken: Number(data.tokenPrice ?? data.pricePerToken ?? 0),
          revenueSharePercent: Number(data.revenueSharePct ?? data.revenueSharePercent ?? 0),
          lumioFeePercent: Number(data.lumioFeePercent ?? data.lumioFeePct ?? 5),
          collateralPercent: Number(data.collateralPercent ?? 0),
          collateralAmount: Number(data.collateralAmount ?? 0),
          maxPerWalletPercent: Number(data.maxPerWalletPercent ?? 10),
          status: (data.status as LumioEvent["status"]) ?? "DRAFT",
          totalFunded: Number(data.totalFunded ?? 0),
          tokensSold: Number(data.tokensSold ?? 0),
          investorCount: Number(data.investorCount ?? 0),
          totalRevenue: Number(data.totalRevenue ?? 0),
          ticketsSold: Number(data.ticketsSold ?? 0),
          ticketPrice: Number(data.ticketPrice ?? 0),
          escrowContractId: data.escrowContractId as string | undefined,
          escrowStatus: data.escrowStatus as string | undefined,
          organizerAddress: data.organizerAddress as string | undefined,
          assetCode: data.assetCode as string | undefined,
          distribution: data.distribution
            ? {
                totalDistributed: Number((data.distribution as Record<string, unknown>).totalDistributed ?? 0),
                lumioFee: Number((data.distribution as Record<string, unknown>).lumioFee ?? 0),
                organizerReceived: Number((data.distribution as Record<string, unknown>).organizerReceived ?? 0),
                payoutPerToken: Number((data.distribution as Record<string, unknown>).payoutPerToken ?? 0),
              }
            : undefined,
        };

        setEvent(mapped);

        // Map investment from the full response if it includes viewer investment data
        if (data.myInvestment) {
          const inv = data.myInvestment as Record<string, unknown>;
          setInvestment({
            eventId: id,
            eventName: mapped.name,
            tokensOwned: Number(inv.tokensOwned ?? inv.tokenAmount ?? 0),
            totalInvested: Number(inv.totalInvested ?? inv.usdcPaid ?? 0),
            status: mapped.status,
            estimatedPayout: Number(inv.estimatedPayout ?? 0),
            actualPayout: inv.actualPayout != null ? Number(inv.actualPayout) : undefined,
            roi: inv.roi != null ? Number(inv.roi) : undefined,
            purchaseDate: (inv.purchaseDate as string) ?? (inv.createdAt as string) ?? "",
            escrowFundingTxHash: inv.escrowFundingTxHash as string | undefined,
          });
        }
      } catch {
        // API unavailable — keep mock data that was set as initial state
      }
    }

    fetchEvent();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
  const hasRevenue = event.status === "LIVE" || event.status === "COMPLETED" || event.status === "CANCELLED";
  const hasDist = event.status === "COMPLETED" && event.distribution;

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
