"use client";

import {
  Area,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import type { KpiSnapshot } from "@/lib/types";

interface Props {
  history: KpiSnapshot[];
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function FlowChart({ history }: Props) {
  const { t } = useI18n();
  const data = history.map((k) => ({
    ts: k.ts,
    label: fmtTime(k.ts),
    inbound: k.inboundLastHour,
    outbound: k.outboundLastHour,
    anchored: k.anchored,
  }));

  return (
    <div className="h-[260px] w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 text-xs uppercase tracking-wider text-slate-400">
        {t("section.flow")}
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gAnc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="inbound"
            stroke="#34d399"
            fill="url(#gIn)"
            name={t("kpi.inboundHour")}
          />
          <Area
            type="monotone"
            dataKey="outbound"
            stroke="#38bdf8"
            fill="url(#gOut)"
            name={t("kpi.outboundHour")}
          />
          <Area
            type="monotone"
            dataKey="anchored"
            stroke="#fbbf24"
            fill="url(#gAnc)"
            name={t("kpi.anchored")}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
