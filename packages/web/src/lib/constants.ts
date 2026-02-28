import {
  LayoutDashboard,
  Compass,
  Briefcase,
  ArrowDownToLine,
  PlusCircle,
  CalendarDays,
  CreditCard,
  Settings,
} from "lucide-react";

export const INVESTOR_NAV = [
  { label: "Overview", href: "/dashboard/investor", icon: LayoutDashboard },
  { label: "Explore Events", href: "/dashboard/investor/explore", icon: Compass },
  { label: "My Portfolio", href: "/dashboard/investor/portfolio", icon: Briefcase },
  { label: "Distributions", href: "/dashboard/investor/distributions", icon: ArrowDownToLine },
];

export const ORGANIZER_NAV = [
  { label: "Overview", href: "/dashboard/organizer", icon: LayoutDashboard },
  { label: "Create Event", href: "/dashboard/organizer/create", icon: PlusCircle },
  { label: "My Events", href: "/dashboard/organizer/events", icon: CalendarDays },
];

export const BOTTOM_NAV = [
  { label: "Lumio Pay", href: "/dashboard/pay/evt-001", icon: CreditCard },
  { label: "Settings", href: "#", icon: Settings },
];

export const CATEGORY_COLORS: Record<string, string> = {
  gastronomy: "bg-amber-500/15 text-amber-400",
  music: "bg-indigo-500/15 text-indigo-400",
  sports: "bg-green-500/15 text-green-400",
  culture: "bg-rose-500/15 text-rose-400",
  other: "bg-slate-500/15 text-slate-400",
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  funding_open: { label: "Funding Open", color: "text-blue-400", bg: "bg-blue-500/15" },
  funding_successful: { label: "Funded", color: "text-green-400", bg: "bg-green-500/15" },
  event_executed: { label: "Event Executed", color: "text-amber-400", bg: "bg-amber-500/15" },
  liquidation_countdown: { label: "Liquidation", color: "text-orange-400", bg: "bg-orange-500/15" },
  distribution_executed: { label: "Completed", color: "text-green-400", bg: "bg-green-500/15" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/15" },
};
