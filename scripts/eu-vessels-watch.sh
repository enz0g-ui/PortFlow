#!/usr/bin/env bash
# Veille de la liste UE des navires sanctionnés (à lancer sur KARL, chaque
# semaine, par cron). La page de l'autorité maritime danoise refuse les
# adresses de serveurs : KARL la lit, et signale par ntfy tout nouveau
# fichier. La prod lit ensuite le CSV sur le CDN (qui, lui, répond).
#
# Mise à jour de la prod après une notification :
#   bash scripts/remote.sh exec "echo '<URL>' > data/eu_vessels_url.txt"
# (le connecteur relit ce fichier à chaque passage quotidien).
set -euo pipefail

PAGE="https://www.dma.dk/growth-and-framework-conditions/maritime-sanctions/general-information/eu-vessel-designations"
CDN="https://cdn2.gopublic.dk/soefartsstyrelsen"
STATE="${HOME}/.portflow-eu-vessels-url"
TOPIC="${NTFY_TOPIC:-portflow-ais-lg-x7k3m9}"

html=$(curl -s -m 60 -A 'Mozilla/5.0' "$PAGE" || true)
path=$(printf '%s' "$html" | grep -o '/Media/[0-9]*/ImportversionList[A-Za-z0-9_%.-]*\.csv' | head -1 || true)

if [ -z "$path" ]; then
  curl -s -m 20 -H "Title: Port Flow - veille liste UE" -H "Priority: low" \
    -d "Page DMA illisible (lien CSV introuvable). A verifier : $PAGE" "https://ntfy.sh/$TOPIC" >/dev/null || true
  exit 0
fi

url="$CDN$path"
prev=$(cat "$STATE" 2>/dev/null || true)
if [ "$url" != "$prev" ]; then
  echo "$url" > "$STATE"
  if [ -n "$prev" ]; then
    curl -s -m 20 -H "Title: Port Flow - nouvelle liste UE des navires" -H "Priority: high" \
      -d "Nouveau fichier publie : $url
Mettre a jour la prod : bash scripts/remote.sh exec \"echo '$url' > data/eu_vessels_url.txt\"" \
      "https://ntfy.sh/$TOPIC" >/dev/null || true
  fi
fi
echo "eu-vessels-watch: $url"
