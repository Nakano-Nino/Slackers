# 🚀 Slackers — Ubuntu VPS Docker Deployment Guide

This guide provides complete, production-tested, step-by-step instructions to deploy the full **Slackers** stack on any Ubuntu VPS (DigitalOcean, AWS EC2, Hetzner, Linode, Vultr, Contabo, etc.) using Docker and Docker Compose.

---

## 📋 System Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| **Operating System** | Ubuntu 20.04 / 22.04 / 24.04 LTS | Ubuntu 22.04 or 24.04 LTS |
| **CPU** | 1 vCPU | 2 vCPUs |
| **RAM** | 2 GB *(with 2GB swap configured)* | 4 GB |
| **Disk Space** | 20 GB SSD | 40+ GB SSD |
| **Network Ports** | 22 (SSH), 80 (HTTP), 443 (HTTPS) | All databases remain internal |

---

## ⚡ Quick Start (1-Click Automated Deployment)

If you just provisioned a fresh Ubuntu VPS, run the following commands to install Docker, configure secrets, and launch all services:

```bash
# 1. Update system & install Docker + Compose
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo apt-get install -y docker-compose-plugin git openssl

# 2. Clone the repository
git clone https://github.com/your-username/slackers.git
cd slackers

# 3. Run the automated deployment script
sudo ./deploy.sh
```

`deploy.sh` will automatically:
1. Generate cryptographically secure random passwords for PostgreSQL, MongoDB, Redis, MinIO, and JWT in `.env.production`.
2. Detect your VPS public IP address and configure `APP_URL`.
3. Build the Next.js frontend and Express backend multi-stage Docker images.
4. Launch the 7-container cluster in detached mode.
5. Wait for all database health checks and Prisma migrations to synchronize.
6. Display your application URL and pre-seeded demo accounts.

---

## 🛠 Manual Step-by-Step Deployment

If you prefer to configure everything manually or inspect each step, follow the walkthrough below.

### Step 1: Server Hardening & Swap Configuration

If your VPS has 2 GB of RAM, configure a 2 GB swap file to prevent the Next.js webpack compiler from triggering the Linux OOM (Out Of Memory) killer during builds:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Configure firewall (UFW) to allow SSH, HTTP, and HTTPS:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

### Step 2: Configure Production Environment

Copy the production template:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` using your favorite text editor (`nano` or `vim`):

```bash
nano .env.production
```

Configure the following key fields:
- `APP_URL`: Set to your VPS public IP (e.g. `http://123.45.67.89`) or your custom domain (e.g. `https://chat.yourdomain.com`).
- `POSTGRES_PASSWORD`: A secure random password.
- `MINIO_ROOT_PASSWORD`: A secure random password for S3 storage.
- `JWT_SECRET`: A 64-character random string (generate with `openssl rand -hex 32`).
- `SEED_DB`: Set to `true` on your first launch if you want default team accounts (`admin`, `alex`, `sarah`, `marcus`) created.

---

### Step 3: Build & Launch with Docker Compose

Build the container images and launch the stack:

