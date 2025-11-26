#!/usr/bin/env bash
#
# HeroBlocks Build Script (OPTIMIERT)
# 
# Baut Administration und Storefront Assets für das HeroBlocks Plugin
# Gemäß Shopware 6 Best Practices
#
# ERKENNTNISSE aus Debugging 2025-11-26:
# - Vite erkennt Twig-Template-Änderungen nicht → Hash bleibt gleich
# - Browser cached Admin-Assets SEHR aggressiv
# - Cache MUSS vor UND nach Build geleert werden
# - assets:install --force MUSS nach jedem Build
#
# Usage:
#   ./build.sh              # Vollständiger Build (Admin + Storefront)
#   ./build.sh --admin-only # Nur Administration Assets
#   ./build.sh --storefront-only # Nur Storefront Assets
#   ./build.sh --force      # Force Rebuild (löscht Build-Artefakte)
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Docker Container Name (anpassen wenn nötig)
CONTAINER_NAME="horex-shopware"

# Build Flags
FORCE_REBUILD=false

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

# Function: Pre-Build Cache Clear (WICHTIG für Vite!)
pre_build_cache_clear() {
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$CYAN" "  Pre-Build: Cache leeren"
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    print_message "$YELLOW" "🧹 Lösche Cache-Verzeichnisse..."
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && rm -rf var/cache/*"
    
    print_message "$GREEN" "✅ Pre-Build Cache cleared"
}

# Function: Force Rebuild (löscht Build-Artefakte)
force_rebuild_clean() {
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$CYAN" "  Force Rebuild: Lösche Build-Artefakte"
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    print_message "$YELLOW" "🗑️  Lösche Admin Build-Artefakte..."
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html/public/bundles/heroblocks/administration && rm -rf assets/* .vite/* 2>/dev/null || true"
    
    print_message "$YELLOW" "🗑️  Lösche Storefront Build-Artefakte..."
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html/public/bundles/heroblocks/storefront && rm -rf assets/* 2>/dev/null || true"
    
    print_message "$GREEN" "✅ Build-Artefakte gelöscht"
}

# Function: Build Administration Assets
build_admin() {
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$CYAN" "  Administration Build"
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Step 1: Bundle Dump (WICHTIG!)
    print_message "$YELLOW" "Step 1/5: bundle:dump"
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && php bin/console bundle:dump"
    
    # Step 2: Feature Dump
    print_message "$YELLOW" "Step 2/5: feature:dump"
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && php bin/console feature:dump || true"
    
    # Step 3: Vite Build (NUR Extensions!)
    print_message "$YELLOW" "Step 3/5: Vite Build (Extensions Only)"
    print_message "$BLUE" "ℹ️  Using SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1"
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && export SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1 && ./bin/build-administration.sh"
    
    # Step 4: Assets Install (--force WICHTIG!)
    print_message "$YELLOW" "Step 4/5: assets:install --force"
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && php bin/console assets:install --force"
    
    # Step 5: Verify Manifest
    print_message "$YELLOW" "Step 5/5: Verify Vite Manifest"
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html/public/bundles/heroblocks/administration && cat .vite/manifest.json | grep -B1 -A3 'hero-category-slider/config' || echo 'No hero-category-slider found in manifest'"
    
    print_message "$GREEN" "✅ Administration Assets built successfully"
    
    # WICHTIG: Browser-Cache-Hinweis
    echo ""
    print_message "$MAGENTA" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$MAGENTA" "⚠️  WICHTIG: Browser-Cache MUSS geleert werden!"
    print_message "$MAGENTA" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$MAGENTA" "Admin-Assets wurden neu gebaut, aber Browser cached SEHR aggressiv!"
    print_message "$MAGENTA" ""
    print_message "$MAGENTA" "🔧 Methode 1 (Empfohlen):"
    print_message "$MAGENTA" "   1. F12 drücken (DevTools öffnen)"
    print_message "$MAGENTA" "   2. Rechtsklick auf Reload-Button (oben links)"
    print_message "$MAGENTA" "   3. 'Leeren und harter Reload' auswählen"
    print_message "$MAGENTA" ""
    print_message "$MAGENTA" "🔧 Methode 2 (Alternative):"
    print_message "$MAGENTA" "   1. F12 drücken"
    print_message "$MAGENTA" "   2. Tab 'Application' (oder 'Anwendung') öffnen"
    print_message "$MAGENTA" "   3. 'Clear storage' → 'Clear site data' klicken"
    print_message "$MAGENTA" "   4. Seite neu laden"
    print_message "$MAGENTA" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Function: Build Storefront Assets
build_storefront() {
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$CYAN" "  Storefront Build"
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Step 1: Bundle Dump
    print_message "$YELLOW" "Step 1/3: bundle:dump"
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && php bin/console bundle:dump"
    
    # Step 2: Theme Compile
    print_message "$YELLOW" "Step 2/3: theme:compile"
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && php bin/console theme:compile"
    
    # Step 3: Assets Install (--force)
    print_message "$YELLOW" "Step 3/3: assets:install --force"
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && php bin/console assets:install --force"
    
    print_message "$GREEN" "✅ Storefront Assets built successfully"
}

# Function: Post-Build Cache Clear
post_build_cache_clear() {
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$CYAN" "  Post-Build: Cache leeren"
    print_message "$CYAN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    print_message "$YELLOW" "🧹 cache:clear..."
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && php bin/console cache:clear"
    
    print_message "$YELLOW" "🧹 Lösche alte Cache-Verzeichnisse..."
    docker exec "$CONTAINER_NAME" bash -c "cd /var/www/html && rm -rf var/cache/prod_* var/cache/dev_* 2>/dev/null || true"
    
    print_message "$GREEN" "✅ Post-Build Cache cleared"
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
            --force)
                FORCE_REBUILD=true
                shift
                ;;
            --help)
                echo "HeroBlocks Build Script (OPTIMIERT)"
                echo ""
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --admin-only        Build nur Administration Assets"
                echo "  --storefront-only   Build nur Storefront Assets"
                echo "  --force             Force Rebuild (löscht Build-Artefakte vor Build)"
                echo "  --help              Zeigt diese Hilfe"
                echo ""
                echo "Default: Build Administration + Storefront Assets"
                echo ""
                echo "WICHTIG nach Admin-Build:"
                echo "  - Browser-Cache IMMER leeren (F12 → Rechtsklick Reload → 'Leeren und harter Reload')"
                echo "  - Bei Twig-Template-Änderungen --force verwenden"
                exit 0
                ;;
        esac
    done
    
    # Pre-Build Cache Clear (WICHTIG!)
    pre_build_cache_clear
    
    # Force Rebuild (optional)
    if [ "$FORCE_REBUILD" = true ]; then
        force_rebuild_clean
    fi
    
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
    
    # Post-Build Cache Clear
    post_build_cache_clear
    
    print_message "$GREEN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$GREEN" "  ✅ Build abgeschlossen!"
    print_message "$GREEN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ "$ADMIN_ONLY" = true ] || [ "$ADMIN_ONLY" = false ] && [ "$STOREFRONT_ONLY" = false ]; then
        print_message "$YELLOW" ""
        print_message "$YELLOW" "Nächster Schritt:"
        print_message "$YELLOW" "  → Browser-Cache leeren (siehe Hinweis oben)"
        print_message "$YELLOW" "  → Admin neu laden mit Strg+Shift+R"
        print_message "$YELLOW" ""
    fi
}

# Run Main
main "$@"

