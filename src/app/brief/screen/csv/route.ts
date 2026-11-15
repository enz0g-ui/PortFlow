import type { NextRequest } from "next/server";
import { parseQuery, screenVessels } from "@/lib/screen";

export const dynamic = "force-dynamic";

// Export CSV du criblage de flotte : mêmes paramètres que /brief/screen.

const VERDICT_LABEL: Record<string, string> = {
  sanctioned: "Sanctioned",
  exposed: "Exposed",
  clear: "No alert",
  unassessed: "Not assessed",
  unseen: "Out of coverage",
  unknown: "Not found",
};

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Neutralise les formules à l'ouverture dans un tableur.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const iso = (ts: number | null | undefined) => (ts ? new Date(ts).toISOString().replace(".000", "") : "");

export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const inputs = parseQuery(q);
  const { rows, at } = screenVessels(inputs);

  const header = [
    "input",
    "verdict",
    "name",
    "imo",
    "mmsi",
    "lists",
    "listed_ships_met",
    "strongest_contact",
    "last_contact_utc",
    "last_seen_place",
    "last_seen_utc",
    "record_url",
    "screened_at_utc",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const best = r.contacts.some((c) => c.best === "transfer")
      ? "probable transfer"
      : r.contacts.length
        ? "contact at sea"
        : "";
    lines.push(
      [
        r.input,
        VERDICT_LABEL[r.verdict] ?? r.verdict,
        r.name,
        r.imo,
        r.mmsi,
        r.lists.join(" / "),
        r.contacts.map((c) => `${c.name ?? c.mmsi} (${c.lists.join("/")})`).join(" | "),
        best,
        iso(r.contacts[0]?.lastTs),
        r.lastSeen?.place.label,
        iso(r.lastSeen?.ts),
        r.mmsi ? `https://portflow.uk/brief/vessel/${r.mmsi}` : "",
        iso(at),
      ]
        .map(cell)
        .join(","),
    );
  }
  lines.push("");
  lines.push(
    cell(
      "Sources: OFAC SDN, UK Sanctions List, UN Security Council list, EU designated-vessels list; contacts from AIS received by Port Flow in monitored areas. Absence of a signal is not evidence of compliance.",
    ),
  );

  const stamp = new Date(at).toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="portflow-screening-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
