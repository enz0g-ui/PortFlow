#!/usr/bin/env bash
# Idempotent deploy/update on the target host.
# Run as the deploy user (NOT root) from the project root:
#   ./scripts/deploy.sh
#
# What it does:
#   1. git pull (fast-forward only)
#   2. npm ci (install deps from lockfile)
#   3. npm run build
#   4. pm2 reload (zero-downtime if the app supports it; restart otherwise)
#   5. pm2 save (persist process list across reboots)
#
# Optional first-time hook: if no .env.local, runs `npm run setup`.

set -euo pipefail

cd "$(dirname "$0")/.."

log() { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }

if [[ ! -f .env.local ]]; then
  log "No .env.local — running setup wizard"
  npm run setup
fi

log "Pulling latest from $(git remote get-url origin) …"
git fetch --tags --prune
git pull --ff-only

log "Installing dependencies (npm ci, full incl. devDeps for build tools)"
npm ci --no-audit --no-fund

log "Building production bundle"
NODE_ENV=production npm run build

log "Restarting via PM2"
if pm2 describe port-flow-web >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

ok "Deployed at $(date -u +%FT%TZ)"
pm2 list
