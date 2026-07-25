"use client";

/**
 * Globe décoratif en fond de hero (landing). Version allégée du globe
 * /overview : non interactif, rotation lente, faible opacité, AUCUN fetch
 * réseau (hubs statiques) — zéro impact SEO/LCP, purement esthétique.
 * Respecte prefers-reduced-motion (rendu figé). pointer-events: none.
 */

import { useEffect, useRef } from "react";
import { geoOrthographic, geoPath, geoGraticule10, geoDistance, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";

type LL = [number, number];

// Quelques hubs mondiaux (statiques) pour les points lumineux + couloirs.
const HUBS: LL[] = [
  [4.1, 51.95], // Rotterdam
  [9.95, 53.55], // Hambourg
  [23.65, 37.94], // Le Pirée
  [-95, 29.7], // Houston
  [-74, 40.5], // New York
  [103.85, 1.25], // Singapour
  [122.05, 30.6], // Shanghai
  [129.05, 35.1], // Busan
  [-118.2, 33.7], // Los Angeles
  [56.4, 25.2], // Fujairah
  [-46.3, -24], // Santos
  [31, -29.87], // Durban
];

const LANES: LL[][] = [
  [[4.1, 51.95], [1.4, 51], [-2.5, 49.6], [-15, 47.5], [-45, 43], [-70, 40.4], [-74, 40.5]],
  [[-94.7, 29.3], [-84, 26], [-79, 26], [-55, 39], [-18, 47], [-2.5, 49.6], [4.1, 51.95]],
  [[4.1, 51.95], [-8, 45], [-5.6, 36], [3, 37.8], [16, 35.5], [31.5, 31.9], [32.3, 30], [38, 18], [43.3, 12.6], [58, 12.5], [68, 8], [80, 5.5], [92, 6], [99, 3.5], [103.85, 1.25]],
  [[103.85, 1.25], [108.5, 8], [114, 18], [120, 26], [122.05, 30.6]],
  [[-118.2, 33.7], [-140, 41], [-175, 49], [152, 43], [130.5, 35.5], [129.05, 35.1]],
  [[56.4, 25.2], [64, 15], [74, 7], [86, 5.5], [99, 3.5], [103.85, 1.25]],
  [[-46.3, -24], [-26, -5], [-19, 22], [-10, 43], [-2.5, 49.6], [4.1, 51.95]],
  [[103.85, 1.25], [82, -4], [62, -18], [42, -28], [31, -29.87]],
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const norm180 = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

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
    return geoInterpolate(s.a, s.b)(clamp((target - s.acc) / s.d, 0, 1)) as LL;
  };
}

export function GlobeBackdrop({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0;
    let H = 0;
    let land: GeoJSON.FeatureCollection | null = null;
    let lambda = -12;

    const proj = geoOrthographic().clipAngle(90).precision(0.5);
    const path = geoPath(proj, ctx);
    const graticule = geoGraticule10();
    const lanes = LANES.map((lane) => ({
      lane,
      interp: makeLaneInterp(lane),
      ships: Array.from({ length: 3 }, () => ({ t: Math.random(), sp: 0.0004 })),
    }));

    const resize = () => {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    fetch("/data/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        land = feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection;
      })
      .catch(() => {});

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let flow = 0;
    let raf = 0;

    const center = (): LL => [-lambda, 8];
    const visible = (ll: LL) => geoDistance(ll, center()) < Math.PI / 2 - 0.02;

    const draw = () => {
      const cx = W * 0.62;
      const cy = H * 0.5;
      const R = Math.min(W, H) * 0.72;
      proj.scale(R).translate([cx, cy]).rotate([lambda, -8, 0]);
      ctx.clearRect(0, 0, W, H);

      // sphère (subtile)
      const ocean = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      ocean.addColorStop(0, "#101f38");
      ocean.addColorStop(1, "#070d18");
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = ocean;
      ctx.fill();

      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = "rgba(120,170,235,0.08)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      if (land) {
        ctx.beginPath();
        path(land);
        ctx.fillStyle = "#15263e";
        ctx.fill();
        ctx.strokeStyle = "rgba(148,196,255,0.28)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.strokeStyle = "rgba(110,190,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // couloirs en flux
      flow += 0.6;
      for (const l of lanes) {
        const geo = { type: "LineString" as const, coordinates: l.lane };
        ctx.beginPath();
        path(geo);
        ctx.strokeStyle = "rgba(79,195,247,0.16)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.save();
        ctx.setLineDash([2, 13]);
        ctx.lineDashOffset = -flow;
        ctx.beginPath();
        path(geo);
        ctx.strokeStyle = "rgba(150,220,255,0.6)";
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.restore();
        for (const s of l.ships) {
          s.t += s.sp;
          if (s.t > 1) s.t -= 1;
          const ll = l.interp(s.t);
          if (!visible(ll)) continue;
          const [x, y] = proj(ll)!;
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, 2 * Math.PI);
          ctx.fillStyle = "#8fdbfc";
          ctx.fill();
        }
      }

      // hubs
      for (const ll of HUBS) {
        if (!visible(ll)) continue;
        const [x, y] = proj(ll)!;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, "rgba(79,195,247,0.45)");
        g.addColorStop(1, "rgba(79,195,247,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, 2 * Math.PI);
        ctx.fillStyle = "#bfe9ff";
        ctx.fill();
      }

      if (!reduced) lambda = norm180(lambda - 0.04);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
