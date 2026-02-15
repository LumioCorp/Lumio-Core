"use client";

import Link from "next/link";
import { TrendingUp, Activity, ArrowDownToLine, Clock } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { investorStats, myInvestments } from "@/data/mock";
import { formatUSDC, formatDate } from "@/lib/utils";

const activity = [
  { text: "Purchased 5 tokens of BurgerFest San José 2026", date: "Feb 10", amount: null },
  { text: "Distribution received from Festival de Tacos Cartago", date: "Feb 1", amount: 349.2 },
  { text: "Purchased 6 tokens of Craft Beer Fest Alajuela", date: "Feb 28", amount: null },
];

export default function InvestorOverview() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-[var(--spacing-gap)] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} title="Total Invested" value="" numericValue={investorStats.totalInvested} prefix="$" suffix=" USDC" />
        <StatCard icon={Activity} title="Active Investments" value="" numericValue={investorStats.activeInvestments} />
        <StatCard icon={ArrowDownToLine} title="Total Returns" value="" numericValue={investorStats.totalReturns} prefix="$" suffix=" USDC" />
        <StatCard icon={Clock} title="Pending Returns" value="" numericValue={investorStats.pendingReturns} prefix="$" suffix=" USDC" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-[var(--radius-card)] border border-border bg-bg-card shadow-card"
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-bold text-text-primary">Active Investments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-6 py-3 font-medium">Event</th>
                <th className="px-6 py-3 font-medium">Tokens</th>
                <th className="px-6 py-3 font-medium">Invested</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Est. Payout</th>
              </tr>
            </thead>
            <tbody>
              {myInvestments.map((inv) => (
                <tr key={inv.eventId} className="border-b border-border last:border-0 hover:bg-bg-primary/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/investor/event/${inv.eventId}`} className="font-medium text-text-primary hover:text-accent-blue">
                      {inv.eventName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{inv.tokensOwned}</td>
                  <td className="px-6 py-4 text-text-primary font-medium">{formatUSDC(inv.totalInvested)} USDC</td>
                  <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                  <td className="px-6 py-4 text-text-primary">{formatUSDC(inv.estimatedPayout)} USDC</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          {activity.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-accent-blue shrink-0" />
              <div>
                <p className="text-sm text-text-primary">{item.text}</p>
                <p className="text-xs text-text-secondary">
                  {item.date}
                  {item.amount != null && ` — $${formatUSDC(item.amount)} USDC`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
