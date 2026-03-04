"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Wallet, Zap, CheckCircle2, Circle,
  ChevronDown, MapPin, CalendarDays,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatUSDC, getCategoryGradient } from "@/lib/utils";
import { useWallet } from "@/components/ui/WalletProvider";
import { useDeployEscrow } from "@/hooks/useEscrow";
import * as api from "@/lib/api";
import type { EventCategory } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline de creación en Stellar
// ─────────────────────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { label: "Generating Event Wallet",         detail: "Creating a dedicated Stellar address" },
  { label: "Deploying Trustless Work Escrow", detail: "Setting up on-chain escrow contract"  },
  { label: "Issuing Asset on Stellar",        detail: "Minting event tokens on Testnet"      },
] as const;

const STEP_DURATIONS = [950, 850, 700] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Categorías del evento
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "gastronomy", label: "Gastronomy" },
  { value: "music",      label: "Music"      },
  { value: "sports",     label: "Sports"     },
  { value: "culture",    label: "Culture"    },
  { value: "other",      label: "Other"      },
];

// ─────────────────────────────────────────────────────────────────────────────
// Estilos base de inputs — dark theme
// ─────────────────────────────────────────────────────────────────────────────
const inputBase =
  "w-full rounded-xl border border-[#2E2832] bg-[#252028] px-3.5 py-2.5 text-sm text-[#E8EDEE] " +
  "placeholder:text-[#5A6068] focus:border-accent-blue/50 focus:outline-none focus:ring-2 " +
  "focus:ring-accent-blue/10 transition-colors duration-150";

const labelBase = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#5A6068]";

