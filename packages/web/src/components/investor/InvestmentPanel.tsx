"use client";

import { useState } from "react";
import { Minus, Plus, Zap, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LumioEvent, Investment } from "@/types";
import { formatUSDC } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

// ─── Opciones de selección rápida de porcentaje ───────────────────────────
const PCT_OPTIONS = [
  { label: "25%", pct: 0.25 },
  { label: "50%", pct: 0.50 },
  { label: "Max", pct: 1.00 },
] as const;

// ─── Separador estilo perforación de ticket ───────────────────────────────
function Perforation() {
  return <div className="my-5 border-t border-dashed border-[#2E2832]" />;
}

// ─── Par label-valor estilo recibo ────────────────────────────────────────
function ReceiptRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#5A6068]">
        {label}
      </span>
      <span className={`text-sm font-semibold text-[#E8EDEE] tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Footer con verificación Stellar ─────────────────────────────────────
function StellarFooter() {
  return (
    <div className="border-t border-[#252028] px-6 py-3">
      <p className="text-center text-[10px] font-medium text-[#444F55]">
        ⬡ Verified on Stellar Testnet
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
interface InvestmentPanelProps {
  event: LumioEvent;
  investment?: Investment;
}

export default function InvestmentPanel({ event, investment }: InvestmentPanelProps) {
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [signing, setSigning] = useState(false);

  const maxTokens = Math.floor(event.tokenSupply * (event.maxPerWalletPercent / 100));
  const remaining = event.tokenSupply - event.tokensSold;
  const maxBuy    = Math.min(maxTokens, remaining);

  const handleBuy = () => {
    setSigning(true);
    setTimeout(() => {
      setSigning(false);
      showToast(`Successfully purchased ${quantity} token${quantity !== 1 ? "s" : ""}!`);
    }, 1_300);
  };

  // ── ESTADO 1: distribution_executed — Recibo de pago final ───────────────
  if (event.status === "distribution_executed" && investment) {
    const roi         = investment.roi ?? 0;
    const roiPositive = roi >= 0;

    return (
      <div className="overflow-hidden rounded-3xl border border-[#2E2832] bg-[#1E1820] shadow-sm">
        {/* Cabecera del ticket */}
        <div className="px-6 pb-4 pt-6">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A6068]">
              Investment Receipt
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Payout Complete
            </span>
          </div>
          <p className="mt-1 truncate text-[15px] font-semibold text-[#FBFBFC]">
            {event.name}
          </p>
        </div>

        <Perforation />

        {/* ROI */}
        <div className="px-6 pb-4 text-center">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5A6068]">
            Final Return on Investment
          </p>
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className={`font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[3.25rem] font-bold leading-none tabular-nums ${
                roiPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {roiPositive ? "+" : ""}
              {roi.toFixed(1)}%
            </span>
          </motion.div>
          <p className="mt-1.5 text-xs text-[#8B9298]">
            from {formatUSDC(investment.totalInvested)} USDC invested
          </p>
        </div>

        <Perforation />

        {/* Filas de recibo */}
        <div className="space-y-0.5 px-6 pb-5">
          <ReceiptRow label="Tokens Held"    value={`${investment.tokensOwned}`} />
          <ReceiptRow label="Invested"       value={`${formatUSDC(investment.totalInvested)} USDC`} />
          <ReceiptRow
            label="Payout Received"
            value={`${formatUSDC(investment.actualPayout ?? 0)} USDC`}
            valueClass="text-emerald-400 font-bold"
          />
        </div>

        <StellarFooter />
      </div>
    );
  }

  // ── ESTADO 2: funding_successful / event_executed — Posición activa ───────
  if (
    (event.status === "funding_successful" || event.status === "event_executed") &&
    investment
  ) {
    const isLive = event.status === "event_executed";

    return (
      <div className="overflow-hidden rounded-3xl border border-[#2E2832] bg-[#1E1820] shadow-sm">
        {/* Cabecera */}
        <div className="px-6 pb-4 pt-6">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A6068]">
              Your Position
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                isLive
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-emerald-500/15 text-emerald-400"
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                    isLive ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isLive ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
              </span>
              {isLive ? "Event Live" : "Goal Reached"}
            </span>
          </div>
          <p className="mt-1 truncate text-[15px] font-semibold text-[#FBFBFC]">
            {event.name}
          </p>
        </div>

        <Perforation />

        {/* Filas de recibo */}
        <div className="space-y-0.5 px-6 pb-5">
          <ReceiptRow label="Tokens Owned"   value={`${investment.tokensOwned}`} />
          <ReceiptRow label="Amount Invested" value={`${formatUSDC(investment.totalInvested)} USDC`} />
          <ReceiptRow
            label="Est. Payout"
            value={`${formatUSDC(investment.estimatedPayout)} USDC`}
            valueClass="font-bold text-accent-blue"
          />
          <ReceiptRow
            label="Status"
            value={event.status.replace(/_/g, " ")}
          />
        </div>

        <Perforation />

        {/* Aviso de estado */}
        <div className="px-6 pb-5">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#252028] px-4 py-3">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A6068]" />
            <p className="text-xs font-medium leading-relaxed text-[#8B9298]">
              {isLive
                ? "Event is live. Revenue is being collected. Distribution will follow."
                : "Fully funded. Awaiting event execution and revenue collection."}
            </p>
          </div>
        </div>

        <StellarFooter />
      </div>
    );
  }

  // ── ESTADO 3: funding_open — Formulario de inversión ──────────────────────
  if (event.status === "funding_open") {
    const total = quantity * event.pricePerToken;

    return (
      <div className="overflow-hidden rounded-3xl border border-[#2E2832] bg-[#1E1820] shadow-sm">
        {/* Cabecera */}
        <div className="px-6 pb-4 pt-6">
          <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A6068]">
            Invest in this Event
          </span>
          <p className="mt-1 truncate text-[15px] font-semibold text-[#FBFBFC]">
            {event.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5A6068]">
            <span className="font-semibold text-[#E8EDEE]">{event.pricePerToken} USDC</span>
            <span aria-hidden>·</span>
            <span>per token</span>
            <span aria-hidden>·</span>
            <span>{remaining} of {event.tokenSupply} remaining</span>
          </div>
        </div>

        <Perforation />

        {/* Selector de cantidad */}
        <div className="px-6 pb-4">
          <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068]">
            Token Quantity
          </label>

          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2E2832] text-[#E8EDEE] transition-colors hover:border-[#444F55] hover:bg-[#252028] disabled:opacity-30"
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} />
            </motion.button>

            <div className="flex flex-col items-center gap-0.5">
              <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] w-16 text-center text-[2.75rem] font-bold leading-none tabular-nums text-[#FBFBFC]">
                {quantity}
              </span>
              <span className="text-[10px] font-semibold text-[#5A6068]">
                {quantity === 1 ? "token" : "tokens"}
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setQuantity(q => Math.min(maxBuy, q + 1))}
              disabled={quantity >= maxBuy}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2E2832] text-[#E8EDEE] transition-colors hover:border-[#444F55] hover:bg-[#252028] disabled:opacity-30"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Botones de selección rápida */}
          <div className="mt-4 flex gap-2">
            {PCT_OPTIONS.map(({ label, pct }) => {
              const tokens = Math.max(1, Math.floor(maxBuy * pct));
              const active = quantity === tokens;
              return (
                <motion.button
                  key={label}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setQuantity(tokens)}
                  className={`flex-1 rounded-full py-1.5 text-[11px] font-bold transition-all duration-150 ${
                    active
                      ? "bg-accent-blue text-white shadow-sm"
                      : "border border-[#2E2832] text-[#8B9298] hover:border-[#444F55] hover:text-[#E8EDEE]"
                  }`}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <Perforation />

        {/* Total */}
        <div className="px-6 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068]">
              Total Cost
            </span>
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={total}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[1.75rem] font-bold leading-none tabular-nums text-[#FBFBFC]"
                >
                  {formatUSDC(total)}
                </motion.span>
              </AnimatePresence>
              <span className="pb-0.5 text-sm font-semibold text-[#5A6068]">USDC</span>
            </div>
          </div>
        </div>

        {/* Botón Buy */}
        <div className="px-6 pb-6">
          <motion.button
            onClick={handleBuy}
            disabled={signing}
            whileHover={signing ? {} : { scale: 1.015 }}
            whileTap={signing ? {} : { scale: 0.975 }}
            className="relative w-full overflow-hidden rounded-full bg-accent-blue py-[14px] text-sm font-bold text-white shadow-lg shadow-accent-blue/20 transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
          >
            {!signing && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
                animate={{ x: ["-130%", "230%"] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 2.0,
                }}
              />
            )}

            <span className="relative flex items-center justify-center gap-2">
              <AnimatePresence mode="wait" initial={false}>
                {signing ? (
                  <motion.span
                    key="signing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-white/25 border-t-white"
                    />
                    Signing on Stellar...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Buy {quantity} Token{quantity !== 1 ? "s" : ""}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-[#5A6068]">
            Revenue share only. Not equity or ownership.
          </p>
        </div>
      </div>
    );
  }

  // ── ESTADO 4: default — Evento no disponible para inversión ───────────────
  return (
    <div className="overflow-hidden rounded-3xl border border-[#2E2832] bg-[#1E1820] p-6 shadow-sm">
      <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[10px] font-bold uppercase tracking-[0.15em] text-[#5A6068]">
        Investment
      </span>
      <Perforation />
      <p className="text-sm text-[#8B9298]">
        This event is not currently open for investment.
      </p>
    </div>
  );
}
