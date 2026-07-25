"use client";

/**
 * Carte du dashboard — MapLibre GL (migration Leaflet → MapLibre, 25/07/2026).
 *
 * Pourquoi MapLibre : Laurent veut un vrai plan 3D incliné (« pitch ») comme
 * les cockpits de contrôle. Leaflet ne sait pas incliner sans casser le clic ;
 * MapLibre a une caméra 3D native où le hit-test reste juste. Bonus : le rendu
 * est data-driven (sources GeoJSON + couches), donc les lueurs des navires
 * sont natives (`circle-blur`) au lieu du hack de double-marqueur Leaflet, et
 * le clustering est géré par le moteur.
 *
 * L'interface `Props` est identique à l'ancienne implémentation Leaflet — ce
 * fichier reste un drop-in pour MapView/Dashboard. Fonctions portées :
 * fond CARTO assombri, atmosphère (ciel + voiles), zones de port, zones de
 * guerre + chokepoints (zoom-aware), trails, trace sélectionnée, navires
 * (lueur + cœur + sélection + surbrillance filtre), halo sanctionnés, SAR,
 * clusters, recentrage sur port / navire / cible forcée — le tout en gardant
 * l'inclinaison 3D.
 */

import { memo, useEffect, useMemo, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Vessel, VesselClass, Zone } from "@/lib/types";

type MLMap = maplibregl.Map;
type GeoJSONSource = maplibregl.GeoJSONSource;

const CLASS_COLOR: Record<VesselClass, string> = {
  cargo: "#34d399",
  tanker: "#f87171",
  passenger: "#a78bfa",
  fishing: "#facc15",
  tug: "#38bdf8",
  pilot: "#22d3ee",
  other: "#94a3b8",
};

const ZONE_COLOR: Record<Zone["kind"], string> = {
  anchorage: "#fbbf24",
  channel: "#38bdf8",
  berth: "#34d399",
  approach: "#a78bfa",
};

export interface SarDetection {
  id: number;
  ts: number;
  lat: number;
  lon: number;
  intensity?: number;
  sizePx?: number;
}

interface Props {
  vessels: Vessel[];
  center: [number, number]; // [lat, lon] (ordre Leaflet, conservé)
  bbox: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
  zones: Zone[];
  portKey: string;
  expanded?: boolean;
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number) => void;
  selectedTrack?: Array<[number, number]>;
  highlightedMmsis?: Set<number>;
  sarDetections?: SarDetection[];
  resetTick?: number;
  trails?: Record<string, Array<[number, number, number]>>;
  panTo?: { lat: number; lon: number; tick: number };
}

/* Inclinaison 3D « command deck ». */
const PITCH = 50;
const BEARING = -18;
const MAX_TRAIL_ZOOM = 13;
const MIN_TRAIL_ZOOM = 8;
const MAX_CONTEXT_ZOOM = 7; // zones de guerre + chokepoints : vue régionale

type FC = GeoJSON.FeatureCollection;
const emptyFC = (): FC => ({ type: "FeatureCollection", features: [] });

/* Expression MapLibre : couleur par classe de navire. */
const CLASS_COLOR_EXPR: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "cls"],
  "cargo",
  CLASS_COLOR.cargo,
  "tanker",
  CLASS_COLOR.tanker,
  "passenger",
  CLASS_COLOR.passenger,
  "fishing",
  CLASS_COLOR.fishing,
  "tug",
  CLASS_COLOR.tug,
  "pilot",
  CLASS_COLOR.pilot,
  CLASS_COLOR.other,
];

/* ---------- construction des sources GeoJSON ---------- */

function buildVesselsFC(vessels: Vessel[], highlighted?: Set<number>): FC {
  const hasHighlight = highlighted !== undefined && highlighted.size > 0;
  return {
    type: "FeatureCollection",
    features: vessels.map((v) => {
      const focused = !hasHighlight || highlighted!.has(v.mmsi);
      return {
        type: "Feature",
        id: v.mmsi,
        geometry: { type: "Point", coordinates: [v.longitude, v.latitude] },
        properties: {
          mmsi: v.mmsi,
          cls: v.vesselClass,
          st: v.state,
          sanctioned: v.sanctioned ? 1 : 0,
          op: focused ? (v.state === "underway" ? 0.95 : 0.6) : 0.16,
          rad: v.state === "underway" ? 4.2 : 3.2,
          name: v.name ?? `MMSI ${v.mmsi}`,
          callsign: v.callsign ?? "",
          sog: v.sog,
          cog: Math.round(v.cog),
          detail: `${v.cargoClass ?? v.vesselClass} · ${v.state}`,
          destination: v.destination ?? "",
          zone: v.zone ?? "",
        },
      };
    }),
  };
}

