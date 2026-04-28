"use client";

import {
  Area,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastResult } from "@/lib/forecast";

interface Props {
  forecast: ForecastResult | null;
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function ForecastChart({ forecast }: Props) {
  if (!forecast)
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
        Loading forecast…
      </div>
    );

  if (forecast.forecast.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-400">
        <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">
          Prévision — {forecast.metric}
        </div>
        <div className="max-w-md text-center">{forecast.notes}</div>
      </div>
    );
  }

  const data = [
    ...forecast.history.map((h) => ({
      ts: h.ts,
      label: fmtTime(h.ts),
      actual: h.value,
    })),
    ...forecast.forecast.map((f) => ({
      ts: f.ts,
      label: fmtTime(f.ts),
      predicted: f.value,
      band: [f.lower, f.upper] as [number, number],
    })),
  ];

  return (
    <div className="h-[260px] w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-400">
          Prévision — {forecast.metric}
        </span>
        <span className="text-slate-500">{forecast.method}</span>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #334155",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="band"
            fill="#38bdf8"
            stroke="none"
            fillOpacity={0.15}
            name="Intervalle 95%"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#34d399"
            dot={false}
            name="Observé"
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#38bdf8"
            strokeDasharray="4 2"
            dot={false}
            name="Prévision"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
