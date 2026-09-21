#!/usr/bin/env bash
# ==============================================================================
# Slackers Hybrid Ubuntu VPS 1-Click Setup Script
# - PostgreSQL, MongoDB, Redis in Docker (bound to 127.0.0.1)
# - Node.js 20, Next.js, Express API in PM2 on host
# - Nginx & Certbot on host
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ███████╗██╗      █████╗  ██████╗██╗  ██╗███████╗██████╗ ███████╗"
echo "  ██╔════╝██║     ██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗██╔════╝"
echo "  ███████╗██║     ███████║██║     █████╔╝ █████╗  ██████╔╝███████╗"
echo "  ╚════██║██║     ██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗╚════██║"
echo "  ███████║███████╗██║  ██║╚██████╗██║  ██╗███████╗██║  ██║███████║"
echo "  ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝"
echo -e "   🚀 Hybrid Production Deployment (Docker DBs + Host PM2 & Nginx)${NC}\n"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run this script with sudo or as root.${NC}"
    echo "Usage: sudo ./scripts/setup-vps-hybrid.sh"
    exit 1
fi

PROJECT_DIR=$(pwd)

# ------------------------------------------------------------------------------
# 1. Prerequisites & System Utilities
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/8] Updating packages & installing host utilities...${NC}"
apt-get update -y
apt-get install -y curl wget git build-essential openssl ufw nginx certbot python3-certbot-nginx

# Configure 2GB swap if system memory is <= 2.5GB (prevents Next.js OOM)
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_MEM" -le 2500 ] && [ ! -f /swapfile ]; then
    echo -e "${YELLOW}⚙️  Configuring 2GB swap space to optimize Next.js builds...${NC}"
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ------------------------------------------------------------------------------
# 2. Ensure Docker & Docker Compose are Installed
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[2/8] Verifying Docker Engine...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
echo -e "${GREEN}✓ Docker is ready: $(docker --version)${NC}"

# ------------------------------------------------------------------------------
# 3. Launch Containerized Databases (PostgreSQL, MongoDB, Redis)
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[3/8] Launching databases with Docker Compose...${NC}"
docker compose -f docker-compose.db.yml up -d

echo "Waiting for databases to initialize..."
MAX_TRIES=30
COUNT=0
until docker compose -f docker-compose.db.yml exec -T postgres pg_isready -U slackers -d slackers_db > /dev/null 2>&1 || [ $COUNT -eq $MAX_TRIES ]; do
    sleep 2
    COUNT=$((COUNT+1))
done

if [ $COUNT -eq $MAX_TRIES ]; then
    echo -e "${RED}❌ PostgreSQL failed to become healthy in time.${NC}"
    docker compose -f docker-compose.db.yml logs postgres
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL, MongoDB, and Redis are running healthy on 127.0.0.1.${NC}"

# ------------------------------------------------------------------------------
# 4. Install Node.js 24 LTS & PM2
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[4/8] Installing Node.js 24 LTS and PM2...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v) != v24* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
fi
npm install -g pm2
echo -e "${GREEN}✓ Node.js $(node -v) & PM2 $(pm2 -v) ready.${NC}"

# ------------------------------------------------------------------------------
# 5. Environment & Workspace Dependencies
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[5/8] Configuring environment and installing workspace packages...${NC}"
JWT_SECRET_VAL=$(openssl rand -hex 32)
DETECTED_IP=$(curl -s --max-time 3 https://ifconfig.me || curl -s --max-time 3 https://api.ipify.org || echo "localhost")

# Generate API .env connecting to localhost Docker ports
cat <<EOF > apps/api/.env
PORT=5001
NODE_ENV=production
CLIENT_URL=http://${DETECTED_IP}
JWT_SECRET=${JWT_SECRET_VAL}
DATABASE_URL="postgresql://slackers:slackers_secret@127.0.0.1:5432/slackers_db?schema=public"
MONGODB_URI="mongodb://127.0.0.1:27017/slackers_logs"
REDIS_URL="redis://127.0.0.1:6379"
SEED_DB=false
EOF

# Generate Web .env.local
cat <<EOF > apps/web/.env.local
NEXT_PUBLIC_API_URL=""
NODE_ENV=production
PORT=3000
EOF

mkdir -p apps/api/uploads/avatars logs

echo "Installing workspace dependencies..."
npm install

# ------------------------------------------------------------------------------
# 6. Database Synchronization & Builds
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[6/8] Syncing database schema and building project...${NC}"
cd apps/api
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
npm run build
cd "$PROJECT_DIR"

echo "Building Next.js frontend application..."
cd apps/web
# Ensure native Tailwind v4 oxide binding is installed on this Linux architecture
npm install --no-save @tailwindcss/oxide
npm run build
cd "$PROJECT_DIR"
echo -e "${GREEN}✓ Frontend and backend builds completed.${NC}"

# ------------------------------------------------------------------------------
# 7. Configure Nginx Reverse Proxy
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[7/8] Configuring Nginx reverse proxy...${NC}"
cp nginx/slackers-native.conf /etc/nginx/sites-available/slackers
ln -sf /etc/nginx/sites-available/slackers /etc/nginx/sites-enabled/slackers
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
echo -e "${GREEN}✓ Nginx active on port 80.${NC}"

# Firewall configuration
ufw allow 22/tcp > /dev/null 2>&1 || true
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 443/tcp > /dev/null 2>&1 || true
ufw --force enable > /dev/null 2>&1 || true

# ------------------------------------------------------------------------------
# 8. Start & Persist PM2
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[8/8] Starting applications with PM2...${NC}"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 systemd startup hook
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || pm2 startup

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 Slackers is running in Hybrid Mode!${NC}"
echo -e "${GREEN}================================================================${NC}"

echo -e "\n🌐 Web Application: ${CYAN}http://${DETECTED_IP}${NC}"
echo -e "📡 REST API Health: ${CYAN}http://${DETECTED_IP}/api/health${NC}"

echo -e "\n🛡️  Database Status: ${GREEN}Fresh & Empty${NC}"
echo -e "  The database has been initialized with 0 demo records."
echo -e "  The first user you register at ${CYAN}http://${DETECTED_IP}${NC} will automatically be granted ${GREEN}ADMIN${NC} privileges."

echo -e "\n📊 Monitoring & Control Commands:"
echo -e "  Node Apps Status:    ${CYAN}pm2 status${NC}"
echo -e "  Node Apps Logs:      ${CYAN}pm2 logs${NC}"
echo -e "  Database Status:     ${CYAN}sudo docker compose -f docker-compose.db.yml ps${NC}"
echo -e "  Database Logs:       ${CYAN}sudo docker compose -f docker-compose.db.yml logs -f${NC}"

echo -e "\n🔒 To Enable Free HTTPS (Let's Encrypt SSL):"
echo -e "  Point your domain A-Record to ${CYAN}${DETECTED_IP}${NC} and run:"
echo -e "  ${CYAN}sudo certbot --nginx -d yourdomain.com${NC}\n"
