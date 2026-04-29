import { ImageResponse } from "next/og";
import { getPort, DEFAULT_PORT_ID } from "@/lib/ports";
import { db } from "@/lib/db";
import { recentClosedVoyages } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Port Flow — ETA precision benchmark";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Stats {
  rmseHours: number | null;
  baselineRmseHours: number | null;
  count: number;
}

function computeStats(portId: string): Stats {
  try {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const voyages = recentClosedVoyages(portId, since, 1000).filter(
      (v) => v.predicted_eta != null && v.arrived_ts != null,
    );
    if (voyages.length === 0) {
      return { rmseHours: null, baselineRmseHours: null, count: 0 };
    }
    const errors: number[] = [];
    const baselines: number[] = [];
    for (const v of voyages) {
      const e = ((v.predicted_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
      if (Math.abs(e) < 72) errors.push(e);
      if (v.broadcast_eta != null) {
        const b = ((v.broadcast_eta ?? 0) - (v.arrived_ts ?? 0)) / 3_600_000;
        if (Math.abs(b) < 168) baselines.push(b);
      }
    }
    const rmse = (a: number[]): number =>
      a.length === 0
        ? NaN
        : Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
    return {
      rmseHours: errors.length ? Number(rmse(errors).toFixed(2)) : null,
      baselineRmseHours: baselines.length
        ? Number(rmse(baselines).toFixed(2))
        : null,
      count: voyages.length,
    };
  } catch {
    return { rmseHours: null, baselineRmseHours: null, count: 0 };
  }
}

export default async function PrecisionOg({
  searchParams,
}: {
  searchParams?: { port?: string };
}) {
  const portId = searchParams?.port ?? DEFAULT_PORT_ID;
  const port = getPort(portId);
  const stats = computeStats(portId);

  const delta =
    stats.rmseHours !== null && stats.baselineRmseHours !== null
      ? ((stats.rmseHours - stats.baselineRmseHours) /
          stats.baselineRmseHours) *
        100
      : null;
  const beats = delta !== null && delta < 0;
  const deltaLabel =
    delta !== null
      ? `${beats ? "" : "+"}${delta.toFixed(1)}%`
      : "—";

  // Touch the db to keep tree-shake happy and warm boot
  void db;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0b0f17 0%, #0f172a 100%)",
          color: "#e6edf3",
          padding: 60,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28 }}
        >
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>Port Flow</span>
          <span style={{ color: "#64748b" }}>·</span>
          <span style={{ color: "#94a3b8" }}>tanker intelligence</span>
        </div>

        <div style={{ marginTop: 60, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 38, color: "#94a3b8" }}>ETA precision · 30j</div>
          <div
            style={{
              marginTop: 12,
              fontSize: 72,
              fontWeight: 700,
              color: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 56 }}>{port?.flag ?? "🌍"}</span>
            <span>{port?.name ?? portId}</span>
          </div>
          <div style={{ fontSize: 26, color: "#64748b", marginTop: 6 }}>
            {port?.country ?? ""}
          </div>
        </div>

        <div
          style={{
            marginTop: 52,
            display: "flex",
            gap: 36,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid #1f2937",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 22, color: "#64748b" }}>RMSE Port Flow</div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: beats ? "#34d399" : "#fbbf24",
                marginTop: 6,
              }}
            >
              {stats.rmseHours !== null ? `${stats.rmseHours} h` : "—"}
            </div>
            <div style={{ fontSize: 18, color: "#475569", marginTop: 4 }}>
              {stats.count} voyages clos
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid #1f2937",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 22, color: "#64748b" }}>vs Broadcast ETA</div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: beats ? "#34d399" : "#fbbf24",
                marginTop: 6,
              }}
            >
              {deltaLabel}
            </div>
            <div style={{ fontSize: 18, color: "#475569", marginTop: 4 }}>
              {beats
                ? "plus précis que ETA déclarée"
                : delta === null
                  ? "comparaison en attente"
                  : "moins précis que broadcast"}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#64748b",
          }}
        >
          <span>portflow.uk/precision</span>
          <span>Public · recalculé continu · reproductible</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
