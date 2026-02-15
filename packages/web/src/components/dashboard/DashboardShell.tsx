"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastProvider } from "@/components/ui/Toast";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg-primary">
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
