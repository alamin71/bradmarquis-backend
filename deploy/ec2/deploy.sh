#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   chmod +x deploy/ec2/deploy.sh
#   ./deploy/ec2/deploy.sh

APP_DIR="/var/www/bradmarquis-backend"
BRANCH="main"

if [ ! -d "$APP_DIR" ]; then
  echo "App directory not found: $APP_DIR"
  echo "Clone your repo first:"
  echo "  sudo mkdir -p /var/www"
  echo "  cd /var/www"
  echo "  sudo git clone <YOUR_REPO_URL> bradmarquis-backend"
  echo "  sudo chown -R $USER:$USER /var/www/bradmarquis-backend"
  exit 1
fi

cd "$APP_DIR"

echo "[1/6] Pulling latest code"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "[2/6] Installing dependencies"
npm ci

echo "[3/6] Building project"
npm run build

echo "[4/6] Ensuring .env exists"
if [ ! -f .env ]; then
  echo "Missing .env file in $APP_DIR"
  echo "Create .env before deploy."
  exit 1
fi

echo "[5/6] Starting/Reloading PM2"
if pm2 describe bradmarquis-backend > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi

echo "[6/6] Saving PM2 process list"
pm2 save
pm2 startup | tail -n 1 || true

echo "Deploy complete"
pm2 status
