import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Compteur minimal de clics UI (encart « What next », « Since your last
// visit »…) pour mesurer ce qui mène à l'inscription. Pas d'IP, pas de
// cookie : nom d'événement en liste blanche + MMSI + horodatage.

const ALLOWED = /^(next|since|watch)\.[a-z0-9_]{1,40}$/;
let ready = false;

export async function POST(req: Request) {
  let ev = "";
  let mmsi: number | null = null;
  try {
    const b = (await req.json()) as { e?: string; m?: number };
    ev = String(b.e ?? "");
    mmsi = Number.isInteger(b.m) ? (b.m as number) : null;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!ALLOWED.test(ev)) return new NextResponse(null, { status: 400 });
  try {
    const raw = db().raw;
    if (!ready) {
      raw.exec(
        "CREATE TABLE IF NOT EXISTS ui_events (ts INTEGER NOT NULL, ev TEXT NOT NULL, mmsi INTEGER)",
      );
      ready = true;
    }
    raw.prepare("INSERT INTO ui_events (ts, ev, mmsi) VALUES (?, ?, ?)").run(Date.now(), ev, mmsi);
  } catch (err) {
    console.error("[ev] insert failed", err);
  }
  return new NextResponse(null, { status: 204 });
}