function buildTrailsFC(
  trails: Record<string, Array<[number, number, number]>> | undefined,
  classByMmsi: Map<number, VesselClass>,
  selectedMmsi: number | null | undefined,
  highlighted?: Set<number>,
): FC {
  if (!trails) return emptyFC();
  const hasHighlight = highlighted !== undefined && highlighted.size > 0;
  const features: GeoJSON.Feature[] = [];
  for (const [mmsiStr, pts] of Object.entries(trails)) {
    if (pts.length < 2) continue;
    const mmsi = Number(mmsiStr);
    if (mmsi === selectedMmsi) continue;
    const cls = classByMmsi.get(mmsi) ?? "other";
    const match = !hasHighlight || highlighted!.has(mmsi);
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: pts.map(([lat, lon]) => [lon, lat]),
      },
      properties: { color: CLASS_COLOR[cls], op: match ? 0.35 : 0.08 },
    });
  }
  return { type: "FeatureCollection", features };
}

function buildZonesFC(zones: Zone[]): FC {
  return {
    type: "FeatureCollection",
    features: zones.map((z) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [z.bbox[1], z.bbox[0]],
            [z.bbox[3], z.bbox[0]],
            [z.bbox[3], z.bbox[2]],
            [z.bbox[1], z.bbox[2]],
            [z.bbox[1], z.bbox[0]],
          ],
        ],
      },
      properties: { color: ZONE_COLOR[z.kind], name: z.name },
    })),
  };
}

function buildSarFC(sar: SarDetection[] | undefined): FC {
  if (!sar) return emptyFC();
  return {
    type: "FeatureCollection",
    features: sar.map((d) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [d.lon, d.lat] },
      properties: {
        label: `SAR · ${d.lat.toFixed(3)}, ${d.lon.toFixed(3)}`,
      },
    })),
  };
}

function buildLineFC(track: Array<[number, number]> | undefined): FC {
  if (!track || track.length < 2) return emptyFC();
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: track.map(([lat, lon]) => [lon, lat]),
        },
        properties: {},
      },
    ],
  };
}

/* ---------- style de base (fond CARTO assombri + ciel) ---------- */

function baseStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
      carto: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#060c17" } },
      {
        id: "carto",
        type: "raster",
        source: "carto",
        paint: {
          "raster-brightness-min": 0,
          "raster-brightness-max": 0.66,
          "raster-saturation": -0.08,
          "raster-contrast": 0.06,
        },
      },
    ],
    sky: {
      "sky-color": "#0a1830",
      "sky-horizon-blend": 0.6,
      "horizon-color": "#0f2748",
      "horizon-fog-blend": 0.7,
      "fog-color": "#070d18",
      "fog-ground-blend": 0.5,
    },
  };
}

/* ---------- composant ---------- */

