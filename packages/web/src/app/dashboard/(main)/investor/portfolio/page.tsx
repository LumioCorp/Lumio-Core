"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Wallet, Activity, CheckCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useWallet } from "@/components/ui/WalletProvider";
import * as api from "@/lib/api";
import {
  myInvestments as mockInvestments,
  investorStats as mockInvestorStats,
} from "@/data/mock";
import type { Investment } from "@/types";
import { formatUSDC, formatDate } from "@/lib/utils";

export default function Portfolio() {
  const { address } = useWallet();

  const [investments, setInvestments] = useState<Investment[]>(mockInvestments);
  const [stats, setStats] = useState(mockInvestorStats);

  // TODO: Replace mock data with real API call once the backend exposes
  // a GET /api/investors/:address/investments endpoint.
  // The backend service `getInvestorInvestments(investorAddress)` exists
  // but is not yet wired to a route.
  useEffect(() => {
    if (!address) return;

    // Future implementation:
    // async function fetchPortfolio() {
    //   try {
    //     const data = await api.getInvestorInvestments(address);
    //     setInvestments(data);
    //     // Derive stats from real data:
    //     // setStats({
    //     //   totalInvested: data.reduce((s, i) => s + i.totalInvested, 0),
    //     //   activeInvestments: data.filter(i => !["COMPLETED","CANCELLED"].includes(i.status)).length,
    //     //   completedInvestments: data.filter(i => i.status === "COMPLETED").length,
    //     //   totalReturns: data.reduce((s, i) => s + (i.actualPayout ?? 0), 0),
    //     //   pendingReturns: data.filter(i => i.status !== "COMPLETED").reduce((s, i) => s + i.estimatedPayout, 0),
    //     // });
    //   } catch (err) {
    //     console.error("Failed to fetch investor portfolio, using mock data:", err);
    //   }
    // }
    // fetchPortfolio();
  }, [address]);

  const completedWithRoi = investments.filter((i) => i.roi !== undefined);
  const avgRoi = completedWithRoi.length > 0
    ? completedWithRoi.reduce((acc, i) => acc + (i.roi ?? 0), 0) / completedWithRoi.length
    : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-[var(--spacing-gap)] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} title="Total Invested" value="" numericValue={stats.totalInvested} prefix="$" suffix=" USDC" />
        <StatCard icon={Activity} title="Active Events" value="" numericValue={stats.activeInvestments} />
        <StatCard icon={CheckCircle} title="Completed" value="" numericValue={stats.completedInvestments} />
        <StatCard icon={TrendingUp} title="Avg ROI" value={avgRoi !== null ? `${avgRoi.toFixed(1)}%` : "---"} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-[var(--radius-card)] border border-border bg-bg-card shadow-card"
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-bold text-text-primary">All Investments</h2>
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
                <th className="px-6 py-3 font-medium">Actual Payout</th>
                <th className="px-6 py-3 font-medium">ROI</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.eventId} className="border-b border-border last:border-0 hover:bg-bg-primary/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/investor/event/${inv.eventId}`} className="font-medium text-text-primary hover:text-accent-blue">
                      {inv.eventName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{inv.tokensOwned}</td>
                  <td className="px-6 py-4 font-medium">{formatUSDC(inv.totalInvested)} USDC</td>
                  <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                  <td className="px-6 py-4">{formatUSDC(inv.estimatedPayout)} USDC</td>
                  <td className="px-6 py-4">{inv.actualPayout ? `${formatUSDC(inv.actualPayout)} USDC` : "---"}</td>
                  <td className="px-6 py-4">
                    {inv.roi !== undefined ? (
                      <span className={inv.roi >= 0 ? "text-success font-medium" : "text-danger font-medium"}>
                        {inv.roi >= 0 ? "+" : ""}{inv.roi.toFixed(1)}%
                      </span>
                    ) : "---"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{formatDate(inv.purchaseDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
