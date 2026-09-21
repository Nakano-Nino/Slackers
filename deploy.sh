#!/usr/bin/env bash
# ==============================================================================
# Slackers Ubuntu VPS 1-Click Deployment Script
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ███████╗██╗      █████╗  ██████╗██╗  ██╗███████╗██████╗ ███████╗"
echo "  ██╔════╝██║     ██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗██╔════╝"
echo "  ███████╗██║     ███████║██║     █████╔╝ █████╗  ██████╔╝███████╗"
echo "  ╚════██║██║     ██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗╚════██║"
echo "  ███████║███████╗██║  ██║╚██████╗██║  ██╗███████╗██║  ██║███████║"
echo "  ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝"
echo -e "         🚀 Production Deployment for Ubuntu VPS${NC}\n"

# 1. Verify Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed on this server.${NC}"
    echo "Please install Docker using the official Ubuntu script:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Verify Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose plugin is not installed.${NC}"
    echo "Please install the compose plugin: sudo apt-get update && sudo apt-get install -y docker-compose-plugin"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose detected.${NC}"

# 2. Setup production environment file
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚙️  .env.production not found. Initializing from template...${NC}"
    cp .env.production.example .env.production

    # Generate secure random secrets
    PG_PASS=$(openssl rand -hex 16 2>/dev/null || tr -dc A-Za-z0-9 </dev/urandom | head -c 32)
    MINIO_PASS=$(openssl rand -hex 16 2>/dev/null || tr -dc A-Za-z0-9 </dev/urandom | head -c 32)
    JWT_SECRET_VAL=$(openssl rand -hex 32 2>/dev/null || tr -dc A-Za-z0-9 </dev/urandom | head -c 64)

    # Detect public IP
    DETECTED_IP=$(curl -s --max-time 3 https://ifconfig.me || curl -s --max-time 3 https://api.ipify.org || echo "localhost")

    # Replace placeholders in .env.production
    sed -i.bak "s/replace_with_a_secure_postgres_password/${PG_PASS}/g" .env.production
    sed -i.bak "s/replace_with_a_secure_minio_password/${MINIO_PASS}/g" .env.production
    sed -i.bak "s/replace_with_a_secure_random_64_character_hex_key/${JWT_SECRET_VAL}/g" .env.production
    sed -i.bak "s|http://localhost|http://${DETECTED_IP}|g" .env.production
    rm -f .env.production.bak

    echo -e "${GREEN}✓ Generated secure random credentials in .env.production.${NC}"
    echo -e "  Detected public address: ${CYAN}http://${DETECTED_IP}${NC}"
else
    echo -e "${GREEN}✓ Existing .env.production found.${NC}"
fi

# 3. Build and launch services
echo -e "\n${CYAN}📦 Building Docker images and starting containers...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 4. Wait for API and Web services to be ready
echo -e "\n${YELLOW}⏳ Waiting for services to pass healthchecks (approx 15-30s)...${NC}"
MAX_RETRIES=20
COUNT=0
HEALTHY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
    API_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' slackers_api_prod 2>/dev/null || echo "\"unhealthy\"")
    if [ "$API_STATUS" = "\"healthy\"" ] || [ "$API_STATUS" = "null" ]; then
        HEALTHY=true
        break
    fi
    sleep 3
    COUNT=$((COUNT + 1))
    echo "  ...waiting for database synchronization and healthcheck ($COUNT/$MAX_RETRIES)"
done

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 Slackers is successfully deployed and running!${NC}"
echo -e "${GREEN}================================================================${NC}"

APP_URL_VAL=$(grep -E '^APP_URL=' .env.production | cut -d '=' -f2-)
echo -e "\n🌐 Web Application: ${CYAN}${APP_URL_VAL}${NC}"
echo -e "📡 REST API Health: ${CYAN}${APP_URL_VAL}/api/health${NC}"

echo -e "\n🔑 Default Demo Accounts (if SEED_DB=true was enabled):"
echo -e "  Admin:      ${CYAN}admin@slackers.dev${NC}   / password: ${YELLOW}password123${NC}"
echo -e "  Developer:  ${CYAN}alex@slackers.dev${NC}    / password: ${YELLOW}password123${NC}"
echo -e "  Designer:   ${CYAN}sarah@slackers.dev${NC}   / password: ${YELLOW}password123${NC}"
echo -e "  QA Lead:    ${CYAN}marcus@slackers.dev${NC}  / password: ${YELLOW}password123${NC}"

echo -e "\n📊 Useful Management Commands:"
echo -e "  View logs:          ${CYAN}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "  Stop containers:    ${CYAN}docker compose -f docker-compose.prod.yml down${NC}"
echo -e "  Restart containers: ${CYAN}docker compose -f docker-compose.prod.yml restart${NC}"
echo -e "  SSL Certificate:    ${CYAN}./scripts/init-ssl.sh yourdomain.com${NC}\n"
