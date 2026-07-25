"use client";

/**
 * Vue mondiale « PORT FLOW MESH » — globe interactif temps réel.
 *
 * Globe filaire orthographique (d3-geo) rendu sur <canvas> : rotation libre
 * à la souris, zoom molette, clic-sur-port = vol animé (interpolation
 * rotation+échelle) + chargement des voyages du port. Panneaux latéraux
 * translucides (backdrop-blur) laissant le globe transparaître.
 *
 * Les routes suivent des COULOIRS MARITIMES (points de passage dans l'eau :
 * Manche, Gibraltar, Suez, Bab-el-Mandeb, Malacca, détroits pacifiques) —
 * plus de grand cercle qui coupe à travers les continents. Rendu « flux
 * d'énergie » : liseré glow + tirets animés parcourant le couloir.
 *
 * Données réelles : ports + comptages live (/api/ports), voyages actifs du
 * port sélectionné (/api/voyages/active).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoDistance,
  geoInterpolate,
} from "d3-geo";
import { feature } from "topojson-client";

/* ---------- types & données ---------- */

type LL = [number, number]; // [lon, lat]

interface ApiPort {
  id: string;
  name: string;
  region: string;
  center: [number, number]; // [lat, lng]
  vesselCount: number;
}
interface ApiVoyage {
  voyageId: string;
  name: string;
  cargoClass?: string;
  currentDistanceNm?: number;
  currentSog: number;
  predictedEta?: number | null;
}

/**
 * Couloirs maritimes principaux, en points de passage [lon, lat] restant
 * dans l'eau (via les détroits réels). Suffisant pour un rendu authentique
 * sans moteur de routage maritime.
 */
const SEA_LANES: LL[][] = [
  // Rotterdam → New York (Atlantique Nord)
  [[4.1, 51.95], [1.4, 51.0], [-2.5, 49.6], [-6.5, 48.5], [-15, 47.5], [-30, 45], [-45, 43], [-60, 41], [-70, 40.4], [-74, 40.5]],
  // Houston → Rotterdam (Golfe du Mexique → détroit de Floride → Atlantique → Manche)
  [[-94.7, 29.3], [-90, 28.5], [-84, 26], [-80.5, 24.5], [-79, 26], [-76, 29], [-70, 33], [-55, 39], [-35, 44], [-18, 47], [-6.5, 48.5], [-2.5, 49.6], [4.1, 51.95]],
  // Santos → Rotterdam (Atlantique Sud, à l'ouest de l'Afrique)
  [[-46.3, -24.0], [-40, -22], [-32, -14], [-26, -5], [-22, 3], [-20, 12], [-19, 22], [-16, 30], [-12, 38], [-10, 43], [-6.5, 48.5], [-2.5, 49.6], [4.1, 51.95]],
  // Los Angeles → Busan (Pacifique Nord)
  [[-118.2, 33.7], [-124, 35], [-140, 41], [-158, 47], [-175, 49], [172, 48], [152, 43], [138, 37], [130.5, 35.5], [129.05, 35.1]],
  // Singapour → Shanghai (mer de Chine méridionale/orientale)
  [[103.85, 1.25], [105.5, 3], [108.5, 8], [111, 13], [114, 18], [117, 22], [120, 26], [122, 29], [122.05, 30.6]],
  // Fujairah → Singapour (golfe d'Oman → mer d'Arabie → sud de l'Inde → Malacca)
  [[56.4, 25.2], [58.5, 24], [61, 21], [64, 15], [68, 10], [74, 7], [80, 5.5], [86, 5.5], [92, 6], [96, 5], [99, 3.5], [103.85, 1.25]],
  // Rotterdam → Singapour (Manche → Gibraltar → Méditerranée → Suez → mer Rouge → Malacca)
  [[4.1, 51.95], [1.4, 51.0], [-2.5, 49.6], [-8, 45], [-9.6, 40], [-8, 36.5], [-5.6, 36.0],
   [-1, 36.6], [3, 37.8], [8, 38], [12, 37.5], [16, 35.5], [21, 34.5], [27, 33.8], [31.5, 31.9], [32.3, 30.0],
   [33.5, 27], [35.5, 23], [38, 18], [41.5, 14], [43.3, 12.6], [47, 12.5], [52, 13], [58, 12.5], [63, 10], [68, 8], [74, 6.5], [80, 5.5], [86, 5.5], [92, 6], [96, 5], [99, 3.5], [103.85, 1.25]],
  // Singapour → Durban (océan Indien SO)
  [[103.85, 1.25], [99, 2], [92, 0], [82, -4], [72, -10], [62, -18], [52, -24], [42, -28], [33, -29.9], [31, -29.87]],
  // Le Pirée → Suez (Méditerranée orientale)
  [[23.65, 37.94], [25, 35.5], [28, 33.5], [31.5, 31.9], [32.3, 30.0]],
];