export default memo(function MapInner({
  vessels,
  center,
  bbox,
  zones,
  portKey,
  expanded,
  selectedMmsi,
  onSelect,
  selectedTrack,
  highlightedMmsis,
  sarDetections,
  resetTick,
  trails,
  panTo,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const readyRef = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const classByMmsi = useMemo(() => {
    const m = new Map<number, VesselClass>();
    for (const v of vessels) m.set(v.mmsi, v.vesselClass);
    return m;
  }, [vessels]);

  /* -- init une seule fois -- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle(),
      center: [center[1], center[0]],
      zoom: 10.5,
      pitch: PITCH,
      bearing: BEARING,
      maxPitch: 68,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    (window as unknown as { __m?: MLMap }).__m = map;
    map.on("error", (e) => console.error("[pf-map] maplibre error:", e.error?.message || e));
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");

    // Fiabilise le dimensionnement : si le conteneur reçoit sa hauteur après
    // l'init (hydratation, agrandissement), on redimensionne la carte.
    const sizeRO = new ResizeObserver(() => map.resize());
    sizeRO.observe(containerRef.current);

    map.on("load", () => {
     try {
      (window as unknown as { __m?: MLMap }).__m = map;
      // sources
      map.addSource("zones", { type: "geojson", data: buildZonesFC(zones) });
      map.addSource("warzones", { type: "geojson", data: emptyFC() });
      map.addSource("chokepoints", { type: "geojson", data: emptyFC() });
      map.addSource("trails", { type: "geojson", data: emptyFC() });
      map.addSource("seltrack", { type: "geojson", data: emptyFC() });
      map.addSource("sar", { type: "geojson", data: emptyFC() });
      map.addSource("vessels", {
        type: "geojson",
        data: buildVesselsFC(vessels, highlightedMmsis),
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 8,
        clusterProperties: {
          sanctioned: ["max", ["get", "sanctioned"]],
        },
      });

      // zones de port
      map.addLayer({
        id: "zones-fill",
        type: "fill",
        source: "zones",
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: "zones-line",
        type: "line",
        source: "zones",
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": 0.55,
          "line-width": 1,
          "line-dasharray": [3, 3],
        },
      });

      // zones de guerre + chokepoints (visibles seulement en vue régionale)
      map.addLayer({
        id: "warzones-fill",
        type: "fill",
        source: "warzones",
        maxzoom: MAX_CONTEXT_ZOOM + 0.5,
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "warzones-line",
        type: "line",
        source: "warzones",
        maxzoom: MAX_CONTEXT_ZOOM + 0.5,
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": 0.6,
          "line-width": 1,
          "line-dasharray": [4, 4],
        },
      });
      map.addLayer({
        id: "chokepoints-line",
        type: "line",
        source: "chokepoints",
        maxzoom: MAX_CONTEXT_ZOOM + 0.5,
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": 0.5,
          "line-width": 1,
          "line-dasharray": [2, 6],
        },
      });

      // trails (vue port ↔ régionale)
      map.addLayer({
        id: "trails",
        type: "line",
        source: "trails",
        minzoom: MIN_TRAIL_ZOOM,
        maxzoom: MAX_TRAIL_ZOOM + 0.5,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": ["get", "op"],
          "line-width": 1.4,
        },
      });

      // trace du navire sélectionné
      map.addLayer({
        id: "seltrack",
        type: "line",
        source: "seltrack",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#38bdf8", "line-opacity": 0.95, "line-width": 2.4 },
      });

      // halo sanctionnés (anneau rouge)
      map.addLayer({
        id: "vessel-sanctioned",
        type: "circle",
        source: "vessels",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "sanctioned"], 1]],
        paint: {
          "circle-radius": 10,
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": "#dc2626",
          "circle-stroke-width": 1.6,
          "circle-stroke-opacity": 0.8,
        },
      });

      // navires : lueur (halo natif via blur)
      map.addLayer({
        id: "vessel-glow",
        type: "circle",
        source: "vessels",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": ["*", ["get", "rad"], 2.4],
          "circle-color": CLASS_COLOR_EXPR,
          "circle-blur": 1,
          "circle-opacity": ["*", ["get", "op"], 0.5],
        },
      });
      // navires : cœur
      map.addLayer({
        id: "vessel-core",
        type: "circle",
        source: "vessels",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": ["get", "rad"],
          "circle-color": CLASS_COLOR_EXPR,
          "circle-opacity": ["get", "op"],
          "circle-stroke-color": "#eaf7ff",
          "circle-stroke-width": 0.6,
          "circle-stroke-opacity": ["*", ["get", "op"], 0.7],
        },
      });
      // navire sélectionné (surbrillance)
      map.addLayer({
        id: "vessel-selected",
        type: "circle",
        source: "vessels",
        filter: ["==", ["get", "mmsi"], selectedMmsi ?? -1],
        paint: {
          "circle-radius": 9,
          "circle-color": "rgba(56,189,248,0.25)",
          "circle-stroke-color": "#38bdf8",
          "circle-stroke-width": 2.5,
        },
      });

      // clusters
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "vessels",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["case", [">", ["get", "sanctioned"], 0], "#7f1d1d", "#0c4a6e"],
          "circle-stroke-color": ["case", [">", ["get", "sanctioned"], 0], "#fb7185", "#38bdf8"],
          "circle-stroke-width": 2,
          "circle-opacity": 0.8,
          "circle-radius": ["min", 20, ["+", 6, ["*", 2, ["sqrt", ["get", "point_count"]]]]],
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "vessels",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Bold", "Noto Sans Bold"],
          "text-size": 11,
        },
        paint: { "text-color": "#f8fafc" },
      });

      // SAR
      map.addLayer({
        id: "sar",
        type: "circle",
        source: "sar",
        paint: {
          "circle-radius": 5,
          "circle-color": "rgba(251,191,36,0.4)",
          "circle-stroke-color": "#f59e0b",
          "circle-stroke-width": 1.4,
        },
      });

      readyRef.current = true;

      // premier cadrage sur le port
      map.fitBounds(
        [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ],
        { padding: 60, pitch: PITCH, bearing: BEARING, duration: 0 },
      );

      // interactions navires
      const showPopup = (e: maplibregl.MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        map.getCanvas().style.cursor = "pointer";
        const p = f.properties as Record<string, string | number>;
        const html = `<div style="font:12px/1.35 ui-sans-serif;color:#e2eefb">
          <div style="font-weight:600">${p.sanctioned ? "🚫 " : ""}${p.name}</div>
          <div style="font-size:10px;color:#94a3b8">MMSI ${p.mmsi}${p.callsign ? " · " + p.callsign : ""}</div>
          <div style="margin-top:2px">${p.detail}</div>
          <div>${Number(p.sog).toFixed(1)} kn · cap ${p.cog}°</div>
          ${p.destination ? `<div>→ ${p.destination}</div>` : ""}
          ${p.zone ? `<div style="color:#94a3b8">zone : ${p.zone}</div>` : ""}
        </div>`;
        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "pf-popup",
        })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      };
      const hidePopup = () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
        popupRef.current = null;
      };
      map.on("mouseenter", "vessel-core", showPopup);
      map.on("mousemove", "vessel-core", showPopup);
      map.on("mouseleave", "vessel-core", hidePopup);
      map.on("click", "vessel-core", (e) => {
        const f = e.features?.[0];
        if (f && onSelectRef.current) onSelectRef.current(Number(f.properties!.mmsi));
      });
      // clic cluster → zoom
      map.on("click", "clusters", (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
        if (!f) return;
        const src = map.getSource("vessels") as GeoJSONSource;
        const cid = f.properties!.cluster_id;
        src.getClusterExpansionZoom(cid).then((z) => {
          const [lon, lat] = (f.geometry as GeoJSON.Point).coordinates;
          map.easeTo({ center: [lon, lat], zoom: z, pitch: PITCH, bearing: BEARING });
        });
      });
      map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
     } catch (err) {
      console.error("[pf-map] init error:", err);
     }
    });

    return () => {
      sizeRO.disconnect();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // init unique — les mises à jour passent par les effets ci-dessous
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -- mises à jour data-driven -- */
  const setData = (id: string, data: FC) => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(id) as GeoJSONSource | undefined;
    src?.setData(data);
  };

  useEffect(() => {
    setData("vessels", buildVesselsFC(vessels, highlightedMmsis));
  }, [vessels, highlightedMmsis]);

  useEffect(() => {
    setData(
      "trails",
      buildTrailsFC(trails, classByMmsi, selectedMmsi, highlightedMmsis),
    );
  }, [trails, classByMmsi, selectedMmsi, highlightedMmsis]);

  useEffect(() => {
    setData("seltrack", buildLineFC(selectedTrack));
  }, [selectedTrack]);

  useEffect(() => {
    setData("zones", buildZonesFC(zones));
  }, [zones]);

  useEffect(() => {
    setData("sar", buildSarFC(sarDetections));
  }, [sarDetections]);

  // surbrillance sélection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (map.getLayer("vessel-selected"))
      map.setFilter("vessel-selected", ["==", ["get", "mmsi"], selectedMmsi ?? -1]);
  }, [selectedMmsi]);

  // zones de guerre + chokepoints : fetch paresseux
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let done = false;
    const load = () => {
      if (done || !readyRef.current) return;
      done = true;
      fetch("/api/war-risk-zones")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j?.features && setData("warzones", j))
        .catch(() => {});
      fetch("/api/chokepoints")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j?.features && setData("chokepoints", j))
        .catch(() => {});
    };
    if (readyRef.current) load();
    else map.once("idle", load);
  }, []);

  // recentrage sur changement de port / bouton recentrer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.fitBounds(
      [
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]],
      ],
      { padding: 60, pitch: PITCH, bearing: BEARING, duration: 700 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portKey, resetTick]);

  // recentrage sur navire sélectionné (garde le pitch)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || selectedMmsi == null || portKey === "__world__") return;
    const v = vessels.find((x) => x.mmsi === selectedMmsi);
    if (!v) return;
    const z = Math.max(map.getZoom(), 8);
    map.easeTo({
      center: [v.longitude, v.latitude],
      zoom: z,
      pitch: PITCH,
      bearing: BEARING,
      duration: 500,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMmsi]);

  // cible forcée (favoris)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !panTo) return;
    map.easeTo({
      center: [panTo.lon, panTo.lat],
      zoom: Math.max(map.getZoom(), 9),
      pitch: PITCH,
      bearing: BEARING,
      duration: 700,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panTo?.tick]);

  // resize quand la carte est agrandie
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const id = window.setTimeout(() => map.resize(), 260);
    return () => window.clearTimeout(id);
  }, [expanded]);

  return (
    <div className="pf-map relative h-full w-full">
      {/* div dédiée à MapLibre (il y appende son canvas WebGL). Hauteur
          explicite : la classe .maplibregl-map force position:relative et
          écraserait un `absolute inset-0` (→ hauteur 0). */}
      <div ref={containerRef} className="h-full w-full" />
      {/* voiles atmosphériques au-dessus du canvas (aurore + grille + dôme),
          pointer-events none pour ne pas gêner l'interaction. */}
      <div className="pf-map-aurora pointer-events-none absolute inset-0 z-[5]" />
      <div className="pf-map-dome pointer-events-none absolute inset-0 z-[6]" />
    </div>
  );
});
