#!/bin/bash
# Docker startup script for Windows Git Bash, macOS, and Linux
# Automatically detects local IP and starts backend services

set -e

echo "🐳 SPL Docker Startup Script"
echo ""

# Parse arguments
INCLUDE_WEB=false
INCLUDE_MOBILE=false
ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -All|--all)
            ALL=true
            shift
            ;;
        -IncludeWeb|--web)
            INCLUDE_WEB=true
            shift
            ;;
        -IncludeMobile|--mobile)
            INCLUDE_MOBILE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Detect local IP
HOST_IP=""

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash / MSYS)
    HOST_IP=$(ipconfig | grep "IPv4 Address" | head -1 | awk '{print $NF}')
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    HOST_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
else
    # Linux
    HOST_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$HOST_IP" ]; then
    echo "⚠ Could not auto-detect IP. Using 127.0.0.1"
    HOST_IP="127.0.0.1"
else
    echo "✓ Detected local IP: $HOST_IP"
fi

# Set environment variables
export HOST_IP
export DB_USER="${DB_USER:-postgres}"
export DB_PASSWORD="${DB_PASSWORD:-postgres}"
export DB_NAME="${DB_NAME:-spl_dev}"
export BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-dev-secret-change-in-production}"

echo ""
echo "Configuration:"
echo "  HOST_IP: $HOST_IP"
echo "  Database: PostgreSQL (localhost:5432)"
echo "  Redis: localhost:6379"
echo "  API: http://localhost:3001"
echo ""

# Determine which services to start
SERVICES="postgres redis api"

if [ "$ALL" = true ] || [ "$INCLUDE_WEB" = true ]; then
    SERVICES="$SERVICES web"
    echo "✓ Including web service"
fi

if [ "$ALL" = true ] || [ "$INCLUDE_MOBILE" = true ]; then
    SERVICES="$SERVICES mobile"
    echo "✓ Including mobile service"
fi

echo ""
echo "Starting services: $SERVICES"
echo ""

# Start Docker Compose
docker compose up -d $SERVICES

echo ""
echo "✓ Services started successfully!"
echo ""
echo "Next steps:"
echo "  1. Wait 10-15 seconds for services to initialize"
echo "  2. Check API health: curl http://localhost:3001/health"
echo "  3. View logs: docker compose logs -f api"
echo ""

if [ "$ALL" = false ] && [ "$INCLUDE_WEB" = false ] && [ "$INCLUDE_MOBILE" = false ]; then
    echo "To run frontend on host:"
    echo "  pnpm dev"
    echo ""
    echo "To include web/mobile in Docker:"
    echo "  ./scripts/docker-start-simple.sh -IncludeWeb"
    echo "  ./scripts/docker-start-simple.sh -IncludeMobile"
    echo "  ./scripts/docker-start-simple.sh -All"
fi
