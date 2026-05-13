"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { CARGO_LABELS } from "@/lib/cargo";
import { formatEtaLocal, timezoneForLongitude } from "@/lib/portTime";
import type { CargoClass, Vessel } from "@/lib/types";

interface VoyageRow {
  voyage_id: string;
  cargo_class?: string | null;
  start_ts: number;
  arrived_ts?: number | null;
  departed_ts?: number | null;
  start_distance_nm?: number | null;
  predicted_eta?: number | null;
  broadcast_eta?: number | null;
}

interface DetailResp {
  mmsi: number;
  port: string;
  live: Vessel | null;
  static: {
    name?: string;
    callsign?: string;
    shipType?: number;
    destination?: string;
    draught?: number;
    lengthM?: number;
    cargoClass?: CargoClass;
  } | null;
  openVoyage: VoyageRow | null;
  lastClosedVoyage: VoyageRow | null;
  track: Array<{
    ts: number;
    lat: number;
    lon: number;
    sog: number;
    cog: number;
    state: string;
    zone: string | null;
  }>;
}

interface Props {
  mmsi: number;
  port: string;
  /** Longitude of the parent port, for local-time formatting of ETAs. */
  portLongitude?: number;
  onClose: () => void;
  bookmarked?: boolean;
  onToggleBookmark?: (mmsi: number) => void;
  bookmarksEnabled?: boolean;
}

function fmtTs(
  ts: number | null | undefined,
  locale: string,
  tz: string = "UTC",
): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

function fmtEtaDelta(ts: number | null | undefined): string {
  if (!ts) return "";
  const diff = (ts - Date.now()) / 3_600_000;
  const sign = diff < 0 ? "−" : "+";
  return `${sign}${Math.abs(diff).toFixed(1)} h`;
}

function EtaSpan({
  ts,
  locale,
  tz,
}: {
  ts: number | null | undefined;
  locale: string;
  tz: string;
}) {
  const { display, title, ok } = formatEtaLocal(ts, locale, tz);
  return (
    <span title={title} className={ok ? undefined : "text-slate-600"}>
      {display}
    </span>
  );
}

