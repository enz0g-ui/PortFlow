#!/usr/bin/env bash
# Keep the Next.js instance + SQLite page cache warm — runs ON the VPS via cron.
#
# Why: on this 1 vCPU / 2GB droplet, idle periods let the kernel swap out
# next-server pages and evict SQLite pages from the page cache; the first
# request after a long idle was observed at up to 23s (vs 0.15s warm).
# Hitting the heavy routes through localhost keeps the working set resident.
# This replaces the external single-URL ping as the primary warmer (the
# external ping only covered `/` and depended on a LAN machine being up).
#
# Cron (deploy user):  */5 * * * * /opt/projects/portflow/scripts/keepwarm.sh
LOG=/home/deploy/keepwarm.log
ROUTES=(/ /app /precision /pricing /m)
line="$(date '+%Y-%m-%d %H:%M:%S')"
for p in "${ROUTES[@]}"; do
  read -r tt code < <(curl -s -o /dev/null -w '%{time_total} %{http_code}' \
    --max-time 60 "http://localhost:3000${p}" 2>/dev/null)
  line+=" ${p}=${code:-ERR}:${tt:-NA}s"
done
echo "$line" >> "$LOG"
# bound the log (~1 week at 5-min cadence)
if [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 2500 ]; then
  tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
