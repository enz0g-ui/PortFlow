import { z } from "zod";
import {
  addWatchlist,
  listWatchlist,
  removeWatchlist,
} from "@/lib/watchlist";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const AddSchema = z.object({
  mmsi: z.number().int().optional(),
  imo: z.number().int().optional(),
  label: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET() {
  return Response.json({ watchlist: listWatchlist() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (!parsed.data.mmsi && !parsed.data.imo) {
    return Response.json(
      { error: "mmsi or imo required" },
      { status: 400 },
    );
  }
  const entry = addWatchlist(parsed.data);
  return Response.json(entry);
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id") ?? "");
  if (!Number.isFinite(id)) {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  const ok = removeWatchlist(id);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ id, deleted: true });
}
