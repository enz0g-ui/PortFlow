import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Port Flow — tanker intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function RootOg() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 25% 20%, rgba(56,189,248,0.18), transparent 55%), linear-gradient(135deg, #0b0f17 0%, #0f172a 100%)",
          color: "#e6edf3",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 30,
          }}
        >
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>Port Flow</span>
          <span style={{ color: "#64748b" }}>·</span>
          <span style={{ color: "#94a3b8" }}>tanker intelligence</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#f1f5f9",
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            Real-time AIS across 51 ports.
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#cbd5e1",
              lineHeight: 1.3,
              maxWidth: 1040,
            }}
          >
            Predicted ETA · sanctions screening · chokepoint transit alerts.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          {[
            "ETA precision (RMSE published)",
            "12 chokepoints tracked",
            "Multi-regime sanctions",
            "Webhooks · API · CSV export",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid #1f2937",
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: 22,
                color: "#cbd5e1",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#64748b",
          }}
        >
          <span>portflow.uk</span>
          <span>Built for commodity traders, freight forwarders, P&amp;I.</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
