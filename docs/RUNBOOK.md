# Port Flow — Runbook

Emergency playbook. Copy-paste commands. Assumes `.env.deploy` is set up locally
and `bash scripts/remote.sh` works.

---

## Quick health check

```bash
bash scripts/remote.sh diag                                 # PM2 + build + listener
bash scripts/remote.sh exec 'curl -s localhost:3000/api/health | head -c 1000'
```

`/api/health` returns `200` if all subsystems OK, `503` otherwise. JSON includes
db / ais / sanctions / migrations / clerk / stripe state.

---

## Symptom → Action

### Site returns 502 / connection refused
```bash
bash scripts/remote.sh exec 'pm2 list && ss -tlnp | grep :3000'
```
- If PM2 status is not `online`: `bash scripts/remote.sh restart`
- If port 3000 isn't listening: `bash scripts/remote.sh exec 'pm2 logs port-flow-web --lines 100 --nostream' | tail -50` to find the boot crash
- If nginx is the issue: `bash scripts/remote.sh nginx-test` then `bash scripts/remote.sh nginx-reload`

### AIS feed disconnected / no live data
```bash
bash scripts/remote.sh exec 'pm2 logs port-flow-web --lines 200 --nostream | grep "\[ais\]"'
```
- Look for `[ais] disconnected` or `error` in the last 100 lines
- If AISStream API key revoked: regenerate at aisstream.io, update via `bash scripts/remote.sh exec 'sed -i "s|^AISSTREAM_API_KEY=.*|AISSTREAM_API_KEY=NEW_KEY|" .env.local'` then restart
- If aisstream.io is down (rare): nothing to do, wait. Worker auto-reconnects with exponential backoff.

### Stripe webhook stops processing
```bash
bash scripts/remote.sh exec 'curl -s localhost:3000/api/health | grep stripe'
```
- Verify webhook secret in Stripe dashboard matches `STRIPE_WEBHOOK_SECRET` in `.env.local`
- Check signature errors: `bash scripts/remote.sh logs 200 | grep webhook`
- If endpoint URL changed: update in Stripe dashboard → Webhooks

### Disk full
```bash
bash scripts/remote.sh exec 'df -h / && du -sh /opt/projects/portflow/.next /opt/projects/portflow/data'
```
- Old build artifacts: `.next/cache` can be safely deleted (will rebuild on next deploy)
- DB grows over time: see "Backup + DB compact" below
- PM2 logs: `bash scripts/remote.sh exec 'pm2 flush'` clears

### TLS cert expiring (< 14 days)
```bash
bash scripts/remote.sh exec 'sudo certbot certificates'
bash scripts/remote.sh exec 'sudo certbot renew --quiet && sudo systemctl reload nginx'
```
Certbot is on a systemd timer normally, but if it failed silently this fixes it.

### Memory leak / high RSS
```bash
bash scripts/remote.sh exec 'pm2 list'
```
- `max_memory_restart: 1G` in `ecosystem.config.js` auto-restarts. If you see
  the restart counter ↺ growing fast, something leaks.
- Capture before next auto-restart: `bash scripts/remote.sh exec 'node --inspect node_modules/next/dist/bin/next start' &`
  then chrome://inspect (only do this if it's important — invasive).

### Bad deploy / need to roll back
```bash
bash scripts/remote.sh exec 'cd /opt/projects/portflow && git log --oneline -10'
bash scripts/remote.sh exec 'cd /opt/projects/portflow && git checkout <SHA> && npm ci && npm run build && pm2 reload ecosystem.config.js --update-env'
```
Then on local machine: `git revert <bad-SHA>` and push so server is back in sync.

---

## Routine maintenance (monthly)

### Dependency security audit
```bash
bash scripts/remote.sh exec 'npm audit --production --omit=dev 2>&1 | head -40'
```
If high/critical: locally `npm audit fix` → commit → deploy.

### Backup
**One-shot manual backup** (downloads to local):
```bash
bash scripts/remote.sh backup ~/Backups/portflow
```

**Daily automated backup** (recommended for production):
```bash
# 1. Install the cron script (one-time setup)
bash scripts/remote.sh exec 'sudo install -m 755 -o deploy -g deploy /opt/projects/portflow/scripts/backup-cron.sh /usr/local/bin/portflow-backup-cron.sh'

# 2. Add deploy user crontab (one-time)
bash scripts/remote.sh ssh   # interactive
crontab -e
# Add line:
30 3 * * * /opt/projects/portflow/scripts/backup-cron.sh >> /var/log/portflow-backup.log 2>&1

# 3. Verify after 24h:
bash scripts/remote.sh exec 'ls -lh /var/backups/portflow/'
bash scripts/remote.sh exec 'tail -20 /var/log/portflow-backup.log'
```

Local rotation: 7 daily backups, older auto-deleted.

**Optional offsite ship** (recommended — local disk lost = backup lost):
- Set `BACKUP_S3_BUCKET=your-bucket` in env (requires `aws` CLI configured)
- Or `BACKUP_B2_BUCKET=your-bucket` for Backblaze B2 (cheaper)

**Restore procedure:**
```bash
# Pull backup locally:
scp deploy@portflow.uk:/var/backups/portflow/portflow-YYYYMMDD-HHMMSS.tar.gz ./

# On the target server (after PM2 stop):
sudo systemctl stop port-flow-web   # or pm2 stop
tar xzf portflow-YYYYMMDD-HHMMSS.tar.gz -C /opt/projects/portflow/
chmod 600 /opt/projects/portflow/.env.local
pm2 start ecosystem.config.js --update-env
```

### SQLite VACUUM (if DB > 500 MB)
```bash
bash scripts/remote.sh exec 'cd /opt/projects/portflow && pm2 stop port-flow-web && sqlite3 data/port.db "VACUUM;" && pm2 start ecosystem.config.js --update-env'
```
Stop the app first to release locks. ~30s downtime.

### Check sanctions freshness
```bash
bash scripts/remote.sh exec 'curl -s localhost:3000/api/sanctions | head -c 300'
```
`fetchedAt` should be < 24h ago. If older, OFAC URL may have changed.

---

## Onboarding a new operator (or future Claude session)

Read in this order:
1. `docs/ARCHITECTURE.md` — what runs where
2. This file — playbook
3. `.env.example` — every env var with comments
4. `scripts/deploy.sh` and `scripts/remote.sh` — deploy + ops automation
5. `scripts/setup.mjs` — multilingual interactive setup

Then:
```bash
git clone <repo>
cp .env.deploy.example .env.deploy && nano .env.deploy
ssh-add ~/.ssh/portflow_deploy   # or set DEPLOY_KEY
bash scripts/remote.sh diag
```

---

## Contacts & accounts

| Service | Where | What to do |
|---|---|---|
| Domain | Cloudflare DNS | Renewals + DNS changes |
| Hosting | DigitalOcean droplet (Frankfurt) | Server provisioning |
| Email | (Resend, when activated) | Inbound bounces + DKIM |
| Auth | Clerk | User management, SSO settings |
| Billing | Stripe | Subscriptions, refunds, disputes |
| AIS data | aisstream.io | API quota, key rotation |
| SAR | dataspace.copernicus.eu | OAuth credentials renewal |
| Sanctions | OFAC + UK OFSI public URLs | Free, no account needed |

Keep credentials in a password manager (1Password / Bitwarden). Never in
plain files except `.env.local` on the server (chmod 600).