// ─────────────────────────────────────────────────────────────────────────────
// Encabezado de sección numerado
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-[11px] font-bold text-accent-blue">
        {n}
      </div>
      <div>
        <h3 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-sm font-semibold text-[#FBFBFC]">
          {title}
        </h3>
        {subtitle && <p className="text-[11px] text-[#5A6068]">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Preview Card
// ─────────────────────────────────────────────────────────────────────────────
interface PreviewProps {
  name: string;
  category: EventCategory;
  location: string;
  eventDate: string;
  fundingTarget: number;
  pricePerToken: number;
  tokenSupply: number;
  revenueSharePercent: number;
}

function LivePreviewCard({
  name, category, location, eventDate,
  fundingTarget, pricePerToken, tokenSupply, revenueSharePercent,
}: PreviewProps) {
  const gradient  = getCategoryGradient(category);
  const hasName   = name.trim().length > 0;
  const hasLoc    = location.trim().length > 0;
  const displayDate = eventDate
    ? new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="sticky top-24">
      {/* Label con pulsito live */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5A6068]">
          Live Preview
        </span>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2E2832] bg-[#1E1820] shadow-sm">
        {/* Barra de color de categoría */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

        <div className="p-5">
          {/* Nombre + badge de estado */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={`font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[15px] font-semibold truncate transition-colors ${
                  hasName ? "text-[#FBFBFC]" : "italic text-[#444F55]"
                }`}
              >
                {hasName ? name : "Your Event Name"}
              </h3>
              <p className="mt-0.5 text-[11px] text-[#5A6068] truncate">
                {hasLoc ? location : "Location"} · {displayDate}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-[10px] font-bold text-blue-400">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
              </span>
              Funding
            </span>
          </div>

          {/* Barra de fondeo */}
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#5A6068]">Funding progress</span>
              <span className="text-[11px] font-bold text-[#8B9298]">0%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#252028]">
              <div className="h-full w-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
            </div>
            <p className="text-[11px] text-[#5A6068] tabular-nums">
              $0 of ${formatUSDC(fundingTarget)} USDC target
            </p>
          </div>

          {/* Métricas clave */}
          <div className="grid grid-cols-3 gap-4 border-t border-[#252028] pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068] mb-0.5">Target</p>
              <p className="text-sm font-bold text-[#FBFBFC]">${formatUSDC(fundingTarget)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068] mb-0.5">Per Token</p>
              <p className="text-sm font-semibold text-[#8B9298]">${pricePerToken}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068] mb-0.5">Supply</p>
              <p className="text-sm font-semibold text-[#8B9298]">{tokenSupply || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue share note */}
      <div className="mt-3 rounded-xl border border-[#2E2832] bg-[#1E1820] px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[11px] font-medium text-[#5A6068]">Investor revenue share</span>
          <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-base font-bold text-accent-blue">
            {revenueSharePercent}%
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-medium text-[#444F55]">
        ⬡ Powered by Stellar Testnet
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de pipeline de creación
// ─────────────────────────────────────────────────────────────────────────────
type SubmitState = "idle" | "processing" | "success";

interface PipelineModalProps {
  submitState: SubmitState;
  activeStep: number;
  completedSteps: number[];
}

function PipelineModal({ submitState, activeStep, completedSteps }: PipelineModalProps) {
  return (
    <AnimatePresence>
      {(submitState === "processing" || submitState === "success") && (
        <motion.div
          key="pipeline-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-3xl border border-[#2E2832] bg-[#1E1820] p-8 shadow-xl"
          >
            {submitState === "processing" ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue/10">
                    <Wallet className="h-5 w-5 text-accent-blue" />
                  </div>
                  <h3 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-lg font-bold text-[#FBFBFC]">
                    Creating Your Event
                  </h3>
                  <p className="mt-1 text-sm text-[#8B9298]">
                    Setting up on Stellar Testnet…
                  </p>
                </div>

                <div className="space-y-4">
                  {PIPELINE_STEPS.map((step, i) => {
                    const isDone   = completedSteps.includes(i);
                    const isActive = activeStep === i;

                    return (
                      <div key={i} className="flex items-start gap-3.5">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                          {isDone ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            </motion.div>
                          ) : isActive ? (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                              className="inline-block h-4 w-4 rounded-full border-2 border-accent-blue/20 border-t-accent-blue"
                            />
                          ) : (
                            <Circle className="h-4 w-4 text-[#444F55]" strokeWidth={1.5} />
                          )}
                        </div>

                        <div>
                          <p
                            className={`text-sm font-semibold transition-colors duration-200 ${
                              isDone   ? "text-emerald-400" :
                              isActive ? "text-[#FBFBFC]"   :
                                         "text-[#444F55]"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p
                            className={`text-[11px] transition-colors duration-200 ${
                              isActive ? "text-[#8B9298]" : "text-[#444F55]"
                            }`}
                          >
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </motion.div>
                <h3 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-xl font-bold text-[#FBFBFC]">
                  Event Created!
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8B9298]">
                  Your event wallet and escrow are live on Stellar Testnet.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateEventForm() {
  const { showToast } = useToast();
  const { address } = useWallet();
  const { deploy } = useDeployEscrow();

  const [name,                setName]                = useState("My New Event");
  const [description,         setDescription]         = useState("An exciting event powered by Lumio.");
  const [category,            setCategory]            = useState<EventCategory>("gastronomy");
  const [location,            setLocation]            = useState("San José, Costa Rica");
  const [eventDate,           setEventDate]           = useState("2026-06-15");
  const [fundingTarget,       setFundingTarget]       = useState(5_000);
  const [pricePerToken,       setPricePerToken]       = useState(100);
  const [revenueSharePercent, setRevenueSharePercent] = useState(30);

  const [submitState,    setSubmitState]    = useState<SubmitState>("idle");
  const [activeStep,     setActiveStep]     = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const computed = useMemo(() => {
    const tokenSupply      = pricePerToken > 0 ? Math.floor(fundingTarget / pricePerToken) : 0;
    const collateralAmount = fundingTarget * 0.15;
    const maxPerWallet     = Math.floor(tokenSupply * 0.4);

    const evDate = new Date(eventDate);

    const fundingDeadline = new Date(evDate);
    fundingDeadline.setDate(fundingDeadline.getDate() - 14);

    const liquidationDeadline = new Date(evDate);
    liquidationDeadline.setDate(liquidationDeadline.getDate() + 7);

    return {
      tokenSupply,
      collateralAmount,
      maxPerWallet,
      fundingDeadline:      fundingDeadline.toISOString().split("T")[0],
      liquidationDeadline:  liquidationDeadline.toISOString().split("T")[0],
    };
  }, [fundingTarget, pricePerToken, eventDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      showToast("Please connect your wallet first");
      return;
    }

    setSubmitState("processing");
    setCompletedSteps([]);
    setActiveStep(0);

    try {
      // Step 1: Create event + token issuer wallet in backend
      const organizerUser = await api.createEvent({
        name,
        description,
        fundingGoal: fundingTarget,
        tokenPrice: pricePerToken,
        revenueSharePct: revenueSharePercent,
        organizerId: address,
        organizerAddress: address,
        category,
        location,
        eventDate,
        fundingDeadline: computed.fundingDeadline,
        ticketPrice: 15,
      });
      const eventId = (organizerUser as Record<string, unknown>).id as string;

      // Initialize token issuer wallet
      await api.initializeTokenIssuer(eventId);

      setCompletedSteps([0]);
      setActiveStep(1);

      // Step 2: Deploy TW escrow (frontend signs XDR)
      await deploy(eventId);

      setCompletedSteps([0, 1]);
      setActiveStep(2);

      // Step 3: Fund wallet + setup asset + open funding
      await api.fundWallet(eventId);
      await api.setupAsset(eventId);
      await api.openFunding(eventId);

      setCompletedSteps([0, 1, 2]);
      setActiveStep(-1);
      setSubmitState("success");

      setTimeout(() => {
        setSubmitState("idle");
        setCompletedSteps([]);
        showToast(`"${name || "Event"}" created successfully!`);
      }, 1_300);
    } catch (err) {
      setSubmitState("idle");
      setCompletedSteps([]);
      setActiveStep(-1);
      showToast(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <>
      <PipelineModal
        submitState={submitState}
        activeStep={activeStep}
        completedSteps={completedSteps}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-start">

          {/* COLUMNA IZQUIERDA — Secciones del formulario */}
          <div className="space-y-5">

            {/* Sección 1: Básico */}
            <div className="rounded-2xl border border-[#2E2832] bg-[#1E1820] p-6 shadow-sm">
              <SectionHeader
                n={1}
                title="Basic Info"
                subtitle="Name, category, and location"
              />

              <div className="space-y-4">
                <div>
                  <label className={labelBase}>Event Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. BurgerFest San José 2026"
                    className={inputBase}
                    required
                  />
                </div>

                <div>
                  <label className={labelBase}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Tell investors what makes this event special…"
                    className={`${inputBase} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Category</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as EventCategory)}
                        className={`${inputBase} appearance-none pr-9`}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6068]" />
                    </div>
                  </div>

                  <div>
                    <label className={labelBase}>Event Date</label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5A6068]" />
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className={`${inputBase} pl-9`}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Location</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5A6068]" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Venue name, City"
                      className={`${inputBase} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Cover Image</label>
                  <div className="flex h-[72px] cursor-not-allowed flex-col items-center justify-center rounded-xl border border-dashed border-[#2E2832] bg-[#252028]">
                    <p className="text-sm font-medium text-[#5A6068]">Upload image</p>
                    <p className="text-[11px] text-[#444F55]">Demo only — not functional</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2: Financiero */}
            <div className="rounded-2xl border border-[#2E2832] bg-[#1E1820] p-6 shadow-sm">
              <SectionHeader
                n={2}
                title="Financial Setup"
                subtitle="Funding target, token price, and investor share"
              />

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Funding Target (USDC)</label>
                    <div className="relative">
                      <DollarSign className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5A6068]" />
                      <input
                        type="number"
                        value={fundingTarget}
                        onChange={(e) => setFundingTarget(Number(e.target.value))}
                        min={100}
                        className={`${inputBase} pl-9`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelBase}>Price per Token (USDC)</label>
                    <div className="relative">
                      <DollarSign className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5A6068]" />
                      <input
                        type="number"
                        value={pricePerToken}
                        onChange={(e) => setPricePerToken(Number(e.target.value))}
                        min={1}
                        className={`${inputBase} pl-9`}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className={labelBase}>Revenue Share</label>
                    <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-base font-bold text-accent-blue">
                      {revenueSharePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    step={1}
                    value={revenueSharePercent}
                    onChange={(e) => setRevenueSharePercent(Number(e.target.value))}
                    className="w-full cursor-pointer accent-accent-blue"
                  />
                  <div className="mt-1.5 flex justify-between text-[10px] text-[#5A6068]">
                    <span>10%</span>
                    <span className="text-center">Investors receive {revenueSharePercent}% of ticket revenue</span>
                    <span>50%</span>
                  </div>
                </div>

                <div className="rounded-xl bg-[#252028] p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068]">
                    Auto-computed Parameters
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                    {[
                      { label: "Token Supply",       value: `${computed.tokenSupply}` },
                      { label: "Collateral (15%)",   value: `${formatUSDC(computed.collateralAmount)} USDC` },
                      { label: "Max per Wallet",     value: `${computed.maxPerWallet} tokens` },
                      { label: "Lumio Fee",          value: "3% + 2% dist" },
                      { label: "Funding Deadline",   value: computed.fundingDeadline, mono: true },
                      { label: "Liquidation",        value: computed.liquidationDeadline, mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#8B9298]">{label}</span>
                        <span className={`text-[11px] font-semibold text-[#E8EDEE] ${mono ? "font-mono" : ""}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 3: Stellar Setup */}
            <div className="rounded-2xl border border-[#2E2832] bg-[#1E1820] p-6 shadow-sm">
              <SectionHeader
                n={3}
                title="Stellar Setup"
                subtitle="On-chain event infrastructure"
              />

              <div className="flex items-start gap-3 rounded-xl border border-accent-blue/10 bg-accent-blue/[0.06] px-4 py-4">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" strokeWidth={2} />
                <div>
                  <p className="text-sm font-bold text-accent-blue">Dedicated Event Wallet</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#8B9298]">
                    Upon creation, Lumio generates a unique Stellar address for this event.
                    All investments flow through a trustless escrow — funds stay locked until
                    distribution is executed by the organizer.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {["AUTH_REVOCABLE", "AUTH_CLAWBACK", "Stellar Testnet"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#2E2832] bg-[#252028] px-2.5 py-1 font-mono text-[10px] font-medium text-[#5A6068]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Botón de submit */}
            <div>
              <motion.button
                type="submit"
                disabled={submitState !== "idle"}
                whileHover={submitState === "idle" ? { scale: 1.01 } : {}}
                whileTap={submitState === "idle" ? { scale: 0.98 } : {}}
                className="relative w-full overflow-hidden rounded-full bg-gradient-to-r from-accent-blue to-blue-400 py-[14px] text-sm font-bold text-white shadow-md shadow-accent-blue/20 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
                  animate={{ x: ["-130%", "230%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 2.2 }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" />
                  Create Event &amp; Deposit Collateral
                </span>
              </motion.button>
              <p className="mt-2.5 text-center text-[11px] leading-relaxed text-[#5A6068]">
                Requires depositing{" "}
                <span className="font-semibold text-[#8B9298]">{formatUSDC(computed.collateralAmount)} USDC</span>{" "}
                as collateral · Funds returned after distribution
              </p>
            </div>
          </div>

          {/* COLUMNA DERECHA — Live Preview Card (sticky) */}
          <LivePreviewCard
            name={name}
            category={category}
            location={location}
            eventDate={eventDate}
            fundingTarget={fundingTarget}
            pricePerToken={pricePerToken}
            tokenSupply={computed.tokenSupply}
            revenueSharePercent={revenueSharePercent}
          />

        </div>
      </form>
    </>
  );
}
