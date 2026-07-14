#!/usr/bin/env bash
# Deploy a branch to the KARL staging box (192.168.1.163:3000) to test
# changes BEFORE touching production.
#
# Staging facts (set up 2026-07-14):
#   * Clone:   enz0g@192.168.1.163:~/portflow-staging
#   * Runtime: pm2 app "port-flow-web" (pm2 at ~/.npm-global/bin/pm2),
#              ecosystem.config.js in the staging dir, PORT=3000
#   * Own .env.local with its OWN aisstream key — no conflict with prod
#   * Browse:  http://192.168.1.163:3000  (LAN only)
#
# Usage (from the repo root, Git Bash):
#   bash scripts/staging.sh              # deploy current branch
#   bash scripts/staging.sh my-branch    # deploy a specific branch
#
# The branch is pushed to origin first (prod does NOT auto-deploy from
# GitHub — production only updates via scripts/remote.sh deploy — so
# pushing a branch, or even main, never touches the live site).

set -euo pipefail

HOST=enz0g@192.168.1.163
DIR='~/portflow-staging'
PM2=/home/enz0g/.npm-global/bin/pm2

branch="${1:-$(git rev-parse --abbrev-ref HEAD)}"

echo "▸ Push de la branche '$branch' vers origin"
git push origin "$branch"

echo "▸ Déploiement sur le staging KARL ($branch)"
ssh -o BatchMode=yes "$HOST" "
  set -e
  cd $DIR
  git fetch -q origin
  git checkout -q '$branch' 2>/dev/null || git checkout -qb '$branch' 'origin/$branch'
  git reset --hard -q 'origin/$branch'
  npm ci --progress=false 2>&1 | tail -1
  npm run build 2>&1 | tail -2
  $PM2 startOrReload ecosystem.config.js --update-env >/dev/null
  sleep 5
  curl -s -o /dev/null -w 'staging HTTP %{http_code}\n' http://localhost:3000/
  git log --oneline -1
"

echo "✓ Staging à jour → http://192.168.1.163:3000"
