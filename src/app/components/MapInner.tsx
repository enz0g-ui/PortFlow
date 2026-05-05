"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Rectangle,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Vessel, VesselClass, Zone } from "@/lib/types";

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
  center: [number, number];
  bbox: [number, number, number, number];
  zones: Zone[];
  portKey: string;
  expanded?: boolean;
  selectedMmsi?: number | null;
  onSelect?: (mmsi: number) => void;
  selectedTrack?: Array<[number, number]>;
  highlightedMmsis?: Set<number>;
  sarDetections?: SarDetection[];
  resetTick?: number;
  /**
   * Recent position trails for visible vessels, keyed by MMSI (string).
   * Each entry is an array of [lat, lon, ts] in chronological order.
   * Refreshed every ~60 s by the dashboard. Hidden at low zoom levels.
   */
  trails?: Record<string, Array<[number, number, number]>>;
  /**
   * Forced pan target — increments panTick triggers a flyTo on the
   * supplied lat/lon regardless of the auto-pan policy. Used by the
   * favorites list to recenter on a vessel that's hard to find on a
   * crowded world map.
   */
  panTo?: { lat: number; lon: number; tick: number };
}

// Below this zoom, trails are visual mush (segments collapse to dots) — skip
// rendering entirely. Port-level zoom is ~10-11; world-level is ~2-4.
const MIN_TRAIL_ZOOM = 8;

function FlyTo({
  bbox,
  portKey,
  resetTick,
}: {
  bbox: [number, number, number, number];
  portKey: string;
  resetTick?: number;
}) {
  const map = useMap();
  // Only fly to bounds when the port actually changes (portKey) or the user
  // clicks "Recentrer" (resetTick). The `bbox` array reference can churn on
  // every parent re-render (e.g. /api/ports re-poll), but its value is stable
  // for a given portKey — depending on it would dezoom the user every 30s,
  // which is the opposite of what every maritime tracker (MarineTraffic,
  // VesselFinder, Spire) does. eslint-disable to acknowledge the closure
  // reads bbox at call time.
  useEffect(() => {
    map.flyToBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { duration: 0.6, padding: [20, 20] },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, portKey, resetTick]);
  return null;
}

