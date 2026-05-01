"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

interface StatusResp {
  ts: number;
  services: {
    ais: {
      healthy: boolean;
      started: boolean;
      lastMessageAgeSeconds: number | null;
      vesselCount: number;
      messageCount: number;
    };
    sar: {
      healthy: boolean | null;
      started: boolean;
      authAvailable: boolean;
      demoEnabled: boolean;
      lastScanAgeSeconds: number | null;
      lastError?: string;
    };
    sanctions: {
      healthy: boolean;
      count: number;
      countByImo: number;
      countByMmsi: number;
      ageSeconds: number | null;
      errors: string[];
    };
  };
  coverage: { portsTracked: number; portsActive: number };
}

function dot(state: "ok" | "warn" | "down" | "idle") {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        state === "ok"
          ? "bg-emerald-400"
          : state === "warn"
            ? "bg-amber-400"
            : state === "down"
              ? "bg-rose-400"
              : "bg-slate-600"
      }`}
    />
  );
}

interface AccuracyResp {
  rmseHours: number | null;
  baselineRmseHours: number | null;
  sampleCount: number;
}

export default function StatusPage() {
  const { tp } = useI18n();
  const [data, setData] = useState<StatusResp | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyResp | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statusR, accR] = await Promise.all([
          fetch("/api/status", { cache: "no-store" }),
          fetch("/api/voyages/accuracy?port=rotterdam&days=30", {
            cache: "no-store",
          }),
        ]);
        if (statusR.ok) {
          const json = (await statusR.json()) as StatusResp;
          if (!cancelled) setData(json);
        }
        if (accR.ok) {
          const json = (await accR.json()) as AccuracyResp;
          if (!cancelled) setAccuracy(json);
        }
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const accuracyDelta =
    accuracy?.rmseHours != null && accuracy?.baselineRmseHours != null
      ? ((accuracy.rmseHours - accuracy.baselineRmseHours) /
          accuracy.baselineRmseHours) *
        100
      : null;
  const accuracyBeats = accuracyDelta !== null && accuracyDelta < 0;

  return (
    <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          {tp("status.backLink")}
        </Link>
        <span className="text-xs text-slate-500">
          {data ? new Date(data.ts).toLocaleString() : "—"}
        </span>
      </header>

      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {tp("status.title")}
        </h1>
        <p className="text-sm text-slate-300">{tp("status.lead")}</p>
      </section>

      {data ? (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ServiceCard
              title={tp("status.ais.title")}
              state={
                data.services.ais.healthy
                  ? "ok"
                  : data.services.ais.started
                    ? "warn"
                    : "down"
              }
              rows={[
                [
                  tp("status.ais.connection"),
                  data.services.ais.started
                    ? tp("status.ais.connectionActive")
                    : tp("status.ais.connectionDown"),
                ],
                [
                  tp("status.ais.lastMessage"),
                  data.services.ais.lastMessageAgeSeconds != null
                    ? `${data.services.ais.lastMessageAgeSeconds} s`
                    : "—",
                ],
                [
                  tp("status.ais.cached"),
                  String(data.services.ais.vesselCount),
                ],
                [
                  tp("status.ais.received"),
                  data.services.ais.messageCount.toLocaleString(),
                ],
              ]}
            />
            <ServiceCard
              title={tp("status.sar.title")}
              state={
                !data.services.sar.started
                  ? "idle"
                  : data.services.sar.healthy
                    ? "ok"
                    : "warn"
              }
              rows={[
                [
                  tp("status.sar.enabled"),
                  data.services.sar.started
                    ? tp("status.sar.yes")
                    : tp("status.sar.no"),
                ],
                [
                  tp("status.sar.copernicusAuth"),
                  data.services.sar.authAvailable
                    ? tp("status.sar.configured")
                    : tp("status.sar.missing"),
                ],
                [
                  tp("status.sar.demoMode"),
                  data.services.sar.demoEnabled
                    ? tp("status.sar.demoOn")
                    : tp("status.sar.demoOff"),
                ],
                [
                  tp("status.sar.lastScan"),
                  data.services.sar.lastScanAgeSeconds != null
                    ? `${Math.round(data.services.sar.lastScanAgeSeconds / 60)} min`
                    : "—",
                ],
              ]}
              footer={data.services.sar.lastError}
            />
            <ServiceCard
              title={tp("status.sanctions.title")}
              state={data.services.sanctions.healthy ? "ok" : "warn"}
              rows={[
                [
                  tp("status.sanctions.indexed"),
                  data.services.sanctions.count.toLocaleString(),
                ],
                [
                  tp("status.sanctions.byImo"),
                  String(data.services.sanctions.countByImo),
                ],
                [
                  tp("status.sanctions.byMmsi"),
                  String(data.services.sanctions.countByMmsi),
                ],
                [
                  tp("status.sanctions.lastUpdate"),
                  data.services.sanctions.ageSeconds != null
                    ? `${Math.round(data.services.sanctions.ageSeconds / 60)} min`
                    : "—",
                ],
              ]}
              footer={data.services.sanctions.errors.join("; ")}
            />
            <ServiceCard
              title={tp("status.coverage.title")}
              state="ok"
              rows={[
                [
                  tp("status.coverage.tracked"),
                  String(data.coverage.portsTracked),
                ],
                [
                  tp("status.coverage.active"),
                  String(data.coverage.portsActive),
                ],
                [
                  tp("status.coverage.activityRate"),
                  `${Math.round((data.coverage.portsActive / data.coverage.portsTracked) * 100)}%`,
                ],
              ]}
            />
            {accuracy && accuracy.sampleCount > 0 ? (
              <ServiceCard
                title={tp("status.accuracy.title")}
                state={accuracyBeats ? "ok" : "warn"}
                rows={[
                  [
                    tp("status.accuracy.rmsePF"),
                    accuracy.rmseHours != null
                      ? `${accuracy.rmseHours.toFixed(2)} h`
                      : "—",
                  ],
                  [
                    tp("status.accuracy.rmseBroadcast"),
                    accuracy.baselineRmseHours != null
                      ? `${accuracy.baselineRmseHours.toFixed(2)} h`
                      : "—",
                  ],
                  [
                    tp("status.accuracy.advantage"),
                    accuracyDelta !== null
                      ? `${accuracyBeats ? "" : "+"}${accuracyDelta.toFixed(1)}%`
                      : "—",
                  ],
                  [
                    tp("status.accuracy.closedVoyages"),
                    String(accuracy.sampleCount),
                  ],
                ]}
                footer={
                  accuracyBeats
                    ? tp("status.accuracy.beats")
                    : accuracyDelta !== null
                      ? tp("status.accuracy.behind")
                      : undefined
                }
              />
            ) : null}
          </section>
        </>
      ) : (
        <div className="text-sm text-slate-500">{tp("status.loading")}</div>
      )}
    </main>
  );
}

function ServiceCard({
  title,
  state,
  rows,
  footer,
}: {
  title: string;
  state: "ok" | "warn" | "down" | "idle";
  rows: Array<[string, string]>;
  footer?: string;
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <header className="mb-3 flex items-center gap-2">
        {dot(state)}
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      </header>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {rows.map(([k, v]) => (
          <span key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-slate-200">{v}</dd>
          </span>
        ))}
      </dl>
      {footer ? (
        <p className="mt-2 text-[11px] text-rose-300">{footer}</p>
      ) : null}
    </article>
  );
}
