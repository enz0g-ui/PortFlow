"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { KpiCard } from "./components/KpiCard";
// FlowChart pulls in recharts (~150-300KB). It's a below-the-fold panel,
// so defer it (ssr:false) to keep recharts out of the homepage's critical
// JS bundle and shorten LCP. Placeholder matches the chart's h-[260px] to
// avoid layout shift.
const FlowChart = dynamic(
  () => import("./components/FlowChart").then((m) => m.FlowChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-full animate-pulse rounded-lg border border-slate-800 bg-slate-900/60" />
    ),
  },
);
import { MapView } from "./components/MapView";
import { VoyagesTable, type ActiveVoyage } from "./components/VoyagesTable";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { AccuracyPanel } from "./components/AccuracyPanel";
import type { DarkEventEntry } from "./components/DarkEventsPanel";
import type {
  EncounterEntry,
  LoiteringEntry,
} from "./components/EncountersLoiteringPanel";
// Below-the-fold detection panels: deferred so their JS leaves the initial
// bundle (lower TBT) and a reserved-height skeleton with a loading spinner
// holds their space (lower CLS) instead of the page jumping when they fill.
function PanelSkeleton() {
  return (
    <div className="flex min-h-[160px] items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-500">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border border-slate-600 border-t-slate-300" />
      Loading…
    </div>
  );
}
const AnomalyPanel = dynamic(
  () => import("./components/AnomalyPanel").then((m) => m.AnomalyPanel),
  { ssr: false, loading: () => <PanelSkeleton /> },
);
const DarkEventsPanel = dynamic(
  () => import("./components/DarkEventsPanel").then((m) => m.DarkEventsPanel),
  { ssr: false, loading: () => <PanelSkeleton /> },
);
const EncountersLoiteringPanel = dynamic(
  () =>
    import("./components/EncountersLoiteringPanel").then(
      (m) => m.EncountersLoiteringPanel,
    ),
  { ssr: false, loading: () => <PanelSkeleton /> },
);
import { CongestionGauge } from "./components/CongestionGauge";
import {
  ContextPanel,
  MixPanel,
  WorkspaceRail,
} from "./components/WorkspacePanels";
import { WeatherWidget } from "./components/WeatherWidget";
import { VesselDetailPanel } from "./components/VesselDetailPanel";
import { PortSelector, type PortInfo } from "./components/PortSelector";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { AuthButtons } from "./components/AuthButtons";
import { DemoButton } from "./components/DemoButton";
import { Attributions } from "./components/Attributions";
import { DegradationBanner } from "./components/DegradationBanner";
import { CARGO_LABELS } from "@/lib/cargo";
import { getChokepointContext } from "@/lib/chokepoint-context";
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
  aisCoverage?: "good" | "limited" | "low";
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
  inboundCount?: number;
  waitingCount?: number;
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

