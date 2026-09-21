#!/usr/bin/env bash
# ==============================================================================
# Slackers Native Ubuntu VPS 1-Click Setup Script (NO DOCKER)
# Installs & configures Node.js 20, PM2, PostgreSQL, MongoDB, Redis, Nginx & Certbot
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
echo -e "      🚀 Native Bare-Metal Production Deployment for Ubuntu VPS${NC}\n"

# Verify root/sudo privileges
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run this script with sudo or as root.${NC}"
    echo "Usage: sudo ./scripts/setup-vps-native.sh"
    exit 1
fi

PROJECT_DIR=$(pwd)

# ------------------------------------------------------------------------------
# 1. System Package Updates & Prerequisites
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/8] Updating system packages & installing core utilities...${NC}"
apt-get update -y
apt-get install -y curl wget gnupg git build-essential openssl ufw nginx certbot python3-certbot-nginx

# Configure 2GB swap if system has <= 2GB RAM
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
# 2. Install Node.js 24 LTS & PM2
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[2/8] Installing Node.js 24 LTS and PM2 process manager...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v) != v24* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
fi
npm install -g pm2
echo -e "${GREEN}✓ Node.js $(node -v) & PM2 $(pm2 -v) installed.${NC}"

# ------------------------------------------------------------------------------
# 3. Install & Start Native PostgreSQL
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[3/8] Installing & configuring PostgreSQL...${NC}"
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Generate secure password for user 'axial'
PG_PASSWORD=$(openssl rand -hex 16)
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'axial') THEN CREATE ROLE axial WITH LOGIN SUPERUSER PASSWORD '${PG_PASSWORD}'; ELSE ALTER ROLE axial WITH PASSWORD '${PG_PASSWORD}'; END IF; END \$\$;" > /dev/null
sudo -u postgres psql -c "SELECT 'CREATE DATABASE slackers OWNER axial' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'slackers')\gexec" > /dev/null
echo -e "${GREEN}✓ PostgreSQL database 'slackers' created with user 'axial'.${NC}"

# ------------------------------------------------------------------------------
# 4. Install & Start Native Redis
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[4/8] Installing & configuring Redis...${NC}"
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server
echo -e "${GREEN}✓ Redis server active.${NC}"

# ------------------------------------------------------------------------------
# 5. Install & Start Native MongoDB
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[5/8] Installing & configuring MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
    # Add MongoDB official GPG key and repo
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update -y
    apt-get install -y mongodb-org || apt-get install -y mongodb
fi
systemctl enable mongod 2>/dev/null || systemctl enable mongodb
systemctl start mongod 2>/dev/null || systemctl start mongodb
echo -e "${GREEN}✓ MongoDB active.${NC}"

# ------------------------------------------------------------------------------
# 6. Configure Environment & Build Application
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[6/8] Configuring application environment and building assets...${NC}"

JWT_SECRET_VAL=$(openssl rand -hex 32)
DETECTED_IP=$(curl -s --max-time 3 https://ifconfig.me || curl -s --max-time 3 https://api.ipify.org || echo "localhost")

# Generate API .env
cat <<EOF > apps/api/.env
PORT=5001
NODE_ENV=production
CLIENT_URL=http://${DETECTED_IP}
JWT_SECRET=${JWT_SECRET_VAL}
DATABASE_URL="postgresql://axial:${PG_PASSWORD}@localhost:5432/slackers?schema=public"
MONGODB_URI="mongodb://localhost:27017/slackers_logs"
REDIS_URL="redis://127.0.0.1:6379"
SEED_DB=false
EOF

# Generate Web .env.local
cat <<EOF > apps/web/.env.local
NEXT_PUBLIC_API_URL=""
NODE_ENV=production
PORT=3000
EOF

# Create upload directory
mkdir -p apps/api/uploads/avatars logs

# Install workspace dependencies
echo "Installing npm workspace dependencies..."
npm install

# Push Prisma schema to PostgreSQL
echo "Synchronizing PostgreSQL schema with Prisma..."
cd apps/api
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
npm run build
cd "$PROJECT_DIR"

# Build Next.js frontend
echo "Compiling Next.js frontend bundle..."
cd apps/web
npm run build
cd "$PROJECT_DIR"

echo -e "${GREEN}✓ Application built successfully.${NC}"

# ------------------------------------------------------------------------------
# 7. Configure Nginx Reverse Proxy
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[7/8] Configuring Nginx reverse proxy...${NC}"
cp nginx/slackers-native.conf /etc/nginx/sites-available/slackers
ln -sf /etc/nginx/sites-available/slackers /etc/nginx/sites-enabled/slackers
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
echo -e "${GREEN}✓ Nginx configured and active on port 80.${NC}"

# Configure firewall
ufw allow 22/tcp > /dev/null 2>&1 || true
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 443/tcp > /dev/null 2>&1 || true
ufw --force enable > /dev/null 2>&1 || true

# ------------------------------------------------------------------------------
# 8. Launch & Persist PM2 Processes
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[8/8] Starting services with PM2 process manager...${NC}"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 systemd startup hook
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || pm2 startup

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 Slackers is successfully running natively on Ubuntu!${NC}"
echo -e "${GREEN}================================================================${NC}"

echo -e "\n🌐 Web Application: ${CYAN}http://${DETECTED_IP}${NC}"
echo -e "📡 REST API Health: ${CYAN}http://${DETECTED_IP}/api/health${NC}"

echo -e "\n🛡️  Database Status: ${GREEN}Fresh & Empty${NC}"
echo -e "  The database has been initialized with 0 demo records."
echo -e "  The first user you register at ${CYAN}http://${DETECTED_IP}${NC} will automatically be granted ${GREEN}ADMIN${NC} privileges."

echo -e "\n📊 PM2 Commands:"
echo -e "  View running status: ${CYAN}pm2 status${NC}"
echo -e "  View live logs:      ${CYAN}pm2 logs${NC}"
echo -e "  Restart all:         ${CYAN}pm2 restart all${NC}"
echo -e "  Stop all:            ${CYAN}pm2 stop all${NC}"

echo -e "\n🔒 To Enable Free HTTPS (Let's Encrypt SSL):"
echo -e "  Point your domain A-Record to ${CYAN}${DETECTED_IP}${NC} and run:"
echo -e "  ${CYAN}sudo certbot --nginx -d yourdomain.com${NC}\n"
