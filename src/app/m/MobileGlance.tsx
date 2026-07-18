"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

/**
 * Mobile glance view — open → know → pocket the phone in under 5 seconds.
 *
 * Three tabs (Fleet / Alerts / Ports), one aggregated fetch
 * (/api/mobile/glance), localStorage cache painted instantly then refreshed.
 * ETA is the hero: biggest number on screen, list sorted by imminence.
 *
 * Dark by default (consistent with the desk product); a sun/moon toggle
 * switches to a bright theme for outdoor use (quayside sunlight), persisted
 * per device. Theme is a token object so both palettes stay in one place.
 */

interface GlanceVessel {
  mmsi: number;
  name: string;
  cargoClass: string | null;
  state: string | null;
  sog: number | null;
  positionTs: number | null;
  destPortName: string | null;
  destFlag: string | null;
  predictedEta: number | null;
  distanceNm: number | null;
  atPortName: string | null;
  sanctioned: boolean;
}

interface GlanceAlert {
  ts: number;
  kind:
    | "arrival"
    | "departure"
    | "inbound"
    | "dark"
    | "loitering"
    | "chokepoint"
    | "sanctions";
  title: string;
  sub: string;
}

interface GlancePort {
  id: string;
  name: string;
  flag: string;
  anchored: number;
  total: number;
  pct: number;
}

interface GlanceResp {
  ts: number;
  isDemo: boolean;
  aisAgoSec: number | null;
  fleet: GlanceVessel[];
  alerts: GlanceAlert[];
  ports: GlancePort[];
}

