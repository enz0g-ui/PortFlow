"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KpiCard } from "./components/KpiCard";
import { FlowChart } from "./components/FlowChart";
import { MapView } from "./components/MapView";
import { VoyagesTable, type ActiveVoyage } from "./components/VoyagesTable";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { AccuracyPanel } from "./components/AccuracyPanel";
import { AnomalyPanel } from "./components/AnomalyPanel";
import { CongestionGauge } from "./components/CongestionGauge";
import { WeatherWidget } from "./components/WeatherWidget";
import { VesselDetailPanel } from "./components/VesselDetailPanel";
import { PortSelector, type PortInfo } from "./components/PortSelector";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { AuthButtons } from "./components/AuthButtons";
import { Attributions } from "./components/Attributions";
import { CARGO_LABELS } from "@/lib/cargo";
import { useI18n } from "@/lib/i18n/context";
import type {
  CargoClass,
  KpiSnapshot,
  Vessel,
  VesselClass,
  Zone,
} from "@/lib/types";

interface PortInfoFull extends PortInfo {
  center: [number, number];
  bbox: [number, number, number, number];
  zones: Zone[];
  cargoStrength: CargoClass[];
}

interface PortsResp {
  ports: PortInfoFull[];
}

interface KpiResponse {
  port: string;
  snapshot: KpiSnapshot;
  worker: {
    started: boolean;
    lastConnectionAt?: number;
    lastMessageAt?: number;
    vesselCount: number;
  };
}

interface VoyagesResp {
  count: number;
  voyages: ActiveVoyage[];
}

interface AccuracyResp {
  windowDays: number;
  sampleCount: number;
  rmseHours: number | null;
  maeHours: number | null;
  baselineRmseHours: number | null;
}

interface AnomaliesResp {
  anomalies: Array<{
    id: string;
    kind: string;
    severity: "info" | "warn" | "critical";
    mmsi: number;
    name?: string;
    cargoClass?: string;
    zone?: string;
    detail: string;
    metricHours: number;
  }>;
}

interface WeatherResp {
  temperature: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  precipitation: number;
  cloudCover: number;
  waveHeight: number | null;
  waveDirection: number | null;
  fetchedAt: number;
}

interface VesselDetailResp {
  track: Array<{ ts: number; lat: number; lon: number }>;
}

interface SarDetectionsResp {
  detections: Array<{
    id: number;
    ts: number;
    lat: number;
    lon: number;
    intensity?: number;
    size_px?: number;
  }>;
  scanner: { authAvailable: boolean; demoEnabled: boolean };
}

const CACHE_PREFIX = "portflow:cache:";
const CACHE_TTL_MS = 30 * 60_000;

interface CacheEnvelope<T> {
  ts: number;
  data: T;
}

function readCache<T>(url: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + url);
    if (!raw) return null;
    const env = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() - env.ts > CACHE_TTL_MS) return null;
    return env.data;
  } catch {
    return null;
  }
}

function writeCache<T>(url: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + url,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    /* quota or privacy mode — ignore */
  }
}

function usePolling<T>(url: string | null, intervalMs: number): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!url) {
      setData(null);
      return;
    }
    const cached = readCache<T>(url);
    if (cached) setData(cached);

    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) return;
        const json = (await r.json()) as T;
        if (!cancelled) {
          setData(json);
          writeCache(url, json);
        }
      } catch {
        /* keep last cached value on network error */
      }
    };
    fetchOnce();
    const id = window.setInterval(fetchOnce, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchOnce();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", fetchOnce);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", fetchOnce);
    };
  }, [url, intervalMs]);
  return data;
}

const TANKER_CARGO: ReadonlySet<CargoClass> = new Set([
  "crude",
  "product",
  "chemical",
  "lng",
  "lpg",
]);