```bash
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Monitor container boot and health status:

```bash
sudo docker compose -f docker-compose.prod.yml ps
```

You should see 7 healthy services running:
1. `slackers_postgres_prod` (healthy)
2. `slackers_mongodb_prod` (healthy)
3. `slackers_redis_prod` (healthy)
4. `slackers_minio_prod` (healthy)
5. `slackers_minio_init` (exited 0)
6. `slackers_api_prod` (healthy)
7. `slackers_web_prod` (healthy)
8. `slackers_nginx_prod` (running on ports 80 & 443)

Verify the API health check endpoint:

```bash
curl http://localhost/api/health
```

Expected output:
```json
{"status":"healthy","service":"slackers-api","database":{"postgres":{"status":"connected"},"mongodb":{"status":"connected"},"redis":{"status":"connected"},"storage":{"status":"connected"}}}
```

---

## 🔒 Custom Domain & Free SSL (Let's Encrypt HTTPS)

To connect a custom domain (e.g. `chat.yourdomain.com`) with automatic SSL:

### 1. Point DNS A-Record
In your domain DNS manager (Cloudflare, GoDaddy, Namecheap, etc.), create an **A Record**:
- **Name**: `chat` (or `@` for root domain)
- **Type**: `A`
- **Value**: Your Ubuntu VPS Public IP address
- **TTL**: Auto / 5 minutes

### 2. Run the SSL Automation Script

Once your DNS record propagates (usually 1-5 minutes), run:

```bash
sudo ./scripts/init-ssl.sh chat.yourdomain.com your-email@example.com
```

This script will:
1. Request a Let's Encrypt certificate using the Certbot ACME webroot challenge.
2. Generate the SSL Nginx configuration with TLSv1.3 and HSTS headers.
3. Automatically reload Nginx.
4. Update `APP_URL=https://chat.yourdomain.com` in `.env.production`.
5. Restart the web and API containers to apply the new origin.

### 3. Automatic SSL Renewal
Let's Encrypt certificates expire every 90 days. Set up a daily cron job to renew automatically:

```bash
(crontab -l 2>/dev/null; echo "0 3 * * * docker run --rm -v slackers_certbot_conf:/etc/letsencrypt -v slackers_certbot_www:/var/www/certbot certbot/certbot renew --quiet && docker exec slackers_nginx_prod nginx -s reload") | crontab -
```

---

## 🔧 Production Operations & Maintenance

### View Live Container Logs
```bash
# View all logs
sudo docker compose -f docker-compose.prod.yml logs -f

# View only API logs
sudo docker compose -f docker-compose.prod.yml logs -f api

# View only Web logs
sudo docker compose -f docker-compose.prod.yml logs -f web

# View Nginx access & error logs
sudo docker compose -f docker-compose.prod.yml logs -f nginx
```

### Restarting the Application
```bash
sudo docker compose -f docker-compose.prod.yml restart
```

### Stopping the Stack
```bash
sudo docker compose -f docker-compose.prod.yml down
```
*(Note: All database and file data is preserved in persistent Docker volumes).*

### Updating the Application (CI/CD / Git Pull)
When new commits are pushed to your repository, update your VPS in seconds:

```bash
git pull
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## 💾 Backup & Restore Procedures

### 1. PostgreSQL Backup
```bash
docker exec -t slackers_postgres_prod pg_dumpall -c -U axial > ~/backup_postgres_$(date +%F).sql
```

### 2. MongoDB Audit Log Backup
```bash
docker exec -t slackers_mongodb_prod mongodump --db slackers_logs --archive > ~/backup_mongo_$(date +%F).archive
```

### 3. MinIO File Attachments Backup
All uploaded encrypted attachments are stored in the Docker volume `minio_data`. To archive:
```bash
sudo tar -czvf ~/backup_minio_$(date +%F).tar.gz /var/lib/docker/volumes/slackers_minio_data/_data
```

---

## ❓ Frequently Asked Questions & Troubleshooting

### Why is port 5001 or 5432 not reachable from the internet?
By design, all database engines (Postgres, Mongo, Redis, MinIO) and backend application services communicate exclusively over the internal `slackers_network` Docker bridge network. Only ports 80 and 443 on Nginx are exposed. This prevents port scanning and brute-force attacks on your databases.

### Can I run this behind Cloudflare?
Yes! Point your Cloudflare DNS record to your VPS IP with the orange proxy icon enabled. In Cloudflare SSL settings, select **Full (Strict)** if you ran `init-ssl.sh`, or **Flexible** if using port 80 HTTP.

### WebSockets disconnect on mobile browsers:
Nginx is pre-configured with `proxy_read_timeout 86400s;` and WebSocket connection upgrades. The frontend client includes `visibilitychange` listeners to automatically resume connections without hammering the server.
