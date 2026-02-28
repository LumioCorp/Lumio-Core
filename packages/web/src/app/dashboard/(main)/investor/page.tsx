"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { investorStats, myInvestments, events } from "@/data/mock";
import { formatUSDC, formatDate } from "@/lib/utils";
import { ChartSparkline, ChartAreaInteractive } from "@/components/ui/Chart";
import { ChartPieDonut } from "@/components/ui/ChartDonut";
import { Progress } from "@/components/ui/Progress";
import type { EventStatus, Investment } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Datos de tendencia sintéticos — reemplazar por datos reales de la API
// ─────────────────────────────────────────────────────────────────────────────
const SPARKLINES = {
  totalInvested:     [{ value: 400 }, { value: 400 }, { value: 500 }, { value: 500 }, { value: 1_400 }, { value: 1_800 }],
  activeInvestments: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 3 }, { value: 3 }, { value: 3 }],
  totalReturns:      [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 349.2 }, { value: 349.2 }],
  pendingReturns:    [{ value: 450 }, { value: 450 }, { value: 450 }, { value: 1_050 }, { value: 1_436 }, { value: 1_436 }],
};

// Datos de portfolio con rangos de tiempo
const PORTFOLIO_CHART_DATA: Record<"7d" | "30d" | "90d", { date: string; value: number }[]> = {
  "7d": [
    { date: "Feb 18", value: 1_620 },
    { date: "Feb 19", value: 1_650 },
    { date: "Feb 20", value: 1_700 },
    { date: "Feb 21", value: 1_680 },
    { date: "Feb 22", value: 1_740 },
    { date: "Feb 24", value: 1_760 },
    { date: "Feb 25", value: 1_800 },
  ],
  "30d": [
    { date: "Jan 27", value: 400 },
    { date: "Feb 01", value: 500 },
    { date: "Feb 05", value: 500 },
    { date: "Feb 10", value: 1_000 },
    { date: "Feb 14", value: 1_400 },
    { date: "Feb 18", value: 1_620 },
    { date: "Feb 21", value: 1_740 },
    { date: "Feb 25", value: 1_800 },
  ],
  "90d": [
    { date: "Nov 25", value: 0 },
    { date: "Dec 08", value: 0 },
    { date: "Dec 22", value: 200 },
    { date: "Jan 05", value: 400 },
    { date: "Jan 19", value: 400 },
    { date: "Feb 02", value: 500 },
    { date: "Feb 09", value: 900 },
    { date: "Feb 14", value: 1_400 },
    { date: "Feb 18", value: 1_620 },
    { date: "Feb 21", value: 1_740 },
    { date: "Feb 25", value: 1_800 },
  ],
};

// Distribución del portfolio por estado para el donut
const PORTFOLIO_DONUT = [
  { name: "Funding Open",     value: 1_100, fill: "#3b82f6" },
  { name: "Upcoming Events",  value: 600,   fill: "#8b5cf6" },
  { name: "Live / Completed", value: 300,   fill: "#f59e0b" },
  { name: "Revenue Received", value: 400,   fill: "#10b981" },
];

type TimeRange = "7d" | "30d" | "90d";

// ─────────────────────────────────────────────────────────────────────────────
// Hook: cuenta progresiva con ease-out cúbico
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 960) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const STEPS = 40;
    const interval = duration / STEPS;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setVal(target * (1 - Math.pow(1 - i / STEPS, 3)));
      if (i >= STEPS) { clearInterval(id); setVal(target); }
    }, interval);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card — stat + Recharts sparkline + badge de tendencia
// ─────────────────────────────────────────────────────────────────────────────
interface KpiCardProps {
  uid: string;
  label: string;
  target: number;
  unit?: string;
  isInt?: boolean;
  sparkData: { value: number }[];
  color: string;
  trendLabel: string;
  trendUp: boolean;
  delay?: number;
}