export function VesselDetailPanel({
  mmsi,
  port,
  portLongitude,
  onClose,
  bookmarked = false,
  onToggleBookmark,
  bookmarksEnabled = false,
}: Props) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<DetailResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timezone =
    portLongitude != null ? timezoneForLongitude(portLongitude) : "UTC";

  useEffect(() => {
    setData(null);
    setError(null);
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const r = await fetch(`/api/vessel/${mmsi}?port=${port}&hours=12`, {
          cache: "no-store",
        });
        if (!r.ok) {
          setError("fetch failed");
          return;
        }
        const json = (await r.json()) as DetailResp;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, 7000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [mmsi, port]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const v = data?.live ?? null;
  const s = data?.static ?? null;
  const open = data?.openVoyage ?? null;
  const last = data?.lastClosedVoyage ?? null;
  const cargo = (v?.cargoClass ?? s?.cargoClass) as CargoClass | undefined;
  const name =
    v?.name ?? s?.name ?? (data ? `MMSI ${mmsi}` : t("vessel.detail"));

  const [sanctions, setSanctions] = useState<{
    flagged: boolean;
    matches: Array<{
      source: string;
      list: string;
      name: string;
      reason?: string;
    }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sanctions?mmsi=${mmsi}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        if (typeof json.flagged === "boolean") {
          setSanctions({
            flagged: json.flagged,
            matches: json.matches ?? [],
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mmsi]);

  const [gfwEvents, setGfwEvents] = useState<{
    configured: boolean;
    count: number;
    events: Array<{
      id: string;
      type: "encounter" | "loitering" | "port_visit" | "fishing";
      start: number;
      end: number;
      durationHours: number;
      position: { lat: number; lon: number };
      encounter?: {
        otherVesselName: string | null;
        otherVesselMmsi: number | null;
        medianDistanceKm: number | null;
      };
      portVisit?: {
        portName: string | null;
        portCountry: string | null;
      };
      loitering?: {
        avgSpeedKn: number | null;
      };
    }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/vessels/${mmsi}/events?days=180&types=encounter,loitering,port_visit`,
      { cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        setGfwEvents({
          configured: json.configured ?? false,
          count: json.count ?? 0,
          events: json.events ?? [],
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mmsi]);

  return (
    <>
      <aside
        className="fixed bottom-0 end-0 top-0 z-[1900] flex h-full w-full flex-col gap-3 overflow-y-auto border-s border-slate-800 bg-slate-950 p-4 shadow-2xl sm:max-w-[440px]"
        role="dialog"
        aria-modal="false"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {t("vessel.detail")}
            </div>
            <h2 className="text-xl font-semibold text-slate-100">{name}</h2>
            <div className="text-xs text-slate-400">
              MMSI {mmsi}
              {s?.callsign ? ` · ${s.callsign}` : ""}
              {cargo
                ? ` · ${CARGO_LABELS[cargo] ?? cargo}`
                : ""}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {bookmarksEnabled && onToggleBookmark ? (
              <button
                onClick={() => onToggleBookmark(mmsi)}
                title={
                  bookmarked
                    ? t("vessel.bookmark.remove")
                    : t("vessel.bookmark.add")
                }
                aria-label={
                  bookmarked
                    ? t("vessel.bookmark.remove")
                    : t("vessel.bookmark.add")
                }
                className={`flex h-7 w-7 items-center justify-center rounded border transition-colors ${
                  bookmarked
                    ? "border-sky-700 bg-sky-500/15 text-sky-300"
                    : "border-slate-700 text-slate-500 hover:text-sky-400 hover:border-sky-700"
                }`}
              >
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  {bookmarked ? (
                    <path d="M3 2v12.5l5-3 5 3V2H3z" />
                  ) : (
                    <path
                      d="M3.5 2v11.5l4.5-2.7 4.5 2.7V2h-9zm1 1h7v9.2L8 10.5l-3.5 1.7V3z"
                      fillRule="evenodd"
                    />
                  )}
                </svg>
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-sky-500 hover:text-sky-300"
            >
              ✕ {t("vessel.close")}
            </button>
          </div>
        </header>

        {sanctions?.flagged ? (
          <div className="rounded border border-rose-700 bg-rose-950/40 p-3 text-xs text-rose-200">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-base">⚠</span>
              <strong>Sanctions hit ({sanctions.matches.length})</strong>
            </div>
            <ul className="space-y-1 pl-5 text-[11px]">
              {sanctions.matches.slice(0, 4).map((m, i) => (
                <li key={i} className="list-disc">
                  <span className="font-mono uppercase text-rose-400">
                    {m.source}
                  </span>{" "}
                  · {m.list} — {m.name}
                  {m.reason ? (
                    <span className="block text-[10px] text-rose-300/70">
                      {m.reason}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {gfwEvents?.configured && gfwEvents.count > 0 ? (
          <div className="rounded border border-amber-700/50 bg-amber-500/5 p-3 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <strong className="text-amber-300">
                Activité 180j — Global Fishing Watch
              </strong>
              <span className="text-[10px] text-slate-500">
                {gfwEvents.count} événement{gfwEvents.count > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="space-y-1.5 text-[11px]">
              {gfwEvents.events.slice(0, 6).map((e) => {
                const ts = new Date(e.start)
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 16);
                if (e.type === "encounter") {
                  return (
                    <li
                      key={e.id}
                      className="rounded bg-rose-500/10 px-2 py-1.5 text-rose-200"
                    >
                      <div className="font-semibold">
                        🚩 Encounter (ship-to-ship)
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {ts} · {e.durationHours.toFixed(1)} h ·{" "}
                        {e.encounter?.otherVesselName ?? "navire inconnu"}
                        {e.encounter?.otherVesselMmsi
                          ? ` (MMSI ${e.encounter.otherVesselMmsi})`
                          : ""}
                        {e.encounter?.medianDistanceKm != null
                          ? ` · dist méd ${(e.encounter.medianDistanceKm * 1000).toFixed(0)} m`
                          : ""}
                      </div>
                    </li>
                  );
                }
                if (e.type === "loitering") {
                  return (
                    <li
                      key={e.id}
                      className="rounded bg-amber-500/10 px-2 py-1.5 text-amber-200"
                    >
                      <div className="font-semibold">⏸ Loitering</div>
                      <div className="text-[10px] text-slate-300">
                        {ts} · {e.durationHours.toFixed(1)} h · vitesse moy{" "}
                        {e.loitering?.avgSpeedKn?.toFixed(1) ?? "—"} kn
                      </div>
                    </li>
                  );
                }
                if (e.type === "port_visit") {
                  return (
                    <li
                      key={e.id}
                      className="rounded bg-sky-500/10 px-2 py-1.5 text-sky-200"
                    >
                      <div className="font-semibold">⚓ Port visit</div>
                      <div className="text-[10px] text-slate-300">
                        {ts} · {e.durationHours.toFixed(1)} h ·{" "}
                        {e.portVisit?.portName ?? "port inconnu"}
                        {e.portVisit?.portCountry
                          ? ` (${e.portVisit.portCountry})`
                          : ""}
                      </div>
                    </li>
                  );
                }
                return null;
              })}
            </ul>
            {gfwEvents.count > 6 ? (
              <div className="mt-2 text-[10px] text-slate-500">
                … {gfwEvents.count - 6} autres événements
              </div>
            ) : null}
            <div className="mt-2 text-[10px] italic text-slate-500">
              Source : Global Fishing Watch (free non-commercial use).
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded border border-rose-700 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        ) : null}

        {!data ? (
          <div className="text-xs text-slate-500">…</div>
        ) : (
          <>
            <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                {t("vessel.live")}
              </div>
              {v ? (
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-slate-500">{t("vessel.position")}</dt>
                  <dd className="tabular-nums text-slate-200">
                    {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                  </dd>
                  <dt className="text-slate-500">{t("vessel.speed")}</dt>
                  <dd className="tabular-nums text-slate-200">
                    {v.sog.toFixed(1)} kn
                  </dd>
                  <dt className="text-slate-500">{t("vessel.heading")}</dt>
                  <dd className="tabular-nums text-slate-200">
                    {Math.round(v.cog)}°{" "}
                    {v.heading != null ? `(${Math.round(v.heading)}°)` : ""}
                  </dd>
                  <dt className="text-slate-500">{t("vessel.status")}</dt>
                  <dd className="text-slate-200 capitalize">{v.state}</dd>
                  <dt className="text-slate-500">{t("vessel.zone")}</dt>
                  <dd className="text-slate-200">{v.zone ?? "—"}</dd>
                </dl>
              ) : (
                <div className="text-xs text-slate-500">
                  {t("vessel.noTrack")}
                </div>
              )}
            </section>

            {(s || v) && (s?.lengthM || s?.draught || s?.shipType || s?.destination) ? (
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                  {t("vessel.dimensions")}
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {s?.lengthM != null ? (
                    <>
                      <dt className="text-slate-500">{t("vessel.length")}</dt>
                      <dd className="tabular-nums text-slate-200">
                        {s.lengthM} m
                      </dd>
                    </>
                  ) : null}
                  {s?.draught != null ? (
                    <>
                      <dt className="text-slate-500">{t("vessel.draught")}</dt>
                      <dd className="tabular-nums text-slate-200">
                        {s.draught.toFixed(1)} m
                      </dd>
                    </>
                  ) : null}
                  {s?.shipType != null ? (
                    <>
                      <dt className="text-slate-500">{t("vessel.shipType")}</dt>
                      <dd className="text-slate-200">{s.shipType}</dd>
                    </>
                  ) : null}
                  {s?.destination ? (
                    <>
                      <dt className="text-slate-500">
                        {t("vessel.destination")}
                      </dt>
                      <dd className="text-slate-200">{s.destination}</dd>
                    </>
                  ) : null}
                </dl>
              </section>
            ) : null}

            {open ? (
              <section className="rounded-lg border border-sky-700/50 bg-sky-500/10 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-sky-300">
                  {t("vessel.openVoyage")}
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-slate-400">Start</dt>
                  <dd
                    className="tabular-nums text-slate-200"
                    title={`${fmtTs(open.start_ts, locale, "UTC")} UTC`}
                  >
                    {fmtTs(open.start_ts, locale, timezone)}
                  </dd>
                  <dt className="text-slate-400">Distance @ start</dt>
                  <dd className="tabular-nums text-slate-200">
                    {open.start_distance_nm?.toFixed(1) ?? "—"} nm
                  </dd>
                  <dt className="text-slate-400">{t("table.predictedEta")}</dt>
                  <dd className="tabular-nums text-sky-300">
                    <EtaSpan
                      ts={open.predicted_eta}
                      locale={locale}
                      tz={timezone}
                    />{" "}
                    <span className="text-slate-500">
                      ({fmtEtaDelta(open.predicted_eta ?? null)})
                    </span>
                  </dd>
                  <dt className="text-slate-400">{t("table.broadcastEta")}</dt>
                  <dd className="tabular-nums text-slate-300">
                    <EtaSpan
                      ts={open.broadcast_eta}
                      locale={locale}
                      tz={timezone}
                    />
                  </dd>
                </dl>
              </section>
            ) : last ? (
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                  {t("vessel.lastVoyage")}
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-slate-500">Start</dt>
                  <dd
                    className="tabular-nums text-slate-200"
                    title={`${fmtTs(last.start_ts, locale, "UTC")} UTC`}
                  >
                    {fmtTs(last.start_ts, locale, timezone)}
                  </dd>
                  <dt className="text-slate-500">Arrived</dt>
                  <dd
                    className="tabular-nums text-slate-200"
                    title={`${fmtTs(last.arrived_ts ?? null, locale, "UTC")} UTC`}
                  >
                    {fmtTs(last.arrived_ts ?? null, locale, timezone)}
                  </dd>
                  {last.departed_ts ? (
                    <>
                      <dt className="text-slate-500">Departed</dt>
                      <dd
                        className="tabular-nums text-slate-200"
                        title={`${fmtTs(last.departed_ts, locale, "UTC")} UTC`}
                      >
                        {fmtTs(last.departed_ts, locale, timezone)}
                      </dd>
                    </>
                  ) : null}
                </dl>
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                {t("vessel.recentTrack")} · {data.track.length} pts
              </div>
              {data.track.length === 0 ? (
                <div className="text-xs text-slate-500">
                  {t("vessel.noTrack")}
                </div>
              ) : (
                <Sparkline
                  points={data.track.map((p) => ({ t: p.ts, v: p.sog }))}
                />
              )}
            </section>
          </>
        )}
      </aside>
    </>
  );
}

function Sparkline({ points }: { points: Array<{ t: number; v: number }> }) {
  if (points.length < 2) return null;
  const w = 380;
  const h = 60;
  const minT = points[0].t;
  const maxT = points[points.length - 1].t;
  const minV = 0;
  const maxV = Math.max(1, ...points.map((p) => p.v));
  const sx = (t: number) => ((t - minT) / Math.max(1, maxT - minT)) * w;
  const sy = (v: number) => h - ((v - minV) / Math.max(0.1, maxV - minV)) * h;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.t)} ${sy(p.v)}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="text-sky-400">
      <path d={d} stroke="currentColor" fill="none" strokeWidth="1.5" />
    </svg>
  );
}
