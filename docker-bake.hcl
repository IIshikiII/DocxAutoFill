# Multi-architecture image build for the pre-built (prod) images.
#
# Build + push amd64 and arm64 manifests:
#   docker buildx bake --push
# Override registry namespace / tag:
#   REGISTRY=me TAG=v1.0.0 docker buildx bake --push
# Build a single native arch and load it locally (for testing):
#   PLATFORMS=linux/arm64 docker buildx bake --load
#
# See scripts/build-images.sh for a wrapper that provisions the builder.

variable "REGISTRY" {
  default = "ishikii"
}

variable "TAG" {
  default = "refactor"
}

variable "PLATFORMS" {
  default = "linux/amd64,linux/arm64"
}

group "default" {
  targets = ["backend", "frontend"]
}

target "backend" {
  context    = "./backend"
  dockerfile = "Dockerfile"
  platforms  = split(",", PLATFORMS)
  tags       = ["${REGISTRY}/docx_backend:${TAG}"]
}

target "frontend" {
  context    = "./frontend"
  dockerfile = "Dockerfile"
  platforms  = split(",", PLATFORMS)
  tags       = ["${REGISTRY}/docx_front:${TAG}"]
}
