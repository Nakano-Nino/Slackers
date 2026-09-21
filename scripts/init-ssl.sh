#!/usr/bin/env bash
# ==============================================================================
# Slackers Let's Encrypt SSL Automation for Ubuntu VPS
# Usage: ./scripts/init-ssl.sh <yourdomain.com> <your-email@example.com>
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Usage: $0 <domain.com> [email@example.com]${NC}"
    echo "Example: $0 chat.mydomain.com admin@mydomain.com"
    exit 1
fi

EMAIL_ARG="--register-unsafely-without-email"
if [ -n "$EMAIL" ]; then
    EMAIL_ARG="--email $EMAIL --no-eff-email"
fi

echo -e "${CYAN}🔐 Requesting Let's Encrypt SSL certificate for: ${DOMAIN}...${NC}"

# Ensure containers are running
docker compose -f docker-compose.prod.yml up -d nginx

# Run certbot standalone webroot client
docker run --rm \
    -v slackers_certbot_conf:/etc/letsencrypt \
    -v slackers_certbot_www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d "$DOMAIN" \
    --agree-tos \
    $EMAIL_ARG \
    --non-interactive

echo -e "${GREEN}✓ SSL Certificate successfully issued!${NC}"

# Generate SSL Nginx configuration from template
export DOMAIN_NAME=$DOMAIN
envsubst '${DOMAIN_NAME}' < nginx/conf.d/default-ssl.conf.template > nginx/conf.d/default.conf

# Reload Nginx configuration
docker exec slackers_nginx_prod nginx -s reload

# Update APP_URL in .env.production
if [ -f ".env.production" ]; then
    sed -i.bak "s|APP_URL=.*|APP_URL=https://${DOMAIN}|g" .env.production
    rm -f .env.production.bak
    echo -e "${GREEN}✓ Updated APP_URL=https://${DOMAIN} in .env.production.${NC}"
    echo -e "${YELLOW}Restarting API and Web to update CORS origin...${NC}"
    docker compose -f docker-compose.prod.yml up -d api web
fi

echo -e "\n${GREEN}🎉 HTTPS is now active at: ${CYAN}https://${DOMAIN}${NC}!\n"
