"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { myDistributions } from "@/data/mock";
import { formatUSDC, formatDate } from "@/lib/utils";

export default function Distributions() {
  if (myDistributions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Inbox className="h-12 w-12 text-text-tertiary mb-3" />
        <p className="text-text-secondary">No distributions received yet.</p>
        <p className="mt-1 text-sm text-text-tertiary">
          Once an event you&apos;ve invested in completes its cycle, your payout will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[var(--radius-card)] border border-border bg-bg-card shadow-card"
    >
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-bold text-text-primary">Distribution History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="px-6 py-3 font-medium">Event</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Tokens Held</th>
              <th className="px-6 py-3 font-medium">Payout</th>
              <th className="px-6 py-3 font-medium">ROI</th>
            </tr>
          </thead>
          <tbody>
            {myDistributions.map((d) => (
              <tr key={d.eventId} className="border-b border-border last:border-0 hover:bg-bg-primary/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/dashboard/investor/event/${d.eventId}`} className="font-medium text-text-primary hover:text-accent-blue">
                    {d.eventName}
                  </Link>
                </td>
                <td className="px-6 py-4 text-text-secondary">{formatDate(d.date)}</td>
                <td className="px-6 py-4 text-text-secondary">{d.tokensHeld}</td>
                <td className="px-6 py-4 font-medium">{formatUSDC(d.payoutAmount)} USDC</td>
                <td className="px-6 py-4">
                  <span className={d.roi >= 0 ? "text-success font-medium" : "text-danger font-medium"}>
                    {d.roi >= 0 ? "+" : ""}{d.roi.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