export default function Dashboard() {
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
  // Click-to-filter from FleetMix / CargoMix lists below the map. Toggling
  // either filters the map vessels + voyages table by class/cargo. Mutually
  // exclusive in practice (vessel class and cargo class describe the same
  // vessel from different angles) but both kept independent for clarity.
  const [selectedVesselClassFilter, setSelectedVesselClassFilter] =
    useState<VesselClass | null>(null);
  const [selectedCargoFilter, setSelectedCargoFilter] =
    useState<CargoClass | null>(null);
  // Toggle for the amber state-filter list — click "X de plus" to render
  // all entries with a taller scroll container instead of capping at 60.
  const [filteredListExpanded, setFilteredListExpanded] = useState(false);
  // Auto-collapse when the filter context changes (different state /
  // class / cargo) — avoids confusing carry-over of an "expanded" view
  // from the previous filter onto the new vessel list.
  useEffect(() => {
    setFilteredListExpanded(false);
  }, [stateFilter, selectedVesselClassFilter, selectedCargoFilter]);
  const [me, setMe] = useState<{
    tier: string;
    portsAccessible: "all" | string[];
  } | null>(null);
  const [upgradePort, setUpgradePort] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  interface SearchMatch {
    mmsi: number;
    name?: string;
    callsign?: string;
    portId: string;
    portName: string;
    flag: string;
    country: string;
    lat: number;
    lon: number;
    sog: number;
    state: string;
    cargoClass?: string;
  }
  const [globalSearchMatches, setGlobalSearchMatches] = useState<
    SearchMatch[]
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setGlobalSearchMatches([]);
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(() => {
      fetch(`/api/search/vessels?q=${encodeURIComponent(q)}&limit=20`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          setGlobalSearchMatches(
            (data.matches as SearchMatch[]) ?? [],
          );
        })
        .catch(() => {});
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [searchQuery]);

  const handleSearchSelect = (m: SearchMatch) => {
    setSelectedMmsi(m.mmsi);
    if (worldView) {
      setPanTo({ lat: m.lat, lon: m.lon, tick: Date.now() });
    } else if (canAccessPort(m.portId)) {
      if (m.portId !== portId) setPortId(m.portId);
      setPanTo({ lat: m.lat, lon: m.lon, tick: Date.now() });
    } else {
      setUpgradePort(m.portId);
    }
    setSearchQuery("");
    setSearchOpen(false);
  };

  const [fleetPortMap, setFleetPortMap] = useState<Map<string, number>>(
    new Map(),
  );
  const [worldView, setWorldView] = useState(false);
  const [worldVessels, setWorldVessels] = useState<Vessel[]>([]);
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false);
  // Workspace v2 : la sélection s'affiche dans le panneau contexte accolé à
  // la carte ; l'overlay VesselDetailPanel ne s'ouvre plus que sur demande.
  const [detailOpen, setDetailOpen] = useState(false);
  const [byoSources, setByoSources] = useState<string[]>([]);
  const [byoVessels, setByoVessels] = useState<Vessel[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/integrations", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { keys?: Array<{ sourceId: string }>; canByoKey?: boolean } | null) => {
        if (cancelled || !data || !data.canByoKey) return;
        const ids = Array.from(
          new Set((data.keys ?? []).map((k) => k.sourceId)),
        );
        setByoSources(ids);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (byoSources.length === 0 || !portId) {
      setByoVessels([]);
      return;
    }
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          byoSources.map((s) =>
            fetch(
              `/api/user/satellite/${s}/fixes?port=${encodeURIComponent(portId)}&sinceHours=6`,
              { cache: "no-store" },
            )
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
          ),
        );
        if (cancelled) return;
        const merged: Vessel[] = [];
        for (const r of results) {
          if (!r?.fixes) continue;
          for (const f of r.fixes as Array<{
            mmsi?: number;
            name?: string;
            lat: number;
            lon: number;
            sog?: number;
            cog?: number;
            ts: number;
            cargoClass?: string;
            source?: string;
          }>) {
            if (!f.mmsi) continue;
            const cargo = (f.cargoClass ?? null) as CargoClass | null;
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
            merged.push({
              mmsi: f.mmsi,
              name: f.name,
              latitude: f.lat,
              longitude: f.lon,
              sog: f.sog ?? 0,
              cog: f.cog ?? 0,
              state: "underway",
              vesselClass: vClass,
              cargoClass: cargo ?? undefined,
              lastUpdate: f.ts,
            });
          }
        }
        setByoVessels(merged);
      } catch {
        /* ignore */
      }
    };
    fetchAll();
    const id = window.setInterval(fetchAll, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [byoSources, portId]);
  const [panTo, setPanTo] = useState<{
    lat: number;
    lon: number;
    tick: number;
  } | null>(null);

  const handleFavoritesSelect = (
    mmsi: number,
    pos?: { lat: number; lon: number },
    vesselPortId?: string,
  ) => {
    setSelectedMmsi(mmsi);
    if (
      vesselPortId &&
      vesselPortId !== portId &&
      canAccessPort(vesselPortId) &&
      !worldView
    ) {
      setPortId(vesselPortId);
    }
    if (pos) {
      setPanTo({ lat: pos.lat, lon: pos.lon, tick: Date.now() });
    }
  };

  const handleVoyageSelect = (mmsi: number) => {
    setSelectedMmsi(mmsi);
    const v = allVessels.find((x) => x.mmsi === mmsi);
    if (v) {
      setPanTo({ lat: v.latitude, lon: v.longitude, tick: Date.now() });
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
              title: t("vessel.bookmark.upgrade.title"),
              body: t("vessel.bookmark.upgrade.body"),
            });
          } else if (json.error?.includes("limit reached")) {
            setUpgradeFeature({
              title: t("vessel.bookmark.limitTitle"),
              body: t("vessel.bookmark.limitBody"),
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
  const chokepointContext = port ? getChokepointContext(port.id) : undefined;
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
  // Recent trails for all vessels in the current port — used by the map to
  // draw fading lines behind each marker (à la VesselFinder / Spire).
  // Skipped in world view (too many vessels, too zoomed-out to be useful).
  // Polled every 60s — the worker writes to `positions` ~once per minute,
  // and a 30s server-side cache absorbs the read load.
  const trailsResp = usePolling<{
    trails: Record<string, Array<[number, number, number]>>;
  }>(worldView ? null : `/api/trails${q}&minutes=30`, 60_000);
  const trails = trailsResp?.trails;

  // Dark fleet detection — AIS-off gap events from our in-house detector.
  // Cadence: every 5 min is enough since the server-side scanner runs hourly.
  const darkEventsResp = usePolling<{
    summary: { total: number; open: number; closed: number };
    events: DarkEventEntry[];
  }>(worldView ? null : `/api/dark-events${q}&days=30`, 5 * 60_000);
  const darkEvents = darkEventsResp?.events ?? [];

  // In-house ship-to-ship encounters in chokepoint zones (replaces GFW).
  // Encounter scanner runs every 15 min; loitering every 30 min.
  const encountersResp = usePolling<{ encounters: EncounterEntry[] }>(
    "/api/encounters?days=30&limit=50",
    5 * 60_000,
  );
  const loiteringResp = usePolling<{ events: LoiteringEntry[] }>(
    "/api/loitering?days=30&limit=50",
    5 * 60_000,
  );
  const encounters = encountersResp?.encounters ?? [];
  const loitering = loiteringResp?.events ?? [];

  const handleDarkEventSelect = (
    mmsi: number,
    lat: number,
    lon: number,
  ) => {
    setSelectedMmsi(mmsi);
    setPanTo({ lat, lon, tick: Date.now() });
  };

  const toggleState = (s: "anchored" | "underway" | "moored") =>
    setStateFilter((cur) => (cur === s ? null : s));

  const allVessels = useMemo(() => {
    const live = vesselsResp?.vessels ?? [];
    if (byoVessels.length === 0) return live;
    // Merge BYO vendor fixes — freshest lastUpdate wins per MMSI.
    const map = new Map<number, Vessel>();
    for (const v of live) map.set(v.mmsi, v);
    for (const v of byoVessels) {
      const existing = map.get(v.mmsi);
      if (!existing) {
        map.set(v.mmsi, v);
      } else if (v.lastUpdate > existing.lastUpdate) {
        // Vendor has fresher data — overlay but keep static fields from live
        map.set(v.mmsi, { ...existing, ...v });
      }
    }
    return Array.from(map.values());
  }, [vesselsResp, byoVessels]);
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return (mmsi: number, name?: string, callsign?: string): boolean => {
      if (String(mmsi).includes(q)) return true;
      if (name && name.toLowerCase().includes(q)) return true;
      if (callsign && callsign.toLowerCase().includes(q)) return true;
      return false;
    };
  }, [searchQuery]);

  const vessels = useMemo(() => {
    let list = allVessels;
    if (fleetOnly) list = list.filter((v) => bookmarkedMmsis.has(v.mmsi));
    if (tankersOnly)
      list = list.filter(
        (v) => v.cargoClass && TANKER_CARGO.has(v.cargoClass),
      );
    if (selectedVesselClassFilter)
      list = list.filter((v) => v.vesselClass === selectedVesselClassFilter);
    if (selectedCargoFilter)
      list = list.filter((v) => v.cargoClass === selectedCargoFilter);
    if (searchMatches)
      list = list.filter((v) => searchMatches(v.mmsi, v.name, v.callsign));
    return list;
  }, [
    allVessels,
    tankersOnly,
    fleetOnly,
    bookmarkedMmsis,
    searchMatches,
    selectedVesselClassFilter,
    selectedCargoFilter,
  ]);

  // MMSIs that pass the current vessel-class filter (computed against the
  // live `vessels` map which carries vesselClass; ActiveVoyage doesn't).
  // Used below to filter the voyages-actifs table so users can sort the
  // class-filtered subset by ETA / cargo / SOG / distance / etc.
  const classFilteredMmsis = useMemo(() => {
    if (!selectedVesselClassFilter) return null;
    return new Set(vessels.map((v) => v.mmsi));
  }, [vessels, selectedVesselClassFilter]);

  const filteredVoyages = useMemo(() => {
    let list = voyagesResp?.voyages ?? [];
    // Active-voyages table shows only inbound voyages. Waiting-in-roads
    // surfaces as its own KPI to avoid polluting the ETA-sorted view with
    // anchored vessels whose ETA is stale (often the source of "-60h"
    // negative-ETA noise the reviewer flagged).
    list = list.filter((v) => v.voyageState !== "waiting");
    if (fleetOnly) list = list.filter((v) => bookmarkedMmsis.has(v.mmsi));
    if (selectedCargoFilter)
      list = list.filter((v) => v.cargoClass === selectedCargoFilter);
    if (classFilteredMmsis)
      list = list.filter((v) => classFilteredMmsis.has(v.mmsi));
    if (stateFilter)
      list = list.filter((v) => v.currentState === stateFilter);
    if (searchMatches)
      list = list.filter((v) => searchMatches(v.mmsi, v.name));
    return list;
  }, [
    voyagesResp,
    fleetOnly,
    bookmarkedMmsis,
    searchMatches,
    selectedCargoFilter,
    classFilteredMmsis,
    stateFilter,
  ]);

  const filteredVessels = useMemo(
    () => (stateFilter ? vessels.filter((v) => v.state === stateFilter) : []),
    [vessels, stateFilter],
  );

  /**
   * State breakdown of the filtered subset (after FleetMix / CargoMix
   * click-to-filter). Drives the contextual strip that appears below the
   * KPI tiles when a class/cargo filter is active. Returns null when no
   * filter is active so we don't render the strip.
   */
  const classFilterBreakdown = useMemo(() => {
    if (!selectedVesselClassFilter && !selectedCargoFilter) return null;
    let anchored = 0,
      underway = 0,
      moored = 0;
    for (const v of vessels) {
      if (v.state === "anchored") anchored++;
      else if (v.state === "underway") underway++;
      else if (v.state === "moored") moored++;
    }
    return { anchored, underway, moored, total: vessels.length };
  }, [vessels, selectedVesselClassFilter, selectedCargoFilter]);
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

  // ── Workspace v2 (maquette Claude Design) : données dérivées du panneau
  // contexte (navire sélectionné + feed risque) et du mix compact. Aucune
  // nouvelle source — tout vient de l'état live existant.
  const contextVessel =
    selectedMmsi != null
      ? (allVessels.find((v) => v.mmsi === selectedMmsi) ?? null)
      : null;
  const contextVoyage =
    selectedMmsi != null
      ? (filteredVoyages.find((v) => v.mmsi === selectedMmsi) ?? null)
      : null;
  const riskFeedItems = [
    ...darkEvents.slice(0, 4).map((e) => ({
      id: `d${e.id}`,
      name: e.name ?? `MMSI ${e.mmsi}`,
      meta: `Dark · ${e.cargoClass ?? "—"}${e.startZone ? ` · ${e.startZone}` : ""}`,
      value: e.durationHours != null ? `${e.durationHours.toFixed(1)} h` : "—",
      mmsi: e.mmsi,
    })),
    ...encounters.slice(0, 2).map((e) => ({
      id: `e${e.id}`,
      name: `${e.vesselAName ?? e.mmsiA} × ${e.vesselBName ?? e.mmsiB}`,
      meta: t("ws.feed.sts"),
      value: e.durationH != null ? `${e.durationH.toFixed(1)} h` : "—",
      mmsi: e.mmsiA,
    })),
    ...loitering.slice(0, 2).map((e) => ({
      id: `l${e.id}`,
      name: e.name ?? `MMSI ${e.mmsi}`,
      meta: t("ws.feed.loitering"),
      value: e.durationH != null ? `${e.durationH.toFixed(1)} h` : "—",
      mmsi: e.mmsi,
    })),
  ];
  const fleetMixData = (
    ["cargo", "tanker", "passenger", "fishing", "tug", "pilot", "other"] as VesselClass[]
  )
    .map((c) => ({ label: classLabel(c), n: k?.byClass?.[c] ?? 0 }))
    .filter((m) => m.n > 0);
  const cargoMixData = [...TANKER_CARGO]
    .map((c) => ({
      label: CARGO_LABELS[c],
      n: allVessels.filter((v) => v.cargoClass === c).length,
    }))
    .filter((m) => m.n > 0);

  return (
    <main className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col">
      <DegradationBanner />
      {/* Command bar — mockup « la preuve d'abord » : barre dense, port +
          badge MAE proéminent, nav condensée. Full-bleed dans le <main> padded
          via marges négatives, collée en haut. */}
      {/* z-[1100] : au-dessus des panes Leaflet (~1000), sinon le dropdown
          du sélecteur de ports passe SOUS la carte (contexte d'empilement). */}
      <header className="sticky top-0 z-[1100] flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-800 bg-slate-900/95 px-4 py-2.5 backdrop-blur">
        {/* « intelligence » en toutes lettres, sur deux lignes — « intel »
            évoquait la marque Intel (retour user 14/07). */}
        <Link href="/?home" title="Port Flow — home" className="flex items-center gap-2">
          <span className="text-[15px] font-bold tracking-[-0.02em] text-slate-100">
            PORT FLOW
          </span>
          <span className="hidden flex-col font-mono text-[7.5px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-sky-500 sm:flex">
            <span>tanker</span>
            <span>intelligence</span>
          </span>
        </Link>

        <PortSelector
          ports={ports}
          selectedId={portId}
          onSelect={trySelectPort}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={toggleBookmark}
          bookmarksEnabled={bookmarksEnabled}
          accessiblePortIds={me?.portsAccessible}
        />

        {/* MAE badge — the proof, front and centre. Même règle d'honnêteté
            que /precision : pas de chiffre sous 20 voyages clos (un port
            froid afficherait une valeur aberrante). */}
        {accuracyResp?.maeHours != null &&
        (accuracyResp.sampleCount ?? 0) >= 20 ? (
          <Link
            href={`/precision?port=${portId}`}
            className="inline-flex items-center gap-2 rounded border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 hover:border-emerald-400/50"
            title={t("ws.maeBadgeTitle")}
          >
            <span className="h-1.5 w-1.5 animate-[pf-pulse_2s_infinite] rounded-full bg-emerald-300" />
            <span className="font-mono text-[11px] font-semibold text-emerald-300">
              MAE {accuracyResp.maeHours.toFixed(1)} h
            </span>
          </Link>
        ) : (
          <Link
            href={`/precision?port=${portId}`}
            className="inline-flex items-center gap-2 rounded border border-slate-700 px-2.5 py-1.5 font-mono text-[11px] text-slate-400 hover:border-sky-500"
            title={t("ws.benchBadgeTitle")}
          >
            benchmark →
          </Link>
        )}

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${
            tone === "good"
              ? "border-emerald-700 text-emerald-300"
              : tone === "warn"
                ? "border-amber-700 text-amber-300"
                : "border-rose-700 text-rose-300"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          AIS {aisLabel}
        </span>
        {byoVessels.length > 0 ? (
          <span
            className="inline-flex items-center gap-2 rounded-full border border-indigo-700 px-2.5 py-1 text-xs text-indigo-300"
            title={`Enrichissement BYO via ${byoSources.join(", ")}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            BYO {byoVessels.length}
          </span>
        ) : null}

        {/* Right cluster — nav condensée + demo + auth. min-height réserve la
            hauteur de la rangée Clerk-gated (culprit CLS 0.5 historique). */}
        <div className="ml-auto flex min-h-[2rem] flex-wrap content-center items-center justify-end gap-1.5 text-xs">
          <Link href={`/precision?port=${portId}`} className="hidden rounded px-2 py-1 text-slate-300 hover:text-white lg:inline">
            {t("nav.precision")}
          </Link>
          <Link href="/methodology" className="hidden rounded px-2 py-1 text-slate-300 hover:text-white lg:inline">
            {t("nav.methodology")}
          </Link>
          <Link href="/guide" className="hidden rounded px-2 py-1 text-slate-300 hover:text-white xl:inline">
            {t("nav.guide")}
          </Link>
          <Link href="/news" className="hidden rounded px-2 py-1 text-slate-300 hover:text-white lg:inline">
            News
          </Link>
          <Link href="/sources" className="hidden rounded px-2 py-1 text-slate-300 hover:text-white xl:inline">
            Sources
          </Link>
          {vesselBookmarksEnabled ? (
            <Link href="/fleet" className="rounded px-2 py-1 text-slate-300 hover:text-white">
              ● {t("nav.fleet")}
            </Link>
          ) : null}
          <Link href="/pricing" className="rounded px-2 py-1 text-slate-300 hover:text-white">
            {t("nav.pricing")}
          </Link>
          <Link
            href="/account"
            className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-amber-500 hover:text-amber-300"
            title="Alerts — Slack · Telegram · Email · Webhook · Discord — configure in Account"
          >
            🔔
          </Link>
          <Link
            href="/m"
            className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-sky-500 hover:text-sky-300"
            title="Phone-first glance view — watchlist ETAs + alerts"
          >
            📱
          </Link>
          <LanguageSwitcher />
          <DemoButton />
          <AuthButtons />
        </div>
      </header>

      {/* ═══ Workspace « tout sur un écran » (maquette Claude Design v2) :
          rail | KPI strip → filtres → carte + panneau contexte → voyages +
          mix. Hauteur viewport sur desktop — la table défile, pas la page.
          Les panneaux détaillés historiques restent SOUS le workspace. ═══ */}
      <div id="top" className="flex min-h-0 flex-1 lg:h-[calc(100dvh-3.25rem)]">
        <WorkspaceRail portId={portId} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">

      <section className="grid flex-none grid-cols-2 gap-px border-b border-slate-800 bg-slate-800/40 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
        <KpiCard
          label={t("kpi.totalVessels")}
          value={k?.totalVessels ?? "—"}
          active={stateFilter === null}
          onClick={() => setStateFilter(null)}
          hint={stateFilter ? t("filter.clearStateTooltip") : undefined}
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
          value={voyagesResp?.inboundCount ?? voyagesResp?.count ?? "—"}
          hint={
            voyagesResp?.waitingCount && voyagesResp.waitingCount > 0
              ? t("kpi.activeVoyagesInbound")
              : tankersOnly
                ? t("kpi.tankersHint")
                : t("kpi.allHint")
          }
        />
        <KpiCard
          label={t("kpi.waitingInRoads")}
          value={voyagesResp?.waitingCount ?? "—"}
          hint={t("kpi.waitingHint")}
          tone={
            voyagesResp?.waitingCount && voyagesResp.waitingCount > 5
              ? "warn"
              : "default"
          }
        />
        {/* Promo alertes — la feature la plus différenciante est invisible
            pour un visiteur pressé : cellule accrocheuse, cloche pulsante,
            même vocabulaire que la cloche de la command bar. */}
        <Link
          href="/account"
          title={t("kpi.alertPromoHint")}
          className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3.5 py-2.5 text-left transition-colors hover:border-amber-400 hover:bg-amber-400/15"
        >
          <div className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-amber-300">
            {t("kpi.alertPromo")}
          </div>
          <div className="flex items-baseline gap-1.5 font-mono text-[21px] font-semibold text-amber-300">
            <span className="inline-block animate-[pf-pulse_2s_infinite]">🔔</span>
            <span className="font-sans text-[12px] font-semibold leading-tight">
              {t("kpi.alertPromoHint").split("—")[0].trim()}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-amber-300/60">
            Slack · Telegram · Email →
          </div>
        </Link>
      </section>

      <div className="mx-2 mb-1 mt-2 flex flex-none items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs">
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
                  ? t("filter.fleetCycleTooltip", { n: fleetPortIds.length })
                  : t("filter.fleetTooltip")
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
              title={t("filter.favoritesPanelTooltip")}
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
              {t("filter.fleetMultiPortsHint", { n: fleetPortMap.size })}
            </span>
          ) : null}
          <div className="relative ml-auto flex items-center">
            <svg
              className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-slate-500"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="7" cy="7" r="5" />
              <line x1="14" y1="14" x2="11" y2="11" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
              placeholder={t("filter.searchPlaceholder", { n: 51 })}
              className="w-64 rounded border border-slate-700 bg-slate-950 pl-7 pr-7 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-1 flex h-5 w-5 items-center justify-center text-slate-500 hover:text-slate-200"
                aria-label={t("filter.searchClear")}
              >
                ✕
              </button>
            ) : null}
            {searchOpen &&
            searchQuery.trim().length >= 2 &&
            globalSearchMatches.length > 0 ? (
              <div className="scroll-thin absolute right-0 top-8 z-[1500] max-h-80 w-80 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
                <div className="sticky top-0 border-b border-slate-800 bg-slate-900/95 px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                  {globalSearchMatches.length} match
                  {globalSearchMatches.length > 1 ? "es" : ""} sur 51 ports
                </div>
                {globalSearchMatches.map((m) => (
                  <button
                    key={m.mmsi}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSearchSelect(m);
                    }}
                    className="flex w-full items-start gap-2 border-t border-slate-800 px-3 py-2 text-left text-xs hover:bg-sky-500/10"
                  >
                    <span className="text-base leading-none">{m.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-100">
                        {m.name ?? `MMSI ${m.mmsi}`}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        MMSI {m.mmsi}
                        {m.callsign ? ` · ${m.callsign}` : ""}
                        {m.cargoClass ? ` · ${m.cargoClass}` : ""}
                      </div>
                      <div className="text-[10px] text-sky-400">
                        à {m.portName} · {m.state}
                        {m.sog > 0 ? ` · ${m.sog.toFixed(1)} kn` : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchOpen &&
              searchQuery.trim().length >= 2 &&
              globalSearchMatches.length === 0 ? (
              <div className="absolute right-0 top-8 z-[1500] w-80 rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-xs text-slate-500 shadow-2xl">
                Aucun navire trouvé pour &quot;{searchQuery.trim()}&quot;
                <div className="mt-1 text-[10px] text-slate-600">
                  Cherche par nom, MMSI ou callsign · min. 2 caractères
                </div>
              </div>
            ) : null}
          </div>
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
                  ? t("filter.worldViewBackTooltip")
                  : t("filter.worldViewTooltip")
              }
              className={`rounded px-3 py-1 ${
                worldView
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🌍 {t("filter.worldView")}
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

      {classFilterBreakdown ? (
        <section className="rounded-lg border border-sky-700/50 bg-sky-500/5 p-3">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs">
            <span className="uppercase tracking-wider text-sky-300">
              {t("filter.active")} :{" "}
              <span className="font-semibold text-sky-100">
                {selectedVesselClassFilter
                  ? t("filter.classLabel", {
                      c: classLabel(selectedVesselClassFilter),
                    })
                  : selectedCargoFilter
                    ? t("filter.cargoLabel", {
                        c: CARGO_LABELS[selectedCargoFilter],
                      })
                    : ""}
              </span>{" "}
              ·{" "}
              {t("filter.vesselsCount", { n: classFilterBreakdown.total })}
            </span>
            <button
              onClick={() => {
                setSelectedVesselClassFilter(null);
                setSelectedCargoFilter(null);
              }}
              className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:border-sky-500"
            >
              {t("filter.clear")}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["anchored", classFilterBreakdown.anchored, t("kpi.anchored")],
                ["underway", classFilterBreakdown.underway, t("kpi.underway")],
                ["moored", classFilterBreakdown.moored, t("kpi.moored")],
              ] as const
            ).map(([state, count, label]) => {
              const active = stateFilter === state;
              return (
                <button
                  key={state}
                  onClick={() => toggleState(state)}
                  disabled={count === 0}
                  className={`rounded border px-2 py-1.5 text-left transition-colors ${
                    active
                      ? "border-amber-600 bg-amber-500/10"
                      : count > 0
                        ? "border-slate-700 bg-slate-900/40 hover:border-sky-500"
                        : "border-slate-800 bg-slate-900/20 opacity-40 cursor-not-allowed"
                  }`}
                  title={
                    count > 0
                      ? active
                        ? t("filter.clearStateTooltip")
                        : t("filter.applyStateTooltip")
                      : t("filter.noVesselsState")
                  }
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {label}
                  </div>
                  <div className="text-xl font-semibold tabular-nums text-slate-100">
                    {count}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

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
          <div
            className={`scroll-thin overflow-y-auto ${
              filteredListExpanded ? "max-h-[480px]" : "max-h-48"
            }`}
          >
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {(filteredListExpanded
                ? filteredVessels
                : filteredVessels.slice(0, 60)
              ).map((v) => (
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
              <div className="mt-2 text-center">
                <button
                  onClick={() => setFilteredListExpanded((v) => !v)}
                  className="rounded border border-amber-700/40 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200 hover:border-amber-500 hover:bg-amber-500/20"
                >
                  {filteredListExpanded
                    ? t("filter.collapse")
                    : t("filter.expand", {
                        n: filteredVessels.length - 60,
                      })}
                </button>
              </div>
            ) : null}
            {filteredVessels.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">—</div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="grid min-h-0 flex-1 border-t border-slate-800 lg:grid-cols-[1fr_384px]">
      <section className="h-[440px] lg:h-full lg:min-h-0">
        {worldView ? (
          <MapView
            vessels={
              searchMatches
                ? worldVessels.filter((v) =>
                    searchMatches(v.mmsi, v.name, v.callsign),
                  )
                : worldVessels
            }
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
            selectedVesselClass={selectedVesselClassFilter}
            onSelectVesselClass={setSelectedVesselClassFilter}
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
            trails={trails}
            panTo={panTo ?? undefined}
            selectedVesselClass={selectedVesselClassFilter}
            onSelectVesselClass={setSelectedVesselClassFilter}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-sm text-slate-500" />
        )}
      </section>

      <ContextPanel
        vessel={contextVessel}
        voyage={contextVoyage}
        portName={`${port?.flag ?? ""} ${portName}`.trim()}
        portBlurb={portBlurb}
        darkCount={darkEvents.length}
        stsCount={encounters.length}
        loiterCount={loitering.length}
        riskItems={riskFeedItems}
        onSelectMmsi={setSelectedMmsi}
        onOpenDetail={() => setDetailOpen(true)}
        onClear={() => setSelectedMmsi(null)}
      />
      </div>

      <div
        id="voyages"
        className="grid flex-none border-t border-slate-800 lg:h-[300px] lg:grid-cols-[1fr_384px]"
      >
      <section className="min-h-[300px] lg:min-h-0 lg:overflow-y-auto">
        {showFavoritesPanel ? (
          <FavoritesPanel
            selectedMmsi={selectedMmsi}
            onSelect={handleFavoritesSelect}
            onSelectPort={(id) => {
              trySelectPort(id);
              setShowFavoritesPanel(false);
            }}
            onToggleBookmark={toggleVesselBookmark}
            searchQuery={searchQuery}
          />
        ) : (
          <VoyagesTable
            voyages={filteredVoyages}
            loading={!voyagesResp}
            selectedMmsi={selectedMmsi}
            onSelect={handleVoyageSelect}
            bookmarkedMmsis={bookmarkedMmsis}
            onToggleBookmark={toggleVesselBookmark}
            bookmarksEnabled={vesselBookmarksEnabled}
            portLongitude={port?.center?.[1]}
          />
        )}
      </section>

      <MixPanel
        fleet={fleetMixData}
        cargo={cargoMixData}
        avgSpeed={k?.avgSpeedChannel ?? null}
      />
      </div>
        </div>
      </div>
      {/* ═══ Fin du workspace — panneaux détaillés ci-dessous ═══ */}

      <div className="space-y-3 p-4">

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

      {port?.aisCoverage === "low" ? (
        <div className="rounded-lg border border-amber-700/50 bg-amber-500/5 px-4 py-3 text-xs">
          <span className="font-semibold text-amber-300">
            🛰️ {t("aisCoverage.lowTitle")}
          </span>{" "}
          <span className="text-slate-300">— {t("aisCoverage.lowBody")}</span>{" "}
          <span className="text-slate-400">
            {t("aisCoverage.lowOptions.before")}{" "}
            <Link
              href="/sources"
              className="text-amber-300 underline hover:text-amber-200"
            >
              /sources
            </Link>{" "}
            {t("aisCoverage.lowOptions.after")}
          </span>
        </div>
      ) : null}

      {chokepointContext ? (
        <div className="rounded-lg border border-sky-700/50 bg-sky-500/5 px-4 py-3 text-xs">
          <span className="font-semibold text-sky-300">
            📊 {t("chokepoint.context")}
          </span>{" "}
          <span className="text-slate-100">
            {[
              chokepointContext.transitsPerDay,
              chokepointContext.oilMbd,
              chokepointContext.shareGlobal,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>{" "}
          <span className="text-slate-500">
            — {chokepointContext.source}
            {chokepointContext.sourceUrl ? (
              <>
                {" · "}
                <a
                  href={chokepointContext.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-sky-300 underline hover:text-sky-200"
                >
                  source
                </a>
              </>
            ) : null}
          </span>
          <span className="mt-1 block text-slate-400">
            {t("chokepoint.contextNote")}
          </span>
        </div>
      ) : null}

      {/* Une seule rangée de 4 cartes compactes, alignées sur la hauteur
          utile du panneau ETA precision (retour user 14/07). */}
      <section className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CongestionGauge
          anchored={k?.anchored ?? 0}
          total={k?.totalVessels ?? 0}
        />
        <FlowChart history={histResp?.history ?? []} />
        <WeatherWidget data={weatherResp ?? null} />
        <AccuracyPanel data={accuracyResp ?? null} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="uppercase tracking-wider text-slate-400">
              {t("section.fleetMix")}
            </span>
            {selectedVesselClassFilter ? (
              <button
                onClick={() => setSelectedVesselClassFilter(null)}
                className="text-[10px] text-sky-400 hover:text-sky-300"
                title={t("filter.clearTooltip")}
              >
                {t("filter.clearShort")}
              </button>
            ) : null}
          </div>
          <div className="space-y-1">
            {(
              ["cargo", "tanker", "passenger", "fishing", "tug", "pilot", "other"] as VesselClass[]
            ).map((cls) => {
              const n = k?.byClass?.[cls] ?? 0;
              const pct = k?.totalVessels
                ? Math.round((n / k.totalVessels) * 100)
                : 0;
              const active = selectedVesselClassFilter === cls;
              return (
                <button
                  key={cls}
                  onClick={() =>
                    setSelectedVesselClassFilter(active ? null : cls)
                  }
                  disabled={n === 0}
                  className={`flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-sky-500/15 ring-1 ring-inset ring-sky-600/40"
                      : n > 0
                        ? "hover:bg-slate-800/60 cursor-pointer"
                        : "opacity-40 cursor-not-allowed"
                  }`}
                  title={
                    n > 0
                      ? t("filter.applyClass", { c: classLabel(cls), n })
                      : t("filter.noVesselsClass")
                  }
                >
                  <span className="w-24 text-slate-400 capitalize">
                    {classLabel(cls)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full ${active ? "bg-sky-300" : "bg-sky-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right tabular-nums text-slate-300">
                    {n}
                  </span>
                </button>
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
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="uppercase tracking-wider text-slate-400">
              {t("section.cargoMix")}
            </span>
            {selectedCargoFilter ? (
              <button
                onClick={() => setSelectedCargoFilter(null)}
                className="text-[10px] text-amber-400 hover:text-amber-300"
                title={t("filter.clearTooltip")}
              >
                {t("filter.clearShort")}
              </button>
            ) : null}
          </div>
          <div className="space-y-1">
            {(["crude", "product", "chemical", "lng", "lpg"] as CargoClass[]).map(
              (c) => {
                const n = allVessels.filter((v) => v.cargoClass === c).length;
                const pct = tankerCount
                  ? Math.round((n / tankerCount) * 100)
                  : 0;
                const active = selectedCargoFilter === c;
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCargoFilter(active ? null : c)}
                    disabled={n === 0}
                    className={`flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-amber-500/15 ring-1 ring-inset ring-amber-600/40"
                        : n > 0
                          ? "hover:bg-slate-800/60 cursor-pointer"
                          : "opacity-40 cursor-not-allowed"
                    }`}
                    title={
                      n > 0
                        ? t("filter.applyCargo", { c: CARGO_LABELS[c], n })
                        : t("filter.noVesselsCargo")
                    }
                  >
                    <span className="w-24 text-slate-400">
                      {CARGO_LABELS[c]}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full ${active ? "bg-amber-300" : "bg-amber-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right tabular-nums text-slate-300">
                      {n}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>

      </section>

      <section id="risk" className="rounded-lg border border-rose-900/40 bg-slate-900/40 p-4">
        <RiskSectionHeader
          anomaliesCount={anomaliesResp?.anomalies?.length ?? 0}
          darkEventsCount={darkEvents.length}
          encountersCount={encounters.length}
          loiteringCount={loitering.length}
          sanctionedCount={
            allVessels.filter((v) => v.sanctioned).length
          }
        />
        <div className="mt-3 space-y-3">
          <AnomalyPanel
            anomalies={anomaliesResp?.anomalies ?? []}
            selectedMmsi={selectedMmsi}
            onSelect={handleVoyageSelect}
          />
          {!worldView ? (
            <DarkEventsPanel
              events={darkEvents}
              selectedMmsi={selectedMmsi}
              onSelect={handleDarkEventSelect}
            />
          ) : null}
          <EncountersLoiteringPanel
            encounters={encounters}
            loitering={loitering}
            selectedMmsi={selectedMmsi}
            onSelect={handleDarkEventSelect}
          />
        </div>
      </section>

      </div>
      {/* Status bar — cadence de rafraîchissement + attributions. */}
      <footer className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-800 bg-slate-900/95 px-4 py-2 font-mono text-[9.5px] text-slate-500">
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-current" /> AIS {aisLabel}
        </span>
        <span>{t("footer.refresh")}</span>
        <span>{t("footer.persistence")}</span>
        <span>{t("footer.portsCount", { n: ports.length })}</span>
        <span className="ml-auto">
          <Attributions compact />
        </span>
      </footer>
      {detailOpen && selectedMmsi != null ? (
        <VesselDetailPanel
          mmsi={selectedMmsi}
          port={portId}
          portLongitude={port?.center?.[1]}
          onClose={() => setDetailOpen(false)}
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
                className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-[#06121d] hover:bg-sky-400"
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
                className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-[#06121d] hover:bg-sky-400"
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

/**
 * Header for the consolidated Risk section. Surfaces a one-line summary
 * of all detection counts so users can gauge the scale of intelligence
 * signals without scrolling through the sub-panels.
 */
function RiskSectionHeader({
  anomaliesCount,
  darkEventsCount,
  encountersCount,
  loiteringCount,
  sanctionedCount,
}: {
  anomaliesCount: number;
  darkEventsCount: number;
  encountersCount: number;
  loiteringCount: number;
  sanctionedCount: number;
}) {
  const { t } = useI18n();
  const total =
    anomaliesCount +
    darkEventsCount +
    encountersCount +
    loiteringCount +
    sanctionedCount;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-rose-300">
          ⚠ {t("risk.title")}
        </span>
        <span className="text-xs text-slate-500">
          {t("risk.subtitle")}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-3 text-[11px] text-slate-400">
        <span>
          <span className="font-semibold text-slate-100 tabular-nums">
            {total}
          </span>{" "}
          {t("risk.totalSignals")}
        </span>
        <span className="text-slate-600">·</span>
        <RiskCount label={t("risk.label.anomalies")} n={anomaliesCount} />
        <RiskCount label={t("risk.label.darkFleet")} n={darkEventsCount} />
        <RiskCount label={t("risk.label.encounters")} n={encountersCount} />
        <RiskCount label={t("risk.label.loitering")} n={loiteringCount} />
        <RiskCount
          label={t("risk.label.sanctioned")}
          n={sanctionedCount}
          tone="bad"
        />
      </div>
    </div>
  );
}

function RiskCount({
  label,
  n,
  tone = "default",
}: {
  label: string;
  n: number;
  tone?: "default" | "bad";
}) {
  const color =
    n === 0
      ? "text-slate-600"
      : tone === "bad"
        ? "text-rose-400"
        : "text-slate-300";
  return (
    <span>
      <span className={`font-semibold tabular-nums ${color}`}>{n}</span>{" "}
      {label}
    </span>
  );
}
