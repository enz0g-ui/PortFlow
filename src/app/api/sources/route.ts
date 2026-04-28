import { SATELLITE_SOURCES } from "@/lib/satellites/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    sources: SATELLITE_SOURCES.map((s) => ({
      id: s.id,
      label: s.label,
      tier: s.tier,
      tariff: s.tariff,
      description: s.description,
      homepage: s.homepage,
      envKeys: s.envKeys,
      hasFetchScenes: typeof s.fetchScenes === "function",
      hasFetchFixes: typeof s.fetchFixes === "function",
      status: s.status(),
    })),
  });
}
