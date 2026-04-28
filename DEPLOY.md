# Production deployment guide

This file documents how to take the local SQLite + single-process setup to a production-grade deployment. Each section is independent and can be tackled in any order, gated by env vars.

## 0. Setup wizard (recommended)

Instead of editing `.env.local` by hand, run:

```bash
npm run setup
```

The wizard walks through every variable, masks secrets, accepts blank input
to keep current values, and tests connections where possible (aisstream.io,
Stripe, Copernicus). Re-run it any time to add a new provider.

Manual file editing of `.env.local` is documented below for completeness, but
not required for any operator workflow.

## 1. Environment variables checklist

Required:

```
AISSTREAM_API_KEY=<your aisstream.io key>
PORT_API_TOKENS=<comma-separated bearer tokens>
NODE_ENV=production
```

Recommended for any commercial run:

```
SENTRY_DSN=<server-side Sentry DSN>
NEXT_PUBLIC_SENTRY_DSN=<client-side Sentry DSN>
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/account
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/account
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
COPERNICUS_CLIENT_ID=<for SAR scanner>
COPERNICUS_CLIENT_SECRET=<for SAR scanner>
SAR_DEMO=0
LOG_FORMAT=json
```

Optional satellite providers (commercial):

```
SPIRE_API_TOKEN=
MARINETRAFFIC_API_KEY=
ORBCOMM_API_TOKEN=
EOG_LICENSE_KEY=  # VIIRS Boat Detection — Payne Institute commercial license
```

## 2. Database — SQLite to Postgres

The current setup uses `node:sqlite` (built-in, persisted at `./data/port.db`).
This is fine for a single-process deployment up to ~10 concurrent users.

To swap to Postgres for production scale:

1. Provision a Postgres database (Neon free tier works).
2. Set `DATABASE_URL=postgres://user:pass@host/db`.
3. Run migrations against Postgres:
   ```bash
   npm run migrate:pg
   ```
   (script not yet implemented — current `runMigrations()` writes to SQLite. Replace with a `pg`-aware version that reads the same `migrations/*.sql` files and tracks applied versions in a `_migrations` table.)
4. Update `src/lib/db.ts` to switch driver based on `DATABASE_URL` presence.
   The current `DatabaseSync` API maps cleanly to `pg.Pool.query()` with prepared statement caching — about a day's refactor.

Schema versioning is already in place via `migrations/*.sql` + `runMigrations()`.

## 3. Worker isolation (PM2)

The default Next.js dev server runs the AIS worker, SAR scanner, sanctions
refresher and webhook queue all in-process. For production, isolate them so
the web tier can restart independently:

```bash
# Production install
npm ci
npm run build

# Start web with PM2
pm2 start ecosystem.config.js
pm2 save
```

For full isolation (dedicated worker process):

1. Create `worker/index.ts` that imports `lib/ais-worker`, `lib/sar/scanner`,
   `lib/sanctions`, `lib/webhooks` startWebhookQueueProcessor.
2. Add a second app to `ecosystem.config.js`:
   ```js
   {
     name: "port-flow-worker",
     script: "tsx",
     args: "worker/index.ts",
     exec_mode: "fork",
     instances: 1,
     ...
   }
   ```
3. Move worker logic out of `src/instrumentation.ts` so the web tier no
   longer starts it.
4. Communication via the same SQLite/Postgres DB — current architecture is
   already DB-mediated for KPI snapshots, sanctions, watchlist, webhook
   queue.

## 4. Sentry

Already wired. Just set `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN`
(client). Both `sentry.server.config.ts` and `sentry.client.config.ts` no-op
when DSN is absent.

For source maps upload during build:

```bash
npx @sentry/wizard@latest -i nextjs
```

…and follow the wizard.

## 5. Clerk

Required env vars listed above. After signing up at clerk.com:

1. Create a new application.
2. Configure sign-in/sign-up URLs to match `/sign-in` and `/sign-up`.
3. Copy publishable + secret keys to `.env.local`.
4. (Optional) Configure organizations if you want team accounts.

`AuthShell` in `src/app/components/AuthShell.tsx` only loads ClerkProvider
when `CLERK_SECRET_KEY` is present, so dev environments work without it.

## 6. Stripe

1. Create products in Stripe dashboard:
   - **Starter**: 99 EUR/month recurring
   - **Pro**: 499 EUR/month recurring
   - **Enterprise**: handled offline (no Stripe price)
