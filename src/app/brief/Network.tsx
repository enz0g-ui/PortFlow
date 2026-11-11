import type { Network as Net, NetNode } from "@/lib/screen";

// Toile de relations rendue en SVG côté serveur : chaque nœud est un lien,
// cliquer sur un navire le place au centre de sa propre toile.

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

function layout(net: Net): Placed[] {
  const placed = new Map<string, Placed>();
  const center = net.nodes.find((n) => n.ring === 0)!;
  placed.set(center.id, { ...center, x: CX, y: CY, angle: 0, r: 26 });

  const ring1 = net.nodes.filter((n) => n.ring === 1);
  ring1.forEach((n, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(ring1.length, 1);
    placed.set(n.id, {
      ...n,
      angle,
      x: CX + R1.x * Math.cos(angle),
      y: CY + R1.y * Math.sin(angle),
      r: n.kind === "port" ? 13 : 15,
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
        r: 9,
      });
    });
  }
  return [...placed.values()];
}

function href(n: NetNode): string | null {
  if (n.kind === "port" && n.portId) return `/ports/${n.portId}`;
  if (n.kind === "vessel" && n.mmsi) return `/brief/vessel/${n.mmsi}`;
  return null;
}

export function Network({ net }: { net: Net }) {
  const nodes = layout(net);
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const vesselsShown = nodes.filter((n) => n.kind === "vessel").length;

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-800 bg-[radial-gradient(ellipse_at_center,#0d1726_0%,#070b12_70%)]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Network of ships met at sea and ports called"
      >
        <style>{`
          .pfe { stroke-dasharray: 600; stroke-dashoffset: 600; animation: pfDraw 1.1s ease-out forwards; }
          .pfn { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pfIn .55s cubic-bezier(.2,.9,.3,1.3) forwards; }
          .pfl { opacity: 0; animation: pfFade .5s ease-out forwards; }
          .pfa:hover .pfc { stroke-width: 3; filter: brightness(1.35); }
          .pfa:hover .pft { fill: #e2ecf8; }
          .pfa { cursor: pointer; }
          @keyframes pfDraw { to { stroke-dashoffset: 0; } }
          @keyframes pfIn { from { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: scale(1); } }
          @keyframes pfFade { to { opacity: 1; } }
        `}</style>

        {/* Cercles guides */}
        <ellipse cx={CX} cy={CY} rx={R1.x} ry={R1.y} fill="none" stroke="#1b2a40" strokeDasharray="2 6" />
        <ellipse cx={CX} cy={CY} rx={R2.x} ry={R2.y} fill="none" stroke="#142033" strokeDasharray="2 8" />

        {/* Liens */}
        {net.edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const hot = a.sanctioned || b.sanctioned;
          const ring = b.ring;
          return (
            <g key={`${e.from}-${e.to}`}>
              <line
                className="pfe"
                style={{ animationDelay: `${ring === 1 ? 0.15 + i * 0.04 : 0.9 + i * 0.03}s` }}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={e.kind === "port" ? "#2c5f86" : hot ? "#a8424c" : "#33475f"}
                strokeWidth={e.kind === "port" ? 1.2 : Math.min(1 + e.weight * 0.8, 5)}
                strokeDasharray={e.kind === "port" ? "4 4" : undefined}
              />
              {ring === 1 && e.kind === "sts" && e.weight > 1 ? (
                <text
                  className="pfl"
                  style={{ animationDelay: "1s" }}
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#8ba1bf"
                  fontFamily="monospace"
                >
                  {e.weight}×
                </text>
              ) : null}
            </g>
          );
        })}

        {/* Nœuds */}
        {nodes.map((n, i) => {
          const link = href(n);
          const delay =
            n.ring === 0 ? 0 : n.ring === 1 ? 0.35 + i * 0.05 : 1.1 + i * 0.03;
          const fill =
            n.kind === "port"
              ? "#0f2a40"
              : n.sanctioned
                ? "#4a1820"
                : n.ring === 0
                  ? "#14324a"
                  : "#18263a";
          const stroke =
            n.kind === "port"
              ? "#4aa3d8"
              : n.sanctioned
                ? "#ef6a75"
                : n.ring === 0
                  ? "#6cc4f7"
                  : "#5f7592";
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
              <circle className="pfc" cx={n.x} cy={n.y} r={n.r} fill={fill} stroke={stroke} strokeWidth={n.ring === 0 ? 2.5 : 1.5} />
            );
          const body = (
            <g className="pfn" style={{ animationDelay: `${delay}s` }}>
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
                fill={n.sanctioned ? "#f2949c" : n.ring === 2 ? "#7089a8" : "#c3d5ec"}
              >
                {trunc(n.label, n.ring === 2 ? 14 : 18)}
              </text>
            </g>
          );
          return link ? (
            <a key={n.id} href={link} className="pfa">
              <title>
                {n.kind === "port"
                  ? `${n.label} — ${n.weight} call(s). Open port page`
                  : `${n.label}${n.sanctioned ? " — on a sanctions list" : ""}. Click to centre`}
              </title>
              {body}
            </a>
          ) : (
            <g key={n.id}>{body}</g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-red-400 bg-red-900/60" /> On a sanctions list
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-500 bg-slate-800" /> Not listed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-sky-400 bg-sky-950" /> Port called
        </span>
        <span className="text-slate-500">
          Inner ring: met this ship · outer ring: met those ships
          {net.hiddenContacts > 0 ? ` · +${net.hiddenContacts} more contacts` : ""}
        </span>
        <span className="ml-auto text-sky-300">
          {vesselsShown > 1 ? "Click any ship to put it at the centre" : null}
        </span>
      </div>
    </div>
  );
}
