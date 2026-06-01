#!/usr/bin/env bash
#
# Deliver the latest images to a running DocxAutoFill stack.
# Runs ON the server, from the deployment directory (default /opt/docxautofill).
#
#   bash scripts/deploy.sh                 # pull + recreate + health check
#   IMAGE_TAG=1.2.0 bash scripts/deploy.sh # pin a specific image tag first
#
# Steps: back up the database, pull new images, recreate containers, reload
# nginx, then health-check the API. A failed health check exits non-zero.
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/docxautofill}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
KEEP_BACKUPS="${KEEP_BACKUPS:-10}"

cd "$DEPLOY_DIR"

# Optionally pin a new image tag in .env before deploying.
if [ -n "${IMAGE_TAG:-}" ] && [ -f .env ]; then
  if grep -q '^IMAGE_TAG=' .env; then
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${IMAGE_TAG}/" .env
  else
    printf 'IMAGE_TAG=%s\n' "$IMAGE_TAG" >> .env
  fi
fi

# Read only the values this script needs, without exporting them. Sourcing the
# whole .env and exporting it would let docker compose pick mangled values from
# the shell (e.g. bash strips the inner quotes of a JSON array like
# DOCXAUTOFILL_CORS_ORIGINS) instead of reading the .env file verbatim.
get_env() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2-; }
POSTGRES_USER="$(get_env POSTGRES_USER)"
POSTGRES_DB="$(get_env POSTGRES_DB)"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

echo "[1/5] Backing up the database…"
mkdir -p backups
ts="$(date +%Y%m%d-%H%M%S)"
if "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx db; then
  if "${COMPOSE[@]}" exec -T db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" \
      | gzip > "backups/db-${ts}.sql.gz"; then
    echo "  saved backups/db-${ts}.sql.gz"
    ls -1t backups/db-*.sql.gz 2>/dev/null | tail -n +"$((KEEP_BACKUPS + 1))" | xargs -r rm --
  else
    rm -f "backups/db-${ts}.sql.gz"
    echo "  WARNING: backup failed, continuing"
  fi
else
  echo "  db not running yet, skipping backup"
fi

echo "[2/5] Pulling images…"
"${COMPOSE[@]}" pull

echo "[3/5] Recreating containers…"
"${COMPOSE[@]}" up -d

echo "[4/5] Reloading nginx…"
# Reload makes nginx re-resolve upstream container IPs after recreation.
"${COMPOSE[@]}" exec -T nginx nginx -s reload 2>/dev/null \
  || "${COMPOSE[@]}" restart nginx

echo "[5/5] Health check…"
ok=0
for _ in $(seq 1 30); do
  code="$(curl -ks -o /dev/null -w '%{http_code}' https://127.0.0.1/api/auth/me || true)"
  # 401 (unauthenticated) or 200 both mean the backend is serving.
  if [ "$code" = "401" ] || [ "$code" = "200" ]; then ok=1; break; fi
  sleep 2
done
if [ "$ok" = "1" ]; then
  echo "  backend healthy (HTTP $code)"
  echo "Deploy complete."
else
  echo "  HEALTH CHECK FAILED (last HTTP code: ${code:-none})"
  "${COMPOSE[@]}" ps
  echo "Rollback: set IMAGE_TAG to the previous tag and re-run, or restore a backup from ./backups."
  exit 1
fi