// Stable references so MapView's FlyTo effect doesn't re-run on every poll.
const WORLD_CENTER: [number, number] = [20, 0];
const WORLD_BBOX: [number, number, number, number] = [-60, -170, 70, 170];
const EMPTY_TRACK: Array<[number, number]> = [];
const EMPTY_ZONES: never[] = [];

function workerTone(
  status: KpiResponse["worker"] | undefined,
): "good" | "warn" | "bad" {
  if (!status?.started) return "bad";
  if (!status.lastMessageAt) return "warn";
  const age = Date.now() - status.lastMessageAt;
  if (age < 30_000) return "good";
  if (age < 5 * 60_000) return "warn";
  return "bad";
}

export default function Page() {
  const { t, locale } = useI18n();
  const [tankersOnly, setTankersOnly] = useState(false);
  const [portId, setPortId] = useState<string>("rotterdam");
  const [selectedMmsi, setSelectedMmsi] = useState<number | null>(null);
  const [stateFilter, setStateFilter] = useState<
    "anchored" | "underway" | "moored" | null
  >(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarksEnabled, setBookmarksEnabled] = useState(false);
  const [bookmarkedMmsis, setBookmarkedMmsis] = useState<Set<number>>(
    new Set(),
  );
  const [vesselBookmarksEnabled, setVesselBookmarksEnabled] = useState(false);
  const [fleetOnly, setFleetOnly] = useState(false);
  const [me, setMe] = useState<{
    tier: string;
    portsAccessible: "all" | string[];
  } | null>(null);
  const [upgradePort, setUpgradePort] = useState<string | null>(null);

  const [fleetPortMap, setFleetPortMap] = useState<Map<string, number>>(
    new Map(),
  );
  const [worldView, setWorldView] = useState(false);
  const [worldVessels, setWorldVessels] = useState<Vessel[]>([]);
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false);
  const [panTo, setPanTo] = useState<{
    lat: number;
    lon: number;
    tick: number;
  } | null>(null);

  const handleFavoritesSelect = (
    mmsi: number,
    pos?: { lat: number; lon: number },
  ) => {
    setSelectedMmsi(mmsi);
    if (pos) {
      setPanTo({ lat: pos.lat, lon: pos.lon, tick: Date.now() });
    }
  };

  useEffect(() => {
    if (!worldView) {
      setWorldVessels([]);
      return;
    }
    let cancelled = false;
    const load = () => {
      fetch("/api/user/fleet", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          const mapped: Vessel[] = (data.vessels ?? [])
            .filter(
              (
                x: {
                  position?: { lat: number; lon: number; ts: number };
                },
              ) => !!x.position,
            )
            .map(
              (x: {
                mmsi: number;
                name: string;
                cargoClass?: string | null;
                draught?: number | null;
                position: {
                  ts: number;
                  lat: number;
                  lon: number;
                  sog: number;
                  state?: string | null;
                };
              }): Vessel => {
                const cargo = (x.cargoClass ?? null) as CargoClass | null;
                const vClass: VesselClass =
                  cargo &&
                  ["crude", "product", "chemical", "lng", "lpg"].includes(cargo)
                    ? "tanker"
                    : cargo &&
                        ["container", "dry-bulk", "general-cargo", "ro-ro"].includes(
                          cargo,
                        )
                      ? "cargo"
                      : "other";
                return {
                  mmsi: x.mmsi,
                  name: x.name,
                  latitude: x.position.lat,
                  longitude: x.position.lon,
                  sog: x.position.sog,
                  cog: 0,
                  state:
                    (x.position.state as Vessel["state"]) ?? "underway",
                  vesselClass: vClass,
                  cargoClass: cargo ?? undefined,
                  lastUpdate: x.position.ts,
                  draught: x.draught ?? undefined,
                };
              },
            );
          setWorldVessels(mapped);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [worldView]);

  useEffect(() => {
    if (!fleetOnly || bookmarkedMmsis.size === 0) {
      setFleetPortMap(new Map());
      return;
    }
    let cancelled = false;
    fetch("/api/user/fleet", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const m = new Map<string, number>();
        for (const v of data.vessels ?? []) {
          // Only the live position determines presence — not openVoyage.port
          // (which would include vessels still 50+nm out, not yet in the
          // port's live bbox = invisible on the dashboard).
          const portIdOf = v.currentPort?.id ?? null;
          if (!portIdOf) continue;
          m.set(portIdOf, (m.get(portIdOf) ?? 0) + 1);
        }
        setFleetPortMap(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fleetOnly, bookmarkedMmsis]);

  const fleetPortIds = useMemo(() => {
    return Array.from(fleetPortMap.keys()).filter((id) => {
      if (!me) return true;
      if (me.portsAccessible === "all") return true;
      return me.portsAccessible.includes(id);
    });
  }, [fleetPortMap, me]);

  const onFleetChipClick = () => {
    if (!fleetOnly) {
      setFleetOnly(true);
      setTankersOnly(false);
      return;
    }
    if (fleetPortIds.length <= 1) return;
    const currentIdx = fleetPortIds.indexOf(portId);
    const nextIdx =
      currentIdx === -1 ? 0 : (currentIdx + 1) % fleetPortIds.length;
    setPortId(fleetPortIds[nextIdx]);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.authenticated) {
          setMe({
            tier: data.tier,
            portsAccessible: data.portsAccessible,
          });
        } else {
          setMe(null);
        }
      })
      .catch(() => {});
    fetch("/api/user/watchlist/ports", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return null;
        return (await r.json()) as { portIds: string[] };
      })
      .then((data) => {
        if (cancelled || !data) return;
        setBookmarkedIds(new Set(data.portIds));
        setBookmarksEnabled(true);
      })
      .catch(() => {});
    fetch("/api/user/watchlist/vessels", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return null;
        return (await r.json()) as { mmsis: number[] };
      })
      .then((data) => {
        if (cancelled || !data) return;
        setBookmarkedMmsis(new Set(data.mmsis));
        setVesselBookmarksEnabled(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const canAccessPort = (id: string): boolean => {
    if (!me) return true;
    if (me.portsAccessible === "all") return true;
    return me.portsAccessible.includes(id);
  };

  const trySelectPort = (id: string) => {
    if (id === portId) return;
    if (!canAccessPort(id)) {
      setUpgradePort(id);
      return;
    }
    setPortId(id);
  };

  const [upgradeFeature, setUpgradeFeature] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const toggleVesselBookmark = async (mmsi: number) => {
    const wasBookmarked = bookmarkedMmsis.has(mmsi);
    setBookmarkedMmsis((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(mmsi);
      else next.add(mmsi);
      return next;
    });
    try {
      const r = wasBookmarked
        ? await fetch(`/api/user/watchlist/vessels?mmsi=${mmsi}`, {
            method: "DELETE",
          })
        : await fetch("/api/user/watchlist/vessels", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mmsi }),
          });
      if (!r.ok) {
        setBookmarkedMmsis((prev) => {
          const next = new Set(prev);
          if (wasBookmarked) next.add(mmsi);
          else next.delete(mmsi);
          return next;
        });
        if (r.status === 403) {
          const json = (await r.json().catch(() => ({}))) as {
            error?: string;
          };
          if (json.error?.includes("tier does not allow")) {
            setUpgradeFeature({
              title: "🔒 Watchlist navires non disponible en Free",
              body: "Le suivi de navires spécifiques (favoris) débloque à partir du plan Starter (25 navires) — Professional (100) — Pro+ (250). C'est ce qui te permet de recevoir une alerte quand UN navire précis arrive ou bouge, sans surveiller manuellement le dashboard.",
            });
          } else if (json.error?.includes("limit reached")) {
            setUpgradeFeature({
              title: "Limite watchlist atteinte",
              body: `Tu as atteint le maximum de navires en watchlist pour ton plan. Passe en plan supérieur ou supprime un navire existant.`,
            });
          }
        }
        return;
      }
      const data = (await r.json()) as { mmsis: number[] };
      setBookmarkedMmsis(new Set(data.mmsis));
    } catch {
      setBookmarkedMmsis((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(mmsi);
        else next.delete(mmsi);
        return next;
      });
    }
  };

  const toggleBookmark = async (id: string) => {
    const wasBookmarked = bookmarkedIds.has(id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      const r = wasBookmarked
        ? await fetch(
            `/api/user/watchlist/ports?portId=${encodeURIComponent(id)}`,
            { method: "DELETE" },
          )
        : await fetch("/api/user/watchlist/ports", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ portId: id }),
          });
      if (!r.ok) {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (wasBookmarked) next.add(id);
          else next.delete(id);
          return next;
        });
        return;
      }
      const data = (await r.json()) as { portIds: string[] };
      setBookmarkedIds(new Set(data.portIds));
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initialPort = params.get("port");
    const initialMmsi = params.get("mmsi");
    const initialFilter = params.get("state");
    const initialTankers = params.get("tankers");
    if (initialPort) setPortId(initialPort);
    if (initialMmsi) setSelectedMmsi(Number(initialMmsi));
    if (
      initialFilter === "anchored" ||
      initialFilter === "underway" ||
      initialFilter === "moored"
    ) {
      setStateFilter(initialFilter);
    }
    if (initialTankers === "1") setTankersOnly(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (portId !== "rotterdam") params.set("port", portId);
    if (selectedMmsi != null) params.set("mmsi", String(selectedMmsi));
    if (stateFilter) params.set("state", stateFilter);
    if (tankersOnly) params.set("tankers", "1");
    const query = params.toString();
    const url = query ? `?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [portId, selectedMmsi, stateFilter, tankersOnly]);

  useEffect(() => {
    setSelectedMmsi((cur) => cur);
    setStateFilter(null);
  }, [portId]);

  const portsResp = usePolling<PortsResp>("/api/ports", 30_000);
  const ports = portsResp?.ports ?? [];
  const port = ports.find((p) => p.id === portId);
  const portName = port ? (port.names[locale] ?? port.name) : "—";
  const portCountry = port
    ? (port.countryNames[locale] ?? port.country)
    : "";
  const portBlurb = port ? (port.blurbs?.[locale] ?? port.blurb) : "";
  const nativeName =
    port && port.nativeLocale !== locale
      ? port.names[port.nativeLocale]
      : undefined;

  const q = `?port=${portId}`;

  const vesselsResp = usePolling<{ vessels: Vessel[]; count: number }>(
    `/api/vessels${q}`,
    5000,
  );
  const kpiResp = usePolling<KpiResponse>(`/api/kpis${q}`, 5000);
  const histResp = usePolling<{ history: KpiSnapshot[] }>(
    `/api/history${q}&hours=6`,
    60_000,
  );
  const voyagesResp = usePolling<VoyagesResp>(
    `/api/voyages/active${q}${tankersOnly ? "&tankersOnly=1" : ""}`,
    10_000,
  );
  const accuracyResp = usePolling<AccuracyResp>(
    `/api/voyages/accuracy${q}&days=30`,
    60_000,
  );
  const anomaliesResp = usePolling<AnomaliesResp>(
    `/api/anomalies${q}`,
    30_000,
  );
  const weatherResp = usePolling<WeatherResp>(`/api/weather${q}`, 5 * 60_000);
  const sarResp = usePolling<SarDetectionsResp>(
    `/api/sar-detections${q}&days=14`,
    5 * 60_000,
  );
  const detailResp = usePolling<VesselDetailResp>(
    selectedMmsi != null
      ? `/api/vessel/${selectedMmsi}?port=${portId}&hours=12`
      : null,
    7000,
  );
  const selectedTrack = useMemo<Array<[number, number]>>(
    () =>
      detailResp?.track
        ? detailResp.track.map((p) => [p.lat, p.lon] as [number, number])
        : [],
    [detailResp],
  );

  const toggleState = (s: "anchored" | "underway" | "moored") =>
    setStateFilter((cur) => (cur === s ? null : s));

  const allVessels = vesselsResp?.vessels ?? [];
  const vessels = useMemo(() => {
    let list = allVessels;
    if (fleetOnly) list = list.filter((v) => bookmarkedMmsis.has(v.mmsi));
    if (tankersOnly)
      list = list.filter(
        (v) => v.cargoClass && TANKER_CARGO.has(v.cargoClass),
      );
    return list;
  }, [allVessels, tankersOnly, fleetOnly, bookmarkedMmsis]);

  const filteredVoyages = useMemo(() => {
    let list = voyagesResp?.voyages ?? [];
    if (fleetOnly) list = list.filter((v) => bookmarkedMmsis.has(v.mmsi));
    return list;
  }, [voyagesResp, fleetOnly, bookmarkedMmsis]);

  const filteredVessels = useMemo(
    () => (stateFilter ? vessels.filter((v) => v.state === stateFilter) : []),
    [vessels, stateFilter],
  );
  const highlightedMmsis = useMemo(
    () => new Set(filteredVessels.map((v) => v.mmsi)),
    [filteredVessels],
  );

  const k = kpiResp?.snapshot;
  const tone = workerTone(kpiResp?.worker);

  const tankerCount = useMemo(
    () =>
      allVessels.filter((v) => v.cargoClass && TANKER_CARGO.has(v.cargoClass))
        .length,
    [allVessels],
  );

  const aisLabel = !kpiResp?.worker?.started
    ? t("ais.off")
    : !kpiResp.worker.lastMessageAt
      ? t("ais.connecting")
      : Date.now() - kpiResp.worker.lastMessageAt < 60_000
        ? t("ais.live")
        : t("ais.stale", {
            s: Math.round(
              (Date.now() - kpiResp.worker.lastMessageAt) / 1000,
            ),
          });

  const classLabel = (cls: VesselClass) => t(`vesselClass.${cls}`) || cls;

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("app.title")}{" "}
            <span className="text-sky-400">· {t("app.subtitle")}</span>
          </h1>
          <p className="text-xs text-slate-400">{t("app.tagline")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <PortSelector
            ports={ports}
            selectedId={portId}
            onSelect={trySelectPort}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            bookmarksEnabled={bookmarksEnabled}
            accessiblePortIds={me?.portsAccessible}
          />
          <LanguageSwitcher />
          <AuthButtons />
          <Link
            href={`/precision?port=${portId}`}
            className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-sky-500 hover:text-sky-300"
          >
            {t("nav.precision")} →
          </Link>
          <Link
            href="/methodology"
            className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-sky-500 hover:text-sky-300"
          >
            {t("nav.methodology")}
          </Link>
          <Link
            href="/guide"
            className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-sky-500 hover:text-sky-300"
          >
            {t("nav.guide")}
          </Link>
          <Link
            href="/sources"
            className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-sky-500 hover:text-sky-300"
          >
            Sources
          </Link>
          {vesselBookmarksEnabled ? (
            <Link
              href="/fleet"
              className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-sky-500 hover:text-sky-300"
            >
              ● {t("nav.fleet")}
            </Link>
          ) : null}
          <Link
            href="/pricing"
            className="rounded border border-sky-700 bg-sky-500/10 px-2 py-1 text-sky-300 hover:border-sky-400 hover:text-sky-200"
          >
            {t("nav.pricing")}
          </Link>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
              tone === "good"
                ? "border-emerald-700 text-emerald-400"
                : tone === "warn"
                  ? "border-amber-700 text-amber-400"
                  : "border-rose-700 text-rose-400"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            AIS {aisLabel}
          </span>
        </div>
      </header>

      {port ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
          <span className="text-sm font-semibold text-slate-200">
            {port.flag} {portName}
            {nativeName ? (
              <span className="ml-2 text-xs italic text-slate-400">
                {nativeName}
              </span>
            ) : null}
            <span className="ml-2 text-xs font-normal text-slate-500">
              {portCountry}
            </span>
          </span>{" "}
          <span className="ms-2">— {portBlurb}</span>{" "}
          <span className="text-slate-500">
            · {t("port.strengths")}:{" "}
            {port.cargoStrength.map((c) => CARGO_LABELS[c]).join(", ")}
          </span>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CongestionGauge
          anchored={k?.anchored ?? 0}
          total={k?.totalVessels ?? 0}
        />
        <WeatherWidget data={weatherResp ?? null} />
      </section>

      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTankersOnly(false);
              setFleetOnly(false);
            }}
            className={`rounded px-3 py-1 ${
              !tankersOnly && !fleetOnly
                ? "bg-sky-500/15 text-sky-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("filter.all")} ({allVessels.length})
          </button>
          <button
            onClick={() => {
              setTankersOnly(true);
              setFleetOnly(false);
            }}
            className={`rounded px-3 py-1 ${
              tankersOnly && !fleetOnly
                ? "bg-sky-500/15 text-sky-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("filter.tankers")} ({tankerCount})
          </button>
          {vesselBookmarksEnabled ? (
            <button
              onClick={onFleetChipClick}
              title={
                fleetOnly && fleetPortIds.length > 1
                  ? `Cycle vers le port suivant de ta flotte (${fleetPortIds.length} ports)`
                  : "Filtrer la carte sur tes navires favoris, port par port"
              }
              className={`rounded px-3 py-1 ${
                fleetOnly
                  ? "bg-sky-500/15 text-sky-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              👁 {t("filter.fleet")}
              {fleetOnly && fleetPortMap.size > 0 ? (
                <span className="ml-1 text-[10px] text-sky-400">
                  ({allVessels.filter((v) => bookmarkedMmsis.has(v.mmsi)).length}/{bookmarkedMmsis.size})
                </span>
              ) : (
                <span className="ml-1 text-[10px]">
                  ({bookmarkedMmsis.size})
                </span>
              )}
              {fleetOnly && fleetPortIds.length > 1 ? (
                <span className="ml-1.5 text-sky-400">▶</span>
              ) : null}
            </button>
          ) : null}
          {vesselBookmarksEnabled && bookmarkedMmsis.size > 0 ? (
            <button
              onClick={() => setShowFavoritesPanel((v) => !v)}
              title="Liste de tous tes navires favoris dans le panneau de droite"
              className={`rounded px-3 py-1 ${
                showFavoritesPanel
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ★ Favoris
              <span className="ml-1 text-[10px]">
                ({bookmarkedMmsis.size})
              </span>
            </button>
          ) : null}
          {fleetOnly && fleetPortMap.size > 1 ? (
            <span className="text-[10px] text-slate-500">
              flotte sur {fleetPortMap.size} ports — clic ▶ pour cycler
            </span>
          ) : null}
          {vesselBookmarksEnabled && bookmarkedMmsis.size > 0 ? (
            <button
              onClick={() => {
                setWorldView((v) => {
                  // Clear vessel selection when entering or leaving world
                  // view so PanToSelected doesn't snap back to a stale pin.
                  setSelectedMmsi(null);
                  return !v;
                });
              }}
              title={
                worldView
                  ? "Revenir à la vue port"
                  : "Voir tous tes navires de flotte sur une carte mondiale"
              }
              className={`rounded px-3 py-1 ${
                worldView
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🌍 {worldView ? "Vue monde" : "Vue monde"}
              {worldView ? (
                <span className="ml-1 text-[10px] text-emerald-400">
                  ({worldVessels.length}/{bookmarkedMmsis.size})
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
        <span className="text-slate-500">{t("filter.subclasses")}</span>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label={t("kpi.totalVessels")}
          value={k?.totalVessels ?? "—"}
        />
        <KpiCard
          label={t("kpi.anchored")}
          value={k?.anchored ?? "—"}
          tone={(k?.anchored ?? 0) > 30 ? "warn" : "default"}
          hint={t("kpi.anchoredHint")}
          active={stateFilter === "anchored"}
          onClick={() => toggleState("anchored")}
        />
        <KpiCard
          label={t("kpi.underway")}
          value={k?.underway ?? "—"}
          active={stateFilter === "underway"}
          onClick={() => toggleState("underway")}
        />
        <KpiCard
          label={t("kpi.moored")}
          value={k?.moored ?? "—"}
          active={stateFilter === "moored"}
          onClick={() => toggleState("moored")}
        />
        <KpiCard
          label={t("kpi.inboundHour")}
          value={k?.inboundLastHour ?? "—"}
          tone="good"
        />
        <KpiCard
          label={t("kpi.activeVoyages")}
          value={voyagesResp?.count ?? "—"}
          hint={tankersOnly ? t("kpi.tankersHint") : t("kpi.allHint")}
        />
      </section>

      {stateFilter ? (
        <section className="rounded-lg border border-amber-700/50 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="uppercase tracking-wider text-amber-300">
              {t(`kpi.${stateFilter === "anchored" ? "anchored" : stateFilter === "underway" ? "underway" : "moored"}`)}{" "}
              · {filteredVessels.length}
            </span>
            <button
              onClick={() => setStateFilter(null)}
              className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:border-sky-500"
            >
              ✕
            </button>
          </div>
          <div className="scroll-thin max-h-48 overflow-y-auto">
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVessels.slice(0, 60).map((v) => (
                <li key={v.mmsi}>
                  <button
                    onClick={() => setSelectedMmsi(v.mmsi)}
                    className={`w-full rounded px-2 py-1 text-left text-xs transition-colors ${
                      v.mmsi === selectedMmsi
                        ? "bg-sky-500/15 text-sky-200"
                        : "text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="font-medium">
                      {v.name ?? `MMSI ${v.mmsi}`}
                    </span>
                    <span className="ml-2 text-slate-500">
                      {v.cargoClass ?? v.vesselClass} · {v.sog.toFixed(1)} kn
                      {v.zone ? ` · ${v.zone}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {filteredVessels.length > 60 ? (
              <div className="mt-2 text-center text-[10px] text-slate-500">
                … {filteredVessels.length - 60} de plus
              </div>
            ) : null}
            {filteredVessels.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">—</div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2 h-[440px] sm:h-[560px] lg:h-[680px]">
          {worldView ? (
            <MapView
              vessels={worldVessels}
              center={WORLD_CENTER}
              bbox={WORLD_BBOX}
              zones={EMPTY_ZONES}
              portKey="__world__"
              selectedMmsi={selectedMmsi}
              onSelect={setSelectedMmsi}
              selectedTrack={EMPTY_TRACK}
              highlightedMmsis={undefined}
              sarDetections={undefined}
              panTo={panTo ?? undefined}
            />
          ) : port ? (
            <MapView
              vessels={vessels}
              center={port.center}
              bbox={port.bbox}
              zones={port.zones}
              portKey={port.id}
              selectedMmsi={selectedMmsi}
              onSelect={setSelectedMmsi}
              selectedTrack={selectedTrack}
              highlightedMmsis={highlightedMmsis}
              sarDetections={sarResp?.detections.map((d) => ({
                id: d.id,
                ts: d.ts,
                lat: d.lat,
                lon: d.lon,
                intensity: d.intensity,
                sizePx: d.size_px,
              }))}
              panTo={panTo ?? undefined}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-sm text-slate-500" />
          )}
        </div>
        <div className="h-[440px] sm:h-[560px] lg:h-[680px]">
          {showFavoritesPanel ? (
            <FavoritesPanel
              selectedMmsi={selectedMmsi}
              onSelect={handleFavoritesSelect}
              onSelectPort={(id) => {
                trySelectPort(id);
                setShowFavoritesPanel(false);
              }}
              onToggleBookmark={toggleVesselBookmark}
            />
          ) : (
            <VoyagesTable
              voyages={filteredVoyages}
              loading={!voyagesResp}
              selectedMmsi={selectedMmsi}
              onSelect={setSelectedMmsi}
              bookmarkedMmsis={bookmarkedMmsis}
              onToggleBookmark={toggleVesselBookmark}
              bookmarksEnabled={vesselBookmarksEnabled}
            />
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <AccuracyPanel data={accuracyResp ?? null} />
        <AnomalyPanel anomalies={anomaliesResp?.anomalies ?? []} />
        <FlowChart history={histResp?.history ?? []} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-400">
            {t("section.fleetMix")}
          </div>
          <div className="space-y-1">
            {(
              ["cargo", "tanker", "passenger", "fishing", "tug", "pilot", "other"] as VesselClass[]
            ).map((cls) => {
              const n = k?.byClass?.[cls] ?? 0;
              const pct = k?.totalVessels
                ? Math.round((n / k.totalVessels) * 100)
                : 0;
              return (
                <div key={cls} className="flex items-center gap-2 text-sm">
                  <span className="w-24 text-slate-400 capitalize">
                    {classLabel(cls)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-sky-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right tabular-nums text-slate-300">
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {t("channel.avgSpeed")} :{" "}
            <span className="text-slate-300">
              {k?.avgSpeedChannel?.toFixed(1) ?? "—"} kn
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-400">
            {t("section.cargoMix")}
          </div>
          <div className="space-y-1">
            {(["crude", "product", "chemical", "lng", "lpg"] as CargoClass[]).map(
              (c) => {
                const n = allVessels.filter((v) => v.cargoClass === c).length;
                const pct = tankerCount
                  ? Math.round((n / tankerCount) * 100)
                  : 0;
                return (
                  <div key={c} className="flex items-center gap-2 text-sm">
                    <span className="w-24 text-slate-400">
                      {CARGO_LABELS[c]}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right tabular-nums text-slate-300">
                      {n}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      <footer className="space-y-2 border-t border-slate-800 pt-3 text-xs text-slate-500">
        <div>
          {t("footer.refresh")} {t("footer.persistence")}{" "}
          {t("footer.portsCount", { n: ports.length })}
        </div>
        <Attributions compact />
      </footer>
      {selectedMmsi != null ? (
        <VesselDetailPanel
          mmsi={selectedMmsi}
          port={portId}
          onClose={() => setSelectedMmsi(null)}
          bookmarked={bookmarkedMmsis.has(selectedMmsi)}
          onToggleBookmark={toggleVesselBookmark}
          bookmarksEnabled={vesselBookmarksEnabled}
        />
      ) : null}

      {upgradeFeature ? (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setUpgradeFeature(null)}
        >
          <div
            className="max-w-md rounded-lg border border-sky-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-100">
              {upgradeFeature.title}
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              {upgradeFeature.body}
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/pricing"
                className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
              >
                Voir les tarifs →
              </Link>
              <button
                onClick={() => setUpgradeFeature(null)}
                className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-sky-500"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {upgradePort ? (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setUpgradePort(null)}
        >
          <div
            className="max-w-md rounded-lg border border-sky-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-100">
              🔒 Port verrouillé en plan Free
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Ton plan Free te donne accès à <strong>3 ports</strong> que tu
              choisis dans ta liste favoris (★). Pour accéder à tous les 51
              ports stratégiques, passe en plan{" "}
              <strong>Starter</strong> (15 ports, 129 €/mois) ou{" "}
              <strong>Pro+</strong> (les 51, 499 €/mois).
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/pricing"
                className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
              >
                Voir les tarifs →
              </Link>
              <button
                onClick={() => setUpgradePort(null)}
                className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-sky-500"
              >
                Plus tard
              </button>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Astuce : tu peux remplacer un de tes 3 favoris en cliquant l&apos;icône
              ☐ dans le sélecteur de port.
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
