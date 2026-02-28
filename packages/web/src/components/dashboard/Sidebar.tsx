"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { INVESTOR_NAV, ORGANIZER_NAV, BOTTOM_NAV } from "@/lib/constants";
import RoleSwitch from "./RoleSwitch";
import LumioLogo from "@/components/ui/LumioLogo";

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
      {/* ── Backdrop overlay (solo mobile) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Panel del Sidebar ── */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-[260px] flex-col bg-white",
          // Sombra lateral refinada como separador
          "shadow-[1px_0_0_0_#edf0f4,6px_0_24px_-6px_rgba(1,2,33,0.05)]",
          // Transición iOS-style con curva de desaceleración natural
          "will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Logo ── */}
        <div className="flex items-center border-b border-slate-100/80 px-5 pb-5 pt-6">
          <LumioLogo size="md" />
        </div>

        {/* ── Role Switch ── */}
        <div className="px-4 pb-3 pt-4">
          <RoleSwitch />
        </div>

        {/* ── Etiqueta de sección ── */}
        <div className="px-5 pb-2">
          <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isOrganizer ? "Organizer" : "Investor"}
          </span>
        </div>

        {/* ── Navegación principal ── */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-[2px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium",
                  "border-l-[3px] transition-all duration-150",
                  active
                    ? "border-dominant bg-dominant/[0.055] text-dominant"
                    : "border-transparent text-slate-500 hover:bg-slate-50/80 hover:text-slate-800"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                    active
                      ? "text-dominant"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                  strokeWidth={active ? 1.6 : 1.2}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Navegación inferior ── */}
        <div className="space-y-[2px] border-t border-slate-100 px-3 py-3">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-[10px] border-l-[3px] border-transparent px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:bg-slate-50/80 hover:text-slate-600"
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0 text-slate-300 transition-colors duration-150 group-hover:text-slate-500"
                  strokeWidth={1.2}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
