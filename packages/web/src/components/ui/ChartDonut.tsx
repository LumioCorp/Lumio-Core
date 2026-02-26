"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DonutEntry {
  name: string;
  value: number;
  fill: string;
}

interface TooltipPayload {
  name?: string;
  value?: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-0.5">
        {item.name}
      </p>
      <p className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-sm font-bold text-slate-900 tabular-nums">
        ${(item.value ?? 0).toLocaleString("en-US")}
      </p>
    </div>
  );
}

export function ChartPieDonut({ data }: { data: DonutEntry[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Donut chart with center label */}
      <div className="relative w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
              isAnimationActive
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-xl font-bold text-slate-900 tabular-nums">
            ${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex w-full flex-col gap-2 px-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-[11px] font-medium text-slate-600">
                {entry.name}
              </span>
            </div>
            <span className="text-[11px] font-bold tabular-nums text-slate-700">
              ${entry.value.toLocaleString("en-US")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
