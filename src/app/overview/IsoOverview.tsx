"use client";

/**
 * Vue d'ensemble isométrique — implémentation du handoff Claude Design
 * (« Adapter design au dashboard Portflow », variante 1a, 25/07/2026).
 *
 * Carte pseudo-3D : géométrie réelle (Natural Earth 110m, servie en local)
 * projetée en Mercator puis inclinée par une affine 2D (θ=-18°, k=0.54) —
 * pas de CSS 3D. Ports = cubes isométriques dont la hauteur suit le nombre
 * RÉEL de navires (/api/ports), navires animés le long des corridors.
 * Le bandeau bas agrège les mêmes données réelles.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

/* ---------- géométrie isométrique (portée du prototype) ---------- */

const TH = (-18 * Math.PI) / 180;
const KY = 0.54;

type Pt = [number, number];
type IsoFn = ((p: Pt) => Pt) & { matrix: string };

function isoFn(cx: number, cy: number): IsoFn {
  const ct = Math.cos(TH);
  const st = Math.sin(TH);
  const f = ((p: Pt): Pt => [
    ct * p[0] - st * p[1] + cx,
    KY * (st * p[0] + ct * p[1]) + cy,
  ]) as IsoFn;
  f.matrix = `matrix(${ct},${KY * st},${-st},${KY * ct},${cx},${cy})`;
  return f;
}

function cube(iso: IsoFn, p: Pt, s: number, h: number) {
  const corners: Pt[] = [
    [p[0] - s, p[1] - s],
    [p[0] + s, p[1] - s],
    [p[0] + s, p[1] + s],
    [p[0] - s, p[1] + s],
  ];
  const base = corners.map(iso);
  const topF = base.map((q) => [q[0], q[1] - h] as Pt);
  let mi = 0;
  base.forEach((q, i) => {
    if (q[1] > base[mi][1]) mi = i;
  });
  const n1 = (mi + 1) % 4;
  const n3 = (mi + 3) % 4;
  const quad = (a: number, b: number) =>
    `${base[a][0]},${base[a][1]} ${base[b][0]},${base[b][1]} ${topF[b][0]},${topF[b][1]} ${topF[a][0]},${topF[a][1]}`;
  return {
    top: topF.map((q) => q.join(",")).join(" "),
    s1: quad(mi, n1),
    s2: quad(mi, n3),
    apex: topF[mi] as Pt,
  };
}

/** Catmull-Rom → cubic Bézier (équivalent d3.curveCatmullRom). */
function catmullRomPath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  const p = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const SVG_NS = "http://www.w3.org/2000/svg";
function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

/* ---------- région Europe (bbox + corridors du handoff) ---------- */

const BBOX: [Pt, Pt] = [
  [-13, 30],
  [33, 60],
];

const ROUTES: Pt[][] = [
  [[4.1, 51.9], [1.9, 51.3], [-1.5, 49.9], [-5.6, 48.4], [-9.5, 43.5], [-9.4, 38.7], [-6.9, 36.6], [-5.4, 36.1]],
  [[9.9, 53.9], [7.6, 54.2], [4.3, 52.6], [1.9, 51.3], [0.2, 49.6]],
  [[-5.4, 36.1], [-2.0, 36.6], [-0.3, 39.4], [3.3, 42.2], [5.3, 43.3], [8.9, 44.4]],
  [[5.3, 43.3], [10.0, 39.0], [14.5, 35.9], [19.5, 35.6], [23.6, 37.9]],
  [[18.6, 54.4], [14.5, 55.2], [12.6, 55.6], [10.1, 54.4], [9.9, 53.8]],
  [[23.6, 37.9], [27.5, 34.9], [32.3, 31.4]],
  [[-5.4, 36.1], [-3.0, 35.6], [2.0, 37.2], [8.0, 37.6], [13.0, 36.6], [15.9, 38.4]],
  [[1.3, 51.9], [3.0, 52.6], [4.3, 52.6], [4.1, 51.9]],
];

/* ---------- données réelles ---------- */

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

const PALETTE: Array<[string, number]> = [
  ["#4fc3f7", 0.42],
  ["#7fe0a8", 0.28],
  ["#ffb26b", 0.16],
  ["#9d7cf5", 0.06],
  ["#9fb0c7", 0.06],
  ["#ff8a8a", 0.02],
];
function pickColor(): string {
  let r = Math.random();
  for (const [c, w] of PALETTE) {
    r -= w;
    if (r < 0) return c;
  }
  return "#9fb0c7";
}

