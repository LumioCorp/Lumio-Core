"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TooltipPayload {
  value?: number;
  name?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ChartSparkline — Sparkline ligero para KPI cards (sin ejes ni grid)
// ─────────────────────────────────────────────────────────────────────────────
interface SparklineProps {
  data: { value: number }[];
  color: string;
  uid?: string;
}

export function ChartSparkline({ data, color, uid = "spark" }: SparklineProps) {
  const gradientId = `spark-gradient-${uid}`;
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="natural"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={false}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip — dark style
// ─────────────────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-[#2E2832] bg-[#252028] px-3 py-2 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6068] mb-0.5">
        {label}
      </p>
      <p className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-sm font-bold text-[#FBFBFC] tabular-nums">
        ${value.toLocaleString("en-US", { minimumFractionDigits: 0 })}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChartAreaInteractive — gráfica de área completa con ejes y tooltip
// ─────────────────────────────────────────────────────────────────────────────
interface AreaInteractiveProps {
  data: { date: string; value: number }[];
  color?: string;
  dataKey?: string;
  uid?: string;
}

export function ChartAreaInteractive({
  data,
  color = "#3b82f6",
  dataKey = "value",
  uid = "area",
}: AreaInteractiveProps) {
  const gradientId = `area-gradient-${uid}`;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#2E2832"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "#5A6068", fontSize: 11, fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          dy={4}
        />
        <YAxis
          tick={{ fill: "#5A6068", fontSize: 11, fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Area
          type="natural"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
