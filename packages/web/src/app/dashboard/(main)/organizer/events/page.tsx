"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { events, myOrganizedEvents } from "@/data/mock";
import { formatUSDC, formatDate, fundingPercent, getCategoryGradient } from "@/lib/utils";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ProgressBar from "@/components/dashboard/ProgressBar";

function actionLabel(status: string) {
  switch (status) {
    case "funding_open": return "View Details";
    case "event_executed": return "View Revenue";
    case "distribution_executed": return "View Summary";
    default: return "View";
  }
}

export default function OrganizerEvents() {
  const orgEvents = events.filter((e) => myOrganizedEvents.includes(e.id));

  return (
    <div className="space-y-6">
      {orgEvents.map((event, i) => {
        const pct = fundingPercent(event.totalFunded, event.fundingTarget);
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg-card shadow-card"
          >
            <div className={`relative h-24 bg-gradient-to-br ${getCategoryGradient(event.category)}`}>
              <Image
                src={event.imageUrl}
                alt={event.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{event.name}</h3>
                  <p className="text-sm text-text-secondary">{event.location} &middot; {formatDate(event.eventDate)}</p>
                </div>
                <StatusBadge status={event.status} size="lg" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-text-secondary">Funded</p>
                  <p className="font-medium">{formatUSDC(event.totalFunded)} USDC</p>
                </div>
                <div>
                  <p className="text-text-secondary">Investors</p>
                  <p className="font-medium">{event.investorCount}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Tokens Sold</p>
                  <p className="font-medium">{event.tokensSold} / {event.tokenSupply}</p>
                </div>
                {event.totalRevenue > 0 && (
                  <div>
                    <p className="text-text-secondary">Revenue</p>
                    <p className="font-medium">{formatUSDC(event.totalRevenue)} USDC</p>
                  </div>
                )}
              </div>

              {event.status === "funding_open" && (
                <div className="mt-4 max-w-md">
                  <ProgressBar value={pct} />
                  <span className="text-xs text-text-secondary mt-1 block">{pct}% funded</span>
                </div>
              )}

              <div className="mt-4">
                <Link
                  href={`/dashboard/organizer/event/${event.id}`}
                  className="inline-flex items-center rounded-[var(--radius-btn)] bg-dominant px-4 py-2 text-sm font-medium text-white hover:bg-dominant-hover transition-colors"
                >
                  {actionLabel(event.status)} &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
