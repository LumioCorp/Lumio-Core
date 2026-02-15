"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function RoleSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const isOrganizer = pathname.startsWith("/dashboard/organizer");

  return (
    <div className="flex rounded-lg bg-bg-primary p-1">
      <button
        onClick={() => router.push("/dashboard/investor")}
        className={cn(
          "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          !isOrganizer ? "bg-dominant text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
        )}
      >
        Investor
      </button>
      <button
        onClick={() => router.push("/dashboard/organizer")}
        className={cn(
          "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          isOrganizer ? "bg-dominant text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
        )}
      >
        Organizer
      </button>
    </div>
  );
}
