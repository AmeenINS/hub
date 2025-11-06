# 🐳 Docker Deployment Guide - Ameen Hub

**Application:** Next.js + LMDB + Scheduler + Notifications  
**Version:** 0.1.0

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [Services & Architecture](#services--architecture)
4. [Management Commands](#management-commands)
5. [Troubleshooting](#troubleshooting)
6. [Backup & Restore](#backup--restore)

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

## 🔧 Environment Configuration

### File Structure

```
.env.example          # Template for environment variables
.env                  # Local development (git-ignored)
```

### Configuration

The `docker-compose.yml` reads environment variables dynamically:

```yaml
environment:
  - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:4000}
  - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:4000}
  - JWT_SECRET=${JWT_SECRET:-default-secret}
  - CRON_SECRET=${CRON_SECRET:-default-secret}
```

### Environment Variables (.env)

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

---

## 🏗️ Services & Architecture

### Docker Containers

| Container | Port | Purpose |
|-----------|------|---------|
| **ameen-hub** | 4000 | Next.js application |

### Application Components

```
┌─────────────────────────────────────────┐
│       Next.js Application (Port 4000)   │
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
│     Persistent Storage (Volumes)        │
│  • ./data/ → Database                   │
│  • ./data/uploads/ → Files              │
│  • ./logs/ → Application logs           │
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

**Every 30 Seconds:**
- Health Checks
  - Application health monitoring
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

### Common Tasks

**View Real-time Logs:**
```bash
# All services
./docker-start.sh logs

# Specific container
docker logs -f ameen-hub
```

**Check Service Status:**
```bash
./docker-start.sh status
docker ps
docker stats
```

**Restart Application:**
```bash
./docker-start.sh restart
```

**Update Application:**
```bash
# Pulls latest code, rebuilds, restarts
./docker-start.sh update
```

**Access Container Shell:**
```bash
./docker-start.sh shell
```

**Create Backup:**
```bash
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz data/ logs/ .env
```

---

## 🔍 Troubleshooting

### Issue: Services Not Starting

**Check logs:**
```bash
./docker-start.sh logs
docker ps -a
```

**Solution:**
```bash
# Restart Docker service
sudo systemctl restart docker

# Rebuild and restart
./docker-start.sh stop
./docker-start.sh build
./docker-start.sh start
```

---

### Issue: Port Already in Use

**Solution:**
```bash
# Check what's using port 4000
sudo lsof -i :4000

# Stop the process or change port in .env
PORT=4001
```

---

### Issue: Database Errors

**Solution:**
```bash
# Check database files
ls -la data/lmdb/

# Reinitialize database
./docker-start.sh init

# Restore from backup
./docker-start.sh stop
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz
./docker-start.sh start
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
# Manual backup
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  data/ \
  logs/ \
  .env
```

**Backup includes:**
- Database files (`data/lmdb/`)
- Uploaded files (`data/uploads/`)
- Application logs (`logs/`)
- Environment configuration (`.env`)

### Restore from Backup

```bash
# 1. Stop services
./docker-start.sh stop

# 2. Extract backup
tar -xzf backup-20251106-123456.tar.gz

# 3. Start services
./docker-start.sh start

# 4. Verify
./docker-start.sh status
curl http://localhost:4000/api/health
```

### Automated Backups

**Daily backup with cron:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/hub && tar -czf backup-$(date +\%Y\%m\%d-\%H\%M\%S).tar.gz data/ logs/ .env
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
curl http://localhost:4000/api/health

# Scheduler service
curl http://localhost:4000/api/scheduler/service

# Notification service
curl http://localhost:4000/api/notifications/cron
```

### Log Files

```bash
# Application logs
docker logs ameen-hub
tail -f logs/app.log
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
df -h

# Service status
docker compose ps
```

---

## 📚 Additional Information

### File Structure

```
hub/
├── .env.example              # Environment template
├── .env                      # Local config (git-ignored)
├── docker-compose.yml        # Docker setup
├── Dockerfile                # Application container
├── docker-start.sh           # Management script
│
├── data/                     # Application data
│   ├── lmdb/                # Database files
│   └── uploads/             # Uploaded files
│
└── logs/                     # Log files
    └── app.log              # Application logs
```

### URLs and Endpoints

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

## ✅ Quick Reference

### Fresh Start

```bash
# Fresh installation
cp .env.example .env && \
./docker-start.sh build && \
./docker-start.sh start && \
./docker-start.sh init
```

### Daily Operations

```bash
# View logs
./docker-start.sh logs

# Restart
./docker-start.sh restart

# Update
./docker-start.sh update

# Backup
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz data/ logs/ .env
```

---

## 🎉 Success!

Your Ameen Hub application is now:

✅ Running in Docker container  
✅ Accessible at http://localhost:4000  
✅ Processing scheduled events (every minute)  
✅ Broadcasting real-time notifications  
✅ Health-checked every 30 seconds  
✅ Backed up and restorable  
✅ Ready to use!  

**Start using your application:** http://localhost:4000 🚀
