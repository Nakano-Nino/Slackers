# Hybrid Production Deployment Guide: Docker Databases + PM2 Apps

This guide explains how to deploy Slackers using the **Hybrid Model** on an Ubuntu 20.04/22.04/24.04 VPS:
- **Databases in Docker**: PostgreSQL 16, MongoDB 7.0, and Redis 7 run in lightweight containers bound strictly to `127.0.0.1`.
- **Apps & Nginx on Host**: Node.js 20, Next.js 16 frontend, Express API backend, and Nginx reverse proxy run natively using PM2.

---

## Why Choose Hybrid?

| Feature | Docker for DBs | Native PM2 for Apps |
| :--- | :--- | :--- |
| **Simplicity** | No apt repository headaches for Mongo/Postgres | Fast builds directly on host without Docker memory spikes |
| **Security** | Ports bound to `127.0.0.1` (never exposed publicly) | Direct local socket communication |
| **Persistence** | Named Docker volumes keep data safe across updates | Local file uploads stored in `apps/api/uploads/` |
| **SSL / HTTPS** | N/A | 1-command Let's Encrypt SSL with auto-renewal via Certbot |

---

## 1. Quick Start (1-Click Deployment)

### Step 1: Clean Up Previous Docker Containers (If any)
If you previously attempted a full Docker Compose deployment, stop old containers to free ports:
```bash
cd ~/slackers
sudo docker compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
```

### Step 2: Run the 1-Click Hybrid Setup
```bash
cd ~/slackers
chmod +x scripts/setup-vps-hybrid.sh scripts/update-hybrid.sh
sudo ./scripts/setup-vps-hybrid.sh
```

The script will automatically:
1. Ensure Docker & Docker Compose are installed.
2. Launch PostgreSQL, MongoDB, and Redis with `docker-compose.db.yml`.
3. Install Node.js 20 LTS and PM2.
4. Push Prisma database schemas and seed initial demo accounts.
5. Compile Next.js and Express apps.
6. Configure Nginx reverse proxy on port 80.
7. Start and register PM2 processes for automatic boot on system restart.

---

## 2. Enabling HTTPS / SSL (Free Let's Encrypt)

Once your domain is pointing to your VPS IP address (DNS `A` Record):

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically configures SSL inside Nginx and sets up automatic renewal.

---

## 3. Daily Operations & Management

### Managing Application Processes (PM2)
```bash
# View status of API and Web
pm2 status

# View live consolidated logs
pm2 logs

# View logs for a specific service
pm2 logs slackers-api
pm2 logs slackers-web

# Restart services
pm2 restart all
```

### Managing Containerized Databases (Docker)
```bash
# View database container status
sudo docker compose -f docker-compose.db.yml ps

# View database logs
sudo docker compose -f docker-compose.db.yml logs -f postgres
sudo docker compose -f docker-compose.db.yml logs -f mongodb
sudo docker compose -f docker-compose.db.yml logs -f redis

# Restart databases
sudo docker compose -f docker-compose.db.yml restart

# Stop databases
sudo docker compose -f docker-compose.db.yml stop

# Start databases
sudo docker compose -f docker-compose.db.yml start
```

---

## 4. Deploying Updates (Zero-Downtime)

Whenever you push new commits to your repository:
```bash
cd ~/slackers
sudo ./scripts/update-hybrid.sh
```

---

## 5. Database Backups

### PostgreSQL Backup & Restore
```bash
# Backup
sudo docker compose -f docker-compose.db.yml exec -T postgres pg_dump -U slackers slackers_db > backup_$(date +%F).sql

# Restore
cat backup_YYYY-MM-DD.sql | sudo docker compose -f docker-compose.db.yml exec -T postgres psql -U slackers slackers_db
```

### MongoDB Backup
```bash
sudo docker compose -f docker-compose.db.yml exec -T mongodb mongodump --db slackers_logs --out /data/db/backup
```
