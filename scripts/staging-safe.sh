#!/usr/bin/env bash
# Déploiement staging KARL "safe-RAM" : on arrête l'app pm2 pendant le
# build (libère ~600 Mo) et on borne la heap Node, pour éviter l'asphyxie
# mémoire qui a gelé la box le 25/07 (SSH injoignable 2 h, reboot requis).
# Usage : bash scripts/staging-safe.sh [branche]
set -euo pipefail

HOST=enz0g@192.168.1.163
DIR='~/portflow-staging'
PM2=/home/enz0g/.npm-global/bin/pm2

branch="${1:-$(git rev-parse --abbrev-ref HEAD)}"

echo "▸ Push de la branche '$branch' vers origin"
git push origin "$branch"

echo "▸ Déploiement safe-RAM sur KARL ($branch)"
ssh -o BatchMode=yes "$HOST" "
  set -e
  cd $DIR
  git fetch -q origin
  git checkout -q '$branch' 2>/dev/null || git checkout -qb '$branch' 'origin/$branch'
  git reset --hard -q 'origin/$branch'
  $PM2 stop port-flow-web >/dev/null 2>&1 || true
  npm ci --progress=false --no-audit --no-fund 2>&1 | tail -1
  NODE_OPTIONS='--max-old-space-size=1536' npm run build 2>&1 | tail -2
  $PM2 startOrReload ecosystem.config.js --update-env >/dev/null
"
echo "▸ Vérification"
sleep 5
curl -s -o /dev/null -m 20 -w 'staging HTTP %{http_code}\n' http://192.168.1.163:3000/
echo "✓ Staging à jour → http://192.168.1.163:3000"
