import type { EventCategory, EventStatus } from "@/types";

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatUSDC(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getCategoryGradient(category: EventCategory): string {
  const gradients: Record<EventCategory, string> = {
    gastronomy: "from-amber-400 to-orange-500",
    music: "from-indigo-500 to-purple-600",
    sports: "from-green-400 to-teal-500",
    culture: "from-rose-400 to-pink-500",
    other: "from-slate-400 to-slate-500",
  };
  return gradients[category];
}

export function getStatusConfig(status: EventStatus): { label: string; color: string; bg: string } {
  const config: Record<EventStatus, { label: string; color: string; bg: string }> = {
    funding_open: { label: "Funding Open", color: "text-blue-400", bg: "bg-blue-500/15" },
    funding_successful: { label: "Funded", color: "text-green-400", bg: "bg-green-500/15" },
    event_executed: { label: "Event Executed", color: "text-amber-400", bg: "bg-amber-500/15" },
    liquidation_countdown: { label: "Liquidation", color: "text-orange-400", bg: "bg-orange-500/15" },
    distribution_executed: { label: "Completed", color: "text-green-400", bg: "bg-green-500/15" },
    cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/15" },
  };
  return config[status];
}

export function fundingPercent(funded: number, target: number): number {
  return Math.round((funded / target) * 100);
}
