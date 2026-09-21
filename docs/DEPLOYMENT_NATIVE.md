# 🚀 Slackers — Native Ubuntu VPS Deployment Guide (No Docker)

This guide provides complete instructions to run **Slackers** directly on bare-metal Ubuntu (20.04 / 22.04 / 24.04 LTS) using **Node.js 24**, **PM2 process manager**, native **PostgreSQL**, **MongoDB**, **Redis**, and **Nginx** reverse proxy with **Let's Encrypt SSL**.

---

## ⚡ Quick Start (1-Click Automated Setup)

On a fresh Ubuntu VPS (DigitalOcean, Hetzner, AWS EC2, Linode, Vultr, Contabo):

```bash
# 1. Clone your repository
git clone https://github.com/your-username/slackers.git
cd slackers

# 2. Run the automated setup script with sudo
sudo ./scripts/setup-vps-native.sh
```

**The script automatically**:
1. Installs Node.js 24, npm, PM2, PostgreSQL, MongoDB, Redis, Nginx, and Certbot.
2. Creates the PostgreSQL `slackers` database and `axial` user with a secure random password.
3. Enables and boots all systemd database services.
4. Generates `.env` files for both backend and frontend.
5. Installs all workspace dependencies and runs `prisma db push` to synchronize schemas.
6. Builds both the Express API and Next.js frontend.
7. Seeds default demo accounts (`admin`, `alex`, `sarah`, `marcus`).
8. Configures Nginx on port 80 with full WebSocket support and UFW firewall rules.
9. Starts both apps under PM2 with automatic restart on boot.

Your app will be live immediately on `http://<YOUR_VPS_IP>`.

---

## 🔒 Enable Free HTTPS (Let's Encrypt SSL)

Setting up HTTPS on native Nginx is simpler than Docker because Certbot integrates directly with the native Nginx daemon:

### 1. Point Your Domain DNS A-Record
In your domain provider (Cloudflare, Namecheap, GoDaddy, etc.):
- **Type**: `A`
- **Name**: `chat` (or `@` for root domain)
- **Value**: Your Ubuntu VPS Public IP
- **TTL**: Auto / 5 minutes

### 2. Issue Certificate with Certbot
Once your DNS record is active, run:

```bash
sudo certbot --nginx -d chat.yourdomain.com
```

Certbot will:
1. Validate your domain.
2. Automatically modify `/etc/nginx/sites-available/slackers` with SSL certificate paths and TLS settings.
3. Automatically configure HTTP $\rightarrow$ HTTPS 301 redirects.
4. Set up automatic certificate renewal via systemd timer.

### 3. Update Application URL
Update the `CLIENT_URL` in `apps/api/.env` to reflect HTTPS:

```bash
sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://chat.yourdomain.com|g" apps/api/.env
pm2 restart slackers-api
```

Your app is now securely running at `https://chat.yourdomain.com` with an official green padlock!

---

## 🛠 Manual Step-by-Step Installation (Alternative)

If you prefer to configure each component manually:

### Step 1: Install Node.js 24 & PM2
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash -
sudo apt install -y nodejs build-essential git nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### Step 2: Install & Configure PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# Create user and database
sudo -u postgres psql -c "CREATE ROLE axial WITH LOGIN SUPERUSER PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE slackers OWNER axial;"
```

### Step 3: Install & Start Redis
```bash
sudo apt install -y redis-server
sudo systemctl enable --now redis-server
```

### Step 4: Install & Start MongoDB
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

### Step 5: Configure Application Environment
```bash
cp .env.native.example apps/api/.env
nano apps/api/.env
# Configure DATABASE_URL="postgresql://axial:your_secure_password@localhost:5432/slackers?schema=public"
# Configure JWT_SECRET (generate with: openssl rand -hex 32)
```

Create `apps/web/.env.local`:
```bash
cat <<EOF > apps/web/.env.local
NEXT_PUBLIC_API_URL=""
NODE_ENV=production
PORT=3000
EOF
```

### Step 6: Install Dependencies & Build
```bash
# In the root repository directory:
npm install

# Build backend
cd apps/api
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
npm run build
npx tsx src/services/dbSeed.ts
cd ../..

# Build frontend
cd apps/web
npm run build
cd ../..
```

### Step 7: Start with PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Step 8: Configure Nginx
```bash
sudo cp nginx/slackers-native.conf /etc/nginx/sites-available/slackers
sudo ln -sf /etc/nginx/sites-available/slackers /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Daily Maintenance & PM2 Commands

### Monitoring
```bash
# View process status & CPU/RAM usage
pm2 status

# Real-time process monitor dashboard
pm2 monit

# View combined live logs
pm2 logs

# View only API logs
pm2 logs slackers-api

# View only Web logs
pm2 logs slackers-web
```

### Managing Processes
```bash
# Restart both services
pm2 restart all

# Stop services
pm2 stop all

# Reload with zero downtime (after code changes)
pm2 reload all
```

---

## 🔄 Updating the Application (Continuous Deployment)

When you make changes to your codebase and push to GitHub, update your VPS in one command:

```bash
sudo ./scripts/update-native.sh
```

This script will automatically:
1. `git pull` latest commits.
2. `npm install` any new dependencies.
3. Run `prisma db push` to apply database schema changes.
4. Compile backend and frontend bundles.
5. Gracefully reload PM2 processes (`pm2 reload all`).

---

## 💾 Native Backup Procedures

### PostgreSQL
```bash
pg_dump -U axial -h localhost -d slackers > ~/backup_postgres_$(date +%F).sql
```

### MongoDB
```bash
mongodump --db slackers_logs --archive=~/backup_mongo_$(date +%F).archive
```

### Uploaded Attachments
```bash
tar -czvf ~/backup_uploads_$(date +%F).tar.gz apps/api/uploads/
```
