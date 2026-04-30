"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Rectangle,
  TileLayer,
  Tooltip,
  useMap,
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
}

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
  useEffect(() => {
    map.flyToBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { duration: 0.6, padding: [20, 20] },
    );
  }, [map, bbox, portKey, resetTick]);
  return null;
}

function PanToSelected({
  vessel,
}: {
  vessel: Vessel | undefined;
}) {
  const map = useMap();
  // Only fly to a vessel when the *selection* changes (mmsi), not on every
  // position update. Lets the user keep their manual zoom while a vessel is
  // selected and moving.
  useEffect(() => {
    if (!vessel) return;
    map.flyTo([vessel.latitude, vessel.longitude], Math.max(map.getZoom(), 13), {
      duration: 0.5,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, vessel?.mmsi]);
  return null;
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
      <PanToSelected vessel={selected} />
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
      {highlightedMmsis && highlightedMmsis.size > 0
        ? vessels
            .filter((v) => highlightedMmsis.has(v.mmsi))
            .map((v) => (
              <CircleMarker
                key={`halo-${v.mmsi}`}
                center={[v.latitude, v.longitude]}
                radius={12}
                pathOptions={{
                  color: "#fbbf24",
                  weight: 2,
                  fill: false,
                  opacity: 0.85,
                  dashArray: "3 3",
                }}
                interactive={false}
              />
            ))
        : null}
      {vessels.map((v) => {
        const isSelected = v.mmsi === selectedMmsi;
        const isHighlighted = highlightedMmsis?.has(v.mmsi) ?? false;
        const baseColor = CLASS_COLOR[v.vesselClass];
        return (
          <CircleMarker
            key={v.mmsi}
            center={[v.latitude, v.longitude]}
            radius={
              isSelected
                ? 8
                : isHighlighted
                  ? 6
                  : v.state === "underway"
                    ? 4
                    : 3
            }
            pathOptions={{
              color: isSelected
                ? "#38bdf8"
                : isHighlighted
                  ? "#fbbf24"
                  : baseColor,
              fillColor: baseColor,
              fillOpacity: isSelected
                ? 1
                : isHighlighted
                  ? 0.95
                  : v.state === "underway"
                    ? 0.85
                    : 0.5,
              weight: isSelected ? 3 : isHighlighted ? 2 : 1,
            }}
            eventHandlers={
              onSelect ? { click: () => onSelect(v.mmsi) } : undefined
            }
          >
            <Tooltip
              permanent={isSelected}
              opacity={isSelected ? 1 : 0.9}
              className={isSelected ? "selected-vessel-tip" : undefined}
            >
              <div className="text-xs">
                <div className="font-semibold">
                  {v.name ?? `MMSI ${v.mmsi}`}
                </div>
                <div>
                  {v.cargoClass ?? v.vesselClass} · {v.state}
                </div>
                <div>
                  {v.sog.toFixed(1)} kn · cap {Math.round(v.cog)}°
                </div>
                {v.destination ? <div>→ {v.destination}</div> : null}
                {v.zone ? (
                  <div className="text-slate-400">zone : {v.zone}</div>
                ) : null}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