2. Copy each price ID to `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO`.
3. Get your secret key → `STRIPE_SECRET_KEY`.
4. Add a webhook endpoint at `https://yourdomain/api/billing/webhook`
   listening to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`.

The webhook handler syncs `users.tier` in SQLite **and** updates Clerk public
metadata so `getCurrentUser()` reflects changes immediately.

## 7. Hosting

### Recommended (single-host, persistent worker) — **Render** or **Fly.io**

The AIS websocket worker is a long-running process and needs persistent compute.
A single web service with a mounted disk for SQLite is the simplest production
setup. A `render.yaml` blueprint is included.

**Render quick deploy:**

1. Push the repo to GitHub.
2. https://render.com → New → Blueprint → connect repo → Render reads `render.yaml`.
3. Fill in env vars in the Render dashboard (or run `npm run setup` locally
   and paste the resulting `.env.local` values).
4. Deploy. SQLite persists on the mounted disk at
   `/opt/render/project/src/data`.

**Fly.io quick deploy:**

```bash
fly launch                          # detects Dockerfile, asks region
fly volumes create port_flow_data --size 1
fly secrets set AISSTREAM_API_KEY=... PORT_API_TOKENS=... [...]
fly deploy
```

The included `Dockerfile` is multi-stage (deps → build → runner) and runs as
non-root user.

### Self-host on Hetzner CX22 (€4.50/month) — best price/perf

Best ratio for a multi-project host. CX22 = 2 vCPU / 4GB RAM / 40GB SSD,
enough for 3-5 small Node apps comfortably.

**1. Provision the VPS**

- https://console.hetzner.cloud → Project → Add Server
- Image: **Ubuntu 24.04**
- Type: **CX22** (or CX32 for more headroom)
- SSH key: paste your public key
- Region: Falkenstein (Germany) for European AIS sources, Ashburn for US

**2. One-time bootstrap (run as root on the fresh server)**

```bash
ssh root@your.ip
bash <(curl -fsSL https://raw.githubusercontent.com/enz0g-ui/PortFlow/main/scripts/server-bootstrap.sh)
```

What it installs:
- Node.js 24 + npm + PM2 (global)
- Nginx + Certbot (Let's Encrypt)
- UFW firewall (only 22/80/443 open)
- Fail2ban (SSH brute-force protection)
- Unattended-upgrades (security patches auto-applied)
- A non-root `deploy` user with sudo + your SSH keys copied over
- `/opt/projects/` directory ready for multiple apps

**3. Deploy Port Flow as the `deploy` user**

```bash
ssh deploy@your.ip
cd /opt/projects
git clone https://github.com/enz0g-ui/PortFlow.git portflow
cd portflow
npm ci
npm run setup           # interactive wizard for .env.local
npm run build
pm2 start ecosystem.config.js
pm2 save
```

**4. Hook up a domain + HTTPS**

Point your DNS A record (e.g. `portflow.yourdomain.com`) to the server IP,
wait a couple of minutes for propagation, then:

```bash
sudo cp /opt/projects/portflow/nginx/portflow.conf /etc/nginx/sites-available/
sudo sed -i 's/portflow.example.com/portflow.yourdomain.com/g' \
  /etc/nginx/sites-available/portflow.conf
sudo ln -s /etc/nginx/sites-available/portflow.conf \
  /etc/nginx/sites-enabled/portflow.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d portflow.yourdomain.com
```

Certbot auto-writes the SSL block + 80→443 redirect into your vhost and
schedules monthly renewal.

**5. Subsequent deployments**

```bash
ssh deploy@your.ip
cd /opt/projects/portflow
./scripts/deploy.sh
```

`deploy.sh` is idempotent: pulls, installs deps from lockfile, builds, runs
`pm2 reload --update-env` for zero-downtime restart.

**6. Multi-project on the same VPS**

Each project lives under `/opt/projects/<name>/` with its own `.env.local`,
its own PM2 ecosystem config (different ports), and its own Nginx vhost.
Suggested port allocation:
- Port Flow → 3000
- Project 2 → 3001
- Project 3 → 3002

PM2 manages all of them. Nginx routes by hostname (one vhost per
subdomain). Resource budget on a CX22: ~600MB RAM per Node app idle, plan
for 4-5 apps max.

### Vercel (works for the dashboard, NOT the AIS worker)

`vercel.json` is included with sane defaults (CORS for /api/v1,
frame-ancestors `*` for /widget, region cdg1 = Paris). But Vercel functions
are short-lived (max 60s hobby, 5 min pro), so the persistent AIS websocket
can't run on Vercel alone.

Two options:

1. **Hybrid** — Vercel for `/`, `/api/v1`, `/widget`, marketing pages →
   separate persistent worker host (Render or Fly) for the
   `instrumentation.ts` workers (AIS + SAR + sanctions + webhook queue).
   Communication via shared Postgres.
2. **All on Render / Fly** — simplest, single host. Recommended until
   ~1000 MAU.

### Database

- **SQLite** (default): file-based, mounted on the host disk. Works up to
  ~10 concurrent users. Free.
- **Neon Postgres** (paid step): set `DATABASE_URL`. Free tier covers small
  production workloads. Required if you hybrid-deploy across Vercel + worker.

### Optional infra

- **Upstash Redis** to swap webhook queue / rate limiter from SQLite-backed
  to Redis-backed (higher throughput, multi-instance safe).
- **Cloudflare R2** or **AWS S3** for daily backups of `data/port.db`.

## 8. Backup

SQLite: snapshot `data/port.db` daily to S3 / R2.

Postgres: enable PITR on Neon (paid) or schedule `pg_dump` to S3.

Vessel snapshots in `data/vessels-*.json` are regenerated every 30s from live
state — no backup needed.

## 9. Monitoring

- `/status` page is publicly accessible — link from your marketing site.
- `GET /api/status` returns JSON for external uptime monitoring (UptimeRobot,
  BetterStack, etc.).
- Sentry handles error tracking automatically once DSN set.
- Per-token rate limiting headers (`X-RateLimit-*`) on every API v1 response
  for client-side observability.
