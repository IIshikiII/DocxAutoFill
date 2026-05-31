#!/usr/bin/env bash
#
# Build the DocxAutoFill images for multiple architectures with buildx bake.
#
#   scripts/build-images.sh                      # build amd64+arm64 and push
#   PUSH=0 scripts/build-images.sh               # build the host arch and load locally
#   REGISTRY=me TAG=v1.0.0 scripts/build-images.sh
#   PLATFORMS=linux/arm64 PUSH=0 scripts/build-images.sh
#
# Multi-arch manifests can only be pushed to a registry (not loaded into the
# local Docker engine), so the default PUSH=1 implies --push. With PUSH=0 the
# build targets the host's native platform and is --loaded for local testing.
set -euo pipefail

REGISTRY="${REGISTRY:-ishikii}"
TAG="${TAG:-refactor}"
PUSH="${PUSH:-1}"
BUILDER="${BUILDER:-docxautofill}"

cd "$(dirname "$0")/.."

# Multi-platform output needs the docker-container driver, not the default one.
if ! docker buildx inspect "$BUILDER" >/dev/null 2>&1; then
  echo "Creating buildx builder '$BUILDER' (docker-container driver)…"
  docker buildx create --name "$BUILDER" --driver docker-container --bootstrap
fi

export REGISTRY TAG

if [ "$PUSH" = "1" ]; then
  echo "Building + pushing ${REGISTRY}/docx_{backend,front}:${TAG} for ${PLATFORMS:-linux/amd64,linux/arm64}…"
  docker buildx bake --builder "$BUILDER" --push
else
  native="$(docker version --format '{{.Server.Os}}/{{.Server.Arch}}')"
  echo "Building ${REGISTRY}/docx_{backend,front}:${TAG} for ${PLATFORMS:-$native} (local --load)…"
  PLATFORMS="${PLATFORMS:-$native}" docker buildx bake --builder "$BUILDER" --load
fi
