"use client";

/**
 * Vue mondiale « PORT FLOW MESH » — globe interactif temps réel.
 *
 * Globe filaire en projection orthographique (d3-geo) rendu sur <canvas> :
 * l'utilisateur fait tourner la Terre à la souris, zoome à la molette ;
 * cliquer un port recentre + zoome dessus (interpolation de rotation).
 * Les panneaux latéraux sont translucides (backdrop-blur) pour laisser le
 * globe transparaître derrière — continuité visuelle demandée le 25/07.
 *
 * Données réelles : ports + comptages live (/api/ports), voyages actifs du
 * port sélectionné (/api/voyages/active). Les navires animés parcourent les
 * grandes routes (grands cercles entre hubs réels).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoDistance,
  geoInterpolate,
  type GeoProjection,
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

/** Grandes routes maritimes = paires de hubs réels (résolues à l'exécution). */
const ROUTE_HUBS: Array<[string, string]> = [
  ["rotterdam", "newYorkNJ"],
  ["rotterdam", "singapore"],
  ["houston", "rotterdam"],
  ["singapore", "shanghai"],
  ["losAngeles", "busan"],
  ["santos", "rotterdam"],
  ["jebelAli", "rotterdam"],
  ["hamburg", "newYorkNJ"],
  ["singapore", "durban"],
  ["busan", "losAngeles"],
  ["fujairah", "singapore"],
  ["piraeus", "suez"],
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
        <text
          x={32}
          y={37}
          textAnchor="middle"
          fontSize={14}
          fontWeight={600}
          fill={color}
          className="font-mono"
        >
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

  // état mutable de la vue (évite les re-renders pendant l'animation)
  const view = useRef({ lambda: -8, phi: -44, scale: 0, drag: false, lastInteract: 0 });
  const landRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const flyRef = useRef<number | null>(null);

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
      .then((d) => {
        if (live) setVoyages((d.voyages ?? []).slice(0, 7));
      })
      .catch(() => {
        if (live) setVoyages([]);
      });
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
    const live = ports.filter((p) => p.vesselCount > 0).length;
    const sorted = [...ports].sort((a, b) => b.vesselCount - a.vesselCount);
    const top = sorted[0];
    const sum = (rs: string[]) =>
      ports.filter((p) => rs.includes(p.region)).reduce((a, p) => a + p.vesselCount, 0);
    return {
      total,
      live,
      top,
      sorted,
      europe: sum(["northern-europe", "mediterranean"]),
      americas: sum(["americas"]),
      asiaME: sum(["asia", "middle-east"]),
      africa: sum(["africa"]),
    };
  }, [ports]);

  /* -- routes + navires (dérivés des ports réels) -- */
  const routes = useMemo(() => {
    const byId = new Map(ports.map((p) => [p.id, p]));
    const out: Array<{ a: LL; b: LL; ships: Array<{ t: number; sp: number; col: string }> }> = [];
    for (const [ida, idb] of ROUTE_HUBS) {
      const pa = byId.get(ida);
      const pb = byId.get(idb);
      if (!pa || !pb) continue;
      const a: LL = [pa.center[1], pa.center[0]];
      const b: LL = [pb.center[1], pb.center[0]];
      const n = 4 + Math.round(Math.random() * 4);
      const ships = Array.from({ length: n }, () => ({
        t: Math.random(),
        sp: (0.0004 + Math.random() * 0.0006) * (Math.random() < 0.5 ? 1 : -1),
        col: pickColor(),
      }));
      out.push({ a, b, ships });
    }
    return out;
  }, [ports]);
  const routesRef = useRef(routes);
  routesRef.current = routes;
  const portsRef = useRef(ports);
  portsRef.current = ports;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  /* -- vol vers un port (clic) -- */
  const flyTo = useCallback((lon: number, lat: number, scaleMul = 2.1) => {
    if (flyRef.current) cancelAnimationFrame(flyRef.current);
    const v = view.current;
    const l0 = v.lambda;
    const p0 = v.phi;
    const s0 = v.scale;
    const l1 = -lon;
    const p1 = clamp(-lat, -85, 85);
    const dl = norm180(l1 - l0);
    const dp = p1 - p0;
    const base = baseScale();
    const s1 = clamp(base * scaleMul, base, base * 5);
    const ds = s1 - s0;
    const t0 = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const e = clamp((now - t0) / dur, 0, 1);
      const k = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2; // easeInOut
      v.lambda = l0 + dl * k;
      v.phi = p0 + dp * k;
      v.scale = s0 + ds * k;
      if (e < 1) flyRef.current = requestAnimationFrame(tick);
      else flyRef.current = null;
    };
    flyRef.current = requestAnimationFrame(tick);
  }, []);

  const baseScale = () => {
    const wrap = wrapRef.current;
    if (!wrap) return 300;
    return Math.min(wrap.clientWidth, wrap.clientHeight) * 0.62;
  };

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
    const path = geoPath(proj, ctx as unknown as CanvasRenderingContext2D);
    const graticule = geoGraticule10();

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

      // sphère océan (dégradé = relief 3D)
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

      // routes (grands cercles)
      for (const rt of routesRef.current) {
        const interp = geoInterpolate(rt.a, rt.b);
        const line: LL[] = Array.from({ length: 48 }, (_, i) => interp(i / 47) as LL);
        ctx.beginPath();
        path({ type: "LineString", coordinates: line });
        ctx.strokeStyle = "rgba(79,195,247,0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // navires sur les routes
      for (const rt of routesRef.current) {
        const interp = geoInterpolate(rt.a, rt.b);
        for (const s of rt.ships) {
          s.t += s.sp;
          if (s.t > 1) s.t -= 1;
          if (s.t < 0) s.t += 1;
          const ll = interp(s.t) as LL;
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

      // ports réels
      const showLabels = R > baseScale() * 0.9;
      for (const p of portsRef.current) {
        if (p.vesselCount <= 0) continue;
        const ll: LL = [p.center[1], p.center[0]];
        if (!visible(ll)) continue;
        const [x, y] = proj(ll)!;
        const tier = p.vesselCount >= 250 ? 1 : p.vesselCount >= 90 ? 2 : 3;
        const rad = tier === 1 ? 4.2 : tier === 2 ? 3.2 : 2.4;
        // halo
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 4);
        g.addColorStop(0, "rgba(79,195,247,0.5)");
        g.addColorStop(1, "rgba(79,195,247,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad * 4, 0, 2 * Math.PI);
        ctx.fill();
        // cœur
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, 2 * Math.PI);
        ctx.fillStyle = "#8fdbfc";
        ctx.fill();
        ctx.strokeStyle = "#eaf7ff";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // label (hubs seulement, ou quand zoomé)
        if (tier <= 2 || showLabels) {
          ctx.font = `${tier === 1 ? 12 : 10}px Geist, ui-sans-serif`;
          ctx.fillStyle = "rgba(200,224,247,0.9)";
          ctx.textAlign = "left";
          ctx.fillText(p.name.toUpperCase(), x + rad + 4, y + 3);
          if (tier === 1) {
            ctx.font = "9px monospace";
            ctx.fillStyle = "rgba(120,155,190,0.85)";
            ctx.fillText(`${p.vesselCount} navires`, x + rad + 4, y + 15);
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

      // rotation d'inactivité (très lente, en pause après interaction)
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
      const dt = performance.now() - downT;
      if (moved < 5 && dt < 400) {
        // clic → hit-test des ports visibles
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
  }, [flyTo]);

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
      {/* globe */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* labels décoratifs de bassin */}
      <div className="pointer-events-none absolute left-8 top-1/3 z-[5] font-mono text-[12px] uppercase tracking-[0.28em] text-[rgba(150,190,225,.45)]">
        Bassin Atlantique
      </div>
      <div className="pointer-events-none absolute right-8 top-1/3 z-[5] font-mono text-[12px] uppercase tracking-[0.28em] text-[rgba(150,190,225,.45)]">
        Corridor Suez · Asie
      </div>

      {/* titre central */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-[5] text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-slate-500">Réseau</div>
        <div className="mt-1 text-[28px] font-light tracking-[0.32em] text-slate-100">
          PORT FLOW MESH
        </div>
        <div className="mt-1 font-mono text-[12px] tracking-[0.14em] text-slate-500">
          Maillage mondial · {stats.total.toLocaleString("fr-FR")} navires suivis · {stats.live}/51
          terminaux actifs
        </div>
      </div>

      {/* header */}
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

      {/* panneau gauche : jauges + KPI (translucide) */}
      <aside className="absolute bottom-6 left-6 top-24 z-10 flex w-[288px] flex-col gap-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/35 p-4 backdrop-blur-md">
        <div className="flex justify-around">
          <Ring pct={(stats.live / 51) * 100} color="#4fc3f7" label="Ports actifs" />
          <Ring
            pct={stats.total && stats.top ? (stats.top.vesselCount / stats.total) * 100 : 0}
            color="#ffb26b"
            label="Charge 1er hub"
          />
          <Ring
            pct={stats.total ? (stats.europe / stats.total) * 100 : 0}
            color="#7fe0a8"
            label="Part Europe"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              ["Navires suivis", stats.total.toLocaleString("fr-FR")],
              ["Ports actifs", `${stats.live}/51`],
              ["Europe", stats.europe.toLocaleString("fr-FR")],
              ["Amériques", stats.americas.toLocaleString("fr-FR")],
              ["Asie · M-O", stats.asiaME.toLocaleString("fr-FR")],
              ["Afrique", stats.africa.toLocaleString("fr-FR")],
            ] as Array<[string, string]>
          ).map(([label, val]) => (
            <div key={label} className="rounded-md border border-slate-800 bg-slate-900/50 px-2.5 py-2">
              <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">
                {label}
              </div>
              <div className="font-mono text-[16px] font-semibold tabular-nums text-slate-100">
                {val}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 min-h-0 flex-1 overflow-hidden">
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
            Hubs par trafic — cliquez pour voler
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto pr-1 scroll-thin" style={{ maxHeight: "100%" }}>
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
                  <span
                    className={`w-24 truncate text-[11px] ${active ? "text-sky-300" : "text-slate-300"}`}
                  >
                    {p.name}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded bg-slate-800">
                    <div
                      className="h-full rounded bg-sky-500"
                      style={{ width: `${(p.vesselCount / max) * 100}%`, opacity: 0.5 }}
                    />
                  </div>
                  <span className="w-9 text-right font-mono text-[10px] tabular-nums text-slate-400">
                    {p.vesselCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* panneau droit : mouvements du port sélectionné (translucide) */}
      <aside className="absolute bottom-6 right-6 top-24 z-10 flex w-[368px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/35 p-4 backdrop-blur-md">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
            Mouvements navires
          </span>
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
