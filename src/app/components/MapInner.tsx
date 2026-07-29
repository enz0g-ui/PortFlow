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

/* Pavé compteur de port sur le globe (comme /overview) : nom + nombre de
   navires suivis. Rendu en vue large, décluttré au zoom port. */
export interface PortCount {
  id: string;
  name: string;
  center: [number, number]; // [lat, lon]
  vesselCount: number;
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
  portCounts?: PortCount[];
  onSelectPort?: (id: string) => void;
}

/* Vue axée (non inclinée) : la profondeur vient de la projection globe,
   pas d'un pitch caméra. Nord en haut. */
const PITCH = 0;
const BEARING = 0;

/* Vue d'accueil : globe dézoomé où la courbure de la sphère est visible,
   centré sur l'Europe. L'utilisateur zoome ensuite sur le port (bouton
   « Recentrer », clic sur un port, ou molette). */
const INTRO_CENTER: [number, number] = [8, 34];
const INTRO_ZOOM = 2.6;
const MAX_TRAIL_ZOOM = 13;
const MIN_TRAIL_ZOOM = 8;
const MAX_CONTEXT_ZOOM = 7; // zones de guerre + chokepoints : vue régionale
const MAX_PORTCOUNT_ZOOM = 6.5; // pavés compteurs : vue réseau, cachés au zoom port

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

function buildPortCountsFC(ports: PortCount[] | undefined): FC {
  if (!ports) return emptyFC();
  return {
    type: "FeatureCollection",
    features: ports
      .filter((p) => p.vesselCount > 0)
      .map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.center[1], p.center[0]] },
        properties: {
          id: p.id,
          name: p.name.toUpperCase(),
          count: p.vesselCount,
          // taille du point proportionnelle au trafic (pavé « hub »)
          rad: p.vesselCount >= 1500 ? 5 : p.vesselCount >= 500 ? 4 : 3,
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
    // Glyphes AUTO-HÉBERGÉS (public/fonts) : le serveur externe openmaptiles a
    // changé d'API et laissait le texte des pavés non rendu (dots seuls). En
    // local, plus aucune dépendance réseau fragile — cf. leçon tuiles/polices.
    // Plage 0-511 embarquée : couvre tous les noms de ports (Latin + accents).
    glyphs: "/fonts/{fontstack}/{range}.pbf",
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
    // Projection globe (MapLibre v5) : la carte devient une vraie sphère
    // courbée vue de face. À fort zoom (niveau port) elle redevient plane
    // automatiquement pour garder la lisibilité des navires ; la courbure
    // n'apparaît qu'en vue régionale / monde.
    projection: { type: "globe" },
    sky: {
      "sky-color": "#0a1830",
      "sky-horizon-blend": 0.6,
      "horizon-color": "#0f2748",
      "horizon-fog-blend": 0.7,
      "fog-color": "#070d18",
      "fog-ground-blend": 0.5,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 4, 0.7, 7, 0],
    },
  };
}

/* ---------- composant ---------- */

