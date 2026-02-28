"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { events } from "@/data/mock";
import { formatUSDC, formatDate } from "@/lib/utils";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import LumioLogo from "@/components/ui/LumioLogo";

function PayContent({ id }: { id: string }) {
  const event = events.find((e) => e.id === id);
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [paying, setPaying] = useState(false);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-slate-500">Event not found.</p>
          <Link href="/" className="mt-2 block text-sm text-dominant hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const total = quantity * event.ticketPrice;

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      showToast(`Payment of ${formatUSDC(total)} USDC confirmed!`);
    }, 1_400);
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(ellipse 100% 60% at 50% -5%, rgba(219,234,254,0.35) 0%, white 65%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <LumioLogo size="md" />
          </Link>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_32px_-8px_rgba(1,2,33,0.10)]"
        >
          {/* Header */}
          <div className="border-b border-slate-50 px-6 pb-5 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Ticket Purchase
            </p>
            <h1 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
              {event.name}
            </h1>
            <p className="mt-0.5 text-[12px] text-slate-400">
              {formatDate(event.eventDate)} · {event.location}
            </p>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-5">
            {/* Price per ticket */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Ticket Price
              </span>
              <span className="font-semibold tabular-nums text-slate-800">
                {event.ticketPrice} USDC
              </span>
            </div>

            {/* Quantity selector */}
            <div>
              <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Quantity
              </label>
              <div className="flex items-center justify-between">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" strokeWidth={2.5} />
                </motion.button>

                <div className="flex flex-col items-center">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={quantity}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[2.5rem] font-bold leading-none tabular-nums text-slate-900"
                    >
                      {quantity}
                    </motion.span>
                  </AnimatePresence>
                  <span className="mt-0.5 text-[10px] font-semibold text-slate-400">
                    {quantity === 1 ? "ticket" : "tickets"}
                  </span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Total
              </span>
              <div className="flex items-baseline gap-1">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={total}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-xl font-bold tabular-nums text-slate-900"
                  >
                    {formatUSDC(total)}
                  </motion.span>
                </AnimatePresence>
                <span className="text-sm font-semibold text-slate-400">USDC</span>
              </div>
            </div>
          </div>

          {/* Pay button */}
          <div className="px-6 pb-6">
            <motion.button
              onClick={handlePay}
              disabled={paying}
              whileHover={paying ? {} : { scale: 1.015 }}
              whileTap={paying ? {} : { scale: 0.975 }}
              className="relative w-full overflow-hidden rounded-full bg-gradient-to-r from-dominant to-blue-400 py-[14px] text-sm font-bold text-white shadow-md shadow-dominant/20 transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
            >
              {!paying && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
                  animate={{ x: ["-130%", "230%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 2.2 }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                <AnimatePresence mode="wait" initial={false}>
                  {paying ? (
                    <motion.span
                      key="paying"
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
                      Processing on Stellar...
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
                      Pay {formatUSDC(total)} USDC
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
              Payment processed on Stellar network
            </p>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-slate-300">Powered by Lumio</p>
      </div>
    </div>
  );
}

export default function LumioPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ToastProvider>
      <PayContent id={id} />
    </ToastProvider>
  );
}
