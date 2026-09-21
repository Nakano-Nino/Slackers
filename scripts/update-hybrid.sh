#!/usr/bin/env bash
# ==============================================================================
# Slackers Hybrid Zero-Downtime Update Script
# Updates code, ensures DB containers are running, runs Prisma migrations,
# rebuilds Next.js & Express, and reloads PM2.
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Updating Slackers (Hybrid Deployment)...${NC}\n"

PROJECT_DIR=$(pwd)

# 1. Pull latest Git changes
echo -e "${CYAN}[1/6] Pulling latest changes from git...${NC}"
git pull

# 2. Ensure database containers are up
echo -e "\n${CYAN}[2/6] Verifying database containers...${NC}"
docker compose -f docker-compose.db.yml up -d

# 3. Install new dependencies
echo -e "\n${CYAN}[3/6] Installing dependencies...${NC}"
npm install

# 4. Synchronize Prisma Schema
echo -e "\n${CYAN}[4/6] Running Prisma database schema sync...${NC}"
cd apps/api
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
npm run build
cd "$PROJECT_DIR"

# 5. Build Next.js
echo -e "\n${CYAN}[5/6] Building Next.js frontend...${NC}"
cd apps/web
npm install --no-save @tailwindcss/oxide
npm run build
cd "$PROJECT_DIR"

# 6. Zero-Downtime Reload with PM2
echo -e "\n${CYAN}[6/6] Reloading PM2 processes...${NC}"
pm2 reload ecosystem.config.cjs --update-env

echo -e "\n${GREEN}✓ Update complete! All services running smoothly.${NC}"
pm2 status