/* ---------- jauge circulaire ---------- */

function Ring({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={74} height={74} viewBox="0 0 74 74">
        <circle cx={37} cy={37} r={r} fill="none" stroke="#1d2a3f" strokeWidth={4} />
        <circle
          cx={37}
          cy={37}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform="rotate(-90 37 37)"
        />
        <text x={37} y={42} textAnchor="middle" fontSize={15} fontWeight={600} fill={color} className="font-mono">
          {Math.round(pct)}%
        </text>
      </svg>
      <span className="text-center font-mono text-[8.5px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

/* ---------- composant principal ---------- */

export function IsoOverview() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ports, setPorts] = useState<ApiPort[]>([]);
  const [voyages, setVoyages] = useState<ApiVoyage[]>([]);
  const [clock, setClock] = useState("");

  useEffect(() => {
    fetch("/api/ports")
      .then((r) => r.json())
      .then((d) => setPorts(d.ports ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/voyages/active?port=rotterdam")
      .then((r) => r.json())
      .then((d) => setVoyages((d.voyages ?? []).slice(0, 6)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date().toISOString().slice(11, 19) + " UTC");
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const inView = useMemo(
    () =>
      ports.filter(
        (p) =>
          p.center[1] >= BBOX[0][0] &&
          p.center[1] <= BBOX[1][0] &&
          p.center[0] >= BBOX[0][1] &&
          p.center[0] <= BBOX[1][1],
      ),
    [ports],
  );

  const stats = useMemo(() => {
    const total = ports.reduce((a, p) => a + p.vesselCount, 0);
    const view = inView.reduce((a, p) => a + p.vesselCount, 0);
    const live = ports.filter((p) => p.vesselCount > 0).length;
    const top = [...ports].sort((a, b) => b.vesselCount - a.vesselCount)[0];
    const sum = (regions: string[]) =>
      ports.filter((p) => regions.includes(p.region)).reduce((a, p) => a + p.vesselCount, 0);
    return {
      total,
      view,
      live,
      top,
      nEurope: sum(["northern-europe"]),
      med: sum(["mediterranean"]),
      americas: sum(["americas"]),
      asia: sum(["asia", "middle-east"]),
    };
  }, [ports, inView]);

  /* -- construction impérative de la carte (portage du prototype) -- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host || inView.length === 0) return;
    host.innerHTML = "";
    const W = host.clientWidth;
    const H = host.clientHeight;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}` });
    svg.style.width = "100%";
    svg.style.height = "100%";
    host.appendChild(svg);
    const defs = el("defs");
    svg.appendChild(defs);
    const uid = "iso";

    const glow = el("radialGradient", { id: `${uid}-glow` });
    glow.append(
      el("stop", { offset: "0%", "stop-color": "rgba(79,195,247,.55)" }),
      el("stop", { offset: "100%", "stop-color": "rgba(79,195,247,0)" }),
    );
    const beam = el("linearGradient", { id: `${uid}-beam`, x1: 0, y1: 1, x2: 0, y2: 0 });
    beam.append(
      el("stop", { offset: "0%", "stop-color": "rgba(79,195,247,.85)" }),
      el("stop", { offset: "100%", "stop-color": "rgba(79,195,247,0)" }),
    );
    defs.append(glow, beam);

    const fitW = Math.min(1330, W * 0.92);
    const fitH = fitW * 0.526;
    const proj = geoMercator().fitExtent(
      [
        [0, 0],
        [fitW, fitH],
      ],
      {
        type: "MultiPoint",
        coordinates: [BBOX[0], BBOX[1], [BBOX[0][0], BBOX[1][1]], [BBOX[1][0], BBOX[0][1]]],
      } as never,
    );
    const iso = isoFn(0, 0);
    const P = (ll: Pt): Pt => iso(proj(ll) as Pt);

    const plate: Pt[] = (
      [
        [0, 0],
        [fitW, 0],
        [fitW, fitH],
        [0, fitH],
      ] as Pt[]
    ).map(iso);
    const xs = plate.map((p) => p[0]);
    const ys = plate.map((p) => p[1]);
    const offX = W / 2 - (Math.min(...xs) + Math.max(...xs)) / 2;
    const offY = H * 0.46 - (Math.min(...ys) + Math.max(...ys)) / 2;
    const root = el("g", { transform: `translate(${offX},${offY})` });
    svg.appendChild(root);

    // masque de fondu radial : la carte se dissout, aucun bord dur
    const px0 = Math.min(...xs);
    const px1 = Math.max(...xs);
    const py0 = Math.min(...ys);
    const py1 = Math.max(...ys);
    const fade = el("radialGradient", {
      id: `${uid}-fade`,
      gradientUnits: "userSpaceOnUse",
      cx: (px0 + px1) / 2,
      cy: (py0 + py1) / 2,
      r: (Math.hypot(px1 - px0, py1 - py0) / 2) * 0.72,
    });
    fade.append(
      el("stop", { offset: "55%", "stop-color": "#fff" }),
      el("stop", { offset: "100%", "stop-color": "#000" }),
    );
    const mask = el("mask", { id: `${uid}-fadem` });
    mask.appendChild(
      el("rect", {
        x: px0 - 80,
        y: py0 - 80,
        width: px1 - px0 + 160,
        height: py1 - py0 + 160,
        fill: `url(#${uid}-fade)`,
      }),
    );
    defs.append(fade, mask);

    const ground = el("g", { mask: `url(#${uid}-fadem)` });
    root.appendChild(ground);

    ground.appendChild(
      el("polygon", { points: plate.map((p) => p.join(",")).join(" "), fill: "rgba(13,25,45,.5)" }),
    );
    for (let i = 1; i < 10; i++) {
      const a = iso([(fitW * i) / 10, 0]);
      const b = iso([(fitW * i) / 10, fitH]);
      const c = iso([0, (fitH * i) / 10]);
      const d = iso([fitW, (fitH * i) / 10]);
      ground.append(
        el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "rgba(120,170,235,.09)" }),
        el("line", { x1: c[0], y1: c[1], x2: d[0], y2: d[1], stroke: "rgba(120,170,235,.09)" }),
      );
    }

    const clip = el("clipPath", { id: `${uid}-clip` });
    clip.appendChild(el("polygon", { points: plate.map((p) => p.join(",")).join(" ") }));
    defs.appendChild(clip);
    const landG = el("g", { "clip-path": `url(#${uid}-clip)` });
    ground.appendChild(landG);
    const routeG = el("g");
    const portG = el("g");
    const shipG = el("g");
    const labelG = el("g");
    root.append(routeG, portG, shipG, labelG);

    let disposed = false;
    fetch("/data/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (disposed) return;
        const feats = feature(
          topo,
          topo.objects.countries,
        ) as unknown as { features: Array<{ type: string }> };
        const path = geoPath(proj);
        const g = el("g", { transform: iso.matrix });
        for (const f of feats.features) {
          const d = path(f as never);
          if (!d) continue;
          g.appendChild(
            el("path", {
              d,
              fill: "#101c30",
              stroke: "rgba(148,196,255,.5)",
              "stroke-width": 1,
              "vector-effect": "non-scaling-stroke",
            }),
          );
        }
        landG.appendChild(g);
      })
      .catch(() => {});

    // corridors
    const routePts = ROUTES.map((r) => r.map(([lon, lat]) => P([lon, lat])));
    const routePaths: SVGPathElement[] = [];
    routePts.forEach((pts) => {
      const d = catmullRomPath(pts);
      routeG.append(
        el("path", { d, fill: "none", stroke: "rgba(79,195,247,.20)", "stroke-width": 1.2 }),
        el("path", { d, fill: "none", stroke: "rgba(79,195,247,.07)", "stroke-width": 5 }),
      );
      const hidden = el("path", { d, fill: "none", stroke: "none" });
      routeG.appendChild(hidden);
      routePaths.push(hidden);
    });

    // ports réels (top 14 de la zone, tiers par volume)
    const shown = [...inView].sort((a, b) => b.vesselCount - a.vesselCount).slice(0, 14);
    const tierOf = (v: number) => (v >= 300 ? 1 : v >= 90 ? 2 : 3);
    const placed: Array<{ x: number; y: number; w: number }> = [];
    const entries = shown
      .map((p) => ({ p, ll: [p.center[1], p.center[0]] as Pt }))
      .sort((a, b) => P(a.ll)[0] - P(b.ll)[0]);
    entries.forEach(({ p, ll }) => {
      const pp = proj(ll) as Pt;
      const tier = tierOf(p.vesselCount);
      const s = tier === 1 ? 13 : tier === 2 ? 10 : 7.5;
      const h = 10 + Math.min(60, p.vesselCount / 12);
      const c = cube(iso, pp, s, h);
      const name = p.name.toUpperCase();
      let beamH = 46 + Math.min(70, p.vesselCount / 8);
      const w = name.length * 7.5;
      let yTop = c.apex[1] - beamH - 10;
      let guard = 0;
      while (
        guard++ < 20 &&
        placed.some((b) => Math.abs(b.x - c.apex[0]) < (b.w + w) / 2 + 14 && Math.abs(b.y - yTop) < 32)
      ) {
        beamH += 34;
        yTop = c.apex[1] - beamH - 10;
      }
      placed.push({ x: c.apex[0], y: yTop, w });

      const base = iso(pp);
      portG.append(
        el("ellipse", {
          cx: base[0],
          cy: base[1],
          rx: s * 4.2,
          ry: s * 2.4,
          fill: `url(#${uid}-glow)`,
          opacity: 0.5,
        }),
        el("polygon", { points: c.s1, fill: "#1e5f86" }),
        el("polygon", { points: c.s2, fill: "#164a6a" }),
        el("polygon", { points: c.top, fill: "#38a8dd", stroke: "#8fdbfc", "stroke-width": 0.8 }),
        el("rect", {
          x: c.apex[0] - 1.2,
          y: c.apex[1] - beamH,
          width: 2.4,
          height: beamH,
          fill: `url(#${uid}-beam)`,
          opacity: 0.75,
        }),
      );
      const t1 = el("text", {
        x: c.apex[0],
        y: c.apex[1] - beamH - 10,
        "text-anchor": "middle",
        fill: "rgba(190,222,245,.85)",
        "font-size": tier === 1 ? 13 : 11,
        "letter-spacing": ".18em",
        "font-weight": 300,
      });
      t1.textContent = name;
      labelG.appendChild(t1);
      if (tier < 3) {
        const t2 = el("text", {
          x: c.apex[0],
          y: c.apex[1] - beamH + 4,
          "text-anchor": "middle",
          fill: "rgba(110,150,185,.8)",
          "font-size": 9,
          "font-family": "monospace",
        });
        t2.textContent = `${p.vesselCount} vessels`;
        labelG.appendChild(t2);
      }
      // encombrement à quai (proportionnel au réel)
      for (let i = 0; i < Math.min(30, Math.round(p.vesselCount / 9)); i++) {
        const q = iso([pp[0] + (Math.random() - 0.5) * 46, pp[1] + (Math.random() - 0.5) * 46]);
        shipG.appendChild(
          el("circle", {
            cx: q[0],
            cy: q[1],
            r: 1.6 + Math.random() * 1.4,
            fill: pickColor(),
            opacity: 0.55,
          }),
        );
      }
    });

    // navires en mouvement — densité liée au trafic réel de la zone
    const perRoute = Math.max(5, Math.min(11, Math.round(stats.view / 260)));
    const ships: Array<{
      el: SVGCircleElement;
      halo: SVGCircleElement | null;
      pathEl: SVGPathElement;
      L: number;
      t: number;
      sp: number;
    }> = [];
    routePaths.forEach((pathEl) => {
      const L = pathEl.getTotalLength();
      for (let i = 0; i < perRoute; i++) {
        const col = pickColor();
        const dot = el("circle", {
          r: col === "#ff8a8a" ? 3.6 : 2.6 + Math.random() * 1.4,
          fill: col,
          opacity: 0.9,
        });
        shipG.appendChild(dot);
        let halo: SVGCircleElement | null = null;
        if (col === "#ff8a8a") {
          halo = el("circle", { r: 7, fill: "none", stroke: "rgba(255,138,138,.5)", "stroke-width": 1 });
          shipG.appendChild(halo);
        }
        ships.push({
          el: dot,
          halo,
          pathEl,
          L,
          t: Math.random(),
          sp: (0.000045 + Math.random() * 0.00007) * (Math.random() < 0.5 ? 1 : -1),
        });
      }
    });

    let raf = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = () => {
      ships.forEach((s) => {
        s.t += s.sp;
        if (s.t > 1) s.t -= 1;
        if (s.t < 0) s.t += 1;
        const pt = s.pathEl.getPointAtLength(s.t * s.L);
        s.el.setAttribute("cx", String(pt.x));
        s.el.setAttribute("cy", String(pt.y));
        if (s.halo) {
          s.halo.setAttribute("cx", String(pt.x));
          s.halo.setAttribute("cy", String(pt.y));
        }
      });
      raf = requestAnimationFrame(step);
    };
    if (!reduced) raf = requestAnimationFrame(step);
    else step();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      host.innerHTML = "";
    };
  }, [inView, stats.view]);

  const fmtEta = (ts?: number | null) =>
    ts ? new Date(ts).toISOString().slice(11, 16) : "—";

  return (
    <div className="flex min-h-screen flex-col">
      {/* header */}
      <header className="flex h-[70px] items-center justify-between px-7">
        <div>
          <div className="text-[22px] font-semibold tracking-[0.2em] text-slate-100">
            PORT FLOW
          </div>
          <div className="text-[12px] text-slate-500">
            Tanker Intelligence · Live Overview
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-slate-500">{clock}</span>
          <Link
            href="/app"
            className="rounded-md border border-sky-500/50 bg-sky-500/10 px-3.5 py-1.5 text-[12.5px] text-sky-300 transition-colors hover:bg-sky-500/20"
          >
            Open dashboard →
          </Link>
        </div>
      </header>

      {/* carte plein cadre */}
      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center font-mono text-[13px] uppercase tracking-[0.3em] text-[rgba(150,190,225,.62)]">
          North Atlantic · Mediterranean
        </div>
        <div ref={hostRef} className="absolute inset-0" />
      </div>

      {/* bandeau analytique */}
      <div className="grid grid-cols-1 gap-3.5 px-6 pb-6 lg:grid-cols-[320px_1fr_452px]">
        {/* jauges + KPI */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-3 flex justify-around">
            <Ring
              pct={stats.total ? (stats.view / stats.total) * 100 : 0}
              color="#4fc3f7"
              label="Europe share"
            />
            <Ring
              pct={stats.view && stats.top ? (stats.top.vesselCount / stats.view) * 100 : 0}
              color="#ffb26b"
              label="Top hub load"
            />
            <Ring pct={(stats.live / 51) * 100} color="#7fe0a8" label="Ports live" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ["Tracked", stats.total],
                ["In view", stats.view],
                ["Ports live", `${stats.live}/51`],
                ["N. Europe", stats.nEurope],
                ["Mediterr.", stats.med],
                ["Asia·ME", stats.asia],
              ] as Array<[string, string | number]>
            ).map(([label, value]) => (
              <div key={label} className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-2">
                <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-slate-500">
                  {label}
                </div>
                <div className="font-mono text-[17px] font-semibold tabular-nums text-slate-100">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* activité par port (barres, données réelles) */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
              Port activity · live vessel count
            </span>
            <span className="font-mono text-[10px] text-slate-500">{clock}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {[...inView]
              .sort((a, b) => b.vesselCount - a.vesselCount)
              .slice(0, 8)
              .map((p) => {
                const max = inView.reduce((a, q) => Math.max(a, q.vesselCount), 1);
                const pct = (p.vesselCount / max) * 100;
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="w-28 truncate text-[11.5px] text-slate-300">{p.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-800">
                      <div
                        className="h-full rounded bg-sky-500"
                        style={{ width: `${pct}%`, opacity: 0.45 + pct / 180 }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] tabular-nums text-slate-100">
                      {p.vesselCount}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>

        {/* mouvements (voyages actifs Rotterdam, réels) */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
            Vessel movements · Rotterdam approach
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-slate-500">
                <th className="py-1 font-medium">Vessel</th>
                <th className="py-1 font-medium">Cargo</th>
                <th className="py-1 text-right font-medium">Dist</th>
                <th className="py-1 text-right font-medium">SOG</th>
                <th className="py-1 text-right font-medium">ETA</th>
              </tr>
            </thead>
            <tbody>
              {voyages.map((v) => (
                <tr key={v.voyageId} className="border-t border-slate-800/60 text-[11.5px]">
                  <td className="py-1.5 pr-2 font-medium text-slate-100">{v.name}</td>
                  <td className="py-1.5 pr-2 text-slate-400">{v.cargoClass ?? "—"}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-300">
                    {v.currentDistanceNm != null ? `${v.currentDistanceNm.toFixed(1)} nm` : "—"}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-300">
                    {v.currentSog.toFixed(1)} kn
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-sky-300">
                    {fmtEta(v.predictedEta)}
                  </td>
                </tr>
              ))}
              {voyages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[11.5px] text-slate-500">
                    Loading live voyages…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
