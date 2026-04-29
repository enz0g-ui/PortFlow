# Port Flow — Architecture

High-level map of what runs where. Read this first when onboarding.

## Topology

```
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare DNS (portflow.uk → 46.101.127.223)              │
└────────────────────────────────┬────────────────────────────┘
                                 │ HTTPS 443
┌────────────────────────────────▼────────────────────────────┐
│  Nginx (Let's Encrypt cert) — /opt/projects/portflow vhost  │
│  Reverse proxy → localhost:3000                             │
└────────────────────────────────┬────────────────────────────┘
                                 │ HTTP 3000
┌────────────────────────────────▼────────────────────────────┐
│  PM2 (port-flow-web)                                        │
│   └─ next start (Next.js 16.2.4 + Turbopack)                │
│      ├─ App routes (server components, /api/*)              │
│      ├─ AIS worker (in-process, aisstream.io WS)            │
│      ├─ Sentinel-1 SAR scanner (interval: 6h)               │
│      ├─ Sanctions refresher (interval: 24h)                 │
│      └─ Stripe webhook receiver (/api/billing/webhook)      │
│                                                              │
│  Storage:                                                    │
│   /opt/projects/portflow/data/port.db    (SQLite, WAL)      │
│   /opt/projects/portflow/data/.integration-key (master enc)  │
│   /opt/projects/portflow/.env.local      (chmod 600)         │
└─────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
        Clerk (auth.clerk.com)         Stripe (api.stripe.com)
        AISStream (websocket)          OFAC + UK OFSI (24h pull)
        Copernicus Data Space          OpenSanctions (optional)
```

## Key design decisions

**Single-process monolith on purpose.** AIS worker, scanners, web server, all
in one `next start`. Pros: zero IPC, atomic deploy, simple ops. Cons: a worker
crash kills the web (mitigated by PM2 auto-restart with `max_memory_restart 1G`).
Splitting comes when QPS warrants it — not before.

**SQLite (node:sqlite, built-in Node 24).** Single-file DB with WAL. No external
DB server to maintain. Migrations idempotent in `migrations/*.sql` applied at
boot via `instrumentation.ts` → `runMigrations()`.

**Encryption at rest.** Per-user integration keys (`user_integration_keys`) are
AES-256-GCM with master key from `INTEGRATION_ENCRYPTION_KEY` env var or
auto-generated `data/.integration-key` (chmod 600). Plaintext never leaves the
server response.

**Multi-port via static registry.** `src/lib/ports.ts` defines 51 ports with
bbox + zones + native names. AIS worker subscribes to one bbox per port. To add
a port: append to `PORTS` array, redeploy.

**i18n two-tier.** UI strings in `src/lib/i18n/messages.ts` (`t()`); page-level
content in `src/lib/i18n/pages.ts` (`tp()` + `tpList()`). 8 langs:
fr/en/nl/de/es/ar/zh/ja.

## Data flow per request

**Dashboard `/`:**
```
Browser → /api/ports             (port list + bbox)
       → /api/vessels?port=X     (live AIS vessels, 5s poll)
       → /api/kpis?port=X        (KPI snapshot, 5s)
       → /api/voyages/active     (open voyages with ETA, 10s)
       → /api/anomalies          (active anomalies, 30s)
       → /api/weather            (Open-Meteo proxy, 5min)
       → /api/sar-detections     (Sentinel-1 cache, 5min)
       → /api/user/watchlist/*   (port + vessel bookmarks, once)
```

**Public API `/api/v1/*`:** auth via `Bearer pf_*` (per-user keys, hashed in
`api_keys` table) OR env-list `PORT_API_TOKENS`. Rate-limited per token.

**AIS worker:** WebSocket to wss://stream.aisstream.io/, subscribes to 51
bboxes. Each `PositionReport` → `persistPosition` + in-memory `store.ts` for
hot reads. `ShipStaticData` → `persistStatic`. Voyage open/close handled in
`voyages.ts` based on state transitions.

## Tier-gated capabilities

`TIER_LIMITS` in `src/lib/auth/tier.ts`. Tiers: free, starter, pro, enterprise.
Gates check at API boundary (e.g. `/api/user/integrations` POST returns 403 if
`!apiAccessAllowed(tier)`).

## Crash isolation

- **DB lock contention:** Avoid by using prepared statements + WAL mode (set on
  open in `db.ts`).
- **AIS worker disconnect:** auto-reconnect with backoff in `ais-worker.ts`.
- **Provider API down (Open-Meteo, Stripe, etc.):** caller catches + returns
  cached/empty data. Never propagate to crash the request.
- **PM2 max_memory_restart:** 1 GB triggers restart. Restart counter visible
  in `pm2 list` ↺ column.

## Deploy flow

```
local: edit code → git commit → git push
      ↓
local: bash scripts/remote.sh deploy
      ↓
remote: git pull --ff-only
      → npm ci (full deps incl. tailwind)
      → NODE_ENV=production npm run build
      → pm2 reload ecosystem.config.js --update-env
      → pm2 save
```

`ecosystem.config.js` reads `.env.local` at PM2 spawn time and merges into
process env. Without this, runtime vars (Clerk, Stripe) are missing despite
being in the bundle.
