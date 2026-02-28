"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Wallet, ChevronDown } from "lucide-react";
import Image from "next/image";
import LumioLogo from "@/components/ui/LumioLogo";
import { useWallet } from "@/components/ui/WalletProvider";

// ─── Botón "Connect Wallet" — navbar ─────────────────────────────────────────
function ConnectWalletButton() {
  const { isConnected, isLoading, displayAddress, connect } = useWallet();
  const router = useRouter();

  const handleClick = async () => {
    if (isConnected) {
      router.push("/dashboard/investor");
      return;
    }
    const addr = await connect();
    if (addr) {
      router.push("/dashboard/investor");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-full border border-[#2E2832] bg-[#1E1820] px-3.5 py-2 shadow-sm transition-all hover:border-[#444F55] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] disabled:opacity-60"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#252028]">
        <Wallet className="h-3.5 w-3.5 text-[#5A6068]" strokeWidth={1.2} />
      </div>
      <span className="hidden text-sm font-medium tracking-[-0.01em] text-[#E8EDEE] sm:block">
        {isLoading ? "Connecting..." : isConnected ? displayAddress : "Connect Wallet"}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Hero() {
  return (
    <div className="bg-[#18121A]">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#2E2832]/80 bg-[#18121A]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <LumioLogo size="md" />

          <div className="hidden items-center gap-7 md:flex">
            <Link
              href="/explore"
              className="text-sm font-medium tracking-[-0.01em] text-[#8B9298] transition-colors hover:text-[#FBFBFC]"
            >
              Explore Events
            </Link>
          </div>

          <ConnectWalletButton />
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[90vh] items-center overflow-hidden px-6"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% -5%, rgba(59,130,246,0.10) 0%, #18121A 65%)",
        }}
      >
        <div className="mx-auto w-full max-w-6xl py-20 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">

            {/* ── Left: Text Content ── */}
            <div className="text-center lg:text-left">

              {/* Eyebrow badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2E2832] bg-[#1E1820] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8B9298] shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live on Stellar Testnet
                </span>
              </motion.div>

              {/* H1 */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-7 font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#FBFBFC] sm:text-[3.5rem]"
              >
                Launch your event.
                <br />
                Fund your vision.
                <br />
                <span className="text-[#5A6068]">On Stellar.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto mt-6 max-w-md text-[1.0625rem] leading-relaxed tracking-[-0.01em] text-[#8B9298] lg:mx-0"
              >
                Lumio tokenizes real-world events so anyone can invest and share the revenue.
              </motion.p>

              {/* CTAs — rounded-full */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
              >
                <Link
                  href="/explore"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-dominant to-blue-400 px-7 py-[13px] text-sm font-semibold tracking-[-0.01em] text-white shadow-md shadow-dominant/20 transition-opacity hover:opacity-90"
                >
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
                    animate={{ x: ["-130%", "230%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                  />
                  <span className="relative">Explore Events</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                </Link>
              </motion.div>
            </div>

            {/* ── Right: Floating Images ── */}
            {/* ── Right: Floating Images ── */}
            <div className="relative hidden h-[600px] lg:block">
              {/* Image 1 — top-left, large */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 top-0 z-10 w-[400px] overflow-hidden rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.50)]"
              >
                <Image
                  src="/concierto.webp"
                  alt="Live concert event"
                  width={400}
                  height={280}
                  className="h-[280px] w-full object-cover"
                />
              </motion.div>

              {/* Image 2 — center-right, overlapping */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-[170px] z-20 w-[380px] overflow-hidden rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.50)]"
              >
                <Image
                  src="/conferencia.webp"
                  alt="Conference event"
                  width={380}
                  height={260}
                  className="h-[260px] w-full object-cover"
                />
              </motion.div>

              {/* Image 3 — bottom-left, overlapping */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-0 left-[10px] z-30 w-[360px] overflow-hidden rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.50)]"
              >
                <Image
                  src="/conferencia2.jpeg"
                  alt="Conference event"
                  width={360}
                  height={250}
                  className="h-[250px] w-full object-cover"
                />
              </motion.div>

              {/* Glow behind images */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
                }}
              />
            </div>

          </div>

          {/* ── Trust badges — centradas, debajo de ambas columnas ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
          >
            {["Trustless Escrow", "All-or-Nothing", "On-Chain Revenue"].map((badge, i) => (
              <span
                key={badge}
                className="flex items-center gap-2 text-[11px] tracking-[0.04em] text-[#5A6068]"
              >
                {i > 0 && <span className="h-px w-3 bg-[#2E2832]" />}
                {badge}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5 text-[#444F55]" strokeWidth={1.2} />
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
