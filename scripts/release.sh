#!/usr/bin/env bash
#
# One-shot release: build + push images from your workstation, then trigger a
# deploy on the server over SSH. This is the "automatic delivery" entry point.
#
#   scripts/release.sh                 # uses deploy/deploy.env
#   TAG=1.2.0 scripts/release.sh       # override a single value ad hoc
#
# Requires: local Docker logged in to the registry (docker login) and SSH
# access to the server with the deploy key.
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${DEPLOY_ENV:-$HERE/deploy/deploy.env}"
if [ -f "$ENV_FILE" ]; then set -a; . "$ENV_FILE"; set +a; fi

: "${REGISTRY:?set REGISTRY (e.g. in deploy/deploy.env)}"
: "${TAG:?set TAG}"
: "${SSH_HOST:?set SSH_HOST}"
REMOTE_DIR="${REMOTE_DIR:-/opt/docxautofill}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/docxautofill_deploy}"
PLATFORMS="${PLATFORMS:-linux/amd64}"
SSH_USER="${SSH_USER:-root}"

echo "==> Building + pushing ${REGISTRY}/docx_{backend,front}:${TAG} (${PLATFORMS})"
REGISTRY="$REGISTRY" TAG="$TAG" PLATFORMS="$PLATFORMS" PUSH=1 "$HERE/scripts/build-images.sh"

echo "==> Deploying on ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"
ssh -i "${SSH_KEY/#\~/$HOME}" -o IdentitiesOnly=yes "${SSH_USER}@${SSH_HOST}" \
  "cd '${REMOTE_DIR}' && IMAGE_TAG='${TAG}' DEPLOY_DIR='${REMOTE_DIR}' bash scripts/deploy.sh"

echo "==> Release ${TAG} delivered."
