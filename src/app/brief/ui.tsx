import Link from "next/link";
import type { ContactTier, Place, SignalKind } from "@/lib/brief";

// Petits éléments partagés par le Briefing et la fiche navire.
// Rendu serveur uniquement : pas de hooks, dates en UTC.

export function fmtAgo(ts: number, now = Date.now()): string {
  const m = Math.max(0, Math.round((now - ts) / 60_000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function fmtUtc(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function fmtDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

export function fmtHours(h: number | null): string {
  if (h == null) return "ongoing";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

const KIND_STYLE: Record<SignalKind | "port", string> = {
  sts: "border-red-500/50 bg-red-500/10 text-red-300",
  dark: "border-red-500/50 bg-red-500/10 text-red-300",
  loiter: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  transit: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  port: "border-slate-600 bg-slate-800/60 text-slate-300",
};

const KIND_SHORT: Record<SignalKind | "port", string> = {
  sts: "STS",
  dark: "AIS gap",
  loiter: "Loitering",
  transit: "Transit",
  port: "Port call",
};

const TIER_STYLE: Record<ContactTier, string> = {
  transfer: "border-red-500/60 bg-red-500/15 text-red-200",
  contact: "border-amber-500/50 bg-amber-500/10 text-amber-200",
  port: "border-slate-700 bg-slate-800/40 text-slate-400",
};

const TIER_SHORT: Record<ContactTier, string> = {
  transfer: "Transfer?",
  contact: "Contact",
  port: "Same port",
};

export function KindBadge({
  kind,
  tier,
}: {
  kind: SignalKind | "port";
  tier?: ContactTier;
}) {
  if (kind === "sts" && tier) {
    return (
      <span
        title={
          tier === "transfer"
            ? "Long, very close contact at sea — consistent with a transfer"
            : tier === "contact"
              ? "Close contact at sea — to check"
              : "Both ships in the same port or terminal area — not a signal"
        }
        className={`inline-block min-w-[72px] rounded border px-1.5 py-0.5 text-center font-mono text-[11px] ${TIER_STYLE[tier]}`}
      >
        {TIER_SHORT[tier]}
      </span>
    );
  }
  return (
    <span
      className={`inline-block min-w-[72px] rounded border px-1.5 py-0.5 text-center font-mono text-[11px] ${KIND_STYLE[kind]}`}
    >
      {KIND_SHORT[kind]}
    </span>
  );
}

export function ListBadges({ lists }: { lists: string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {lists.map((l) => (
        <span
          key={l}
          className="rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-red-300"
        >
          {l}
        </span>
      ))}
    </span>
  );
}

export function VesselLink({
  mmsi,
  name,
  sanctioned,
}: {
  mmsi: number;
  name: string | null;
  sanctioned?: boolean;
}) {
  return (
    <Link
      href={`/brief/vessel/${mmsi}`}
      className="font-medium text-slate-100 underline-offset-2 hover:text-sky-300 hover:underline"
    >
      {sanctioned ? (
        <span className="mr-1 text-red-400" title="On a sanctions list">
          ●
        </span>
      ) : null}
      {name || `MMSI ${mmsi}`}
    </Link>
  );
}

export function PlaceLink({ place }: { place: Place }) {
  if (place.portId) {
    return (
      <Link
        href={`/ports/${place.portId}`}
        className="text-slate-300 underline-offset-2 hover:text-sky-300 hover:underline"
      >
        {place.label}
      </Link>
    );
  }
  return <span className="text-slate-400">{place.label}</span>;
}

export function cargoLabel(c: string | null): string {
  if (!c) return "—";
  return c
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
