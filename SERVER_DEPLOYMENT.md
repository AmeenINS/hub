# 🚀 Server Deployment Guide - Ameen Hub

**Domain:** `ameenhub.sbc.om`  
**Setup:** Nginx Proxy + Let's Encrypt SSL

---

## 📋 Prerequisites

### 1️⃣ Server Requirements
- Ubuntu 20.04/22.04 or similar
- 2GB RAM minimum (4GB recommended)
- 20GB storage
- Docker & Docker Compose installed

### 2️⃣ DNS Configuration
Configure your DNS to point to your server:

```
Type: A
Host: ameenhub.sbc.om
Value: YOUR_SERVER_IP
TTL: 300
```

**Verify DNS:**
```bash
nslookup ameenhub.sbc.om
ping ameenhub.sbc.om
```

### 3️⃣ Firewall Configuration
```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status
```

---

## 🎯 Quick Deployment

### One-Command Deployment

```bash
chmod +x deploy-server.sh
./deploy-server.sh deploy
```

This will:
1. ✅ Start Nginx Proxy (if not running)
2. ✅ Build Docker image
3. ✅ Start application
4. ✅ Generate SSL certificate (automatic via Let's Encrypt)
5. ✅ Initialize database

---

## 📝 Step-by-Step Deployment

### Step 1: Start Nginx Proxy

```bash
cd SERVER
docker-compose up -d
cd ..
```

Verify:
```bash
docker ps | grep proxy
```

### Step 2: Build Application

```bash
./deploy-server.sh build
```

### Step 3: Start Application

```bash
./deploy-server.sh start
```

### Step 4: Initialize Database

```bash
./deploy-server.sh init
```

### Step 5: Verify Deployment

```bash
./deploy-server.sh status
```

---

## 🔧 Configuration

### Domain Settings (docker-compose.yml)

```yaml
environment:
  VIRTUAL_HOST: ameenhub.sbc.om          # Your domain
  VIRTUAL_PORT: 4000                     # Application port
  LETSENCRYPT_HOST: ameenhub.sbc.om     # Domain for SSL
  LETSENCRYPT_EMAIL: admin@sbc.om       # Email for SSL notifications
  
  NEXT_PUBLIC_APP_URL: https://ameenhub.sbc.om
  NEXT_PUBLIC_API_URL: https://ameenhub.sbc.om
```

### Security Settings (⚠️ MUST CHANGE)

Edit `docker-compose.yml`:

```yaml
JWT_SECRET: your-super-secret-jwt-key-change-this-in-production
CRON_SECRET: your-cron-secret-change-this
```

Generate secure secrets:
```bash
# JWT Secret
openssl rand -base64 32

# CRON Secret
openssl rand -base64 32
```

---

## 🎮 Management Commands

### Basic Operations

```bash
# Start application
./deploy-server.sh start

# Stop application
./deploy-server.sh stop

# Restart application
./deploy-server.sh restart

# View logs (real-time)
./deploy-server.sh logs

# Check status
./deploy-server.sh status
```

### Advanced Operations

```bash
# Rebuild image
./deploy-server.sh build

# Initialize database
./deploy-server.sh init

# Start only Nginx Proxy
./deploy-server.sh proxy
```

---

## 🌐 How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│         Internet (Port 80/443)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Nginx Proxy (Container)         │
│  • Automatic SSL (Let's Encrypt)        │
│  • HTTP → HTTPS Redirect                │
│  • Domain Routing                       │
│  • Certificate Auto-Renewal             │
└──────────────┬──────────────────────────┘
               │ proxy network
               ▼
┌─────────────────────────────────────────┐
│       Ameen Hub (Container)             │
│  Port: 4000                             │
│  Domain: ameenhub.sbc.om                │
└─────────────────────────────────────────┘
```

### Nginx Proxy Features

The `nginxproxy/nginx-proxy` container automatically:
- ✅ Detects containers with `VIRTUAL_HOST` environment variable
- ✅ Configures Nginx to route traffic to them
- ✅ Generates SSL certificates via Let's Encrypt
- ✅ Renews certificates automatically
- ✅ Redirects HTTP to HTTPS

### How SSL Works

1. Container starts with `LETSENCRYPT_HOST` and `LETSENCRYPT_EMAIL`
2. `acme-companion` detects the container
3. Requests SSL certificate from Let's Encrypt
4. Installs certificate in Nginx
5. Auto-renews before expiration

---

## 🔍 Troubleshooting

### Issue: SSL Certificate Not Generated

**Symptoms:**
- Can't access via HTTPS
- Browser shows "Not Secure"

**Solutions:**

1. **Check DNS is configured:**
   ```bash
   nslookup ameenhub.sbc.om
   # Should return your server IP
   ```

2. **Verify ports are open:**
   ```bash
   sudo ufw status
   # Ports 80 and 443 must be ALLOW
   ```

3. **Check Let's Encrypt logs:**
   ```bash
   docker logs letsencrypt
   ```

4. **Wait 1-2 minutes:**
   SSL generation takes time. Be patient!

---

### Issue: Domain Not Accessible

**Solutions:**

1. **Check all containers are running:**
   ```bash
   ./deploy-server.sh status
   ```

2. **Check Nginx Proxy logs:**
   ```bash
   docker logs proxy
   ```

3. **Check application logs:**
   ```bash
   ./deploy-server.sh logs
   ```

4. **Verify proxy network:**
   ```bash
   docker network inspect proxy
   # Should show both proxy and ameen-hub containers
   ```

---

### Issue: Application Not Working

**Solutions:**

1. **Check application health:**
   ```bash
   docker exec ameen-hub curl http://localhost:4000/api/health
   ```

2. **Reinitialize database:**
   ```bash
   ./deploy-server.sh init
   ```

3. **Restart everything:**
   ```bash
   ./deploy-server.sh stop
   cd SERVER && docker-compose restart && cd ..
   ./deploy-server.sh start
   ```

---

## 📊 Monitoring

### Check Container Status

```bash
# All containers
docker ps

# Proxy status
docker ps --filter name=proxy

# Ameen Hub status
docker ps --filter name=ameen-hub
```

### View Logs

```bash
# Nginx Proxy
docker logs -f proxy

# Let's Encrypt (SSL)
docker logs -f letsencrypt

# Ameen Hub
docker logs -f ameen-hub
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
df -h

# Docker disk usage
docker system df
```

---

## 🔐 Security Checklist

Before going live:

- [ ] DNS configured correctly
- [ ] Firewall configured (only 22, 80, 443)
- [ ] SSL certificate generated and working
- [ ] Changed `JWT_SECRET` to strong random value
- [ ] Changed `CRON_SECRET` to strong random value
- [ ] Changed default admin password
- [ ] Tested login and basic functionality
- [ ] Backup system configured

---

## 💾 Backup

### Create Backup

```bash
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  data/ \
  logs/
```

### Restore Backup

```bash
# Stop application
./deploy-server.sh stop

# Extract backup
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz

# Start application
./deploy-server.sh start
```

### Automated Backups

Add to crontab:
```bash
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/hub && tar -czf backup-$(date +\%Y\%m\%d-\%H\%M\%S).tar.gz data/ logs/

# Clean old backups (keep last 7 days)
0 3 * * * find /path/to/hub/backup-*.tar.gz -mtime +7 -delete
```

---

## 🎉 Success!

After successful deployment:

✅ Nginx Proxy running on ports 80/443  
✅ SSL certificate auto-generated  
✅ Ameen Hub accessible via https://ameenhub.sbc.om  
✅ Automatic HTTPS redirect  
✅ Certificate auto-renewal configured  

**Access your application:** https://ameenhub.sbc.om

**Default credentials:**
- Email: `admin@ameen.om`
- Password: `Admin@123`

⚠️ **IMPORTANT:** Change the default password immediately!

---

## 📞 Support

### Useful Commands

```bash
# Show help
./deploy-server.sh help

# Check all services
./deploy-server.sh status

# View real-time logs
./deploy-server.sh logs

# Restart everything
./deploy-server.sh restart
```

### Common Files

- `docker-compose.yml` - Main application configuration
- `SERVER/docker-compose.yml` - Nginx Proxy configuration
- `deploy-server.sh` - Deployment script
- `data/` - Database and uploads
- `logs/` - Application logs

---

## 📚 References

- [Nginx Proxy Documentation](https://github.com/nginx-proxy/nginx-proxy)
- [ACME Companion Documentation](https://github.com/nginx-proxy/acme-companion)
- [Let's Encrypt](https://letsencrypt.org/)
