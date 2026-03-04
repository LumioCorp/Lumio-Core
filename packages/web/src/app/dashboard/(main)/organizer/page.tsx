"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Plus, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { organizerStats as mockOrganizerStats, events as mockEvents, myOrganizedEvents as mockMyOrganizedEvents } from "@/data/mock";
import { formatUSDC, formatDate } from "@/lib/utils";
import { ChartSparkline, ChartAreaInteractive } from "@/components/ui/Chart";
import { ChartPieDonut } from "@/components/ui/ChartDonut";
import { Progress } from "@/components/ui/Progress";
import type { EventStatus, LumioEvent } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Datos de tendencia sintéticos — reemplazar por datos reales de la API
// ─────────────────────────────────────────────────────────────────────────────
const SPARKLINES = {
  totalRaised:  [{ value: 0 }, { value: 0 }, { value: 3_200 }, { value: 4_000 }, { value: 7_200 }, { value: 9_000 }],
  activeEvents: [{ value: 0 }, { value: 1 }, { value: 1 }, { value: 2 }, { value: 2 }, { value: 1 }],
  ticketsSold:  [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 600 }, { value: 600 }],
  totalRevenue: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 12_000 }, { value: 12_000 }],
};

// Datos de fondos recaudados con rangos de tiempo
const FUNDS_CHART_DATA: Record<"7d" | "30d" | "90d", { date: string; value: number }[]> = {
  "7d": [
    { date: "Feb 18", value: 8_200 },
    { date: "Feb 19", value: 8_400 },
    { date: "Feb 20", value: 8_700 },
    { date: "Feb 21", value: 8_700 },
    { date: "Feb 22", value: 8_900 },
    { date: "Feb 24", value: 9_000 },
    { date: "Feb 25", value: 9_000 },
  ],
  "30d": [
    { date: "Jan 27", value: 3_200 },
    { date: "Feb 01", value: 4_000 },
    { date: "Feb 05", value: 5_500 },
    { date: "Feb 10", value: 6_800 },
    { date: "Feb 14", value: 7_200 },
    { date: "Feb 18", value: 8_200 },
    { date: "Feb 21", value: 8_700 },
    { date: "Feb 25", value: 9_000 },
  ],
  "90d": [
    { date: "Nov 25", value: 0 },
    { date: "Dec 08", value: 0 },
    { date: "Dec 22", value: 1_000 },
    { date: "Jan 05", value: 2_000 },
    { date: "Jan 19", value: 3_200 },
    { date: "Feb 02", value: 4_000 },
    { date: "Feb 09", value: 6_000 },
    { date: "Feb 14", value: 7_200 },
    { date: "Feb 18", value: 8_200 },
    { date: "Feb 21", value: 8_700 },
    { date: "Feb 25", value: 9_000 },
  ],
};