const VESSEL_PALETTE: Array<[string, number]> = [
  ["#4fc3f7", 0.42],
  ["#7fe0a8", 0.28],
  ["#ffb26b", 0.16],
  ["#9d7cf5", 0.06],
  ["#9fb0c7", 0.06],
  ["#ff8a8a", 0.02],
];
function pickColor(): string {
  let r = Math.random();
  for (const [c, w] of VESSEL_PALETTE) {
    r -= w;
    if (r < 0) return c;
  }
  return "#9fb0c7";
}

const norm180 = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Interpolateur le long d'un couloir (suit exactement la polyligne). */
function makeLaneInterp(lane: LL[]) {
  const segs: Array<{ a: LL; b: LL; d: number; acc: number }> = [];
  let total = 0;
  for (let i = 0; i < lane.length - 1; i++) {
    const d = geoDistance(lane[i], lane[i + 1]) || 1e-6;
    segs.push({ a: lane[i], b: lane[i + 1], d, acc: total });
    total += d;
  }
  return (t: number): LL => {
    const target = clamp(t, 0, 1) * total;
    let s = segs[segs.length - 1];
    for (const seg of segs) {
      if (target <= seg.acc + seg.d) {
        s = seg;
        break;
      }
    }
    const lt = (target - s.acc) / s.d;
    return geoInterpolate(s.a, s.b)(clamp(lt, 0, 1)) as LL;
  };
}

/* ---------- jauge circulaire ---------- */

