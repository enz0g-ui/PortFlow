#!/usr/bin/env bash
# Remote ops wrapper for the Port Flow VPS.
# Reads .env.deploy for host/user/key, then SSH-execs common operations.
#
# Usage:
#   bash scripts/remote.sh diag                # quick health check
#   bash scripts/remote.sh logs [N]            # tail last N pm2 lines (default 100)
#   bash scripts/remote.sh tail                # live-stream pm2 logs (Ctrl-C to stop)
#   bash scripts/remote.sh errors              # last 50 lines of pm2 errors
#   bash scripts/remote.sh restart             # pm2 reload --update-env
#   bash scripts/remote.sh deploy              # git pull + npm ci + build + reload
#   bash scripts/remote.sh build               # rebuild only (no git pull)
#   bash scripts/remote.sh env                 # list .env.local keys (values redacted)
#   bash scripts/remote.sh nginx-test          # sudo nginx -t
#   bash scripts/remote.sh nginx-reload        # sudo systemctl reload nginx
#   bash scripts/remote.sh exec "<cmd>"        # arbitrary command in project dir
#   bash scripts/remote.sh ssh                 # interactive shell
#   bash scripts/remote.sh health              # call /api/_health and pretty-print
#   bash scripts/remote.sh integrations        # which env keys are set / missing
#   bash scripts/remote.sh set-env KEY=VALUE   # atomic update of .env.local + reload
#   bash scripts/remote.sh backup [dir]        # tar data/ + .env.local, scp to local
#   bash scripts/remote.sh emergency           # dump logs + state to single file
#   bash scripts/remote.sh deps-audit          # npm audit production
#   bash scripts/remote.sh certbot-renew       # renew TLS + reload nginx
#   bash scripts/remote.sh disk                # disk usage breakdown
#
# Quick example:
#   bash scripts/remote.sh exec "find .next -name '*.css' | head"

set -euo pipefail

cd "$(dirname "$0")/.."

log()  { printf "\033[1;36m▸ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$*"; }
err()  { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; }

if [[ ! -f .env.deploy ]]; then
  err ".env.deploy not found."
  echo "  → cp .env.deploy.example .env.deploy && edit it"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env.deploy
set +a

: "${DEPLOY_HOST:?DEPLOY_HOST required in .env.deploy}"
: "${DEPLOY_USER:?DEPLOY_USER required in .env.deploy}"
: "${DEPLOY_PROJECT_DIR:?DEPLOY_PROJECT_DIR required in .env.deploy}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

SSH_OPTS=("-p" "$DEPLOY_PORT" "-o" "StrictHostKeyChecking=accept-new" "-o" "ServerAliveInterval=30")
if [[ -n "${DEPLOY_KEY:-}" ]]; then
  # Expand ~ if present
  KEY_PATH="${DEPLOY_KEY/#\~/$HOME}"
  SSH_OPTS+=("-i" "$KEY_PATH")
fi
TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

ssh_run() {
  ssh "${SSH_OPTS[@]}" "$TARGET" "$@"
}

ssh_run_tty() {
  ssh -t "${SSH_OPTS[@]}" "$TARGET" "$@"
}

cmd="${1:-help}"
shift || true