// Distribución de eventos por estado para el donut
const EVENTS_DONUT = [
  { name: "Funding Open",  value: 3_800, fill: "#3b82f6" },
  { name: "Funded",        value: 5_200, fill: "#8b5cf6" },
  { name: "Completed",     value: 9_000, fill: "#10b981" },
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
// Etiquetas y estilos operativos por estado del evento
// ─────────────────────────────────────────────────────────────────────────────
const OPERATIONAL_LABELS: Record<EventStatus, string> = {
  DRAFT:           "Draft",
  ESCROW_DEPLOYED: "Escrow Ready",
  FUNDING_OPEN:    "Funding",
  FUNDED:          "Ready to Execute",
  LIVE:            "Event Live",
  CANCELLED:       "Cancelled",
  COMPLETED:       "Completed",
};

const STATUS_STYLES: Record<EventStatus, { bg: string; text: string; pulse?: string }> = {
  DRAFT:           { bg: "bg-slate-500/15",   text: "text-slate-400"                          },
  ESCROW_DEPLOYED: { bg: "bg-cyan-500/15",    text: "text-cyan-400",    pulse: "bg-cyan-400"  },
  FUNDING_OPEN:    { bg: "bg-blue-500/15",    text: "text-blue-400",    pulse: "bg-blue-400"  },
  FUNDED:          { bg: "bg-violet-500/15",  text: "text-violet-400",  pulse: "bg-violet-400"},
  LIVE:            { bg: "bg-amber-500/15",   text: "text-amber-400",   pulse: "bg-amber-400" },
  CANCELLED:       { bg: "bg-red-500/15",     text: "text-red-400"                            },
  COMPLETED:       { bg: "bg-emerald-500/15", text: "text-emerald-400"                        },
};

// ─────────────────────────────────────────────────────────────────────────────
// Organizer Event Card — con Progress bar y h-full
// ─────────────────────────────────────────────────────────────────────────────
function OrganizerEventCard({ event, index }: { event: LumioEvent; index: number }) {
  const fundedPct   = Math.round((event.totalFunded / event.fundingTarget) * 100);
  const label       = OPERATIONAL_LABELS[event.status];
  const style       = STATUS_STYLES[event.status];
  const hasPulse    = !!style.pulse;

  const isFunding   = event.status === "FUNDING_OPEN";
  const isFunded    = event.status === "FUNDED";
  const isLive      = event.status === "LIVE";
  const isCompleted = event.status === "COMPLETED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.22 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link
        href={`/dashboard/organizer/event/${event.id}`}
        className="group flex h-full flex-col rounded-2xl border border-[#2E2832] bg-[#1E1820] p-5 shadow-sm transition-all duration-200 hover:border-[#444F55] hover:shadow-md"
      >
        {/* ── Cabecera ── */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[15px] font-semibold text-[#FBFBFC] transition-colors group-hover:text-dominant truncate">
              {event.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-[#5A6068] truncate">
              {event.location} · {formatDate(event.eventDate)}
            </p>
          </div>

          {/* Badge de estado operativo con pulso */}
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${style.bg} ${style.text}`}
          >
            {hasPulse ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${style.pulse}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${style.pulse}`} />
              </span>
            ) : (
              <span className={`h-2 w-2 rounded-full ${isCompleted ? "bg-emerald-400" : "bg-[#444F55]"}`} />
            )}
            {label}
          </span>
        </div>

        {/* ── Progreso de fondeo con Progress component ── */}
        {isFunding && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#5A6068]">Funding progress</span>
              <span className="text-[11px] font-bold text-[#8B9298] tabular-nums">{fundedPct}%</span>
            </div>
            <Progress value={fundedPct} />
            <p className="text-[11px] text-[#5A6068] tabular-nums">
              ${formatUSDC(event.totalFunded)} of ${formatUSDC(event.fundingTarget)} USDC raised
            </p>
          </div>
        )}

        {/* ── Fondeo completado, listo para ejecutar ── */}
        {isFunded && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-violet-500/15 px-4 py-3">
            <Zap className="h-4 w-4 shrink-0 text-violet-400" strokeWidth={2.2} />
            <div>
              <p className="text-xs font-bold text-violet-400">
                Fully funded — ready to go live
              </p>
              <p className="mt-0.5 text-[11px] text-violet-400">
                ${formatUSDC(event.totalFunded)} raised · {event.investorCount} investors on board
              </p>
            </div>
          </div>
        )}

        {/* ── Revenue — para event_executed y distribution_executed ── */}
        {(isLive || isCompleted) && (
          <div className="mb-4 rounded-xl bg-[#252028] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068]">
                {isCompleted ? "Total Revenue" : "Revenue Collected"}
              </span>
              <span
                className={`font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-lg font-bold tabular-nums ${
                  isCompleted ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                ${formatUSDC(event.totalRevenue)} USDC
              </span>
            </div>
            {isCompleted && event.distribution && (
              <p className="mt-1 text-[11px] text-[#5A6068]">
                You received ${formatUSDC(event.distribution.organizerReceived)} · {event.investorCount} investors paid out
              </p>
            )}
          </div>
        )}

        {/* ── Métricas clave ── */}
        <div className="grid grid-cols-3 gap-4 border-t border-[#252028] pt-4 mt-auto">
          <Metric label="Investors"   value={`${event.investorCount}`} />
          <Metric label="Tokens Sold" value={`${event.tokensSold}`} bold />
          <Metric
            label={isCompleted ? "Tickets Sold" : "Target"}
            value={isCompleted
              ? `${event.ticketsSold.toLocaleString("en-US")}`
              : `$${formatUSDC(event.fundingTarget)}`
            }
          />
        </div>

        {/* ── Hover indicator ── */}
        <div className="mt-3 flex items-center justify-end gap-1 text-[11px] font-medium text-[#444F55] transition-colors group-hover:text-dominant">
          <span>Manage event</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed de actividad reciente — perspectiva organizador
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVITY = [
  {
    type: "distribution",
    text: "Festival de Tacos Cartago — Distribution sent to 15 investors",
    date: "Feb 01",
    amount: 3_492,
  },
  {
    type: "revenue",
    text: "Festival de Tacos Cartago — Revenue collected: $12,000 USDC",
    date: "Jan 26",
    amount: 12_000,
  },
  {
    type: "funding",
    text: "BurgerFest San José 2026 — Investor #8 joined the campaign",
    date: "Feb 10",
    amount: 100,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function OrganizerOverview() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [orgStats, setOrgStats] = useState(mockOrganizerStats);
  const [orgEvents, setOrgEvents] = useState(() => mockEvents.filter((e) => mockMyOrganizedEvents.includes(e.id)));

  const totalTickets = orgEvents.reduce((sum, e) => sum + e.ticketsSold, 0);

  return (
    <div className="space-y-8 pb-4">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          uid="org-raised"
          label="Total Raised"
          target={orgStats.totalFundsRaised}
          unit="USDC"
          sparkData={SPARKLINES.totalRaised}
          color="#3b82f6"
          trendLabel="+$6k this cycle"
          trendUp
          delay={0}
        />
        <KpiCard
          uid="org-active"
          label="Active Events"
          target={orgStats.activeEvents}
          isInt
          sparkData={SPARKLINES.activeEvents}
          color="#8b5cf6"
          trendLabel="1 in progress"
          trendUp
          delay={0.06}
        />
        <KpiCard
          uid="org-tickets"
          label="Tickets Sold"
          target={totalTickets}
          isInt
          sparkData={SPARKLINES.ticketsSold}
          color="#10b981"
          trendLabel="600 total"
          trendUp
          delay={0.12}
        />
        <KpiCard
          uid="org-revenue"
          label="Total Revenue"
          target={orgStats.totalRevenue}
          unit="USDC"
          sparkData={SPARKLINES.totalRevenue}
          color="#f59e0b"
          trendLabel="From events"
          trendUp
          delay={0.18}
        />
      </div>

      {/* ── Funds Overview ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Funds Raised chart — ocupa 2 columnas en lg */}
          <div className="rounded-2xl border border-[#2E2832] bg-[#1E1820] p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-base font-semibold text-[#FBFBFC]">
                  Funds Raised
                </h2>
                <p className="mt-0.5 text-[11px] text-[#5A6068]">USDC raised across all events</p>
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
              data={FUNDS_CHART_DATA[range]}
              color="#3b82f6"
              uid={`funds-${range}`}
            />
          </div>

          {/* Donut chart — Events by Status */}
          <div className="rounded-2xl border border-[#2E2832] bg-[#1E1820] p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-base font-semibold text-[#FBFBFC]">
                Events by Status
              </h2>
              <p className="mt-0.5 text-[11px] text-[#5A6068]">USDC by lifecycle stage</p>
            </div>
            <ChartPieDonut data={EVENTS_DONUT} />
          </div>
        </div>
      </motion.section>

      {/* ── My Events ── */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-lg font-semibold text-[#FBFBFC]">
              My Events
            </h2>
            <p className="mt-0.5 text-sm text-[#5A6068]">
              {orgEvents.length} event{orgEvents.length !== 1 ? "s" : ""} · {orgStats.activeEvents} active
            </p>
          </div>

          {/* ── Botón destacado Create New Event ── */}
          <Link
            href="/dashboard/organizer/create"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-dominant to-blue-400 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-dominant/20 transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-dominant/30"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Create New Event
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {orgEvents.map((event, i) => (
            <OrganizerEventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      </section>

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
          <div className="absolute left-[6px] top-2 bottom-3 w-px bg-[#2E2832]" />
          <div className="space-y-5">
            {ACTIVITY.map((item, i) => (
              <div key={i} className="relative flex items-start gap-4 pl-5">
                <div className="absolute left-0 top-[3px] h-[13px] w-[13px] rounded-full border-2 border-[#1E1820] bg-[#444F55] shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E8EDEE] leading-snug">{item.text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-[#5A6068]">{item.date}</span>
                    <span className="text-[11px] font-medium tabular-nums text-[#8B9298]">
                      +${formatUSDC(item.amount)} USDC
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
