"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { INVESTOR_NAV, ORGANIZER_NAV, BOTTOM_NAV } from "@/lib/constants";
import RoleSwitch from "./RoleSwitch";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isOrganizer = pathname.startsWith("/dashboard/organizer");
  const navItems = isOrganizer ? ORGANIZER_NAV : INVESTOR_NAV;

  const isActive = (href: string) => {
    if (href === "/dashboard/investor" || href === "/dashboard/organizer") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-[260px] flex-col border-r border-border bg-bg-card transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-6 pt-6 pb-4">
          <Link href="/" className="text-2xl font-bold tracking-wide text-dominant">
            Lumio
          </Link>
        </div>

        <div className="px-4 pb-4">
          <RoleSwitch />
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-l-[3px] border-dominant bg-blue-50/60 text-dominant"
                    : "border-l-[3px] border-transparent text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-2 py-3 space-y-1">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-colors"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
