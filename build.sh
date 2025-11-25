#!/usr/bin/env bash
#
# HeroBlocks Build Script
# 
# Baut Administration und Storefront Assets für das HeroBlocks Plugin
# Gemäß Shopware 6 Best Practices
#
# Usage:
#   ./build.sh              # Vollständiger Build (Admin + Storefront)
#   ./build.sh --admin-only # Nur Administration Assets
#   ./build.sh --storefront-only # Nur Storefront Assets
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Docker Container Name (anpassen wenn nötig)
CONTAINER_NAME="horex-shopware"

# Function: Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function: Check if Docker container is running
check_docker() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_message "$RED" "❌ Docker container '${CONTAINER_NAME}' is not running!"
        print_message "$YELLOW" "Please start the container and try again."
        exit 1
    fi
    print_message "$GREEN" "✅ Docker container '${CONTAINER_NAME}' is running"
}

# Function: Build Administration Assets
build_admin() {
    print_message "$BLUE" "🔨 Building Administration Assets..."
    
    # Step 1: Bundle Dump
    print_message "$YELLOW" "Step 1: bundle:dump"
    docker exec "$CONTAINER_NAME" php bin/console bundle:dump
    
    # Step 2: Build with Vite
    print_message "$YELLOW" "Step 2: npm run build (Vite)"
    docker exec \
        -e PROJECT_ROOT=/var/www/html \
        -e ADMIN_ROOT=/var/www/html/vendor/shopware/administration \
        -e SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1 \
        -e VITE_MODE=production \
        -w /var/www/html/vendor/shopware/administration/Resources/app/administration \
        "$CONTAINER_NAME" npm run build
    
    # Step 3: Assets Install
    print_message "$YELLOW" "Step 3: assets:install"
    docker exec "$CONTAINER_NAME" php bin/console assets:install
    
    print_message "$GREEN" "✅ Administration Assets built successfully"
}

# Function: Build Storefront Assets
build_storefront() {
    print_message "$BLUE" "🔨 Building Storefront Assets..."
    
    # Step 1: Storefront Build
    print_message "$YELLOW" "Step 1: theme:compile"
    docker exec "$CONTAINER_NAME" php bin/console theme:compile
    
    # Alternative: Wenn kein Theme aktiv, nur Assets installieren
    # docker exec "$CONTAINER_NAME" php bin/console assets:install
    
    print_message "$GREEN" "✅ Storefront Assets built successfully"
}

# Function: Clear Cache
clear_cache() {
    print_message "$BLUE" "🧹 Clearing Cache..."
    docker exec "$CONTAINER_NAME" php bin/console cache:clear
    print_message "$GREEN" "✅ Cache cleared"
}

# Main Script
main() {
    print_message "$BLUE" "========================================="
    print_message "$BLUE" "  HeroBlocks Build Script"
    print_message "$BLUE" "========================================="
    
    # Check Docker
    check_docker
    
    # Parse Arguments
    ADMIN_ONLY=false
    STOREFRONT_ONLY=false
    
    for arg in "$@"; do
        case $arg in
            --admin-only)
                ADMIN_ONLY=true
                shift
                ;;
            --storefront-only)
                STOREFRONT_ONLY=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --admin-only        Build only Administration assets"
                echo "  --storefront-only   Build only Storefront assets"
                echo "  --help              Show this help message"
                echo ""
                echo "Default: Build both Administration and Storefront assets"
                exit 0
                ;;
        esac
    done
    
    # Execute Build
    if [ "$ADMIN_ONLY" = true ]; then
        build_admin
    elif [ "$STOREFRONT_ONLY" = true ]; then
        build_storefront
    else
        # Full Build
        build_admin
        build_storefront
    fi
    
    # Clear Cache
    clear_cache
    
    print_message "$GREEN" "========================================="
    print_message "$GREEN" "  ✅ Build completed successfully!"
    print_message "$GREEN" "========================================="
}

# Run Main
main "$@"

