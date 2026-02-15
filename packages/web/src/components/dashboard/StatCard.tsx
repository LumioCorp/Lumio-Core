"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
}

export default function StatCard({ icon: Icon, title, value, numericValue, prefix = "", suffix = "" }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(numericValue !== undefined ? "0" : value);

  useEffect(() => {
    if (numericValue === undefined) return;

    const duration = 800;
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = numericValue * eased;

      if (Number.isInteger(numericValue)) {
        setDisplayValue(Math.round(val).toLocaleString("en-US"));
      } else {
        setDisplayValue(val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }

      if (current >= steps) {
        clearInterval(timer);
        if (Number.isInteger(numericValue)) {
          setDisplayValue(numericValue.toLocaleString("en-US"));
        } else {
          setDisplayValue(numericValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[var(--radius-card)] border border-border bg-bg-card p-[var(--spacing-card)] shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-primary">
          <Icon className="h-5 w-5 text-icon-default" />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-xl font-bold text-text-primary">
            {prefix}{displayValue}{suffix}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