function Ring({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = clamp(pct, 0, 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={64} height={64} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={r} fill="none" stroke="#1d2a3f" strokeWidth={3.5} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={`${(c * p) / 100} ${c}`}
          transform="rotate(-90 32 32)"
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />
        <text x={32} y={37} textAnchor="middle" fontSize={14} fontWeight={600} fill={color} className="font-mono">
          {Math.round(p)}%
        </text>
      </svg>
      <span className="text-center font-mono text-[8px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

/* ---------- composant principal ---------- */

export function GlobeOverview() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [ports, setPorts] = useState<ApiPort[]>([]);
  const [selected, setSelected] = useState<ApiPort | null>(null);
  const [voyages, setVoyages] = useState<ApiVoyage[]>([]);
  const [clock, setClock] = useState("");

  const view = useRef({ lambda: -8, phi: -44, scale: 0, drag: false, lastInteract: 0 });
  const landRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const flyRef = useRef<number | null>(null);
  const portsRef = useRef<ApiPort[]>([]);
  const selectedRef = useRef<ApiPort | null>(null);
  portsRef.current = ports;
  selectedRef.current = selected;

  /* -- données -- */
  useEffect(() => {
    fetch("/api/ports")
      .then((r) => r.json())
      .then((d) => {
        const ps: ApiPort[] = d.ports ?? [];
        setPorts(ps);
        setSelected((s) => s ?? ps.find((p) => p.id === "rotterdam") ?? ps[0] ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    let live = true;
    fetch(`/api/voyages/active?port=${selected.id}`)
      .then((r) => r.json())
      .then((d) => live && setVoyages((d.voyages ?? []).slice(0, 7)))
      .catch(() => live && setVoyages([]));
    return () => {
      live = false;
    };
  }, [selected]);

  useEffect(() => {
    fetch("/data/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        landRef.current = feature(
          topo,
          topo.objects.countries,
        ) as unknown as GeoJSON.FeatureCollection;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toISOString().slice(11, 19) + " UTC"), 1000);
    return () => clearInterval(t);
  }, []);

  /* -- stats réelles -- */
  const stats = useMemo(() => {
    const total = ports.reduce((a, p) => a + p.vesselCount, 0);
    const liveP = ports.filter((p) => p.vesselCount > 0).length;
    const sorted = [...ports].sort((a, b) => b.vesselCount - a.vesselCount);
    const sum = (rs: string[]) =>
      ports.filter((p) => rs.includes(p.region)).reduce((a, p) => a + p.vesselCount, 0);
    return {
      total,
      liveP,
      top: sorted[0],
      sorted,
      europe: sum(["northern-europe", "mediterranean"]),
      americas: sum(["americas"]),
      asiaME: sum(["asia", "middle-east"]),
      africa: sum(["africa"]),
    };
  }, [ports]);

  const baseScale = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return 300;
    return Math.min(wrap.clientWidth, wrap.clientHeight) * 0.62;
  }, []);

  /* -- vol vers un port (clic) -- */
  const flyTo = useCallback(
    (lon: number, lat: number, scaleMul = 2.1) => {
      if (flyRef.current) cancelAnimationFrame(flyRef.current);
      const v = view.current;
      const l0 = v.lambda;
      const p0 = v.phi;
      const s0 = v.scale;
      const dl = norm180(-lon - l0);
      const dp = clamp(-lat, -85, 85) - p0;
      const base = baseScale();
      const ds = clamp(base * scaleMul, base, base * 5) - s0;
      const t0 = performance.now();
      const dur = 900;
      const tick = (now: number) => {
        const e = clamp((now - t0) / dur, 0, 1);
        const k = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
        v.lambda = l0 + dl * k;
        v.phi = p0 + dp * k;
        v.scale = s0 + ds * k;
        if (e < 1) flyRef.current = requestAnimationFrame(tick);
        else flyRef.current = null;
      };
      flyRef.current = requestAnimationFrame(tick);
    },
    [baseScale],
  );

  /* -- rendu canvas + interactions -- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0;
    let H = 0;
    let dpr = 1;

    const proj = geoOrthographic().clipAngle(90).precision(0.4);
    const path = geoPath(proj, ctx);
    const graticule = geoGraticule10();

    // couloirs : interpolateur + navires
    const lanes = SEA_LANES.map((lane) => ({
      lane,
      interp: makeLaneInterp(lane),
      ships: Array.from({ length: 5 + Math.round(Math.random() * 3) }, () => ({
        t: Math.random(),
        sp: 0.00035 + Math.random() * 0.0005,
        col: pickColor(),
      })),
    }));

    const resize = () => {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (view.current.scale === 0) view.current.scale = baseScale();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const center = (): LL => [-view.current.lambda, -view.current.phi];
    const visible = (ll: LL) => geoDistance(ll, center()) < Math.PI / 2 - 0.02;
    let flow = 0;

    const draw = () => {
      const v = view.current;
      const cx = W / 2;
      const cy = H * 0.56;
      const R = v.scale;
      proj.scale(R).translate([cx, cy]).rotate([v.lambda, v.phi, 0]);
      ctx.clearRect(0, 0, W, H);

      // halo atmosphérique
      const atm = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.22);
      atm.addColorStop(0, "rgba(79,195,247,0)");
      atm.addColorStop(0.6, "rgba(56,130,246,0.05)");
      atm.addColorStop(0.86, "rgba(79,195,247,0.16)");
      atm.addColorStop(1, "rgba(79,195,247,0)");
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, 2 * Math.PI);
      ctx.fill();

      // sphère océan
      const ocean = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.34, R * 0.1, cx, cy, R);
      ocean.addColorStop(0, "#0f1d33");
      ocean.addColorStop(1, "#060c17");
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = ocean;
      ctx.fill();

      // graticule
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = "rgba(120,170,235,0.09)";
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // terres
      if (landRef.current) {
        ctx.beginPath();
        path(landRef.current);
        ctx.fillStyle = "#16273f";
        ctx.fill();
        ctx.strokeStyle = "rgba(148,196,255,0.34)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // liseré du limbe
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.strokeStyle = "rgba(110,190,255,0.4)";
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // couloirs maritimes — rendu « flux d'énergie »
      flow += 0.7;
      for (const l of lanes) {
        const geo = { type: "LineString" as const, coordinates: l.lane };
        // glow large
        ctx.beginPath();
        path(geo);
        ctx.strokeStyle = "rgba(79,195,247,0.09)";
        ctx.lineWidth = 4;
        ctx.stroke();
        // base
        ctx.strokeStyle = "rgba(79,195,247,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
        // tirets animés (flux)
        ctx.save();
        ctx.setLineDash([3, 15]);
        ctx.lineDashOffset = -flow;
        ctx.beginPath();
        path(geo);
        ctx.strokeStyle = "rgba(150,220,255,0.75)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // navires (suivent le couloir)
      for (const l of lanes) {
        for (const s of l.ships) {
          s.t += s.sp;
          if (s.t > 1) s.t -= 1;
          const ll = l.interp(s.t);
          if (!visible(ll)) continue;
          const [x, y] = proj(ll)!;
          if (s.col === "#ff8a8a") {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(255,138,138,0.5)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = s.col;
          ctx.fill();
        }
      }

      // ports réels — dots + labels anti-collision
      const zoom = R / baseScale();
      const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
      const vis = portsRef.current
        .filter((p) => p.vesselCount > 0)
        .map((p) => ({ p, ll: [p.center[1], p.center[0]] as LL }))
        .filter((o) => visible(o.ll))
        .sort((a, b) => b.p.vesselCount - a.p.vesselCount);
      for (const { p, ll } of vis) {
        const [x, y] = proj(ll)!;
        const tier = p.vesselCount >= 250 ? 1 : p.vesselCount >= 90 ? 2 : 3;
        const rad = tier === 1 ? 4.2 : tier === 2 ? 3.2 : 2.4;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 4);
        g.addColorStop(0, "rgba(79,195,247,0.5)");
        g.addColorStop(1, "rgba(79,195,247,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad * 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, 2 * Math.PI);
        ctx.fillStyle = "#8fdbfc";
        ctx.fill();
        ctx.strokeStyle = "#eaf7ff";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const wantLabel = tier === 1 || (tier === 2 && zoom > 1.15) || (tier === 3 && zoom > 1.6);
        if (wantLabel) {
          const text = p.name.toUpperCase();
          const fs = tier === 1 ? 12 : 10;
          const w = text.length * fs * 0.62 + rad + 8;
          const box = { x: x + rad + 4, y: y - 8, w, h: 16 };
          const overlap = placed.some(
            (b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y,
          );
          if (!overlap) {
            ctx.font = `${fs}px Geist, ui-sans-serif`;
            ctx.fillStyle = "rgba(200,224,247,0.9)";
            ctx.textAlign = "left";
            ctx.fillText(text, x + rad + 4, y + 3);
            if (tier === 1) {
              ctx.font = "9px monospace";
              ctx.fillStyle = "rgba(120,155,190,0.85)";
              ctx.fillText(`${p.vesselCount} navires`, x + rad + 4, y + 15);
            }
            placed.push(box);
          }
        }
      }

      // port sélectionné : anneau pulsé
      const sel = selectedRef.current;
      if (sel && sel.vesselCount > 0) {
        const ll: LL = [sel.center[1], sel.center[0]];
        if (visible(ll)) {
          const [x, y] = proj(ll)!;
          const pulse = 6 + 4 * (0.5 + 0.5 * Math.sin(performance.now() / 400));
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(79,195,247,0.7)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      // rotation d'inactivité
      if (!v.drag && !flyRef.current && performance.now() - v.lastInteract > 4000) {
        v.lambda = norm180(v.lambda - 0.045);
      }
      raf = requestAnimationFrame(draw);
    };
    let raf = requestAnimationFrame(draw);

    /* interactions */
    let px = 0;
    let py = 0;
    let downX = 0;
    let downY = 0;
    let downT = 0;
    const onDown = (e: PointerEvent) => {
      view.current.drag = true;
      view.current.lastInteract = performance.now();
      px = downX = e.clientX;
      py = downY = e.clientY;
      downT = performance.now();
      if (flyRef.current) {
        cancelAnimationFrame(flyRef.current);
        flyRef.current = null;
      }
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!view.current.drag) return;
      const v = view.current;
      const k = 75 / v.scale;
      v.lambda = norm180(v.lambda + (e.clientX - px) * k);
      v.phi = clamp(v.phi - (e.clientY - py) * k, -85, 85);
      px = e.clientX;
      py = e.clientY;
      v.lastInteract = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      view.current.drag = false;
      view.current.lastInteract = performance.now();
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved < 5 && performance.now() - downT < 400) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        let best: ApiPort | null = null;
        let bestD = 18;
        for (const p of portsRef.current) {
          if (p.vesselCount <= 0) continue;
          const ll: LL = [p.center[1], p.center[0]];
          if (!visible(ll)) continue;
          const [x, y] = proj(ll)!;
          const d = Math.hypot(x - mx, y - my);
          if (d < bestD) {
            bestD = d;
            best = p;
          }
        }
        if (best) {
          setSelected(best);
          flyTo(best.center[1], best.center[0]);
        }
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = view.current;
      const base = baseScale();
      v.scale = clamp(v.scale * (e.deltaY < 0 ? 1.12 : 0.89), base * 0.85, base * 5);
      v.lastInteract = performance.now();
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      if (flyRef.current) cancelAnimationFrame(flyRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [flyTo, baseScale]);

  const fmtEta = (ts?: number | null) => (ts ? new Date(ts).toISOString().slice(11, 16) : "—");
  const regionLabel = (r: string) =>
    ({
      "northern-europe": "Europe du Nord",
      mediterranean: "Méditerranée",
      americas: "Amériques",
      asia: "Asie",
      "middle-east": "Moyen-Orient",
      africa: "Afrique",
      chokepoint: "Détroit",
    })[r] ?? r;

  return (
    <div ref={wrapRef} className="relative h-screen w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      <div className="pointer-events-none absolute left-8 top-1/3 z-[5] font-mono text-[12px] uppercase tracking-[0.28em] text-[rgba(150,190,225,.45)]">
        Bassin Atlantique
      </div>
      <div className="pointer-events-none absolute right-8 top-1/3 z-[5] font-mono text-[12px] uppercase tracking-[0.28em] text-[rgba(150,190,225,.45)]">
        Corridor Suez · Asie
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-16 z-[5] text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-slate-500">Réseau</div>
        <div className="mt-1 text-[28px] font-light tracking-[0.32em] text-slate-100">PORT FLOW MESH</div>
        <div className="mt-1 font-mono text-[12px] tracking-[0.14em] text-slate-500">
          Maillage mondial · {stats.total.toLocaleString("fr-FR")} navires suivis · {stats.liveP}/51 terminaux actifs
        </div>
      </div>

      <header className="absolute inset-x-0 top-0 z-10 flex h-[70px] items-center justify-between px-7">
        <div>
          <div className="text-[20px] font-semibold tracking-[0.2em] text-slate-100">PORT FLOW</div>
          <div className="text-[12px] text-slate-500">Vue mondiale · maillage AIS temps réel</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-slate-500">{clock}</span>
          <Link
            href="/app"
            className="rounded-md border border-sky-500/50 bg-sky-500/10 px-3.5 py-1.5 text-[12.5px] text-sky-300 backdrop-blur transition-colors hover:bg-sky-500/20"
          >
            Ouvrir le tableau de bord →
          </Link>
        </div>
      </header>

      {/* panneau gauche */}
      <aside className="absolute bottom-6 left-6 top-24 z-10 flex w-[288px] flex-col gap-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/35 p-4 backdrop-blur-md">
        <div className="flex justify-around">
          <Ring pct={(stats.liveP / 51) * 100} color="#4fc3f7" label="Ports actifs" />
          <Ring
            pct={stats.total && stats.top ? (stats.top.vesselCount / stats.total) * 100 : 0}
            color="#ffb26b"
            label="Charge 1er hub"
          />
          <Ring pct={stats.total ? (stats.europe / stats.total) * 100 : 0} color="#7fe0a8" label="Part Europe" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              ["Navires suivis", stats.total.toLocaleString("fr-FR")],
              ["Ports actifs", `${stats.liveP}/51`],
              ["Europe", stats.europe.toLocaleString("fr-FR")],
              ["Amériques", stats.americas.toLocaleString("fr-FR")],
              ["Asie · M-O", stats.asiaME.toLocaleString("fr-FR")],
              ["Afrique", stats.africa.toLocaleString("fr-FR")],
            ] as Array<[string, string]>
          ).map(([label, val]) => (
            <div key={label} className="rounded-md border border-slate-800 bg-slate-900/50 px-2.5 py-2">
              <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">{label}</div>
              <div className="font-mono text-[16px] font-semibold tabular-nums text-slate-100">{val}</div>
            </div>
          ))}
        </div>
        <div className="mt-1 flex min-h-0 flex-1 flex-col">
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
            Hubs par trafic — cliquez pour voler
          </div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1 scroll-thin">
            {stats.sorted.slice(0, 12).map((p) => {
              const max = stats.top?.vesselCount || 1;
              const active = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    flyTo(p.center[1], p.center[0]);
                  }}
                  className={`flex items-center gap-2 rounded px-1.5 py-1 text-left transition-colors hover:bg-sky-500/10 ${
                    active ? "bg-sky-500/15" : ""
                  }`}
                >
                  <span className={`w-24 truncate text-[11px] ${active ? "text-sky-300" : "text-slate-300"}`}>
                    {p.name}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded bg-slate-800">
                    <div className="h-full rounded bg-sky-500" style={{ width: `${(p.vesselCount / max) * 100}%`, opacity: 0.5 }} />
                  </div>
                  <span className="w-9 text-right font-mono text-[10px] tabular-nums text-slate-400">{p.vesselCount}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* panneau droit */}
      <aside className="absolute bottom-6 right-6 top-24 z-10 flex w-[368px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/35 p-4 backdrop-blur-md">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Mouvements navires</span>
          {selected ? (
            <span className="font-mono text-[10px] text-sky-300">
              {selected.name} · {regionLabel(selected.region)}
            </span>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900/60 backdrop-blur">
              <tr className="font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500">
                <th className="py-1.5 font-medium">Navire</th>
                <th className="py-1.5 font-medium">Cargo</th>
                <th className="py-1.5 text-right font-medium">Dist</th>
                <th className="py-1.5 text-right font-medium">SOG</th>
                <th className="py-1.5 text-right font-medium">ETA</th>
              </tr>
            </thead>
            <tbody>
              {voyages.map((v) => (
                <tr key={v.voyageId} className="border-t border-slate-800/50 text-[11px]">
                  <td className="py-1.5 pr-2 font-medium text-slate-100">{v.name}</td>
                  <td className="py-1.5 pr-2 text-slate-400">{v.cargoClass ?? "—"}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-300">
                    {v.currentDistanceNm != null ? `${v.currentDistanceNm.toFixed(1)} nm` : "—"}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-300">{v.currentSog.toFixed(1)} kn</td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-sky-300">{fmtEta(v.predictedEta)}</td>
                </tr>
              ))}
              {voyages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[11px] text-slate-500">
                    {selected ? "Aucun voyage actif en approche." : "Chargement…"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-2 border-t border-slate-800 pt-2 font-mono text-[9px] text-slate-600">
          Glissez pour tourner · molette pour zoomer · cliquez un port pour vous y rendre
        </div>
      </aside>
    </div>
  );
}
