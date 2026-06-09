#!/bin/bash
set -e

echo ""
echo "=========================================="
echo "   ERW Portal — AWS EC2 Setup Script"
echo "=========================================="
echo ""

# ── 1. System update ──
echo "▶ Updating system packages..."
sudo apt-get update -y -q
sudo apt-get install -y -q git curl nginx

# ── 2. Python 3.11 ──
echo "▶ Installing Python 3.11..."
sudo apt-get install -y -q python3.11 python3.11-pip python3.11-venv python3-pip

# ── 3. Node.js 18 ──
echo "▶ Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - > /dev/null 2>&1
sudo apt-get install -y -q nodejs

echo "   Node: $(node --version)  |  npm: $(npm --version)"

# ── 4. Create swap (prevents OOM during npm build on t2.micro) ──
if [ ! -f /swapfile ]; then
    echo "▶ Creating 1GB swap file (needed for npm build on t2.micro)..."
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
fi

# ── 5. Copy project to /var/www ──
echo "▶ Deploying project files..."
sudo mkdir -p /var/www/erw-portal
sudo chown -R ubuntu:ubuntu /var/www/erw-portal
cp -r . /var/www/erw-portal/
cd /var/www/erw-portal

# ── 6. Python dependencies ──
echo "▶ Installing Python dependencies..."
pip3 install -r requirements.txt --quiet

# ── 7. Frontend build ──
echo "▶ Installing frontend npm packages (this takes ~2 min)..."
cd frontend
npm install --legacy-peer-deps --quiet

echo "▶ Building React frontend (this takes ~2 min)..."
NODE_OPTIONS=--max-old-space-size=512 npm run build

cd /var/www/erw-portal

# ── 8. Nginx config ──
echo "▶ Configuring nginx..."
sudo cp nginx/erw-portal.conf /etc/nginx/sites-available/erw-portal
sudo ln -sf /etc/nginx/sites-available/erw-portal /etc/nginx/sites-enabled/erw-portal
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# ── 9. Systemd service ──
echo "▶ Configuring ERW Portal service..."
sudo cp systemd/erw-portal.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable erw-portal
sudo systemctl start erw-portal

# ── 10. Done ──
sleep 2
echo ""
echo "=========================================="
echo "   ✅  Setup complete!"
echo "=========================================="
PUBLIC_IP=$(curl -s --max-time 3 ifconfig.me || echo "your-ec2-ip")
echo "   🌐  Portal: http://$PUBLIC_IP"
echo "   🔌  API:    http://$PUBLIC_IP/api/docs"
echo ""
echo "   Service status:"
sudo systemctl status erw-portal --no-pager -l | head -8
echo "=========================================="
