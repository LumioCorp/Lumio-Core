"use client";

import { cn } from "@/lib/utils";
import type { EventCategory, EventStatus } from "@/types";

const CATEGORIES: { value: EventCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gastronomy", label: "Gastronomy" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "culture", label: "Culture" },
];

const STATUSES: { value: EventStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "FUNDING_OPEN", label: "Funding Open" },
  { value: "FUNDED", label: "Funded" },
  { value: "COMPLETED", label: "Completed" },
];

interface FilterBarProps {
  activeCategory: string;
  activeStatus: string;
  onCategoryChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export default function FilterBar({ activeCategory, activeStatus, onCategoryChange, onStatusChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-6">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeCategory === cat.value
                ? "bg-dominant text-white"
                : "bg-bg-card border border-border text-text-secondary hover:text-text-primary"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((st) => (
          <button
            key={st.value}
            onClick={() => onStatusChange(st.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeStatus === st.value
                ? "bg-dominant text-white"
                : "bg-bg-card border border-border text-text-secondary hover:text-text-primary"
            )}
          >
            {st.label}
          </button>
        ))}
      </div>
    </div>
  );
}