const CACHE_KEY = "portflow:mobile:glance";
const SEEN_KEY = "portflow:mobile:alertsSeenTs";
const THEME_KEY = "portflow:mobile:theme";
const POLL_MS = 60_000;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function fmtCountdown(etaMs: number, now: number): string {
  const d = etaMs - now;
  if (d <= 0) return "due";
  const min = Math.round(d / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ${String(min % 60).padStart(2, "0")}`;
  const days = Math.floor(h / 24);
  return `${days} d ${h % 24} h`;
}

function fmtEtaAbs(etaMs: number): string {
  return (
    new Date(etaMs).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

function fmtAgo(ts: number, now: number): string {
  const min = Math.round((now - ts) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? "yesterday" : `${days} d ago`;
}

/** Theme tokens — every surface/text class lives here, per palette. */
const THEMES = {
  dark: {
    page: "bg-slate-950 text-slate-100",
    card: "border-slate-800 bg-slate-900",
    title: "text-slate-100",
    sub: "text-slate-400",
    muted: "text-slate-500",
    faint: "text-slate-600",
    chip: "border-slate-700 text-slate-400",
    nav: "border-slate-800 bg-slate-950/95",
    navIdle: "text-slate-500",
    accent: "text-sky-400",
    ok: "text-emerald-300",
    okBorder: "border-l-emerald-400",
    warn: "text-amber-300",
    warnBorder: "border-l-amber-400",
    warnChip: "border-amber-500/40 text-amber-300",
    bad: "text-rose-300",
    badBorder: "border-l-rose-400",
    berth: "border-l-sky-400",
    berthChip: "border-sky-500/40 text-sky-300",
    idleBorder: "border-l-slate-600",
    sanc: "bg-indigo-400/15 text-indigo-300",
    unread: "bg-sky-400",
    readDot: "border border-slate-700",
    badge: "bg-rose-400 text-slate-950",
    live: "border-emerald-700/60 text-emerald-300",
    liveDot: "bg-emerald-400",
    dead: "border-slate-700 text-slate-500",
    deadDot: "bg-slate-600",
    tag: {
      arrival: "text-emerald-300 bg-emerald-400/10",
      departure: "text-emerald-300 bg-emerald-400/10",
      inbound: "text-sky-300 bg-sky-400/10",
      dark: "text-rose-300 bg-rose-400/10",
      loitering: "text-amber-300 bg-amber-400/10",
      chokepoint: "text-sky-300 bg-sky-400/10",
      sanctions: "text-indigo-300 bg-indigo-400/15",
    } as Record<GlanceAlert["kind"], string>,
  },
  light: {
    page: "bg-slate-100 text-slate-900",
    card: "border-slate-300 bg-white",
    title: "text-slate-900",
    sub: "text-slate-600",
    muted: "text-slate-500",
    faint: "text-slate-400",
    chip: "border-slate-300 text-slate-500",
    nav: "border-slate-300 bg-white/95",
    navIdle: "text-slate-400",
    accent: "text-sky-600",
    ok: "text-emerald-600",
    okBorder: "border-l-emerald-500",
    warn: "text-amber-600",
    warnBorder: "border-l-amber-500",
    warnChip: "border-amber-500/50 text-amber-700",
    bad: "text-rose-600",
    badBorder: "border-l-rose-500",
    berth: "border-l-sky-500",
    berthChip: "border-sky-500/50 text-sky-700",
    idleBorder: "border-l-slate-300",
    sanc: "bg-indigo-100 text-indigo-700",
    unread: "bg-sky-500",
    readDot: "border border-slate-300",
    badge: "bg-rose-500 text-white",
    live: "border-emerald-500/50 text-emerald-700",
    liveDot: "bg-emerald-500",
    dead: "border-slate-300 text-slate-400",
    deadDot: "bg-slate-300",
    tag: {
      arrival: "text-emerald-700 bg-emerald-100",
      departure: "text-emerald-700 bg-emerald-100",
      inbound: "text-sky-700 bg-sky-100",
      dark: "text-rose-700 bg-rose-100",
      loitering: "text-amber-700 bg-amber-100",
      chokepoint: "text-sky-700 bg-sky-100",
      sanctions: "text-indigo-700 bg-indigo-100",
    } as Record<GlanceAlert["kind"], string>,
  },
};

const TAG_LABEL: Record<GlanceAlert["kind"], string> = {
  arrival: "Arrival",
  departure: "Departure",
  inbound: "Inbound",
  dark: "Dark",
  loitering: "Loitering",
  chokepoint: "Transit",
  sanctions: "Sanctions",
};

type Tab = "fleet" | "alerts" | "ports";

export function MobileGlance() {
  const [data, setData] = useState<GlanceResp | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("fleet");
  const [seenTs, setSeenTs] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const [mode, setMode] = useState<"dark" | "light">("dark");
  // Push channel state: "na" = unsupported/not applicable (demo, denied,
  // server unconfigured), "available" = can offer, "busy" = subscribing,
  // "on" = this device is subscribed.
  const [push, setPush] = useState<"na" | "available" | "busy" | "on">("na");
  const t = THEMES[mode];

  // Register the service worker early (needed for push + PWA install).
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Evaluate push availability once we know who the user is (not for demo
  // sessions — their identity is throwaway).
  useEffect(() => {
    if (!data || data.isDemo || unauth) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "denied") return;
    let cancelled = false;
    (async () => {
      try {
        const vapid = await fetch("/api/push/vapid");
        if (!vapid.ok) return; // server not configured
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setPush(sub ? "on" : "available");
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, unauth]);

  const enablePush = async () => {
    setPush("busy");
    try {
      const vapid = await fetch("/api/push/vapid");
      if (!vapid.ok) throw new Error("unconfigured");
      const { publicKey } = (await vapid.json()) as { publicKey: string };
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPush("na");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setPush(r.ok ? "on" : "available");
    } catch {
      setPush("available");
    }
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) setData(JSON.parse(raw) as GlanceResp);
      setSeenTs(Number(window.localStorage.getItem(SEEN_KEY) ?? 0));
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      if (savedTheme === "light" || savedTheme === "dark") setMode(savedTheme);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/mobile/glance", { cache: "no-store" });
      if (r.status === 401) {
        setUnauth(true);
        return;
      }
      if (!r.ok) return;
      const json = (await r.json()) as GlanceResp;
      setData(json);
      setUnauth(false);
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(json));
      } catch {
        /* quota — ignore */
      }
    } catch {
      /* offline — keep cache */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const alerts = data?.alerts ?? [];
  const unread = alerts.filter(
    (a) => a.ts > seenTs && a.kind !== "sanctions",
  ).length;

  const openAlerts = () => {
    setTab("alerts");
    const ts = Date.now();
    setSeenTs(ts);
    try {
      window.localStorage.setItem(SEEN_KEY, String(ts));
    } catch {
      /* ignore */
    }
  };

  const aisLive = data?.aisAgoSec != null && data.aisAgoSec < 120;

  if (unauth) {
    return (
      <main
        className={`flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center ${t.page}`}
      >
        <div className="text-2xl font-bold">
          Port Flow <span className={t.accent}>·</span>
        </div>
        <p className={`max-w-xs text-sm ${t.sub}`}>
          Sign in — or start the free demo — to see your fleet and alerts at a
          glance.
        </p>
        <Link
          href="/"
          className="rounded bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Open portflow.uk →
        </Link>
      </main>
    );
  }

  return (
    <main
      className={`mx-auto flex min-h-screen w-full max-w-md flex-col ${t.page}`}
    >
      {/* App bar */}
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="text-[15px] font-bold tracking-tight">
          {tab === "fleet" ? (
            <>
              Port Flow <span className={t.accent}>·</span>
            </>
          ) : tab === "alerts" ? (
            "Alerts"
          ) : (
            "My ports"
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
              aisLive ? t.live : t.dead
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${aisLive ? t.liveDot : t.deadDot}`}
            />
            {aisLive ? "AIS LIVE" : "AIS …"}
          </span>
          <button
            onClick={toggleTheme}
            aria-label={mode === "dark" ? "Switch to bright mode" : "Switch to dark mode"}
            className={`rounded-full border px-2 py-0.5 text-[13px] leading-none ${t.chip}`}
          >
            {mode === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-24">
        {tab === "fleet" ? (
          <>
            <div className="flex items-baseline justify-between px-1 pt-1">
              <span
                className={`text-[10.5px] font-bold uppercase tracking-[0.12em] ${t.muted}`}
              >
                My fleet
              </span>
              <span className={`text-[10.5px] ${t.faint}`}>
                sorted by soonest ETA
              </span>
            </div>

            {(data?.fleet ?? []).map((v) => {
              const eta = v.predictedEta;
              const soon = eta != null && eta - now < 6 * 3_600_000;
              const overdue = eta != null && eta < now;
              const stripe = v.atPortName
                ? t.berth
                : overdue
                  ? t.badBorder
                  : soon
                    ? t.warnBorder
                    : eta != null
                      ? t.okBorder
                      : t.idleBorder;
              const countColor = overdue
                ? t.bad
                : soon
                  ? t.warn
                  : eta != null
                    ? t.ok
                    : t.muted;
              return (
                <div
                  key={v.mmsi}
                  className={`rounded-xl border border-l-4 px-3.5 py-3 ${t.card} ${stripe}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={`truncate text-[14.5px] font-bold ${t.title}`}
                    >
                      {v.name}
                      {v.sanctioned ? (
                        <span
                          className={`ml-2 rounded px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wider ${t.sanc}`}
                        >
                          Sanctions
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`text-[22px] font-extrabold tabular-nums leading-none ${countColor}`}
                    >
                      {v.atPortName
                        ? "at berth"
                        : eta != null
                          ? fmtCountdown(eta, now)
                          : "—"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3">
                    <span className={`truncate text-xs ${t.sub}`}>
                      {v.atPortName
                        ? `in ${v.atPortName}`
                        : v.destPortName
                          ? `→ ${v.destFlag ?? ""} ${v.destPortName}`
                          : "no active voyage"}
                      {v.cargoClass ? ` · ${v.cargoClass}` : ""}
                    </span>
                    {!v.atPortName && eta != null ? (
                      <span
                        className={`whitespace-nowrap text-[10.5px] tabular-nums ${t.faint}`}
                      >
                        ETA {fmtEtaAbs(eta)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {v.state ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          v.state === "anchored"
                            ? t.warnChip
                            : v.state === "moored"
                              ? t.berthChip
                              : t.chip
                        }`}
                      >
                        {v.state === "anchored"
                          ? "At anchor"
                          : v.state === "moored"
                            ? "Moored"
                            : "Underway"}
                      </span>
                    ) : null}
                    {v.sog != null && v.sog > 0.5 ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${t.chip}`}
                      >
                        {v.sog.toFixed(1)} kn
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {loaded && (data?.fleet ?? []).length === 0 ? (
              <div
                className={`rounded-xl border p-5 text-center text-sm ${t.card} ${t.sub}`}
              >
                No vessels in your watchlist yet.
                <br />
                <span className={`text-xs ${t.muted}`}>
                  Star vessels in the{" "}
                  <Link href="/app" className={t.accent}>
                    desktop dashboard
                  </Link>{" "}
                  and they show up here, sorted by ETA.
                </span>
              </div>
            ) : null}

            {push === "available" || push === "busy" ? (
              <button
                onClick={enablePush}
                disabled={push === "busy"}
                className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left ${t.card} disabled:opacity-60`}
              >
                <span className="text-lg">🔔</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[13px] font-semibold ${t.title}`}>
                    {push === "busy"
                      ? "Enabling…"
                      : "Get alerts on your lock screen"}
                  </span>
                  <span className={`block text-[11px] ${t.muted}`}>
                    Vessel arrivals &amp; departures, pushed to this device.
                  </span>
                </span>
                <span
                  className={`flex-none rounded px-2.5 py-1 text-[11px] font-bold ${mode === "dark" ? "bg-sky-500 text-slate-950" : "bg-sky-600 text-white"}`}
                >
                  Enable
                </span>
              </button>
            ) : null}

            {(data?.ports ?? []).length > 0 ? (
              <>
                <div
                  className={`px-1 pt-2 text-[10.5px] font-bold uppercase tracking-[0.12em] ${t.muted}`}
                >
                  My ports
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(data?.ports ?? []).slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-xl border px-3 py-2.5 ${t.card}`}
                    >
                      <div className={`truncate text-[11px] ${t.muted}`}>
                        {p.flag} {p.name}
                      </div>
                      <div
                        className={`text-lg font-extrabold tabular-nums ${
                          p.pct >= 30 ? t.warn : t.ok
                        }`}
                      >
                        {p.pct}%
                        <span
                          className={`ml-1 text-[10px] font-medium ${t.muted}`}
                        >
                          waiting
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : tab === "alerts" ? (
          <>
            {alerts.map((a, i) => (
              <div
                key={`${a.ts}-${i}`}
                className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${t.card}`}
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${
                    a.ts > seenTs ? t.unread : t.readDot
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[13px] font-semibold leading-snug ${t.title}`}
                  >
                    {a.title}
                  </div>
                  <div className={`mt-0.5 text-[11px] ${t.muted}`}>
                    {fmtAgo(a.ts, now)} · {a.sub}
                  </div>
                </div>
                <span
                  className={`mt-0.5 flex-none rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${t.tag[a.kind]}`}
                >
                  {TAG_LABEL[a.kind]}
                </span>
              </div>
            ))}
            {loaded && alerts.length === 0 ? (
              <div
                className={`rounded-xl border p-5 text-center text-sm ${t.card} ${t.sub}`}
              >
                No events for your fleet in the last 7 days.
              </div>
            ) : null}
          </>
        ) : (
          <>
            {(data?.ports ?? []).map((p) => (
              <div
                key={p.id}
                className={`flex items-baseline justify-between rounded-xl border px-4 py-3 ${t.card}`}
              >
                <span className={`text-sm font-semibold ${t.title}`}>
                  {p.flag} {p.name}
                </span>
                <span className={`tabular-nums text-sm ${t.sub}`}>
                  <span
                    className={`text-lg font-extrabold ${p.pct >= 30 ? t.warn : t.ok}`}
                  >
                    {p.pct}%
                  </span>{" "}
                  · {p.anchored}/{p.total} at anchor
                </span>
              </div>
            ))}
            {loaded && (data?.ports ?? []).length === 0 ? (
              <div
                className={`rounded-xl border p-5 text-center text-sm ${t.card} ${t.sub}`}
              >
                No bookmarked ports yet.
                <br />
                <span className={`text-xs ${t.muted}`}>
                  Star ports in the{" "}
                  <Link href="/app" className={t.accent}>
                    desktop dashboard
                  </Link>
                  .
                </span>
              </div>
            ) : null}
            <p className={`px-1 pt-2 text-center text-[11px] ${t.faint}`}>
              <Link href="/app" className={`underline ${t.muted}`}>
                Full desktop dashboard →
              </Link>
            </p>
          </>
        )}
      </div>

      {/* Bottom tabs */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t backdrop-blur ${t.nav}`}
      >
        <div className="grid grid-cols-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
          {(
            [
              ["fleet", "Fleet", "⛴"],
              ["alerts", "Alerts", "🔔"],
              ["ports", "Ports", "⚓"],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => (id === "alerts" ? openAlerts() : setTab(id))}
              className={`relative py-1 text-center text-[10px] font-semibold ${
                tab === id ? t.accent : t.navIdle
              }`}
            >
              <span className="block text-[17px] leading-tight">{icon}</span>
              {label}
              {id === "alerts" && unread > 0 ? (
                <span
                  className={`absolute right-[26%] top-0 min-w-[15px] rounded-full px-1 text-[9px] font-extrabold leading-[15px] ${t.badge}`}
                >
                  {unread}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
