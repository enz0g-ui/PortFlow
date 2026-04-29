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

  help|-h|--help|"")
    sed -n '2,18p' "$0"
    ;;

  *)
    err "Unknown command: $cmd"
    echo "Run 'bash scripts/remote.sh help' for usage."
    exit 1
    ;;
esac
