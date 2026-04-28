# Port Flow — multi-port AIS intelligence

Production-ready maritime intelligence platform: 51 ports tracked live, ETA prediction with measurable precision, AIS+SAR fusion (dark fleet detection), sanctions screening, carbon emissions, multi-tenant + Stripe billing. Built with Next.js, SQLite (Postgres-ready), Sentinel-1 SAR, Open-Meteo, Clerk, Stripe, Sentry.

## Quick start

```bash
npm install
npm run setup     # interactive wizard, fills .env.local for you
npm run dev
```

Open http://localhost:3000.

The `setup` wizard walks you through every API key and connection (aisstream.io, optional Clerk auth, Stripe billing, Sentry, Copernicus SAR, etc.), tests connections where possible, and writes `.env.local` for you — **no manual file editing required**.

Run it again any time to add a key or rotate a secret.

## Architecture

- `src/instrumentation.ts` — boots the AIS worker once when the Next.js Node server starts.
- `src/lib/ais-worker.ts` — websocket client to `wss://stream.aisstream.io/v0/stream`, filters to the Rotterdam bounding box, parses position + static messages.
- `src/lib/store.ts` — in-process state: live vessels, KPI ring buffer, flow events.
- `src/lib/kpi.ts` — periodic KPI sampler (every 60s) used by the forecast.
- `src/lib/forecast.ts` — rolling-mean baseline. Will swap for a seasonal model once 7+ days of history exist.
- `src/app/api/*` — read-only JSON endpoints consumed by the dashboard.
- `src/app/page.tsx` — dashboard, polls API routes from the client.

## Notes

- Storage is in-memory only for now — restarting the server clears history. Persistence (NDJSON or SQLite) is the next step before forecasts become useful.
- The bounding box covers Maasvlakte → Waalhaven plus offshore anchorages. Adjust in `src/lib/rotterdam.ts`.
- Free aisstream tier rate-limits per connection but does not cap message volume for a single bbox of this size.
