#!/usr/bin/env bash
# Daily backup of Port Flow data + .env.local.
#
# Designed to run as the deploy user via cron (or systemd timer).
# Rotates 7 daily backups locally. Optional offsite ship to S3-compatible
# (AWS S3, Backblaze B2, MinIO, ...) via aws CLI if BACKUP_S3_BUCKET is set.
#
# Cron line (deploy user crontab):
#   30 3 * * * /opt/projects/portflow/scripts/backup-cron.sh >> /var/log/portflow-backup.log 2>&1
#
# Restore:
#   tar xzf /var/backups/portflow/portflow-YYYYMMDD.tar.gz -C /tmp/restore
#   then copy data/* and .env.local back into the project, restart PM2.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/projects/portflow}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/portflow}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

cd "$PROJECT_DIR"

stamp=$(date -u +%Y%m%d-%H%M%S)
out="$BACKUP_DIR/portflow-$stamp.tar.gz"

# Use sqlite3 .backup (atomic) instead of copying the file directly.
if command -v sqlite3 >/dev/null && [[ -f data/port.db ]]; then
  sqlite3 data/port.db ".backup data/port.db.bak"
fi

tar czf "$out" \
  --exclude='data/*.bak-tmp' \
  data/ .env.local 2>/dev/null

# Cleanup the on-disk .backup helper if any
rm -f data/port.db.bak

# Permissions: only deploy user can read
chmod 600 "$out"

# Rotation: keep last N days
find "$BACKUP_DIR" -name 'portflow-*.tar.gz' -mtime "+$RETENTION_DAYS" -delete

echo "[backup] $(date -u +%FT%TZ) wrote $(du -sh "$out" | cut -f1) to $out"

# Optional offsite ship
if [[ -n "${BACKUP_S3_BUCKET:-}" ]] && command -v aws >/dev/null; then
  s3_path="s3://${BACKUP_S3_BUCKET}/portflow/portflow-$stamp.tar.gz"
  if aws s3 cp "$out" "$s3_path" --quiet; then
    echo "[backup] shipped to $s3_path"
  else
    echo "[backup] ! S3 ship failed for $s3_path"
  fi
fi

# Optional Backblaze B2 ship via b2 CLI
if [[ -n "${BACKUP_B2_BUCKET:-}" ]] && command -v b2 >/dev/null; then
  if b2 file upload "$BACKUP_B2_BUCKET" "$out" "portflow-$stamp.tar.gz" >/dev/null; then
    echo "[backup] shipped to b2://$BACKUP_B2_BUCKET/portflow-$stamp.tar.gz"
  else
    echo "[backup] ! B2 ship failed"
  fi
fi
