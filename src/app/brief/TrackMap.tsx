"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Petite carte de preuve : traces de navires et points repères sur un fond
// OpenFreeMap sobre (terre / mer, sans étiquettes).

export interface TrackLine {
  label: string;
  color: string;
  points: Array<[number, number]>; // [lon, lat]
}

export interface TrackMarker {
  lon: number;
  lat: number;
  color: string;
  label: string;
}

function style(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
        attribution:
          '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      },
    },
    layers: [
      { id: "land", type: "background", paint: { "background-color": "#16233a" } },
      {
        id: "water",
        type: "fill",
        source: "basemap",
        "source-layer": "water",
        paint: { "fill-color": "#060c16" },
      },
    ],
  };
}

export function TrackMap({
  lines = [],
  markers = [],
  height = 320,
  zoom = 9,
}: {
  lines?: TrackLine[];
  markers?: TrackMarker[];
  height?: number;
  zoom?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const all: Array<[number, number]> = [
      ...lines.flatMap((l) => l.points),
      ...markers.map((m) => [m.lon, m.lat] as [number, number]),
    ];
    if (all.length === 0) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: style(),
      center: all[all.length - 1],
      zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      lines.forEach((l, i) => {
        if (l.points.length < 2) return;
        map.addSource(`t${i}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: l.points },
          },
        });
        map.addLayer({
          id: `t${i}`,
          type: "line",
          source: `t${i}`,
          paint: { "line-color": l.color, "line-width": 2.5, "line-opacity": 0.9 },
        });
      });
      for (const m of markers) {
        const el = document.createElement("div");
        el.style.cssText = `width:12px;height:12px;border-radius:50%;background:${m.color};border:2px solid #070b12;box-shadow:0 0 0 3px ${m.color}55`;
        el.title = m.label;
        new maplibregl.Marker({ element: el }).setLngLat([m.lon, m.lat]).addTo(map);
      }
      if (all.length > 1) {
        const b = new maplibregl.LngLatBounds(all[0], all[0]);
        for (const p of all) b.extend(p);
        map.fitBounds(b, { padding: 40, maxZoom: 13, duration: 0 });
      }
    });
    return () => map.remove();
  }, [lines, markers, zoom]);

  return (
    <div
      ref={ref}
      style={{ height }}
      className="w-full overflow-hidden rounded-md border border-slate-800 bg-[#060c16]"
    />
  );
}
