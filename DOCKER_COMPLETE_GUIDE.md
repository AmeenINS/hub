# 🐳 Complete Docker Deployment Guide - Ameen Hub

**Domain:** `ameenhub.sbc.om`  
**Application:** Next.js + LMDB + Scheduler + Notifications  
**Version:** 0.1.0

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Production Deployment](#production-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Services & Architecture](#services--architecture)
5. [Management Commands](#management-commands)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)
8. [Backup & Restore](#backup--restore)

---

## 🚀 Quick Start

### Local Development (5 minutes)

```bash
# 1. Create environment file
cp .env.example .env

# 2. Build and start
chmod +x docker-start.sh
./docker-start.sh build
./docker-start.sh start

# 3. Initialize database
./docker-start.sh init

# 4. Access application
# http://localhost:4000
```

**Default credentials:**
- Email: `admin@ameen.om`
- Password: `Admin@123`

---

## 🌐 Production Deployment

### Prerequisites

- **Server:** Ubuntu 20.04/22.04 or CentOS 7/8
- **RAM:** 2GB minimum (4GB recommended)
- **Storage:** 20GB minimum
- **Domain:** ameenhub.sbc.om (DNS configured)
- **Ports:** 80, 443 open in firewall

### Step-by-Step Deployment

#### 1️⃣ Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

#### 2️⃣ Clone and Setup

```bash
# Clone repository
git clone https://github.com/AmeenINS/hub.git
cd hub

# Make scripts executable
chmod +x deploy-production.sh docker-start.sh
```

#### 3️⃣ Configure DNS

In your DNS management panel:

```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 300
```

**Verify DNS:**
```bash
nslookup ameenhub.sbc.om
dig ameenhub.sbc.om
```

Wait 5-15 minutes for propagation.

#### 4️⃣ Generate Secrets

```bash
./deploy-production.sh secrets
```

This generates:
- Strong JWT secret for authentication
- CRON secret for scheduled tasks

#### 5️⃣ Setup SSL Certificate

```bash
./deploy-production.sh ssl
```

Enter your email (e.g., `admin@sbc.om`) for certificate notifications.

This will:
- Obtain Let's Encrypt certificate
- Configure auto-renewal every 12 hours
- Enable HTTPS with TLS 1.2/1.3

#### 6️⃣ Build and Deploy

```bash
# Build Docker images
./deploy-production.sh build

# Start all services
./deploy-production.sh start

# Initialize database
./deploy-production.sh init
```

#### 7️⃣ Configure Firewall

```bash
sudo ufw enable
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw status
```

#### 8️⃣ Verify Deployment

```bash
# Check status
./deploy-production.sh status

# Test health endpoint
curl https://ameenhub.sbc.om/api/health

# View logs
./deploy-production.sh logs
```

**Access application:** https://ameenhub.sbc.om

---

## 🔧 Environment Configuration

### File Structure

```
.env.example          # Template for environment variables
.env                  # Local development (git-ignored)
.env.production       # Production server (git-ignored)
```

### Dynamic Configuration

Both `docker-compose.yml` and `docker-compose.prod.yml` read environment variables dynamically:

```yaml
environment:
  - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:4000}
  - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:4000}
  - JWT_SECRET=${JWT_SECRET:-default-secret}
  - CRON_SECRET=${CRON_SECRET:-default-secret}
```

### Local Development (.env)

```bash
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Security
JWT_SECRET=your-local-secret
CRON_SECRET=your-local-cron-secret
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=4000
DATABASE_URL=file:/app/data/dev.db

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./data/uploads
```

### Production (.env.production)

```bash
# Domain Configuration
NEXT_PUBLIC_APP_URL=https://ameenhub.sbc.om
NEXT_PUBLIC_API_URL=https://ameenhub.sbc.om

# Security (auto-generated)
JWT_SECRET=<strong-random-secret>
CRON_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=4000
DATABASE_URL=file:/app/data/dev.db

# SSL/TLS
SSL_CERTIFICATE_PATH=/etc/letsencrypt/live/ameenhub.sbc.om/fullchain.pem
SSL_CERTIFICATE_KEY_PATH=/etc/letsencrypt/live/ameenhub.sbc.om/privkey.pem
```

### Change Domain

To change domain (e.g., to `app.example.com`):

```bash
# 1. Update .env.production
sed -i 's/ameenhub.sbc.om/app.example.com/g' .env.production

# 2. Update Nginx config
sed -i 's/ameenhub.sbc.om/app.example.com/g' nginx/conf.d/app.conf

# 3. Obtain new SSL certificate
./deploy-production.sh ssl

# 4. Rebuild and restart
./deploy-production.sh build
./deploy-production.sh start
```

---

## 🏗️ Services & Architecture

### Docker Containers

| Container | Port | Purpose |
|-----------|------|---------|
| **ameen-hub** | 4000 | Next.js application |
| **ameen-nginx** | 80, 443 | Reverse proxy + SSL |
| **ameen-certbot** | - | SSL certificate management |

### Application Components

```
┌─────────────────────────────────────────┐
│         Nginx Reverse Proxy             │
│  • HTTP → HTTPS Redirect                │
│  • SSL/TLS Termination                  │
│  • Static File Caching (30 days)        │
│  • Gzip Compression                     │
│  • Security Headers                     │
│  • SSE Support (Real-time)              │
└──────────────┬──────────────────────────┘
               │ Port 4000
               ▼
┌─────────────────────────────────────────┐
│       Next.js Application               │
│  ┌─────────────────────────────────┐   │
│  │ React Frontend                  │   │
│  │ • Dashboard, CRM, Tasks         │   │
│  │ • Scheduler, Notifications      │   │
│  │ • User Management               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ API Routes                      │   │
│  │ • Authentication (JWT)          │   │
│  │ • Role-based Permissions        │   │
│  │ • RESTful APIs                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Background Services             │   │
│  │ • Scheduler (every minute)      │   │
│  │ • Event Cleanup (every hour)    │   │
│  │ • SSE Notifications (real-time) │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ LMDB Database                   │   │
│  │ • High-performance key-value    │   │
│  │ • ACID compliance               │   │
│  │ • Zero-copy reads               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Certbot (SSL Manager)               │
│  • Auto-renewal every 12 hours          │
│  • Let's Encrypt certificates           │
│  • Email notifications                  │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Persistent Storage (Volumes)        │
│  • ./data/ → Database                   │
│  • ./data/uploads/ → Files              │
│  • ./logs/ → Application logs           │
│  • ./certbot/conf/ → SSL certs          │
└─────────────────────────────────────────┘
```

### Automated Services

**Every Minute:**
- Scheduler Service
  - Process scheduled event notifications
  - Send due notifications
  - Complete past events
  - Create recurring events

**Every Hour:**
- Event Cleanup
  - Remove old completed events
  - Clean expired data

**Every 12 Hours:**
- SSL Certificate Renewal
  - Check certificate expiry
  - Renew if needed (30 days before expiry)
  - Reload Nginx configuration

**Every 30 Seconds:**
- Health Checks
  - Application health monitoring
  - Nginx availability check
  - Auto-restart on failure

---

## 🎮 Management Commands

### Development (docker-start.sh)

```bash
./docker-start.sh build      # Build Docker image
./docker-start.sh start      # Start containers
./docker-start.sh stop       # Stop containers
./docker-start.sh restart    # Restart containers
./docker-start.sh logs       # View logs (real-time)
./docker-start.sh status     # Show container status
./docker-start.sh init       # Initialize database
./docker-start.sh shell      # Access container shell
./docker-start.sh cleanup    # Remove all containers
./docker-start.sh help       # Show all commands
```

### Production (deploy-production.sh)

```bash
./deploy-production.sh setup         # Configure domain
./deploy-production.sh secrets       # Generate secure secrets
./deploy-production.sh ssl           # Setup SSL certificate
./deploy-production.sh build         # Build Docker images
./deploy-production.sh start         # Start all services
./deploy-production.sh stop          # Stop all services
./deploy-production.sh restart       # Restart services
./deploy-production.sh update        # Update application
./deploy-production.sh logs          # View logs
./deploy-production.sh status        # Check status
./deploy-production.sh init          # Initialize database
./deploy-production.sh shell         # Access container shell
./deploy-production.sh backup        # Create backup
./deploy-production.sh renew-ssl     # Renew SSL certificate
./deploy-production.sh cleanup       # Remove all containers
./deploy-production.sh help          # Show all commands
```

### Common Tasks

**View Real-time Logs:**
```bash
# All services
./deploy-production.sh logs

# Specific container
docker logs -f ameen-hub
docker logs -f ameen-nginx
docker logs -f ameen-certbot
```

**Check Service Status:**
```bash
./deploy-production.sh status
docker ps
docker stats
```

**Restart Application:**
```bash
./deploy-production.sh restart
```

**Update Application:**
```bash
# Pulls latest code, rebuilds, restarts
./deploy-production.sh update
```

**Access Container Shell:**
```bash
./deploy-production.sh shell
```

**Create Backup:**
```bash
./deploy-production.sh backup
# Creates: backup-YYYYMMDD-HHMMSS.tar.gz
```

---

## 🔒 Security

### Implemented Features

✅ **Network Security**
- Firewall configured (only ports 80, 443)
- Internal Docker network isolation
- No database network exposure

✅ **SSL/TLS Encryption**
- Let's Encrypt certificates
- TLS 1.2 and 1.3 support
- Strong cipher suites
- Auto-renewal configured

✅ **HTTP Security Headers**
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing)
- X-XSS-Protection

✅ **Application Security**
- JWT authentication
- Role-based permissions
- Input validation (Zod)
- XSS protection
- CSRF protection
- Secure password hashing (Argon2)

✅ **File Security**
- Upload size limits (20MB)
- File type validation
- Restricted file permissions

### Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Verify JWT_SECRET is strong and unique
- [ ] Verify CRON_SECRET is set
- [ ] SSL certificate obtained and valid
- [ ] Firewall configured (ports 80, 443 only)
- [ ] Database directory permissions restricted
- [ ] Regular backups scheduled
- [ ] Monitoring configured
- [ ] Security updates enabled

### Best Practices

**Secrets Management:**
```bash
# Generate strong secrets
./deploy-production.sh secrets

# Never commit secrets to git
# .env and .env.production are in .gitignore

# Rotate secrets periodically
openssl rand -base64 32
```

**Firewall Configuration:**
```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status verbose
```

**SSL Certificate Monitoring:**
```bash
# Check certificate expiry
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# Manual renewal
./deploy-production.sh renew-ssl
```

---

## 🔍 Troubleshooting

### Issue: Services Not Starting

**Check logs:**
```bash
./deploy-production.sh logs
docker ps -a
```

**Solution:**
```bash
# Restart Docker service
sudo systemctl restart docker

# Rebuild and restart
./deploy-production.sh stop
./deploy-production.sh build
./deploy-production.sh start
```

---

### Issue: SSL Certificate Fails

**Common causes:**
- DNS not configured
- Ports 80/443 blocked
- Domain doesn't point to server

**Solution:**
```bash
# 1. Verify DNS
nslookup ameenhub.sbc.om
dig ameenhub.sbc.om

# 2. Check firewall
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# 3. Retry SSL setup
./deploy-production.sh ssl
```

---

### Issue: Domain Not Accessible

**Solution:**
```bash
# 1. Check services
./deploy-production.sh status

# 2. Check Nginx
docker logs ameen-nginx
docker exec ameen-nginx nginx -t

# 3. Check application
docker logs ameen-hub

# 4. Restart all
./deploy-production.sh restart
```

---

### Issue: Database Errors

**Solution:**
```bash
# Check database files
ls -la data/lmdb/

# Reinitialize database
./deploy-production.sh init

# Restore from backup
./deploy-production.sh stop
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz
./deploy-production.sh start
```

---

### Issue: Out of Disk Space

**Solution:**
```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a

# Remove old backups
ls -lh backup-*.tar.gz
rm backup-OLD-*.tar.gz

# Clean logs
truncate -s 0 logs/*.log
```

---

## 💾 Backup & Restore

### Create Backup

```bash
# Automatic backup (includes everything)
./deploy-production.sh backup

# Manual backup
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  data/ \
  logs/ \
  .env.production
```

**Backup includes:**
- Database files (`data/lmdb/`)
- Uploaded files (`data/uploads/`)
- Application logs (`logs/`)
- Environment configuration (`.env.production`)

### Restore from Backup

```bash
# 1. Stop services
./deploy-production.sh stop

# 2. Extract backup
tar -xzf backup-20251106-123456.tar.gz

# 3. Start services
./deploy-production.sh start

# 4. Verify
./deploy-production.sh status
curl https://ameenhub.sbc.om/api/health
```

### Automated Backups

**Daily backup with cron:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/hub && ./deploy-production.sh backup
```

**Keep last 7 days:**
```bash
# Add to crontab
0 3 * * * find /path/to/hub/backup-*.tar.gz -mtime +7 -delete
```

---

## 📊 Monitoring

### Health Check Endpoints

```bash
# Application health
curl https://ameenhub.sbc.om/api/health

# Scheduler service
curl https://ameenhub.sbc.om/api/scheduler/service

# Notification service
curl https://ameenhub.sbc.om/api/notifications/cron
```

### Log Files

```bash
# Application logs
docker logs ameen-hub
tail -f logs/app.log

# Nginx access logs
tail -f logs/nginx/ameen-access.log

# Nginx error logs
tail -f logs/nginx/ameen-error.log
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
df -h

# Service status
docker compose -f docker-compose.prod.yml ps
```

---

## 📚 Additional Information

### File Structure

```
hub/
├── .env.example              # Environment template
├── .env                      # Local config (git-ignored)
├── .env.production          # Production config (git-ignored)
├── docker-compose.yml       # Local Docker setup
├── docker-compose.prod.yml  # Production Docker setup
├── Dockerfile               # Application container
├── docker-start.sh          # Development manager
├── deploy-production.sh     # Production manager
│
├── nginx/
│   ├── nginx.conf          # Main Nginx config
│   └── conf.d/
│       └── app.conf        # Application config
│
├── certbot/                # SSL certificates
│   ├── conf/              # Certificate files
│   └── www/               # ACME challenge
│
├── data/                   # Application data
│   ├── lmdb/              # Database files
│   └── uploads/           # Uploaded files
│
└── logs/                   # Log files
    ├── nginx/             # Nginx logs
    └── app.log            # Application logs
```

### URLs and Endpoints

**Production:**
- Application: https://ameenhub.sbc.om
- Login: https://ameenhub.sbc.om/login
- Health: https://ameenhub.sbc.om/api/health

**Local:**
- Application: http://localhost:4000
- Login: http://localhost:4000/login
- Health: http://localhost:4000/api/health

### Default Credentials

```
Email: admin@ameen.om
Password: Admin@123
```

⚠️ **IMPORTANT:** Change password immediately after first login!

---

## ✅ Deployment Checklist

### Before Deployment

- [ ] Server prepared (Docker installed)
- [ ] DNS configured (A record)
- [ ] Domain points to server IP
- [ ] Firewall configured (ports 80, 443)
- [ ] Repository cloned
- [ ] Scripts are executable

### During Deployment

- [ ] Secrets generated
- [ ] SSL certificate obtained
- [ ] Docker images built
- [ ] Services started
- [ ] Database initialized
- [ ] Health check passing

### After Deployment

- [ ] Application accessible via domain
- [ ] HTTPS working (HTTP redirects)
- [ ] Default password changed
- [ ] Users created
- [ ] Permissions configured
- [ ] Backup created and tested
- [ ] Monitoring configured

---

## 🎯 Quick Reference

### Production Deployment (One Command)

```bash
# After DNS is configured
./deploy-production.sh secrets && \
./deploy-production.sh ssl && \
./deploy-production.sh build && \
./deploy-production.sh start && \
./deploy-production.sh init
```

### Local Development (One Command)

```bash
# Fresh start
cp .env.example .env && \
./docker-start.sh build && \
./docker-start.sh start && \
./docker-start.sh init
```

### Daily Operations

```bash
# View logs
./deploy-production.sh logs

# Restart
./deploy-production.sh restart

# Update
./deploy-production.sh update

# Backup
./deploy-production.sh backup
```

---

## 📞 Support

### Documentation

- This file: Complete Docker guide
- `.env.example`: Environment variable template
- `nginx/conf.d/app.conf`: Nginx configuration
- `ARCHITECTURE.txt`: System architecture diagram

### Getting Help

```bash
# Show all commands
./docker-start.sh help
./deploy-production.sh help

# Check status
./deploy-production.sh status

# View logs
./deploy-production.sh logs
```

---

## 🎉 Success!

Your Ameen Hub application is now:

✅ Running in Docker containers  
✅ Accessible via domain (ameenhub.sbc.om)  
✅ Secured with SSL/HTTPS  
✅ Auto-restarting on failure  
✅ Auto-renewing SSL certificates  
✅ Processing scheduled events (every minute)  
✅ Broadcasting real-time notifications  
✅ Health-checked every 30 seconds  
✅ Backed up and restorable  
✅ Production-ready!  

**Start using your application:** https://ameenhub.sbc.om 🚀
