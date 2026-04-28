"use client";

import { useI18n } from "@/lib/i18n/context";

interface Props {
  anchored: number;
  total: number;
}

function tier(
  ratio: number,
): { label: string; color: string; bg: string } {
  if (ratio >= 0.5)
    return { label: "critical", color: "#f87171", bg: "rgba(248,113,113,0.15)" };
  if (ratio >= 0.25)
    return { label: "high", color: "#fb923c", bg: "rgba(251,146,60,0.15)" };
  if (ratio >= 0.1)
    return { label: "moderate", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" };
  return { label: "low", color: "#34d399", bg: "rgba(52,211,153,0.15)" };
}

export function CongestionGauge({ anchored, total }: Props) {
  const { t } = useI18n();
  const ratio = total > 0 ? anchored / total : 0;
  const clamped = Math.min(1, ratio);
  const sweep = clamped * 180;
  const { label, color, bg } = tier(ratio);

  const r = 60;
  const cx = 80;
  const cy = 80;
  const startA = 180;
  const endA = startA + sweep;
  const toXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = toXY(startA);
  const [x2, y2] = toXY(endA);
  const largeArc = sweep > 180 ? 1 : 0;
  const path =
    sweep <= 0
      ? ""
      : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  const [bx2, by2] = toXY(360);
  const bgPath = `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${bx2} ${by2}`;

  return (
    <div
      className="rounded-lg border border-slate-800 p-3"
      style={{ background: bg }}
    >
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-slate-300">
          {t("section.congestion")}
        </span>
        <span className="text-slate-500">
          {anchored} / {total}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <svg width={160} height={90} viewBox="0 0 160 90">
          <path d={bgPath} stroke="#1e293b" strokeWidth="10" fill="none" />
          {sweep > 0 ? (
            <path
              d={path}
              stroke={color}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fontSize="22"
            fontWeight="600"
            fill={color}
          >
            {Math.round(ratio * 100)}%
          </text>
        </svg>
        <div className="flex flex-col">
          <span
            className="text-lg font-semibold capitalize"
            style={{ color }}
          >
            {t(`congestion.${label}`)}
          </span>
          <span className="text-xs text-slate-400">
            {t("kpi.anchored")} / {t("kpi.totalVessels")}
          </span>
        </div>
      </div>
    </div>
  );
}
