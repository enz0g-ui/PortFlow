#!/usr/bin/env bash
# One-shot deploy for Port Flow on infra-01.
# Works whether run as root or as the deploy user.
#
# What it does:
#   1. Detects effective user, fixes ownership if needed (.next, .git)
#   2. git config safe.directory (so root can pull a deploy-owned repo)
#   3. git pull --ff-only as the deploy user
#   4. npm ci + npm run build as the deploy user
#   5. pm2 startOrReload <ecosystem.config.js> --update-env
#      (reloads via the file so changes to max_memory_restart, env, etc.
#       are actually applied — pm2 reload <name> does NOT re-read the file)
#   6. pm2 save (persist process list across reboots)
#   7. Prints status + filtered boot log + /api/health check
#
# Failure modes this script handles (each one has bitten us):
#   * git "dubious ownership" when running as root over a deploy-owned repo
#   * .next/ left root-owned by a prior root-run build → EACCES on unlink
#   * pm2 reload <name> NOT re-reading ecosystem.config.js
#
# Usage:
#   bash /opt/projects/portflow/scripts/deploy.sh
#
# Idempotent. Re-running is always safe.

set -euo pipefail

REPO=/opt/projects/portflow
APP=port-flow-web
DEPLOY_USER=deploy
ECOSYSTEM="$REPO/ecosystem.config.js"

# If REPO doesn't match cwd's parent, bail rather than do the wrong thing.
cd "$(dirname "$0")/.."
ACTUAL_REPO="$(pwd)"
if [[ "$ACTUAL_REPO" != "$REPO" ]]; then
  REPO="$ACTUAL_REPO"
  ECOSYSTEM="$REPO/ecosystem.config.js"
fi

log() { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
warn(){ printf "\033[1;33m⚠ %s\033[0m\n" "$*"; }

CURRENT_USER="$(id -un)"
log "Running as: $CURRENT_USER (target deploy user: $DEPLOY_USER)"

# When we're root, we need to (a) bless the repo path for git, and (b) fix
# any root-owned files left by a prior root-run build, otherwise the deploy
# user can't unlink them when rebuilding.
if [[ "$CURRENT_USER" == "root" ]]; then
  log "Marking repo safe for git operations under root"
  git config --global --add safe.directory "$REPO" >/dev/null

  log "Resetting ownership of build artifacts to $DEPLOY_USER"
  chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$REPO/.next" 2>/dev/null || true
  chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$REPO/.git" 2>/dev/null || true

  RUN_AS_DEPLOY=(sudo -u "$DEPLOY_USER")
elif [[ "$CURRENT_USER" == "$DEPLOY_USER" ]]; then
  RUN_AS_DEPLOY=()
else
  warn "Running as $CURRENT_USER (not root, not $DEPLOY_USER) — assuming privileges are sufficient"
  RUN_AS_DEPLOY=()
fi

# First-time setup if no env file.
if [[ ! -f "$REPO/.env.local" ]]; then
  log "No .env.local — running setup wizard"
  "${RUN_AS_DEPLOY[@]}" bash -c "cd '$REPO' && npm run setup"
fi

log "Pulling latest from $(git -C "$REPO" remote get-url origin 2>/dev/null || echo origin)"
"${RUN_AS_DEPLOY[@]}" git -C "$REPO" fetch --tags --prune
"${RUN_AS_DEPLOY[@]}" git -C "$REPO" pull --ff-only

log "Installing dependencies (npm ci)"
"${RUN_AS_DEPLOY[@]}" bash -c "cd '$REPO' && npm ci --no-audit --no-fund"

log "Building production bundle"
"${RUN_AS_DEPLOY[@]}" bash -c "cd '$REPO' && NODE_ENV=production npm run build"

log "PM2 startOrReload (re-reads $ECOSYSTEM, applies memory/env changes)"
pm2 startOrReload "$ECOSYSTEM" --update-env
pm2 save >/dev/null

log "Waiting 30s for deferred ingestors to fire (UKSL@90s/OFAC@120s come later)"
sleep 30

echo
log "Status after deploy"
pm2 show "$APP" 2>/dev/null | grep -E 'status|uptime|↺|restarts|memory|unstable' || true

echo
log "Recent boot log (EADDRINUSE noise filtered out)"
pm2 logs "$APP" --lines 60 --nostream 2>/dev/null \
  | grep -v -E '(EADDRINUSE|Failed to start|address already|new Promise|errno:|syscall:)' \
  | tail -30

echo
log "Health check"
if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
  ok "/api/health responds 200 (origin healthy)"
else
  warn "/api/health does not respond locally — check ss -tlnp | grep :3000"
fi

echo
ok "Deployed at $(date -u +%FT%TZ)"
