"use client";

import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { useWallet } from "@/components/ui/WalletProvider";
import { formatUSDC } from "@/lib/utils";
import LumioLogo from "@/components/ui/LumioLogo";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/investor": "Overview",
  "/dashboard/investor/explore": "Explore Events",
  "/dashboard/investor/portfolio": "My Portfolio",
  "/dashboard/investor/distributions": "Distributions",
  "/dashboard/organizer": "Overview",
  "/dashboard/organizer/create": "Create Event",
  "/dashboard/organizer/events": "My Events",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.includes("/investor/event/")) return "Event Details";
  if (pathname.includes("/organizer/event/")) return "Event Details";
  return "Dashboard";
}

/**
 * Genera un gradiente CSS consistente a partir de la dirección de la wallet.
 * Determinístico: la misma dirección siempre produce el mismo gradiente.
 */
function getAvatarGradient(address: string): [string, string] {
  const palettes: [string, string][] = [
    ["#6366f1", "#818cf8"], // indigo
    ["#3b82f6", "#60a5fa"], // blue
    ["#10b981", "#34d399"], // emerald
    ["#f59e0b", "#fbbf24"], // amber
    ["#8b5cf6", "#a78bfa"], // violet
    ["#ec4899", "#f472b6"], // pink
  ];
  const hash = address
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

interface WalletBadgeProps {
  address: string;
  displayAddress: string;
  balance: number;
  onDisconnect: () => void;
}

function WalletBadge({ address, displayAddress, balance, onDisconnect }: WalletBadgeProps) {
  const [from, to] = getAvatarGradient(address);
  const initials = address.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2.5 rounded-[12px] border border-slate-200 bg-white px-3 py-2 shadow-sm transition-shadow hover:shadow-md">
      {/* Avatar con gradiente + status dot */}
      <div className="relative shrink-0">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-white"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <span
            className="text-[10px] font-bold leading-none"
            style={{ fontFamily: "var(--font-display, var(--font-dm-sans))" }}
          >
            {initials}
          </span>
        </div>
        {/* Pulso de estado conectado */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-[10px] w-[10px]">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-[10px] w-[10px] rounded-full bg-emerald-500 border-[1.5px] border-white" />
        </span>
      </div>

      {/* Dirección en monospace */}
      <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
        {displayAddress}
      </span>

      {/* Separador vertical */}
      <span className="h-4 w-px bg-slate-200" />

      {/* Balance USDC */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-semibold text-amber-500">◆</span>
        <span
          className="text-xs font-semibold text-slate-800 tabular-nums"
          style={{ fontFamily: "var(--font-display, var(--font-dm-sans))" }}
        >
          {formatUSDC(balance)}
        </span>
        <span className="text-[10px] font-medium text-slate-400 leading-none">
          USDC
        </span>
      </div>

      {/* Disconnect */}
      <button
        onClick={onDisconnect}
        className="ml-0.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="Disconnect wallet"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const { isConnected, address, displayAddress, usdcBalance, connect, disconnect } = useWallet();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Botón hamburguesa — solo mobile */}
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>

        {/* Logo en mobile (cuando sidebar está oculto) */}
        <LumioLogo size="sm" className="lg:hidden" />

        {/* Título de la página */}
        <h1
          className="hidden text-lg font-semibold text-slate-900 lg:block"
          style={{ fontFamily: "var(--font-display, var(--font-dm-sans))" }}
        >
          {title}
        </h1>
      </div>

      {isConnected && address ? (
        <WalletBadge
          address={address}
          displayAddress={displayAddress}
          balance={usdcBalance}
          onDisconnect={disconnect}
        />
      ) : (
        <button
          onClick={connect}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
        >
          Connect Wallet
        </button>
      )}
    </header>
  );
}
