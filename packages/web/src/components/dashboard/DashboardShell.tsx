"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { useWallet } from "@/components/ui/WalletProvider";
import LumioLogo from "@/components/ui/LumioLogo";

function ConnectWalletScreen() {
  const { isLoading, connect } = useWallet();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#18121A]">
      <div className="flex max-w-sm flex-col items-center text-center">
        <LumioLogo size="lg" />

        <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#2E2832] bg-[#1E1820]">
          <Wallet className="h-7 w-7 text-[#5A6068]" strokeWidth={1.2} />
        </div>

        <h1 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-[#FBFBFC]">
          Connect your wallet to continue
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#8B9298]">
          Lumio requires a Stellar wallet to view your portfolio, invest in events, and manage your account.
        </p>

        <button
          onClick={() => connect()}
          disabled={isLoading}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-blue-400 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-[#3B82F6]/20 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Wallet className="h-4 w-4" strokeWidth={1.5} />
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </button>

        <Link
          href="/"
          className="mt-4 text-sm text-[#8B9298] transition-colors hover:text-[#FBFBFC]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <ConnectWalletScreen />;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-app-grid">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-[260px]">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 lg:p-[var(--spacing-page)]">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
