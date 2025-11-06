# 🚀 Deployment Summary - Ameen Hub

**Domain:** `ameenhub.sbc.om`  
**System:** Nginx Proxy + Let's Encrypt SSL

---

## 📋 Two Deployment Options

### 🏠 Option 1: Local Development

**Script:** `./docker-start.sh`  
**URL:** http://localhost:4000  
**SSL:** No  
**Nginx Proxy:** No  

```bash
./docker-start.sh build
./docker-start.sh start
./docker-start.sh init
```

---

### 🌐 Option 2: Production with Domain

**Script:** `./deploy-server.sh`  
**URL:** https://ameenhub.sbc.om  
**SSL:** ✅ Automatic (Let's Encrypt)  
**Nginx Proxy:** ✅ Yes  

```bash
./deploy-server.sh deploy
```

---

## 🚀 Quick Start - Production Deployment

### Step 1: Prerequisites

1. **Install Docker on your server:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install docker-compose-plugin -y
   ```

2. **Configure DNS:**
   ```
   Type: A
   Host: ameenhub.sbc.om
   Value: YOUR_SERVER_IP
   ```

3. **Open firewall ports:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

### Step 2: Security Configuration

1. **Generate secrets:**
   ```bash
   # JWT Secret
   openssl rand -base64 32
   
   # CRON Secret
   openssl rand -base64 32
   ```

2. **Edit `docker-compose.yml`:**
   Replace these values with generated secrets:
   ```yaml
   JWT_SECRET: <your-generated-jwt-secret>
   CRON_SECRET: <your-generated-cron-secret>
   ```

### Step 3: Deploy

```bash
# Clone project
git clone https://github.com/AmeenINS/hub.git
cd hub

# Make scripts executable
chmod +x deploy-server.sh docker-start.sh

# Deploy everything
./deploy-server.sh deploy
```

This will:
- ✅ Start Nginx Proxy
- ✅ Build Docker image
- ✅ Start application
- ✅ Generate SSL certificate (automatic)
- ✅ Initialize database

### Step 4: Access

Wait 1-2 minutes for SSL certificate generation, then:

**URL:** https://ameenhub.sbc.om

**Default login:**
- Email: `admin@ameen.om`
- Password: `Admin@123`

⚠️ **Change password immediately after first login!**

---

## 🎮 Management Commands

### Production Server

```bash
./deploy-server.sh deploy     # Full deployment
./deploy-server.sh start      # Start application
./deploy-server.sh stop       # Stop application
./deploy-server.sh restart    # Restart application
./deploy-server.sh logs       # View logs
./deploy-server.sh status     # Check status
./deploy-server.sh init       # Initialize database
./deploy-server.sh help       # Show help
```

### Local Development

```bash
./docker-start.sh build       # Build image
./docker-start.sh start       # Start containers
./docker-start.sh stop        # Stop containers
./docker-start.sh restart     # Restart containers
./docker-start.sh logs        # View logs
./docker-start.sh status      # Check status
./docker-start.sh init        # Initialize database
./docker-start.sh help        # Show help
```

---

## 📁 File Structure

```
hub/
├── docker-compose.yml          # Application config (with Nginx Proxy)
├── Dockerfile                  # Application container
│
├── docker-start.sh            # Local development script
├── deploy-server.sh           # Production deployment script
│
├── SERVER_DEPLOYMENT.md       # Complete deployment guide
├── DOCKER_COMPLETE_GUIDE.md   # Docker guide
│
├── SERVER/
│   └── docker-compose.yml     # Nginx Proxy + SSL
│
├── data/                      # Database & uploads
└── logs/                      # Application logs
```

---

## 🏗️ Architecture

```
Internet (Port 80/443)
       ↓
Nginx Proxy Container
• Automatic SSL (Let's Encrypt)
• HTTP → HTTPS Redirect
• Domain Routing
       ↓ proxy network
Ameen Hub Container
• Port: 4000
• Domain: ameenhub.sbc.om
```

---

## 🔍 Troubleshooting

### SSL Certificate Not Generated

**Check DNS:**
```bash
nslookup ameenhub.sbc.om
```

**Check ports:**
```bash
sudo ufw status
# Ports 80 and 443 must be open
```

**Check logs:**
```bash
docker logs letsencrypt
```

**Wait:** SSL generation takes 1-2 minutes

---

### Cannot Access Website

**Check services:**
```bash
./deploy-server.sh status
```

**Check logs:**
```bash
./deploy-server.sh logs
```

**Restart:**
```bash
./deploy-server.sh restart
```

---

## 📚 Documentation

- **SERVER_DEPLOYMENT.md** - Complete deployment guide
- **DOCKER_COMPLETE_GUIDE.md** - Docker guide for local development

---

## ✨ Features

✅ One-command deployment  
✅ Automatic SSL (Let's Encrypt)  
✅ Auto certificate renewal  
✅ HTTP → HTTPS redirect  
✅ Nginx Proxy for domain management  
✅ Automatic health checks  
✅ Auto-restart on failure  
✅ Complete English documentation  

---

## 🎉 Success!

After deployment, your application will be:

✅ Running at https://ameenhub.sbc.om  
✅ SSL enabled automatically  
✅ HTTP redirects to HTTPS  
✅ Certificate auto-renews  
✅ Health monitored every 30 seconds  
✅ Production-ready!  

**Start using:** https://ameenhub.sbc.om 🚀
