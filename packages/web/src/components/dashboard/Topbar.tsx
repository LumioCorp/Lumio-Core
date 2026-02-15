"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { connectedWallet } from "@/data/mock";
import { formatUSDC } from "@/lib/utils";

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

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-bg-card px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg hover:bg-bg-primary">
          <Menu className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border bg-bg-primary px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-success" />
        <span className="text-sm font-medium text-text-primary">{connectedWallet.displayAddress}</span>
        <span className="text-sm text-text-secondary">{formatUSDC(connectedWallet.usdcBalance)} USDC</span>
      </div>
    </header>
  );
}
