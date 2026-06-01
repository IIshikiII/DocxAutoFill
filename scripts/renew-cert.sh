#!/usr/bin/env bash
#
# Renew the Let's Encrypt short-lived certificate via the HTTP-01 webroot
# challenge (served by the running nginx) and reload nginx on success.
# Invoked by the lego-renew systemd timer; safe to run manually.
#
# Short-lived certificates last ~6 days, so the timer runs twice daily and
# this renews when fewer than RENEW_DAYS remain.
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/docxautofill}"
set -a; [ -f "$DEPLOY_DIR/.env" ] && . "$DEPLOY_DIR/.env"; set +a

: "${ACME_EMAIL:?set ACME_EMAIL in $DEPLOY_DIR/.env}"
: "${ACME_DOMAIN:?set ACME_DOMAIN in $DEPLOY_DIR/.env}"
ACME_SERVER="${ACME_SERVER:-https://acme-v02.api.letsencrypt.org/directory}"
ACME_PROFILE="${ACME_PROFILE:-shortlived}"
LEGO_PATH="${LEGO_PATH:-/etc/lego}"
ACME_WEBROOT="${ACME_WEBROOT:-/var/www/acme}"
NGINX_CONTAINER="${NGINX_CONTAINER:-docxautofill-nginx}"
RENEW_DAYS="${RENEW_DAYS:-3}"
LEGO_BIN="${LEGO_BIN:-/usr/local/bin/lego}"

"$LEGO_BIN" \
  --path "$LEGO_PATH" \
  --server "$ACME_SERVER" \
  --email "$ACME_EMAIL" --accept-tos \
  --http --http.webroot "$ACME_WEBROOT" \
  --domains "$ACME_DOMAIN" --profile "$ACME_PROFILE" \
  renew --days "$RENEW_DAYS" \
  --renew-hook "docker exec ${NGINX_CONTAINER} nginx -s reload"
