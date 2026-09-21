#!/usr/bin/env bash
# ==============================================================================
# Slackers Native VPS Update Script (Zero Downtime PM2 Reload)
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔄 Pulling latest changes from git...${NC}"
git pull

echo -e "${CYAN}📦 Installing dependencies...${NC}"
npm install

echo -e "${CYAN}🐘 Updating database schema with Prisma...${NC}"
cd apps/api
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
npm run build
cd ../..

echo -e "${CYAN}⚡ Compiling Next.js frontend...${NC}"
cd apps/web
npm run build
cd ../..

echo -e "${CYAN}🚀 Reloading PM2 processes...${NC}"
pm2 reload ecosystem.config.cjs

echo -e "\n${GREEN}✓ Update deployed successfully!${NC}"
pm2 status