function KpiCard({
  uid, label, target, unit, isInt = false,
  sparkData, color, trendLabel, trendUp, delay = 0,
}: KpiCardProps) {
  const raw = useCountUp(target);
  const display = isInt
    ? Math.round(raw).toLocaleString("en-US")
    : raw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#2E2832] bg-[#1E1820] p-5 shadow-sm"
    >
      {/* Etiqueta + badge de tendencia */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5A6068]">
          {label}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#252028] px-2 py-0.5 text-[10px] font-medium text-[#8B9298]">
          <ArrowUpRight className="h-2.5 w-2.5" />
          {trendLabel}
        </span>
      </div>

      {/* Valor principal */}
      <div className="flex items-baseline gap-1.5 mb-4">
        <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[2rem] font-bold leading-none tracking-tight text-[#FBFBFC] tabular-nums">
          {display}
        </span>
        {unit && (
          <span className="text-sm font-semibold text-[#5A6068] leading-none pb-0.5">
            {unit}
          </span>
        )}
      </div>

      {/* Recharts sparkline: se extiende hasta los bordes */}
      <div className="-mx-5 -mb-5 mt-auto">
        <ChartSparkline data={sparkData} color={color} uid={uid} />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Átomo de métrica — label + valor en pares compactos
// ─────────────────────────────────────────────────────────────────────────────
function Metric({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068] mb-0.5">
        {label}
      </p>
      <p className={`text-sm ${bold ? "font-bold text-[#FBFBFC]" : "font-semibold text-[#8B9298]"}`}>
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Investment Card — con Progress bar y h-full
// ─────────────────────────────────────────────────────────────────────────────
function InvestmentCard({ inv, index }: { inv: Investment; index: number }) {
  const event     = events.find((e) => e.id === inv.eventId);
  const fundedPct = event
    ? Math.round((event.totalFunded / event.fundingTarget) * 100)
    : 100;

  const isCompleted = inv.status === "distribution_executed";
  const roi         = inv.roi !== undefined
    ? inv.roi
    : ((inv.estimatedPayout - inv.totalInvested) / inv.totalInvested) * 100;
  const roiPositive = roi >= 0;

  const roiBg    = roiPositive
    ? (isCompleted ? "bg-emerald-500/15" : "bg-blue-500/15")
    : (isCompleted ? "bg-red-500/15"    : "bg-[#252028]");
  const roiColor = roiPositive
    ? (isCompleted ? "text-emerald-400" : "text-blue-400")
    : (isCompleted ? "text-red-400"     : "text-[#8B9298]");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.22 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link
        href={`/dashboard/investor/event/${inv.eventId}`}
        className="group flex h-full flex-col rounded-2xl border border-[#2E2832] bg-[#1E1820] p-5 shadow-sm transition-all duration-200 hover:border-[#444F55] hover:shadow-md"
      >
        {/* ── Cabecera ── */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[15px] font-semibold text-[#FBFBFC] transition-colors group-hover:text-dominant truncate">
              {inv.eventName}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={inv.status} />
              <span className="text-[11px] text-[#5A6068]">
                {formatDate(inv.purchaseDate)}
              </span>
            </div>
          </div>

          {/* Badge de ROI */}
          <div className={`shrink-0 rounded-[10px] px-3 py-2 text-right ${roiBg}`}>
            <p className={`font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-xl font-bold leading-none tabular-nums ${roiColor}`}>
              {roiPositive ? "+" : ""}{roi.toFixed(1)}%
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5A6068]">
              {isCompleted ? "ROI" : "Est. ROI"}
            </p>
          </div>
        </div>

        {/* ── Progress bar de fondeo ── */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#5A6068]">
              {inv.status === "funding_open" ? "Event funding" : "Funding complete"}
            </span>
            <span className="text-[11px] font-bold text-[#8B9298] tabular-nums">
              {fundedPct}%
            </span>
          </div>
          <Progress value={fundedPct} />
          {event && inv.status === "funding_open" && (
            <p className="text-[11px] text-[#5A6068] tabular-nums">
              ${formatUSDC(event.totalFunded)} of ${formatUSDC(event.fundingTarget)} USDC raised
            </p>
          )}
        </div>

        {/* ── Métricas clave ── */}
        <div className="grid grid-cols-3 gap-4 border-t border-[#252028] pt-4 mt-auto">
          <Metric label="Tokens" value={`${inv.tokensOwned}`} />
          <Metric label="Invested" value={`$${formatUSDC(inv.totalInvested)}`} bold />
          <Metric
            label={isCompleted ? "Received" : "Est. Payout"}
            value={`$${formatUSDC(isCompleted ? (inv.actualPayout ?? 0) : inv.estimatedPayout)}`}
          />
        </div>

        {/* ── Flecha hover ── */}
        <div className="mt-3 flex items-center justify-end gap-1 text-[11px] font-medium text-[#444F55] transition-colors group-hover:text-dominant">
          <span>View details</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed de actividad reciente
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVITY = [
  { type: "buy",     text: "Purchased 6 tokens of Craft Beer Fest Alajuela",  date: "Feb 28", amount: 600   },
  { type: "buy",     text: "Purchased 5 tokens of BurgerFest San José 2026",  date: "Feb 10", amount: 500   },
  { type: "receive", text: "Distribution from Festival de Tacos Cartago",      date: "Feb 01", amount: 349.2 },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function InvestorOverview() {
  const [range, setRange] = useState<TimeRange>("30d");

  return (
    <div className="space-y-8 pb-4">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          uid="invested"
          label="Total Invested"
          target={investorStats.totalInvested}
          unit="USDC"
          sparkData={SPARKLINES.totalInvested}
          color="#3b82f6"
          trendLabel="+$400 this month"
          trendUp
          delay={0}
        />
        <KpiCard
          uid="active"
          label="Backed Events"
          target={investorStats.activeInvestments}
          isInt
          sparkData={SPARKLINES.activeInvestments}
          color="#8b5cf6"
          trendLabel="Stable"
          trendUp={false}
          delay={0.06}
        />
        <KpiCard
          uid="returns"
          label="Total Returns"
          target={investorStats.totalReturns}
          unit="USDC"
          sparkData={SPARKLINES.totalReturns}
          color="#10b981"
          trendLabel="+$349 this cycle"
          trendUp
          delay={0.12}
        />
        <KpiCard
          uid="pending"
          label="Expected Revenue"
          target={investorStats.pendingReturns}
          unit="USDC"
          sparkData={SPARKLINES.pendingReturns}
          color="#f59e0b"
          trendLabel="+36% projected"
          trendUp
          delay={0.18}
        />
      </div>

      {/* ── My Investments ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-lg font-semibold text-[#FBFBFC]">
              My Investments
            </h2>
            <p className="mt-0.5 text-sm text-[#5A6068]">
              {myInvestments.length} positions · {myInvestments.filter(i => i.status !== "distribution_executed").length} active
            </p>
          </div>
          <Link
            href="/dashboard/investor/portfolio"
            className="inline-flex items-center gap-1 text-sm font-medium text-dominant transition-colors hover:text-dominant-hover"
          >
            Full portfolio
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {myInvestments.map((inv, i) => (
            <InvestmentCard key={inv.eventId} inv={inv} index={i} />
          ))}
        </div>
      </section>

      {/* ── Portfolio Overview ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Investment Growth chart — ocupa 2 columnas en lg */}
          <div className="rounded-2xl border border-[#2E2832] bg-[#1E1820] p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-base font-semibold text-[#FBFBFC]">
                  Investment Growth
                </h2>
                <p className="mt-0.5 text-[11px] text-[#5A6068]">Total value of your event investments</p>
              </div>

              {/* Time range tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-[#252028] p-1">
                {(["7d", "30d", "90d"] as TimeRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-lg px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] transition-all duration-150 ${
                      range === r
                        ? "bg-[#1E1820] text-[#FBFBFC] shadow-sm"
                        : "text-[#5A6068] hover:text-[#E8EDEE]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <ChartAreaInteractive
              data={PORTFOLIO_CHART_DATA[range]}
              color="#3b82f6"
              uid={`portfolio-${range}`}
            />
          </div>

          {/* Donut chart — Events by Stage */}
          <div className="rounded-2xl border border-[#2E2832] bg-[#1E1820] p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-base font-semibold text-[#FBFBFC]">
                Events by Stage
              </h2>
              <p className="mt-0.5 text-[11px] text-[#5A6068]">Where your USDC is allocated</p>
            </div>
            <ChartPieDonut data={PORTFOLIO_DONUT} />
          </div>
        </div>
      </motion.section>

      {/* ── Recent Activity ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-[#2E2832] bg-[#1E1820] p-6 shadow-sm"
      >
        <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] mb-5 text-base font-semibold text-[#FBFBFC]">
          Recent Activity
        </h2>

        <div className="relative">
          <div className="absolute left-[6px] top-2 bottom-3 w-px bg-[#252028]" />
          <div className="space-y-5">
            {ACTIVITY.map((item, i) => (
              <div key={i} className="relative flex items-start gap-4 pl-5">
                <div className="absolute left-0 top-[3px] h-[13px] w-[13px] rounded-full border-2 border-[#1E1820] bg-[#444F55] shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E8EDEE] leading-snug">{item.text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-[#5A6068]">{item.date}</span>
                    <span className="text-[11px] font-medium tabular-nums text-[#8B9298]">
                      {item.type === "receive" ? "+" : "−"}${formatUSDC(item.amount)} USDC
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

    </div>
  );
}
