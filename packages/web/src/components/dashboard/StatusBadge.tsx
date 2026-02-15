import type { EventStatus } from "@/types";
import { getStatusConfig } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status, size = "sm" }: { status: EventStatus; size?: "sm" | "lg" }) {
  const config = getStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bg,
        config.color,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {config.label}
    </span>
  );
}
