#!/bin/bash
# ============================================================================
# DEPLOYMENT SCRIPT — Zero-downtime deploy for the monorepo
# ============================================================================
# This script is meant to be run on the VPS, either manually or via CI/CD.
#
# Usage:
#   ./scripts/deploy.sh <dockerhub_username> <image_tag>
#
# Example:
#   ./scripts/deploy.sh myuser abc1234
# ============================================================================

set -euo pipefail

# ── Arguments ────────────────────────────────────────────────────────────────
DOCKERHUB_USERNAME="${1:?Usage: $0 <dockerhub_username> <image_tag>}"
IMAGE_TAG="${2:?Usage: $0 <dockerhub_username> <image_tag>}"

# ── Config ───────────────────────────────────────────────────────────────────
PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Pre-flight Checks ───────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
    error "Docker is not installed"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    error "Docker Compose is not installed"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    error "docker-compose.yml not found at ${COMPOSE_FILE}"
    exit 1
fi

# ── Export for docker-compose.yml interpolation ──────────────────────────────
export DOCKERHUB_USERNAME
export IMAGE_TAG

# ── Pull Images ──────────────────────────────────────────────────────────────
log "📥 Pulling images with tag: ${IMAGE_TAG}..."
docker pull "${DOCKERHUB_USERNAME}/monorepo-web:${IMAGE_TAG}"
docker pull "${DOCKERHUB_USERNAME}/monorepo-api:${IMAGE_TAG}"
docker pull "${DOCKERHUB_USERNAME}/monorepo-nginx:${IMAGE_TAG}"

# ── Deploy ───────────────────────────────────────────────────────────────────
log "🚀 Starting deployment..."
cd "$PROJECT_DIR"
docker compose up -d --no-build --remove-orphans

# ── Health Check ─────────────────────────────────────────────────────────────
log "⏳ Waiting for services to be healthy..."
MAX_RETRIES=30
RETRY_INTERVAL=2

for i in $(seq 1 $MAX_RETRIES); do
    if docker compose ps | grep -q "(healthy)"; then
        HEALTHY_COUNT=$(docker compose ps | grep -c "(healthy)")
        if [ "$HEALTHY_COUNT" -ge 3 ]; then
            log "✅ All services are healthy!"
            break
        fi
    fi

    if [ "$i" -eq "$MAX_RETRIES" ]; then
        warn "⚠️  Not all services became healthy within timeout."
        warn "Current status:"
        docker compose ps
        exit 1
    fi

    sleep $RETRY_INTERVAL
done

# ── Verify ───────────────────────────────────────────────────────────────────
log "📊 Deployment status:"
docker compose ps

# ── Cleanup ──────────────────────────────────────────────────────────────────
log "🧹 Cleaning up old images..."
docker image prune -f

log "🎉 Deployment complete!"
log "   Tag: ${IMAGE_TAG}"
log "   Web: http://localhost"
log "   API: http://localhost/api/"