function PanToSelected({
  vessel,
}: {
  vessel: Vessel | undefined;
}) {
  const map = useMap();
  // Only fly to a vessel when the *selection* changes (mmsi), not on every
  // position update. Center on the vessel, but don't force a city-level zoom
  // — keep whatever zoom the user is at unless they're absurdly far out
  // (then ease to a moderate regional zoom).
  useEffect(() => {
    if (!vessel) return;
    const currentZoom = map.getZoom();
    const targetZoom = currentZoom < 6 ? 6 : currentZoom;
    map.flyTo([vessel.latitude, vessel.longitude], targetZoom, {
      duration: 0.5,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, vessel?.mmsi]);
  return null;
}

function ForcePanTo({
  target,
}: {
  target?: { lat: number; lon: number; tick: number };
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const z = Math.max(map.getZoom(), 9);
    map.flyTo([target.lat, target.lon], z, { duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, target?.tick]);
  return null;
}

/**
 * Renders fading position trails behind each vessel, in the style of
 * VesselFinder / Spire. Memoized so it doesn't re-create polylines on every
 * 5 s vessel-position poll — only when the trails dataset itself changes
 * (~60 s) or zoom crosses the visibility threshold.
 *
 * Implementation notes:
 * - `<MapContainer preferCanvas>` is set in the parent, so each Polyline
 *   here renders to a single shared canvas (cheap for ~700 lines).
 * - Color matches the vessel class (looked up from the live vessels array).
 * - Selected vessel's trail is suppressed here — it's drawn separately,
 *   brighter, by the parent component's `selectedTrack` polyline.
 * - We listen to `zoomend` to hide trails below MIN_TRAIL_ZOOM, where
 *   they'd just look like noise on top of the markers.
 */
const TrailsLayer = memo(function TrailsLayer({
  trails,
  vesselClassByMmsi,
  selectedMmsi,
  highlightedMmsis,
  visible,
}: {
  trails: Record<string, Array<[number, number, number]>>;
  vesselClassByMmsi: Map<number, VesselClass>;
  selectedMmsi: number | null | undefined;
  highlightedMmsis?: Set<number>;
  visible: boolean;
}) {
  if (!visible) return null;
  const hasHighlight = highlightedMmsis && highlightedMmsis.size > 0;
  return (
    <>
      {Object.entries(trails).map(([mmsiStr, points]) => {
        if (points.length < 2) return null;
        const mmsi = Number(mmsiStr);
        if (mmsi === selectedMmsi) return null; // brighter trail drawn separately
        const cls = vesselClassByMmsi.get(mmsi) ?? "other";
        const color = CLASS_COLOR[cls];
        // When a state filter / search is active, dim trails of vessels that
        // don't match — keeps the eye on the relevant subset without hiding
        // context entirely.
        const isMatch = !hasHighlight || highlightedMmsis!.has(mmsi);
        const opacity = isMatch ? 0.35 : 0.08;
        const positions = points.map(
          ([lat, lon]) => [lat, lon] as [number, number],
        );
        return (
          <Polyline
            key={`trail-${mmsi}`}
            positions={positions}
            pathOptions={{
              color,
              weight: 1.5,
              opacity,
              interactive: false,
            }}
          />
        );
      })}
    </>
  );
});

/**
 * Tracks the map's current zoom level via leaflet events. Cheap re-render
 * trigger for components that need to react to zoom changes (e.g. show or
 * hide trails below a threshold).
 */
function useMapZoom(initial = 11): number {
  const [zoom, setZoom] = useState(initial);
  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom()),
  });
  return zoom;
}

function TrailsForCurrentZoom(props: {
  trails?: Record<string, Array<[number, number, number]>>;
  vessels: Vessel[];
  selectedMmsi: number | null | undefined;
  highlightedMmsis?: Set<number>;
}) {
  const zoom = useMapZoom(11);
  const visible = zoom >= MIN_TRAIL_ZOOM;
  const vesselClassByMmsi = useMemo(() => {
    const m = new Map<number, VesselClass>();
    for (const v of props.vessels) m.set(v.mmsi, v.vesselClass);
    return m;
  }, [props.vessels]);
  if (!props.trails) return null;
  return (
    <TrailsLayer
      trails={props.trails}
      vesselClassByMmsi={vesselClassByMmsi}
      selectedMmsi={props.selectedMmsi}
      highlightedMmsis={props.highlightedMmsis}
      visible={visible}
    />
  );
}

function ResizeOnExpand({ expanded }: { expanded?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(id);
  }, [map, expanded]);
  return null;
}

