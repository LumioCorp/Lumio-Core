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
  gastronomy: "bg-amber-100 text-amber-700",
  music: "bg-indigo-100 text-indigo-700",
  sports: "bg-green-100 text-green-700",
  culture: "bg-rose-100 text-rose-700",
  other: "bg-slate-100 text-slate-700",
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  funding_open: { label: "Funding Open", color: "text-blue-700", bg: "bg-blue-100" },
  funding_successful: { label: "Funded", color: "text-green-700", bg: "bg-green-100" },
  event_executed: { label: "Event Executed", color: "text-amber-700", bg: "bg-amber-100" },
  liquidation_countdown: { label: "Liquidation", color: "text-orange-700", bg: "bg-orange-100" },
  distribution_executed: { label: "Completed", color: "text-green-700", bg: "bg-green-100" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-100" },
};
