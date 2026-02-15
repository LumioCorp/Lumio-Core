"use client";

import Link from "next/link";
import { CalendarDays, Activity, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ProgressBar from "@/components/dashboard/ProgressBar";
import { organizerStats, events, myOrganizedEvents } from "@/data/mock";
import { formatUSDC, fundingPercent } from "@/lib/utils";

export default function OrganizerOverview() {
  const orgEvents = events.filter((e) => myOrganizedEvents.includes(e.id));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-[var(--spacing-gap)] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} title="Events Created" value="" numericValue={organizerStats.totalEventsCreated} />
        <StatCard icon={Activity} title="Active Events" value="" numericValue={organizerStats.activeEvents} />
        <StatCard icon={TrendingUp} title="Total Funds Raised" value="" numericValue={organizerStats.totalFundsRaised} prefix="$" suffix=" USDC" />
        <StatCard icon={DollarSign} title="Total Revenue" value="" numericValue={organizerStats.totalRevenue} prefix="$" suffix=" USDC" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card"
      >
        <h2 className="text-base font-bold text-text-primary mb-4">My Events</h2>
        <div className="space-y-4">
          {orgEvents.map((event) => {
            const pct = fundingPercent(event.totalFunded, event.fundingTarget);
            return (
              <Link
                key={event.id}
                href={`/dashboard/organizer/event/${event.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:shadow-elevated transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-text-primary truncate">{event.name}</h3>
                    <StatusBadge status={event.status} />
                  </div>
                  {event.status === "funding_open" && (
                    <div className="mt-1 max-w-xs">
                      <ProgressBar value={pct} />
                      <span className="text-xs text-text-secondary mt-0.5 block">{pct}% funded</span>
                    </div>
                  )}
                  {(event.status === "event_executed" || event.status === "distribution_executed") && (
                    <p className="text-sm text-text-secondary">Revenue: {formatUSDC(event.totalRevenue)} USDC</p>
                  )}
                </div>
                <div className="text-sm text-text-secondary ml-4">
                  {event.investorCount} investors &middot; {event.tokensSold} tokens sold
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card"
      >
        <h2 className="text-base font-bold text-text-primary mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-accent-blue shrink-0" />
            <div>
              <p className="text-sm text-text-primary">BurgerFest San José 2026 — Funding at 64%</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-success shrink-0" />
            <div>
              <p className="text-sm text-text-primary">Festival de Tacos Cartago — Distribution completed. $12,000 revenue.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