export default function MapInner({
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
  const selected = vessels.find((v) => v.mmsi === selectedMmsi);

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      preferCanvas={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyTo bbox={bbox} portKey={portKey} resetTick={resetTick} />
      <ResizeOnExpand expanded={expanded} />
      {portKey !== "__world__" ? (
        <PanToSelected vessel={selected} />
      ) : null}
      <ForcePanTo target={panTo} />
      {zones.map((z) => (
        <Rectangle
          key={`${portKey}-${z.id}`}
          bounds={[
            [z.bbox[0], z.bbox[1]],
            [z.bbox[2], z.bbox[3]],
          ]}
          pathOptions={{
            color: ZONE_COLOR[z.kind],
            weight: 1,
            fillOpacity: 0.05,
            dashArray: "4 4",
          }}
        >
          <Tooltip direction="center" opacity={0.8} permanent={false}>
            {z.name}
          </Tooltip>
        </Rectangle>
      ))}
      <TrailsForCurrentZoom
        trails={trails}
        vessels={vessels}
        selectedMmsi={selectedMmsi}
        highlightedMmsis={highlightedMmsis}
      />
      {selectedTrack && selectedTrack.length > 1 ? (
        <Polyline
          positions={selectedTrack}
          pathOptions={{ color: "#38bdf8", weight: 2, opacity: 0.9 }}
        />
      ) : null}
      {sarDetections?.map((d) => (
        <CircleMarker
          key={`sar-${d.id}`}
          center={[d.lat, d.lon]}
          radius={5}
          pathOptions={{
            color: "#f59e0b",
            fillColor: "#fbbf24",
            fillOpacity: 0.4,
            weight: 1.5,
            dashArray: "2 2",
          }}
          interactive={true}
        >
          <Tooltip>
            <div className="text-xs">
              <div className="font-semibold text-amber-600">SAR detection</div>
              <div>
                {d.lat.toFixed(4)}, {d.lon.toFixed(4)}
              </div>
              <div className="text-[10px] text-slate-500">
                {new Date(d.ts).toLocaleString([], {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {d.sizePx ? ` · ${d.sizePx} px` : ""}
              </div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
      {vessels.map((v) => {
        const isSelected = v.mmsi === selectedMmsi;
        const hasHighlight =
          highlightedMmsis !== undefined && highlightedMmsis.size > 0;
        const isHighlighted = highlightedMmsis?.has(v.mmsi) ?? false;
        const baseColor = CLASS_COLOR[v.vesselClass];
        // When a filter is active (state filter, search match…) we dim
        // non-matching vessels rather than draw extra halos around the
        // matches — keeps the eye on the relevant subset, less visual
        // noise. The selected vessel always stays bright.
        const isFocused = isSelected || !hasHighlight || isHighlighted;
        return (
          <CircleMarker
            key={v.mmsi}
            center={[v.latitude, v.longitude]}
            radius={
              isSelected
                ? 8
                : isFocused
                  ? v.state === "underway"
                    ? 4
                    : 3
                  : 2
            }
            pathOptions={{
              color: isSelected ? "#38bdf8" : baseColor,
              fillColor: baseColor,
              fillOpacity: isSelected
                ? 1
                : isFocused
                  ? v.state === "underway"
                    ? 0.85
                    : 0.5
                  : 0.15,
              opacity: isSelected ? 1 : isFocused ? 0.9 : 0.25,
              weight: isSelected ? 3 : 1,
            }}
            eventHandlers={
              onSelect ? { click: () => onSelect(v.mmsi) } : undefined
            }
          >
            <Tooltip
              key={`tip-${v.mmsi}`}
              opacity={0.9}
            >
              <div className="text-xs leading-snug">
                <div className="font-semibold">
                  {v.name ?? `MMSI ${v.mmsi}`}
                </div>
                <div className="text-[10px] text-slate-400">
                  MMSI {v.mmsi}
                  {v.callsign ? ` · ${v.callsign}` : ""}
                </div>
                <div className="mt-1">
                  {v.cargoClass ?? v.vesselClass} · {v.state}
                </div>
                <div>
                  {v.sog.toFixed(1)} kn · cap {Math.round(v.cog)}°
                </div>
                {v.lengthM || v.draught ? (
                  <div className="text-[10px] text-slate-400">
                    {v.lengthM ? `L ${Math.round(v.lengthM)} m` : ""}
                    {v.lengthM && v.draught ? " · " : ""}
                    {v.draught ? `tirant d'eau ${v.draught.toFixed(1)} m` : ""}
                  </div>
                ) : null}
                {v.destination ? <div>→ {v.destination}</div> : null}
                {v.zone ? (
                  <div className="text-slate-400">zone : {v.zone}</div>
                ) : null}
                {v.lastUpdate ? (
                  <div className="text-[10px] text-slate-500">
                    màj {Math.max(0, Math.round((Date.now() - v.lastUpdate) / 1000))}s
                  </div>
                ) : null}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
