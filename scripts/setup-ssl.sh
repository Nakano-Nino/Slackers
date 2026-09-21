#!/usr/bin/env bash
# ==============================================================================
# Configure Domain & Free Let's Encrypt HTTPS for Slackers
# ==============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="${1:-slacker.prasty.web.id}"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run with sudo: sudo ./scripts/setup-ssl.sh [domain]${NC}"
    exit 1
fi

echo -e "${CYAN}🔒 Setting up HTTPS / SSL for domain: ${YELLOW}${DOMAIN}${NC}\n"

# 1. Update Nginx configuration with the domain name
NGINX_CONF="/etc/nginx/sites-available/slackers"
if [ -f "$NGINX_CONF" ]; then
    echo "Updating Nginx server_name to ${DOMAIN}..."
    sed -i "s/server_name .*/server_name ${DOMAIN};/" "$NGINX_CONF"
    nginx -t
    systemctl reload nginx
else
    echo "Installing Nginx configuration..."
    cp nginx/slackers-native.conf "$NGINX_CONF"
    sed -i "s/server_name .*/server_name ${DOMAIN};/" "$NGINX_CONF"
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/slackers
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx
fi

# 2. Update backend API .env CLIENT_URL
PROJECT_DIR=$(pwd)
if [ -f "$PROJECT_DIR/apps/api/.env" ]; then
    echo "Updating backend CLIENT_URL to https://${DOMAIN}..."
    sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://${DOMAIN}|" "$PROJECT_DIR/apps/api/.env"
    if command -v pm2 &> /dev/null; then
        pm2 reload slackers-api --update-env 2>/dev/null || true
    fi
fi

# 3. Obtain and install Let's Encrypt SSL certificate
echo -e "\n${CYAN}Obtaining and configuring Let's Encrypt SSL certificate via Certbot...${NC}"
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect || certbot --nginx -d "${DOMAIN}"

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 HTTPS is successfully enabled!${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "Your web app is now live at: ${CYAN}https://${DOMAIN}${NC}"
echo -e "API Health check:            ${CYAN}https://${DOMAIN}/api/health${NC}\n"
