#!/usr/bin/env bash
# Hetzner / Ubuntu 24.04 LTS — one-time bootstrap for a multi-project Node host.
#
# Run as root, ONCE per fresh server:
#   curl -fsSL https://raw.githubusercontent.com/enz0g-ui/PortFlow/main/scripts/server-bootstrap.sh | bash
#
# Or copy the file onto the box and run:  bash server-bootstrap.sh
#
# Provisions: non-root deploy user, Node 24, PM2, Nginx, UFW, Fail2ban, Certbot.
# Re-runnable safely (idempotent on system packages, skips already-done steps).

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
NODE_MAJOR="${NODE_MAJOR:-24}"
SSH_PORT="${SSH_PORT:-22}"

log() { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }

if [[ $(id -u) -ne 0 ]]; then
  echo "Run as root."
  exit 1
fi

log "Updating apt & installing baseline packages"
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl ca-certificates gnupg git build-essential \
  ufw fail2ban nginx certbot python3-certbot-nginx \
  unattended-upgrades htop

log "Installing Node.js $NODE_MAJOR via NodeSource"
if ! command -v node >/dev/null 2>&1 || [[ $(node -v | cut -d'.' -f1 | tr -d v) -lt $NODE_MAJOR ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
ok "Node $(node -v) · npm $(npm -v)"

log "Installing PM2 globally"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi
ok "pm2 $(pm2 -v)"

log "Creating deploy user '$DEPLOY_USER'"
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  mkdir -p "/home/$DEPLOY_USER/.ssh"
  if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys"
  fi
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  chmod 700 "/home/$DEPLOY_USER/.ssh"
  chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys" || true
  ok "User created. SSH keys copied from root if present."
else
  ok "User $DEPLOY_USER already exists"
fi

log "Configuring UFW firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT"/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ok "UFW: 22/80/443 open, default deny"

log "Configuring Fail2ban (SSH brute-force protection)"
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = ${SSH_PORT}
maxretry = 5
bantime = 3600
findtime = 600
EOF
systemctl enable --now fail2ban

log "Enabling automatic security updates"
dpkg-reconfigure -f noninteractive unattended-upgrades

log "Creating /opt/projects for hosted apps"
mkdir -p /opt/projects
chown "$DEPLOY_USER:$DEPLOY_USER" /opt/projects

log "Configuring Nginx (default vhost disabled, ready for per-project configs)"
rm -f /etc/nginx/sites-enabled/default
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
nginx -t
systemctl enable --now nginx

log "Linking PM2 to systemd for $DEPLOY_USER"
sudo -u "$DEPLOY_USER" bash -c 'pm2 startup systemd -u $USER --hp $HOME' || true
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" || true

log "Done."
cat <<EOF

═══════════════════════════════════════════════════════════
  Server is ready.

  Next steps as deploy user:
    su - $DEPLOY_USER
    cd /opt/projects
    git clone https://github.com/enz0g-ui/PortFlow.git portflow
    cd portflow
    npm ci
    npm run setup           # interactive wizard for .env.local
    npm run build
    pm2 start ecosystem.config.js
    pm2 save

  HTTPS via Let's Encrypt (after DNS A record points to this server):
    sudo cp nginx/portflow.conf /etc/nginx/sites-available/
    sudo ln -s /etc/nginx/sites-available/portflow.conf /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    sudo certbot --nginx -d portflow.example.com

═══════════════════════════════════════════════════════════
EOF
