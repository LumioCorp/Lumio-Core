"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Users, Coins, Percent } from "lucide-react";
import type { LumioEvent } from "@/types";
import { getCategoryGradient, fundingPercent, formatUSDC, formatDate, cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

interface EventCardProps {
  event: LumioEvent;
  href: string;
  index?: number;
}

export default function EventCard({ event, href, index = 0 }: EventCardProps) {
  const pct = fundingPercent(event.totalFunded, event.fundingTarget);
  const muted = event.status === "distribution_executed" || event.status === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={href} className="block">
        <div
          className={cn(
            "group overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg-card shadow-card transition-shadow hover:shadow-elevated",
            muted && "opacity-75"
          )}
        >
          <div className={`relative h-36 bg-gradient-to-br ${getCategoryGradient(event.category)}`}>
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <span
              className={cn(
                "absolute top-3 left-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                CATEGORY_COLORS[event.category]
              )}
            >
              {event.category}
            </span>
          </div>

          <div className="p-5">
            <h3 className="text-base font-bold text-text-primary group-hover:text-dominant-hover transition-colors">
              {event.name}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {event.location} &middot; {formatDate(event.eventDate)}
            </p>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                <span>{pct}% funded</span>
                <span>{formatUSDC(event.totalFunded)} / {formatUSDC(event.fundingTarget)} USDC</span>
              </div>
              <ProgressBar value={pct} />
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Percent className="h-3.5 w-3.5" />
                {event.revenueSharePercent}%
              </span>
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" />
                {event.pricePerToken} USDC
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event.investorCount}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span>{event.organizer.name}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{event.organizer.rating}</span>
              </div>
              <StatusBadge status={event.status} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
