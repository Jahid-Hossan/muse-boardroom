#!/bin/bash
# MUSE AI CEO Command Center - 1-Click VPS Deployment Script
# Works on Ubuntu 20.04 / 22.04 / 24.04 LTS or Debian

echo "=========================================================="
echo "👑 Deploying MUSE AI CEO Command Center on Linux VPS"
echo "=========================================================="

# 1. Update system and install prerequisites
sudo apt-get update -y
sudo apt-get install -y curl git chromium-browser ca-certificates

# 2. Install Node.js (v20+ LTS) if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Install PM2 for 24/7 background process management
sudo npm install -g pm2

# 4. Install project dependencies
npm install

# 5. Open firewall port 3000 (if ufw is active)
if command -v ufw &> /dev/null; then
    sudo ufw allow 3000/tcp
fi

# 6. Start the server with PM2 (Auto-restart on crash / reboot)
pm2 stop muse-ceo 2>/dev/null || true
pm2 start server.js --name "muse-ceo"
pm2 save
pm2 startup

echo "=========================================================="
echo "✅ DEPLOYMENT COMPLETE & RUNNING 24/7!"
echo "👉 Access your CEO Command Center from anywhere at:"
echo "   http://$(curl -s ifconfig.me):3000"
echo "=========================================================="
