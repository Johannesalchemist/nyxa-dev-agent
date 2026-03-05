#!/usr/bin/env bash
#
# deploy.sh — Deploy Amuse Events to a Hetzner Cloud VPS
#
# Usage:
#   ./deploy.sh <SERVER_IP> [SSH_USER]
#
# Prerequisites:
#   - SSH access to the server (key-based auth recommended)
#   - Docker installed on the server
#
# Example:
#   ./deploy.sh 168.119.xx.xx root

set -euo pipefail

SERVER_IP="${1:?Usage: ./deploy.sh <SERVER_IP> [SSH_USER]}"
SSH_USER="${2:-root}"
APP_NAME="amuse-events"
REMOTE_DIR="/opt/${APP_NAME}"

echo "==> Deploying ${APP_NAME} to ${SSH_USER}@${SERVER_IP}"

# Step 1: Ensure Docker is installed on the server
echo "==> Checking Docker on remote..."
ssh "${SSH_USER}@${SERVER_IP}" "command -v docker >/dev/null 2>&1 || {
  echo 'Installing Docker...'
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
}"

# Step 2: Copy project files to the server
echo "==> Syncing files..."
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  "${REPO_ROOT}/modules/amuse_events/" \
  "${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/modules/amuse_events/"

# Step 3: Build and run on the server
echo "==> Building and starting container..."
ssh "${SSH_USER}@${SERVER_IP}" "cd ${REMOTE_DIR} && \
  docker build -t ${APP_NAME} -f modules/amuse_events/webapp/Dockerfile . && \
  docker stop ${APP_NAME} 2>/dev/null || true && \
  docker rm ${APP_NAME} 2>/dev/null || true && \
  docker run -d \
    --name ${APP_NAME} \
    --restart unless-stopped \
    -p 80:3000 \
    ${APP_NAME}"

echo ""
echo "==> Deployed! Access at: http://${SERVER_IP}"
echo ""
echo "Useful commands:"
echo "  ssh ${SSH_USER}@${SERVER_IP} docker logs -f ${APP_NAME}   # View logs"
echo "  ssh ${SSH_USER}@${SERVER_IP} docker restart ${APP_NAME}   # Restart"
echo "  ssh ${SSH_USER}@${SERVER_IP} docker stop ${APP_NAME}      # Stop"
