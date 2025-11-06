#!/bin/bash

# Production Deployment Script for Ameen Hub
# This script helps you deploy and manage the application with domain support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Check if running with docker-compose or docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Functions
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v $DOCKER_COMPOSE &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_success "All requirements met"
}

setup_domain() {
    print_info "Domain Configuration Setup"
    echo ""
    
    read -p "Enter your domain name (e.g., ameen.example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_error "Domain name is required"
        exit 1
    fi
    
    print_info "Configuring domain: $DOMAIN"
    
    # Update .env.production
    if [ -f "$ENV_FILE" ]; then
        sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|g" "$ENV_FILE"
        sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$DOMAIN|g" "$ENV_FILE"
        print_success "Updated $ENV_FILE with domain"
    fi
    
    # Update nginx configuration
    sed -i "s|your-domain.com|$DOMAIN|g" nginx/conf.d/app.conf
    print_success "Updated Nginx configuration"
    
    echo ""
    print_warning "Important: Make sure your DNS is configured to point to this server's IP address"
    print_info "DNS Configuration:"
    echo "  A Record: $DOMAIN -> $(curl -s ifconfig.me)"
    echo ""
}

setup_ssl() {
    print_info "SSL Certificate Setup with Let's Encrypt"
    echo ""
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error "$ENV_FILE not found. Run setup first."
        exit 1
    fi
    
    # Extract domain from env file
    DOMAIN=$(grep NEXT_PUBLIC_APP_URL "$ENV_FILE" | cut -d'=' -f2 | sed 's|https://||' | sed 's|http://||')
    
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" == "your-domain.com" ]; then
        print_error "Please configure your domain first by running: $0 setup"
        exit 1
    fi
    
    read -p "Enter email for SSL certificate notifications: " EMAIL
    
    if [ -z "$EMAIL" ]; then
        print_error "Email is required"
        exit 1
    fi
    
    print_info "Obtaining SSL certificate for $DOMAIN..."
    
    # Create directories
    mkdir -p certbot/conf certbot/www
    
    # Start nginx temporarily for certificate validation
    $DOCKER_COMPOSE -f $COMPOSE_FILE up -d nginx
    
    # Obtain certificate
    $DOCKER_COMPOSE -f $COMPOSE_FILE run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN
    
    # Restart nginx with SSL
    $DOCKER_COMPOSE -f $COMPOSE_FILE restart nginx
    
    print_success "SSL certificate obtained successfully"
    echo ""
    print_info "Certificate will auto-renew every 12 hours"
}

create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p data/uploads/images
    mkdir -p data/uploads/documents
    mkdir -p data/uploads/videos
    mkdir -p data/uploads/others
    mkdir -p data/lmdb
    mkdir -p logs
    mkdir -p logs/nginx
    mkdir -p certbot/conf
    mkdir -p certbot/www
    print_success "Directories created"
}

generate_secrets() {
    print_info "Generating secure secrets..."
    
    JWT_SECRET=$(openssl rand -base64 32)
    CRON_SECRET=$(openssl rand -base64 24)
    
    if [ -f "$ENV_FILE" ]; then
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"$JWT_SECRET\"|g" "$ENV_FILE"
        sed -i "s|CRON_SECRET=.*|CRON_SECRET=\"$CRON_SECRET\"|g" "$ENV_FILE"
        print_success "Secrets generated and saved to $ENV_FILE"
        print_warning "Keep these secrets safe and never commit them to version control!"
    else
        print_error "$ENV_FILE not found"
        exit 1
    fi
}

build() {
    print_info "Building Docker images..."
    create_directories
    $DOCKER_COMPOSE -f $COMPOSE_FILE build --no-cache
    print_success "Docker images built successfully"
}

start() {
    print_info "Starting production services..."
    create_directories
    $DOCKER_COMPOSE -f $COMPOSE_FILE up -d
    print_success "Services started successfully"
    
    # Get domain from env
    DOMAIN=$(grep NEXT_PUBLIC_APP_URL "$ENV_FILE" | cut -d'=' -f2 | sed 's|https://||' | sed 's|http://||')
    
    if [ "$DOMAIN" != "your-domain.com" ]; then
        print_info "Application is running at: https://$DOMAIN"
    else
        print_warning "Domain not configured. Configure it with: $0 setup"
        print_info "Application is running at: http://localhost"
    fi
}

stop() {
    print_info "Stopping services..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE down
    print_success "Services stopped successfully"
}

restart() {
    print_info "Restarting services..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE restart
    print_success "Services restarted successfully"
}

logs() {
    print_info "Showing logs (Press Ctrl+C to exit)..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f
}

status() {
    print_info "Service status:"
    $DOCKER_COMPOSE -f $COMPOSE_FILE ps
}

update() {
    print_info "Updating application..."
    
    # Pull latest code if using git
    if [ -d ".git" ]; then
        print_info "Pulling latest code..."
        git pull
    fi
    
    # Rebuild and restart
    print_info "Rebuilding images..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE build --no-cache
    
    print_info "Restarting services..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE down
    $DOCKER_COMPOSE -f $COMPOSE_FILE up -d
    
    print_success "Application updated successfully"
}

init_db() {
    print_info "Initializing database..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE exec app npm run db:init
    print_success "Database initialized"
}

shell() {
    print_info "Accessing container shell..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE exec app sh
}

cleanup() {
    print_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Cleaning up..."
        $DOCKER_COMPOSE -f $COMPOSE_FILE down -v --rmi all
        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

renew_ssl() {
    print_info "Renewing SSL certificate..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE exec certbot certbot renew
    $DOCKER_COMPOSE -f $COMPOSE_FILE restart nginx
    print_success "SSL certificate renewed"
}

backup() {
    print_info "Creating backup..."
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_FILE" data/ logs/ .env.production
    print_success "Backup created: $BACKUP_FILE"
}

show_help() {
    echo ""
    echo "Ameen Hub - Production Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Setup Commands:"
    echo "  setup          - Configure domain name"
    echo "  ssl            - Setup SSL certificate with Let's Encrypt"
    echo "  secrets        - Generate secure JWT and CRON secrets"
    echo ""
    echo "Deployment Commands:"
    echo "  build          - Build Docker images"
    echo "  start          - Start all services"
    echo "  stop           - Stop all services"
    echo "  restart        - Restart all services"
    echo "  update         - Update application (pull, rebuild, restart)"
    echo ""
    echo "Management Commands:"
    echo "  logs           - View service logs"
    echo "  status         - Show service status"
    echo "  init           - Initialize database"
    echo "  shell          - Access application shell"
    echo "  backup         - Create backup of data and logs"
    echo ""
    echo "Maintenance Commands:"
    echo "  renew-ssl      - Manually renew SSL certificate"
    echo "  cleanup        - Remove all containers and images"
    echo ""
    echo "Examples:"
    echo "  $0 setup       # Configure domain"
    echo "  $0 ssl         # Setup SSL"
    echo "  $0 secrets     # Generate secrets"
    echo "  $0 build       # Build images"
    echo "  $0 start       # Start application"
    echo "  $0 logs        # View logs"
    echo ""
}

# Main script
main() {
    check_requirements
    
    case "${1:-}" in
        setup)
            setup_domain
            ;;
        ssl)
            setup_ssl
            ;;
        secrets)
            generate_secrets
            ;;
        build)
            build
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs
            ;;
        status)
            status
            ;;
        update)
            update
            ;;
        init)
            init_db
            ;;
        shell)
            shell
            ;;
        cleanup)
            cleanup
            ;;
        renew-ssl)
            renew_ssl
            ;;
        backup)
            backup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Invalid command: ${1:-}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
