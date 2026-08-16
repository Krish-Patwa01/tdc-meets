#!/bin/bash
# Jitsi server setup for meet.thedarknetcommunity.com
#
# Run on a fresh Ubuntu 22.04 VM, as root, AFTER the DNS A record already
# points at this machine. Let's Encrypt verifies over HTTP, so a wrong or
# unpropagated DNS record is the usual reason this fails.
#
#   sudo bash jitsi-setup.sh meet.thedarknetcommunity.com you@email.com
#
# Nothing here is idempotent by design, but re-running is safe.

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: sudo bash jitsi-setup.sh <domain> <email>"
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this with sudo."
  exit 1
fi

echo "==> Checking that $DOMAIN resolves to this machine"
RESOLVED=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)
PUBLIC_IP=$(curl -s --max-time 10 https://api.ipify.org || true)
if [ -n "$RESOLVED" ] && [ -n "$PUBLIC_IP" ] && [ "$RESOLVED" != "$PUBLIC_IP" ]; then
  echo "WARNING: $DOMAIN resolves to $RESOLVED but this machine is $PUBLIC_IP"
  echo "The certificate step will fail. Fix DNS first, or press Ctrl+C now."
  sleep 15
fi

echo "==> Setting hostname"
hostnamectl set-hostname "$DOMAIN"
if ! grep -q "$DOMAIN" /etc/hosts; then
  echo "127.0.0.1 $DOMAIN" >> /etc/hosts
fi

echo "==> Opening firewall ports"
# Oracle Cloud images ship a restrictive iptables INPUT chain. The VCN security
# list in the web console has to allow these too, that part cannot be scripted.
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent >/dev/null

for RULE in "tcp 80" "tcp 443" "tcp 22" "udp 10000"; do
  PROTO=$(echo "$RULE" | cut -d' ' -f1)
  PORT=$(echo "$RULE" | cut -d' ' -f2)
  if ! iptables -C INPUT -p "$PROTO" --dport "$PORT" -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 1 -p "$PROTO" --dport "$PORT" -j ACCEPT
  fi
done
netfilter-persistent save

echo "==> Adding Prosody and Jitsi repositories"
apt-get install -y apt-transport-https curl gnupg lsb-release

curl -sL https://prosody.im/files/prosody-debian-packages.key \
  | gpg --dearmor > /usr/share/keyrings/prosody-debian-packages.key
echo "deb [signed-by=/usr/share/keyrings/prosody-debian-packages.key] http://packages.prosody.im/debian $(lsb_release -sc) main" \
  > /etc/apt/sources.list.d/prosody-debian-packages.list

curl -sL https://download.jitsi.org/jitsi-key.gpg.key \
  | gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/" \
  > /etc/apt/sources.list.d/jitsi-stable.list

apt-get update -qq

echo "==> Installing Jitsi Meet"
# Preseed the prompts so the install runs unattended.
echo "jitsi-videobridge2 jitsi-videobridge/jvb-hostname string $DOMAIN" | debconf-set-selections
echo "jitsi-meet-web-config jitsi-meet/cert-choice select Generate a new self-signed certificate" \
  | debconf-set-selections
DEBIAN_FRONTEND=noninteractive apt-get install -y jitsi-meet

echo "==> Requesting Let's Encrypt certificate"
echo "$EMAIL" | /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh

echo "==> Allowing the meet frontend to embed this server"
# Jitsi ships a security-headers snippet that blocks framing from other origins.
# Without this the video never renders inside our own page.
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN.conf"
if [ -f "$NGINX_CONF" ]; then
  sed -i '/X-Frame-Options/d' "$NGINX_CONF"
  if ! grep -q "frame-ancestors" "$NGINX_CONF"; then
    sed -i "0,/server_name/s|server_name|add_header Content-Security-Policy \"frame-ancestors 'self' https://meet.thedarknetcommunity.com https://*.thedarknetcommunity.com http://localhost:3000\" always;\n    server_name|" "$NGINX_CONF"
  fi
  nginx -t && systemctl reload nginx
else
  echo "WARNING: $NGINX_CONF not found, set the frame-ancestors header by hand."
fi

echo "==> Restarting services"
systemctl restart prosody jicofo jitsi-videobridge2 nginx

echo ""
echo "Done. Open https://$DOMAIN in a browser."
echo ""
echo "If the page loads but a call never connects, port 10000/udp is blocked."
echo "Check the VCN security list ingress rules in the Oracle console."
