"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0b0f17",
          color: "#e6edf3",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 640,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>App error</h1>
          <p style={{ color: "#94a3b8", marginBottom: 16 }}>
            A top-level error occurred. The error has been logged.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "#475569" }}>
              digest: {error.digest}
            </p>
          ) : null}
          <p style={{ fontFamily: "monospace", fontSize: 13, color: "#fda4af" }}>
            {error.message}
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                background: "#0ea5e9",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: "transparent",
                color: "#cbd5e1",
                border: "1px solid #334155",
                borderRadius: 4,
                padding: "8px 16px",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
