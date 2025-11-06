#!/bin/bash

# Docker Start Script for Ameen Hub
# This script helps you manage the Docker container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Check if running with docker-compose or docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Check for .env file
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success ".env file created. Please update it with your values."
        else
            print_warning "No .env.example found. Using default values."
        fi
    fi
}

# Functions
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p data/uploads/images
    mkdir -p data/uploads/documents
    mkdir -p data/uploads/videos
    mkdir -p data/uploads/others
    mkdir -p logs
    print_success "Directories created"
}

# Build Docker image
build() {
    check_env_file
    print_info "Building Docker image..."
    docker-compose build --no-cache
    print_success "Docker image built successfully"
}

# Start containers
start() {
    check_env_file
    print_info "Starting containers..."
    docker-compose up -d
    print_success "Containers started successfully"
    
    # Show URL based on .env file
    if [ -f ".env" ] && grep -q "NEXT_PUBLIC_APP_URL" .env; then
        APP_URL=$(grep "NEXT_PUBLIC_APP_URL" .env | cut -d'=' -f2)
        print_info "Application is running at: $APP_URL"
    else
        print_info "Application is running at: http://localhost:4000"
    fi
}

# Stop containers
stop() {
    print_info "Stopping containers..."
    docker-compose down
    print_success "Containers stopped successfully"
}

# Restart containers
restart() {
    print_info "Restarting containers..."
    docker-compose restart
    print_success "Containers restarted successfully"
}

# View logs
logs() {
    print_info "Showing logs (Press Ctrl+C to exit)..."
    docker-compose logs -f
}

# Update application
update() {
    print_info "Updating application..."
    
    # Pull latest code (if using git)
    if [ -d ".git" ]; then
        print_info "Pulling latest code from git..."
        git pull
    fi
    
    # Rebuild and restart
    print_info "Rebuilding Docker image..."
    docker-compose build --no-cache
    
    print_info "Restarting containers..."
    docker-compose down
    docker-compose up -d
    
    print_success "Application updated successfully"
}

# Show status
status() {
    print_info "Container status:"
    docker-compose ps
}

# Clean up
cleanup() {
    print_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Cleaning up..."
        docker-compose down -v --rmi all
        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Initialize database
init() {
    print_info "Initializing database..."
    docker-compose exec app npm run db:init
    print_success "Database initialized"
}

# Access shell
shell() {
    print_info "Accessing container shell..."
    docker-compose exec app sh
}

# Show help
show_help() {
    echo ""
    echo "Ameen Hub - Docker Management Script"
    echo ""
    echo "Usage: ./docker-start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build      - Build Docker image"
    echo "  start      - Start containers"
    echo "  stop       - Stop containers"
    echo "  restart    - Restart containers"
    echo "  logs       - View container logs"
    echo "  update     - Update application (pull code, rebuild, restart)"
    echo "  status     - Show container status"
    echo "  init       - Initialize database with default data"
    echo "  shell      - Access container shell"
    echo "  cleanup    - Remove all containers and images"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-start.sh build      # Build the image"
    echo "  ./docker-start.sh start      # Start the application"
    echo "  ./docker-start.sh logs       # View logs"
    echo "  ./docker-start.sh update     # Update the application"
    echo ""
}

# Main script
main() {
    check_docker
    
    case "${1:-}" in
        build)
            create_directories
            build
            ;;
        start)
            create_directories
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
        update)
            update
            ;;
        status)
            status
            ;;
        init)
            init
            ;;
        shell)
            shell
            ;;
        cleanup)
            cleanup
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
