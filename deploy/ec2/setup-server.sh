#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   chmod +x deploy/ec2/setup-server.sh
#   ./deploy/ec2/setup-server.sh

echo "[1/6] Updating apt packages"
sudo apt update -y
sudo apt upgrade -y

echo "[2/6] Installing base packages"
sudo apt install -y curl git nginx build-essential

echo "[3/6] Installing Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "[4/6] Installing PM2"
sudo npm install -g pm2

echo "[5/6] Enabling Nginx"
sudo systemctl enable nginx
sudo systemctl start nginx

echo "[6/6] Server setup done"
node -v
npm -v
pm2 -v
