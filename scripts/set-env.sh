#!/usr/bin/env bash
# Atomic update of a single KEY=VALUE in .env.local, then pm2 reload.
#
# Designed to run on the SERVER (where the project lives).
# For the same operation from your local PC over SSH, use:
#   bash scripts/remote.sh set-env KEY=VALUE
#
# Usage (on the server, as deploy user):
#   sudo -u deploy bash /opt/projects/portflow/scripts/set-env.sh KEY=VALUE
#
# Or if PROJECT_DIR is somewhere else:
#   PROJECT_DIR=/path/to/portflow bash scripts/set-env.sh KEY=VALUE

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/projects/portflow}"

if [[ $# -ne 1 || "$1" != *=* ]]; then
  echo "Usage: $0 KEY=VALUE" >&2
  exit 1
fi

pair="$1"
key="${pair%%=*}"

if [[ ! -f "$PROJECT_DIR/.env.local" ]]; then
  echo "✗ $PROJECT_DIR/.env.local not found" >&2
  exit 1
fi

cd "$PROJECT_DIR"

# Atomic: backup, strip the key, append the new line.
cp -p .env.local .env.local.bak
grep -v "^${key}=" .env.local.bak > .env.local || true
echo "$pair" >> .env.local
chmod 600 .env.local

echo "▸ updated $key in .env.local (backup at .env.local.bak)"

# Reload PM2 with new env (--update-env reloads from .env.local).
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
  echo "▸ PM2 reloaded"
else
  echo "! pm2 not found in PATH — restart the worker manually"
fi