export default memo(function MapInner({
  vessels,
  // `center` (prop) n'est plus lu : la vue d'accueil est fixée par INTRO_*,
  // et les recentrages passent par bbox / vessel / panTo. Conservé dans Props.
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
  portCounts,
  onSelectPort,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const readyRef = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onSelectPortRef = useRef(onSelectPort);
  onSelectPortRef.current = onSelectPort;

  // Refs vers les données dynamiques : `setup()` (défini dans l'effet d'init,
  // closure figée au mount) doit lire les valeurs COURANTES au moment où il
  // s'exécute — sinon, si l'API répond avant que le style soit chargé, setup
  // installe une source vide et la mise à jour intermédiaire est perdue.
  const dataRef = useRef({ vessels, highlightedMmsis, zones, selectedMmsi, trails, selectedTrack, sarDetections, portCounts });
  dataRef.current = { vessels, highlightedMmsis, zones, selectedMmsi, trails, selectedTrack, sarDetections, portCounts };

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
      center: INTRO_CENTER, // vue d'accueil globe (dézoomée) — cf. INTRO_ZOOM
      zoom: INTRO_ZOOM,
      pitch: PITCH,
      bearing: BEARING,
      maxPitch: 68,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    (window as unknown as { __m?: MLMap }).__m = map; // DEBUG temporaire (ports cliquables)
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-left");

    // Fiabilise le dimensionnement : si le conteneur reçoit sa hauteur après
    // l'init (hydratation, agrandissement), on redimensionne la carte.
    const sizeRO = new ResizeObserver(() => map.resize());
    sizeRO.observe(containerRef.current);

    // Installe sources + couches + interactions. Idempotent (garde readyRef) :
    // on l'appelle depuis `load` ET immédiatement si le style est déjà prêt,
    // pour ne pas dépendre d'un unique événement dont le timing varie beaucoup
    // sur une box lente (tuiles raster distantes qui retardent `isStyleLoaded`).
    const setup = () => {
      if (readyRef.current || !mapRef.current) return;
     try {
      // sources — on lit les valeurs COURANTES via dataRef (pas la closure
      // du mount) pour ne pas installer une source vide si l'API a déjà répondu.
      const d = dataRef.current;
      map.addSource("zones", { type: "geojson", data: buildZonesFC(d.zones) });
      map.addSource("warzones", { type: "geojson", data: emptyFC() });
      map.addSource("chokepoints", { type: "geojson", data: emptyFC() });
      map.addSource("trails", { type: "geojson", data: emptyFC() });
      map.addSource("seltrack", { type: "geojson", data: emptyFC() });
      map.addSource("sar", { type: "geojson", data: emptyFC() });
      map.addSource("portcounts", {
        type: "geojson",
        data: buildPortCountsFC(d.portCounts),
      });
      // Pas de clustering : le worker de clustering (supercluster) ne produit
      // aucune tuile en maplibre 4.7.1 avec notre config, d'où des navires
      // invisibles. Sans cluster, les 943 points se rendent en dots lumineux
      // individuels — c'est aussi le rendu « command deck » recherché.
      map.addSource("vessels", {
        type: "geojson",
        data: buildVesselsFC(d.vessels, d.highlightedMmsis),
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
        filter: ["==", ["get", "sanctioned"], 1],
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
        filter: ["==", ["get", "mmsi"], d.selectedMmsi ?? -1],
        paint: {
          "circle-radius": 9,
          "circle-color": "rgba(56,189,248,0.25)",
          "circle-stroke-color": "#38bdf8",
          "circle-stroke-width": 2.5,
        },
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

      // Pavés compteurs de ports (comme /overview) — visibles en vue réseau
      // (globe), cachés au zoom port. Point marqueur + label « NOM \ N navires ».
      // Zone de clic invisible large : les dots visibles font 3-5 px (durs à
      // cliquer) ; ce cercle transparent de 16 px porte le hit-test.
      map.addLayer({
        id: "portcount-hit",
        type: "circle",
        source: "portcounts",
        maxzoom: MAX_PORTCOUNT_ZOOM,
        paint: {
          "circle-radius": 16,
          "circle-color": "#000000",
          "circle-opacity": 0.01,
        },
      });
      map.addLayer({
        id: "portcount-dot",
        type: "circle",
        source: "portcounts",
        maxzoom: MAX_PORTCOUNT_ZOOM,
        paint: {
          "circle-radius": ["get", "rad"],
          "circle-color": "#6cc4f7",
          "circle-opacity": 0.9,
          "circle-stroke-color": "rgba(168,220,255,0.55)",
          "circle-stroke-width": 1.4,
          "circle-blur": 0.2,
        },
      });
      map.addLayer({
        id: "portcount-label",
        type: "symbol",
        source: "portcounts",
        maxzoom: MAX_PORTCOUNT_ZOOM,
        layout: {
          "text-field": [
            "format",
            ["get", "name"],
            {},
            "\n",
            {},
            ["concat", ["to-string", ["get", "count"]], " navires"],
            { "font-scale": 0.82 },
          ],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-offset": [0.9, 0],
          "text-anchor": "left",
          "text-max-width": 12,
          "text-allow-overlap": false,
          "text-optional": true,
        },
        paint: {
          "text-color": "#dbe6f5",
          "text-halo-color": "rgba(6,12,22,0.9)",
          "text-halo-width": 1.4,
          "text-halo-blur": 0.5,
        },
      });

      readyRef.current = true;

      // hydrate les sources qui démarrent vides mais dont les données peuvent
      // déjà être arrivées avant que le style soit prêt (mêmes valeurs courantes).
      (map.getSource("trails") as GeoJSONSource | undefined)?.setData(
        buildTrailsFC(d.trails, classByMmsi, d.selectedMmsi, d.highlightedMmsis),
      );
      (map.getSource("seltrack") as GeoJSONSource | undefined)?.setData(buildLineFC(d.selectedTrack));
      (map.getSource("sar") as GeoJSONSource | undefined)?.setData(buildSarFC(d.sarDetections));
      (map.getSource("portcounts") as GeoJSONSource | undefined)?.setData(buildPortCountsFC(d.portCounts));

      // Pas de cadrage-port au chargement : on reste sur la vue d'accueil
      // globe (INTRO_ZOOM). L'utilisateur zoome via « Recentrer », un clic
      // sur un port, ou la molette. Le fitBounds vit dans l'effet [portKey,
      // resetTick] déclenché par ces actions.

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

      // interactions pavés de ports : curseur pointer + clic → sélection du
      // port (le recadrage sur le port suit via l'effet [portKey, resetTick]).
      const portEnter = () => (map.getCanvas().style.cursor = "pointer");
      const portLeave = () => (map.getCanvas().style.cursor = "");
      const portClick = (e: maplibregl.MapLayerMouseEvent) => {
        const f = e.features?.[0];
        const id = f?.properties?.id;
        if (id && onSelectPortRef.current) onSelectPortRef.current(String(id));
      };
      // hit-test sur la zone large invisible + le label (le dot est couvert
      // par la zone large, inutile de l'écouter).
      for (const layer of ["portcount-hit", "portcount-label"]) {
        map.on("mouseenter", layer, portEnter);
        map.on("mouseleave", layer, portLeave);
        map.on("click", layer, portClick);
      }
     } catch (err) {
      console.error("[pf-map] init error:", err);
     }
    };

    // On déclenche setup dès que le SPEC de style est parsé (couche `bg`
    // présente), PAS sur `load`/`idle`/`isStyleLoaded` qui attendent tous le
    // chargement des tuiles raster distantes : quand CARTO est lent ou limité
    // en débit, ces événements ne se déclenchent jamais et les couches
    // vectorielles (navires, zones) ne seraient jamais ajoutées. Les cercles
    // se dessinent sans dépendre du fond raster. `setup` est idempotent.
    const trySetup = () => {
      if (readyRef.current || !mapRef.current) return;
      if (!map.getLayer("bg")) return; // spec pas encore parsé
      setup();
    };
    map.on("styledata", trySetup);
    map.on("load", trySetup);
    trySetup();

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
    setData("portcounts", buildPortCountsFC(portCounts));
  }, [portCounts]);

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
    else map.on("styledata", load); // `load` garde `done`+readyRef : sûr en multi-appel
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
