import Link from "next/link";
import type { NetNode, Network as Net } from "@/lib/screen";
import { cargoLabel } from "./ui";

// Toile de relations rendue en SVG côté serveur, sans JS :
// - chaque navire est un lien qui le place au centre (le chemin parcouru
//   est gardé dans l'URL, ?t=…) ;
// - chaque lien entre deux navires ouvre la preuve du rapprochement ;
// - info-bulles et surbrillance croisée avec la liste en CSS (:has).

const W = 900;
const H = 540;
const CX = W / 2;
const CY = H / 2;
const R1 = { x: 215, y: 160 };
const R2 = { x: 390, y: 240 };

interface Placed extends NetNode {
  x: number;
  y: number;
  angle: number;
  r: number;
}

function trunc(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function d2(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}`;
}

function layout(net: Net): Placed[] {
  const placed = new Map<string, Placed>();
  const center = net.nodes.find((n) => n.ring === 0)!;
  placed.set(center.id, { ...center, x: CX, y: CY, angle: 0, r: 26 });

  const ring1 = net.nodes.filter((n) => n.ring === 1);
  ring1.forEach((n, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(ring1.length, 1);
    const r = n.kind === "port" ? 13 : n.identified ? 15 : 10;
    placed.set(n.id, {
      ...n,
      angle,
      x: CX + R1.x * Math.cos(angle),
      y: CY + R1.y * Math.sin(angle),
      r,
    });
  });

  const byParent = new Map<string, NetNode[]>();
  for (const n of net.nodes.filter((x) => x.ring === 2)) {
    const arr = byParent.get(n.parent!) ?? [];
    arr.push(n);
    byParent.set(n.parent!, arr);
  }
  for (const [pid, kids] of byParent) {
    const p = placed.get(pid);
    if (!p) continue;
    kids.forEach((n, j) => {
      const angle = p.angle + (j - (kids.length - 1) / 2) * 0.24;
      placed.set(n.id, {
        ...n,
        angle,
        x: CX + R2.x * Math.cos(angle),
        y: CY + R2.y * Math.sin(angle),
        r: n.identified ? 9 : 6,
      });
    });
  }
  return [...placed.values()];
}

function tipLines(n: NetNode): string[] {
  if (n.kind === "port") return [n.label, `${n.weight} port call${n.weight > 1 ? "s" : ""}`, "Open port page"];
  const lines = [n.label];
  const id = [
    n.cargoClass ? cargoLabel(n.cargoClass) : null,
    n.lists.length ? `${n.lists.join("/")} list` : "not listed",
    n.flagCode ? `flag ${n.flagCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  lines.push(id);
  if (n.ring > 0) {
    lines.push(
      `${n.weight} contact${n.weight > 1 ? "s" : ""} · ${Math.round(n.hours)} h · last ${d2(n.lastTs)}${n.best === "transfer" ? " · probable transfer" : ""}`,
    );
  }
  return lines;
}

export function Network({
  net,
  trail = [],
  query = "",
}: {
  net: Net;
  trail?: number[];
  query?: string;
}) {
  const nodes = layout(net);
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const center = nodes.find((n) => n.ring === 0)!;
  const nextTrail = [...trail.filter((m) => m !== center.mmsi), center.mmsi!].slice(-5);
  const vesselHref = (m: number) =>
    `/brief/vessel/${m}?t=${nextTrail.join(",")}${query ? `&${query}` : ""}`;
  const hrefOf = (n: NetNode): string | null => {
    if (n.kind === "port" && n.portId) return `/ports/${n.portId}`;
    if (n.kind === "vessel" && n.mmsi) return vesselHref(n.mmsi);
    return null;
  };

  // Surbrillance croisée toile ↔ liste, et info-bulles, en CSS pur.
  const css = nodes
    .filter((n) => n.mmsi)
    .map(
      (n) =>
        `.pfg:has([data-m="${n.mmsi}"]:hover) [data-m="${n.mmsi}"] .pfc{stroke-width:3.5;filter:brightness(1.5)}` +
        `.pfg:has([data-m="${n.mmsi}"]:hover) li[data-m="${n.mmsi}"]{background:rgba(56,189,248,.09)}` +
        `.pfg:has([data-m="${n.mmsi}"]:hover) .pftip[data-tip="${n.id}"]{opacity:1}`,
    )
    .join("");
  const portCss = nodes
    .filter((n) => n.kind === "port")
    .map((n) => `.pfg:has([data-p="${n.id}"]:hover) .pftip[data-tip="${n.id}"]{opacity:1}`)
    .join("");

  const ring1 = nodes.filter((n) => n.ring === 1 && n.kind === "vessel");
  const kidsOf = (id: string) => nodes.filter((n) => n.parent === id);

  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-[radial-gradient(ellipse_at_center,#0d1726_0%,#070b12_70%)]">
      <style>{css + portCss}</style>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="hidden h-auto w-full sm:block"
        role="img"
        aria-label="Network of ships met at sea and ports called"
      >
        <style>{`
          .pfe { stroke-dasharray: 900; stroke-dashoffset: 900; animation: pfDraw 1.1s ease-out forwards; }
          .pfe.pfd { animation: pfDrawD 1.1s ease-out forwards; }
          .pfn { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pfIn .55s cubic-bezier(.2,.9,.3,1.3) forwards; }
          .pfl { opacity: 0; animation: pfFade .5s ease-out forwards; }
          .pfa { cursor: pointer; }
          .pfa:hover .pft { fill: #e2ecf8; }
          .pfea:hover .pfe { stroke-width: 5; }
          .pftip { opacity: 0; transition: opacity .12s; pointer-events: none; }
          @keyframes pfDraw { to { stroke-dashoffset: 0; } }
          @keyframes pfDrawD { from { stroke-dashoffset: 900; } to { stroke-dashoffset: 0; stroke-dasharray: 6 5; } }
          @keyframes pfIn { from { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: scale(1); } }
          @keyframes pfFade { to { opacity: 1; } }
        `}</style>

        <ellipse cx={CX} cy={CY} rx={R1.x} ry={R1.y} fill="none" stroke="#1b2a40" strokeDasharray="2 6" />
        <ellipse cx={CX} cy={CY} rx={R2.x} ry={R2.y} fill="none" stroke="#142033" strokeDasharray="2 8" />

        {/* Liens : rouge = vers un navire listé ; plein = transfert probable ;
            pointillé = contact en mer. Cliquer ouvre la preuve. */}
        {net.edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const hot = b.sanctioned;
          const dashed = e.kind === "port" || e.best === "contact";
          const delay = b.ring === 1 ? 0.15 + i * 0.04 : 0.9 + i * 0.03;
          const line = (
            <line
              className={`pfe${dashed ? " pfd" : ""}`}
              style={{ animationDelay: `${delay}s` }}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={e.kind === "port" ? "#2c5f86" : hot ? "#d0505c" : "#3a5170"}
              strokeWidth={
                e.kind === "port" ? 1.2 : Math.min(1.2 + e.weight * 0.6, 4.5) + (e.best === "transfer" ? 1 : 0)
              }
            />
          );
          if (!e.pair) return <g key={`${e.from}-${e.to}`}>{line}</g>;
          return (
            <a key={`${e.from}-${e.to}`} href={`/brief/contact/${e.pair[0]}/${e.pair[1]}`} className="pfea">
              <title>
                {`${a.label} ↔ ${b.label}: ${e.weight} contact${e.weight > 1 ? "s" : ""}${e.best === "transfer" ? " incl. probable transfer" : ""}. Click for evidence`}
              </title>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={14} />
              {line}
              {b.ring === 1 && e.weight > 1 ? (
                <text
                  className="pfl"
                  style={{ animationDelay: "1s" }}
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#8ba1bf"
                  fontFamily="monospace"
                >
                  {e.weight}×
                </text>
              ) : null}
            </a>
          );
        })}

        {/* Nœuds */}
        {nodes.map((n, i) => {
          const link = hrefOf(n);
          const delay = n.ring === 0 ? 0 : n.ring === 1 ? 0.35 + i * 0.05 : 1.1 + i * 0.03;
          const dim = !n.identified && !n.sanctioned;
          const fill =
            n.kind === "port" ? "#0f2a40" : n.sanctioned ? "#4a1820" : n.ring === 0 ? "#14324a" : "#18263a";
          const stroke =
            n.kind === "port" ? "#4aa3d8" : n.sanctioned ? "#ef6a75" : n.ring === 0 ? "#6cc4f7" : "#5f7592";
          const shape =
            n.kind === "port" ? (
              <rect
                className="pfc"
                x={n.x - n.r}
                y={n.y - n.r}
                width={n.r * 2}
                height={n.r * 2}
                rx={3}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
              />
            ) : (
              <circle
                className="pfc"
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill={fill}
                stroke={stroke}
                strokeWidth={n.ring === 0 ? 2.5 : 1.5}
                strokeDasharray={dim ? "3 2" : undefined}
              />
            );
          const body = (
            <g className="pfn" style={{ animationDelay: `${delay}s`, opacity: dim ? 0.55 : undefined }}>
              {n.sanctioned ? (
                <circle cx={n.x} cy={n.y} r={n.r} fill="none" stroke="#ef6a75" strokeWidth={1.5}>
                  <animate attributeName="r" from={n.r} to={n.r + 14} dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.7" to="0" dur="2.2s" repeatCount="indefinite" />
                </circle>
              ) : null}
              {shape}
              <text
                className="pft"
                x={n.x}
                y={n.y + n.r + (n.ring === 2 ? 12 : 16)}
                textAnchor="middle"
                fontSize={n.ring === 0 ? 15 : n.ring === 1 ? 12 : 10}
                fontWeight={n.ring === 0 ? 600 : 400}
                fontStyle={dim ? "italic" : undefined}
                fill={n.sanctioned ? "#f2949c" : n.ring === 2 || dim ? "#7089a8" : "#c3d5ec"}
              >
                {trunc(n.label, n.ring === 2 ? 14 : 18)}
              </text>
            </g>
          );
          return link ? (
            <a
              key={n.id}
              href={link}
              className="pfa"
              data-m={n.mmsi ?? undefined}
              data-p={n.kind === "port" ? n.id : undefined}
            >
              {body}
            </a>
          ) : (
            <g key={n.id} data-m={n.mmsi ?? undefined}>
              {body}
            </g>
          );
        })}

        {/* Info-bulles (au-dessus de tout) */}
        {nodes.map((n) => {
          const lines = tipLines(n);
          const w = Math.max(...lines.map((l) => l.length)) * 6.6 + 20;
          const h = lines.length * 16 + 12;
          const x = Math.min(Math.max(n.x - w / 2, 4), W - w - 4);
          const y = n.y - n.r - h - 8 < 4 ? n.y + n.r + 22 : n.y - n.r - h - 8;
          return (
            <g key={`tip-${n.id}`} className="pftip" data-tip={n.id}>
              <rect x={x} y={y} width={w} height={h} rx={5} fill="#0b1422" stroke="#2c4566" />
              {lines.map((l, i) => (
                <text
                  key={i}
                  x={x + 10}
                  y={y + 20 + i * 16}
                  fontSize={i === 0 ? 12 : 11}
                  fontWeight={i === 0 ? 600 : 400}
                  fill={i === 0 ? (n.sanctioned ? "#f2949c" : "#e2ecf8") : "#9fb6d4"}
                >
                  {l}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Mobile : liste hiérarchique à la place de la toile */}
      <ul className="divide-y divide-slate-800/80 sm:hidden">
        {ring1.map((n) => (
          <li key={n.id} className="px-4 py-2.5">
            <Link href={vesselHref(n.mmsi!)} className={n.sanctioned ? "font-medium text-red-300" : "font-medium text-slate-100"}>
              {n.sanctioned ? "● " : ""}
              {n.label}
            </Link>
            <span className="ml-2 font-mono text-[11px] text-slate-500">
              {n.weight}× · {n.best === "transfer" ? "probable transfer" : "contact"}
            </span>
            {kidsOf(n.id).length > 0 ? (
              <ul className="mt-1 space-y-0.5 border-l border-slate-700 pl-3 text-xs">
                {kidsOf(n.id).map((k) => (
                  <li key={k.id}>
                    <Link href={vesselHref(k.mmsi!)} className={k.sanctioned ? "text-red-300" : "text-slate-400"}>
                      {k.sanctioned ? "● " : ""}
                      {k.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
        {ring1.length === 0 ? (
          <li className="px-4 py-3 text-sm text-slate-500">No contact at sea recorded.</li>
        ) : null}
      </ul>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-red-400 bg-red-900/60" /> Listed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-500 bg-slate-800" /> Not listed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-slate-500 opacity-60" /> Unidentified
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-sky-400 bg-sky-950" /> Port called
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-slate-300" /> probable transfer
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 border-t border-dashed border-slate-300" /> contact at sea
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-red-400" /> to a listed ship
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-2 text-[11px] text-slate-500">
        <span>Inner ring: met this ship at sea · outer ring: met those ships</span>
        {net.hiddenContacts > 0 ? <span>+{net.hiddenContacts} more contacts not drawn</span> : null}
        {net.portHidden > 0 ? (
          <span>{net.portHidden} same-port contacts left out (ships moored at the same terminal)</span>
        ) : null}
        {net.serviceHidden > 0 ? <span>{net.serviceHidden} tugs / pilots / service craft left out</span> : null}
        <span className="ml-auto text-sky-300">Click a ship to centre it · click a line for the evidence</span>
      </div>
    </div>
  );
}