case "$cmd" in
  diag)
    log "Running diagnostics on $TARGET"
    ssh_run "set -e; cd '$DEPLOY_PROJECT_DIR'; \
      echo '=== git ===';        git log -1 --oneline; \
      echo '=== build ===';      [ -f .next/BUILD_ID ] && stat -c '%y  %n' .next/BUILD_ID || echo 'no build'; \
      echo '=== css/js ===';     find .next/static -name '*.css' -o -name '*.js' 2>/dev/null | head -10; \
      echo '=== pm2 ===';        pm2 list | tail -n +1; \
      echo '=== HTTP ===';       curl -sI -o /dev/null -w 'status=%{http_code}  total=%{time_total}s\n' https://localhost --resolve localhost:443:127.0.0.1 -k; \
      echo '=== port 3000 ==='; ss -tlnp 2>/dev/null | grep ':3000 ' || echo 'no listener'"
    ;;

  logs)
    n="${1:-100}"
    log "Last $n PM2 lines"
    ssh_run "pm2 logs port-flow-web --lines $n --nostream"
    ;;

  tail)
    log "Live PM2 logs (Ctrl-C to stop)"
    ssh_run_tty "pm2 logs port-flow-web --lines 20"
    ;;

  errors)
    log "Last 50 error lines"
    ssh_run "pm2 logs port-flow-web --err --lines 50 --nostream"
    ;;

  restart)
    log "pm2 reload"
    ssh_run "cd '$DEPLOY_PROJECT_DIR' && pm2 reload ecosystem.config.js --update-env && pm2 list"
    ;;

  deploy)
    log "Running scripts/deploy.sh on $TARGET"
    ssh_run_tty "cd '$DEPLOY_PROJECT_DIR' && bash scripts/deploy.sh"
    ;;

  build)
    log "Rebuilding (no git pull)"
    ssh_run_tty "cd '$DEPLOY_PROJECT_DIR' && NODE_ENV=production npm run build && pm2 reload ecosystem.config.js --update-env"
    ;;

  env)
    log ".env.local keys on remote (values redacted)"
    ssh_run "cd '$DEPLOY_PROJECT_DIR' && [ -f .env.local ] && awk -F= '/^[A-Z_]+=/{print \$1}' .env.local || echo 'no .env.local'"
    ;;

  nginx-test)
    ssh_run_tty "sudo nginx -t"
    ;;

  nginx-reload)
    ssh_run_tty "sudo nginx -t && sudo systemctl reload nginx && echo 'nginx reloaded'"
    ;;

  exec)
    if [[ $# -eq 0 ]]; then
      err "exec requires a command argument"
      exit 1
    fi
    ssh_run "cd '$DEPLOY_PROJECT_DIR' && $*"
    ;;

  ssh)
    log "Opening interactive shell on $TARGET (cd $DEPLOY_PROJECT_DIR)"
    ssh -t "${SSH_OPTS[@]}" "$TARGET" "cd '$DEPLOY_PROJECT_DIR' && exec \$SHELL -l"
    ;;

  health)
    log "GET /api/health"
    ssh_run "curl -s -o /dev/stdout -w '\\nHTTP %{http_code}\\n' http://localhost:3000/api/health"
    ;;

  integrations)
    log "Integration keys present in .env.local"
    ssh_run "cd '$DEPLOY_PROJECT_DIR' && awk -F= '/^[A-Z_]+=/{key=\$1; gsub(/[ \\t]/,\"\",key); print key}' .env.local | sort -u"
    ;;

  set-env)
    if [[ $# -eq 0 ]]; then
      err "set-env requires KEY=VALUE"
      exit 1
    fi
    pair="$1"
    if [[ "$pair" != *=* ]]; then
      err "argument must be KEY=VALUE"
      exit 1
    fi
    key="${pair%%=*}"
    log "Updating $key in .env.local"
    ssh_run "cd '$DEPLOY_PROJECT_DIR' && \
      cp -p .env.local .env.local.bak && \
      grep -v '^${key}=' .env.local.bak > .env.local && \
      echo '${pair}' >> .env.local && \
      chmod 600 .env.local && \
      pm2 reload ecosystem.config.js --update-env && \
      echo 'reloaded — backup at .env.local.bak'"
    ;;

  backup)
    dest="${1:-./backups}"
    mkdir -p "$dest"
    stamp=$(date +%Y%m%d-%H%M%S)
    log "Creating backup tar.gz on remote"
    ssh_run "cd '$DEPLOY_PROJECT_DIR' && tar czf /tmp/portflow-${stamp}.tar.gz data/ .env.local 2>/dev/null && ls -lh /tmp/portflow-${stamp}.tar.gz"
    log "Downloading to $dest/"
    scp "${SSH_OPTS[@]}" "$TARGET:/tmp/portflow-${stamp}.tar.gz" "$dest/"
    ssh_run "rm /tmp/portflow-${stamp}.tar.gz"
    log "Done: $dest/portflow-${stamp}.tar.gz"
    ;;

  emergency)
    stamp=$(date +%Y%m%d-%H%M%S)
    out="emergency-${stamp}.txt"
    log "Capturing emergency snapshot → $out"
    {
      echo "=== ts ===";          date -u +%FT%TZ
      echo "=== git ==="
      ssh_run "cd '$DEPLOY_PROJECT_DIR' && git log -3 --oneline"
      echo "=== pm2 ==="
      ssh_run "pm2 list"
      echo "=== ports ==="
      ssh_run "ss -tlnp 2>/dev/null | grep -E ':(80|443|3000)' || echo none"
      echo "=== disk ==="
      ssh_run "df -h / && du -sh '$DEPLOY_PROJECT_DIR'/.next '$DEPLOY_PROJECT_DIR'/data 2>/dev/null"
      echo "=== /api/health ==="
      ssh_run "curl -s http://localhost:3000/api/health"
      echo "=== nginx ==="
      ssh_run "sudo nginx -t 2>&1 | tail -5"
      echo "=== last 200 PM2 lines ==="
      ssh_run "pm2 logs port-flow-web --lines 200 --nostream"
      echo "=== last 50 PM2 errors ==="
      ssh_run "pm2 logs port-flow-web --err --lines 50 --nostream"
    } > "$out" 2>&1
    log "Saved $out ($(wc -l <"$out") lines)"
    ;;

  deps-audit)
    log "npm audit (production deps only)"
    ssh_run "cd '$DEPLOY_PROJECT_DIR' && npm audit --omit=dev 2>&1 | head -60"
    ;;

  certbot-renew)
    log "certbot renew + nginx reload"
    ssh_run_tty "sudo certbot renew --quiet && sudo nginx -t && sudo systemctl reload nginx && echo 'TLS renewed + nginx reloaded'"
    ;;

  disk)
    log "Disk usage breakdown"
    ssh_run "df -h / && echo --- && du -sh '$DEPLOY_PROJECT_DIR'/.next '$DEPLOY_PROJECT_DIR'/data '$DEPLOY_PROJECT_DIR'/node_modules 2>/dev/null && echo --- && find '$DEPLOY_PROJECT_DIR'/data -type f | xargs ls -lh 2>/dev/null | head"
    ;;

  help|-h|--help|"")
    sed -n '2,18p' "$0"
    ;;

  *)
    err "Unknown command: $cmd"
    echo "Run 'bash scripts/remote.sh help' for usage."
    exit 1
    ;;
esac
