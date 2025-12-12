#!/bin/bash

# =============================================================================
# Matt Interfaces CLI Tool for Hero Blocks
# =============================================================================
#
# Development & Build Tool for Shopware 6.7+ CMS Block Plugin
#
# Usage:
#   ./mi-cli.sh <command> [options]
#
# Commands:
#   build [admin|storefront]  - Build assets
#   cache                      - Clear cache
#   create-block               - Create new CMS block (interactive)
#   release                    - Create release ZIP
#   test                       - Run tests
#   help                       - Show this help
#
# Author: Matt Interfaces (https://matt-interfaces.ch)
# License: Proprietary
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Plugin directory
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_NAME="horex-shopware"
SHOPWARE_PATH="/var/www/html"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "\n${MAGENTA}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}${BOLD}  🚀 Matt Interfaces CLI - Hero Blocks${NC}"
    echo -e "${MAGENTA}${BOLD}════════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${BLUE}▶  $1${NC}"
}

# Check if Docker container is running
check_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_error "Docker container '${CONTAINER_NAME}' is not running!"
        echo -e "   Start it with: ${CYAN}cd dockware && docker-compose up -d${NC}"
        exit 1
    fi
}

# Execute command in Docker container
docker_exec() {
    docker exec ${CONTAINER_NAME} "$@"
}

# =============================================================================
# Build Command
# =============================================================================

cmd_build() {
    local target="${1:-all}"
    
    print_header
    check_container
    
    case "$target" in
        admin)
            print_step "Building Admin Assets..."
            build_admin
            ;;
        storefront)
            print_step "Building Storefront Assets..."
            build_storefront
            ;;
        all|*)
            print_step "Building All Assets (Admin + Storefront)..."
            build_admin
            build_storefront
            ;;
    esac
    
    print_success "Build completed!"
}

build_admin() {
    print_info "Step 1/4: Dumping bundle configuration..."
    docker_exec php bin/console bundle:dump
    
    print_info "Step 2/4: Building admin assets with Vite..."
    docker exec -e PROJECT_ROOT=${SHOPWARE_PATH} \
                -e ADMIN_ROOT=${SHOPWARE_PATH}/vendor/shopware/administration \
                -e SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1 \
                -e VITE_MODE=production \
                -w ${SHOPWARE_PATH}/vendor/shopware/administration/Resources/app/administration \
                ${CONTAINER_NAME} npm run build
    
    print_info "Step 3/4: Installing assets..."
    docker_exec php bin/console assets:install
    
    print_info "Step 4/4: Clearing cache..."
    docker_exec php bin/console cache:clear
    
    print_success "Admin build completed!"
    print_warning "Don't forget to Hard Refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)"
}

build_storefront() {
    print_info "Step 1/3: Clearing cache..."
    docker_exec php bin/console cache:clear
    
    print_info "Step 2/3: Compiling theme..."
    docker_exec php bin/console theme:compile
    
    print_info "Step 3/3: Final cache clear..."
    docker_exec php bin/console cache:clear
    
    print_success "Storefront build completed!"
}

# =============================================================================
# Cache Command
# =============================================================================

cmd_cache() {
    print_header
    check_container
    
    print_step "Clearing all caches..."
    docker_exec php bin/console cache:clear
    
    print_success "Cache cleared!"
}

# =============================================================================
# Create Block Command (Interactive)
# =============================================================================

cmd_create_block() {
    print_header
    
    echo -e "${BOLD}Create New CMS Block${NC}\n"
    
    # Select category
    echo -e "Select block category:"
    echo -e "  ${CYAN}1${NC}) text       - Text-only blocks"
    echo -e "  ${CYAN}2${NC}) image      - Image blocks"
    echo -e "  ${CYAN}3${NC}) text-image - Text & image blocks"
    echo -e "  ${CYAN}4${NC}) commerce   - Product/commerce blocks"
    echo -e "  ${CYAN}5${NC}) video      - Video blocks"
    echo -e "  ${CYAN}6${NC}) form       - Form blocks"
    echo -e "  ${CYAN}7${NC}) sidebar    - Sidebar blocks"
    echo -e "  ${CYAN}8${NC}) html       - Custom HTML blocks"
    echo ""
    
    read -p "Enter category number (1-8): " category_num
    
    case "$category_num" in
        1) category="text" ;;
        2) category="image" ;;
        3) category="text-image" ;;
        4) category="commerce" ;;
        5) category="video" ;;
        6) category="form" ;;
        7) category="sidebar" ;;
        8) category="html" ;;
        *)
            print_error "Invalid category!"
            exit 1
            ;;
    esac
    
    # Get block name
    echo ""
    read -p "Enter block name (e.g., hero-testimonial): " block_name
    
    if [[ ! "$block_name" =~ ^hero-[a-z-]+$ ]]; then
        print_warning "Block name should start with 'hero-' followed by lowercase letters and hyphens."
        read -p "Use '$block_name' anyway? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Convert to various naming conventions
    block_name_camel=$(echo "$block_name" | sed -r 's/(^|-)([a-z])/\U\2/g' | sed 's/^./\L&/')
    block_name_pascal=$(echo "$block_name" | sed -r 's/(^|-)([a-z])/\U\2/g')
    block_name_underscore=$(echo "$block_name" | tr '-' '_')
    
    print_info "Creating block: $block_name"
    print_info "Category: $category"
    print_info "CamelCase: $block_name_camel"
    print_info "PascalCase: $block_name_pascal"
    
    # Create directories
    ADMIN_BLOCK_DIR="${PLUGIN_DIR}/src/Resources/app/administration/src/module/sw-cms/blocks/${category}/${block_name}"
    STOREFRONT_DIR="${PLUGIN_DIR}/src/Resources/views/storefront/block"
    
    print_step "Creating directory structure..."
    
    mkdir -p "${ADMIN_BLOCK_DIR}/component"
    mkdir -p "${ADMIN_BLOCK_DIR}/preview"
    mkdir -p "${ADMIN_BLOCK_DIR}/config"
    mkdir -p "${STOREFRONT_DIR}"
    
    # Create block registration (index.js)
    print_step "Creating block registration..."
    create_block_index "$ADMIN_BLOCK_DIR" "$block_name" "$block_name_camel" "$category"
    
    # Create component files
    print_step "Creating component files..."
    create_component_files "$ADMIN_BLOCK_DIR" "$block_name"
    
    # Create preview files
    print_step "Creating preview files..."
    create_preview_files "$ADMIN_BLOCK_DIR" "$block_name"
    
    # Create config files
    print_step "Creating config files..."
    create_config_files "$ADMIN_BLOCK_DIR" "$block_name" "$block_name_camel"
    
    # Create storefront template
    print_step "Creating storefront template..."
    create_storefront_template "$STOREFRONT_DIR" "$block_name" "$block_name_underscore"
    
    print_success "Block '$block_name' created successfully!"
    
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo -e "  1. Import in main.js:"
    echo -e "     ${CYAN}import \"./module/sw-cms/blocks/${category}/${block_name}/index.js\";${NC}"
    echo ""
    echo -e "  2. Add snippets in de-DE.json & en-GB.json:"
    echo -e "     ${CYAN}\"${block_name_camel}\": { \"label\": \"Block Label\" }${NC}"
    echo ""
    echo -e "  3. Add enable toggle in config.xml (optional):"
    echo -e "     ${CYAN}<name>enable${block_name_pascal}</name>${NC}"
    echo ""
    echo -e "  4. Build:"
    echo -e "     ${CYAN}./mi-cli.sh build admin${NC}"
}

create_block_index() {
    local dir="$1"
    local name="$2"
    local camel="$3"
    local category="$4"
    
    cat > "${dir}/index.js" << EOF
/**
 * ${name} Block Registration
 *
 * Category: ${category}
 * Created by: Matt Interfaces CLI
 *
 * @package HeroBlocks
 */

import './component/index.js';
import './preview/index.js';
import './config/index.js';

// Register block with CMS Service
Shopware.Service('cmsService').registerCmsBlock({
    name: '${name}',
    label: 'sw-cms.blocks.heroBlocks.${camel}.label',
    category: '${category}',
    component: 'sw-cms-block-${name}',
    previewComponent: 'sw-cms-preview-${name}',
    configComponent: 'sw-cms-block-config-${name}',
    defaultConfig: {
        marginTop: '0',
        marginBottom: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'boxed',
        // Add block-specific config here
    },
    slots: {
        content: 'text',
        // Add slots here (e.g., image: 'image', left: 'text', right: 'image')
    },
});

console.info('[HeroBlocks] Block "${name}" registered');
EOF
}

create_component_files() {
    local dir="$1"
    local name="$2"
    
    # Component index.js
    cat > "${dir}/component/index.js" << EOF
/**
 * ${name} Block Component
 */

import template from './sw-cms-block-${name}.html.twig';
import './sw-cms-block-${name}.scss';

Shopware.Component.register('sw-cms-block-${name}', {
    template,
});

export default Shopware.Component.build('sw-cms-block-${name}');
EOF

    # Component template
    cat > "${dir}/component/sw-cms-block-${name}.html.twig" << EOF
{% block sw_cms_block_${name//-/_} %}
<div class="sw-cms-block-${name}">
    <slot name="content">
        <sw-cms-slot name="content" />
    </slot>
</div>
{% endblock %}
EOF

    # Component SCSS
    cat > "${dir}/component/sw-cms-block-${name}.scss" << EOF
/**
 * ${name} Block Component Styles (Admin Preview)
 */
.sw-cms-block-${name} {
    display: flex;
    flex-direction: column;
    min-height: 200px;
    padding: 1rem;
    background-color: var(--color-white);
    border: 1px dashed var(--color-gray-300);
    border-radius: 4px;
    
    // Slot styling
    .sw-cms-slot {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
EOF
}

create_preview_files() {
    local dir="$1"
    local name="$2"
    
    # Preview index.js
    cat > "${dir}/preview/index.js" << EOF
/**
 * ${name} Block Preview Component
 */

import template from './sw-cms-preview-${name}.html.twig';
import './sw-cms-preview-${name}.scss';

Shopware.Component.register('sw-cms-preview-${name}', {
    template,
});

export default Shopware.Component.build('sw-cms-preview-${name}');
EOF

    # Preview template
    cat > "${dir}/preview/sw-cms-preview-${name}.html.twig" << EOF
{% block sw_cms_preview_${name//-/_} %}
<div class="sw-cms-preview-${name}">
    <div class="sw-cms-preview-${name}__placeholder">
        <sw-icon name="regular-image" size="32px"></sw-icon>
        <span>{{ \$tc('sw-cms.blocks.heroBlocks.${name//-/}.label') }}</span>
    </div>
    
    {# Matt Interfaces Branding Button #}
    <div class="mi-branding-badge">
        <svg viewBox="0 0 512 512" class="mi-logo">
            <path d="M0 0 C3.50448246 3.03391591..." fill="#FF5432"/>
        </svg>
    </div>
</div>
{% endblock %}
EOF

    # Preview SCSS
    cat > "${dir}/preview/sw-cms-preview-${name}.scss" << EOF
/**
 * ${name} Block Preview Styles (Sidebar)
 */
.sw-cms-preview-${name} {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    padding: 1rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 4px;
    
    &__placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-gray-500);
        font-size: 12px;
        text-align: center;
    }
    
    // Matt Interfaces Branding
    .mi-branding-badge {
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 16px;
        height: 16px;
        opacity: 0.6;
        transition: opacity 0.2s ease;
        
        &:hover {
            opacity: 1;
        }
        
        .mi-logo {
            width: 100%;
            height: 100%;
        }
    }
}
EOF
}

create_config_files() {
    local dir="$1"
    local name="$2"
    local camel="$3"
    
    # Config index.js
    cat > "${dir}/config/index.js" << EOF
/**
 * ${name} Block Config Component
 */

import template from './sw-cms-block-config-${name}.html.twig';
import './sw-cms-block-config-${name}.scss';

const component = {
    template,
    
    inject: ['repositoryFactory', 'cmsService'],
    
    mixins: [
        Shopware.Mixin.getByName('cms-state'),
    ],
    
    props: {
        block: {
            type: Object,
            required: true,
        },
    },
    
    created() {
        this.initializeBlockConfig();
    },
    
    watch: {
        'block.type': {
            handler() {
                this.initializeBlockConfig();
            },
            immediate: true,
        },
    },
    
    methods: {
        initializeBlockConfig() {
            if (!this.block) return;
            
            if (!this.block.customFields) {
                this.\$set(this.block, 'customFields', {});
            }
            
            // Initialize default custom field values
            const defaults = {
                // Add default values here
            };
            
            Object.keys(defaults).forEach((key) => {
                if (this.block.customFields[key] === undefined) {
                    this.\$set(this.block.customFields, key, defaults[key]);
                }
            });
        },
        
        onConfigChange(value, key) {
            if (!this.block?.customFields) return;
            
            this.\$set(this.block.customFields, key, value);
            this.\$emit('block-update');
        },
    },
};

Shopware.Component.register('sw-cms-block-config-${name}', component);

export default component;
EOF

    # Config template
    cat > "${dir}/config/sw-cms-block-config-${name}.html.twig" << EOF
{% block sw_cms_block_config_${name//-/_} %}
<div class="sw-cms-block-config-${name}" v-if="block">
    
    <sw-container columns="1fr" gap="16px">
        {# Add config fields here #}
        {# Example:
        <sw-text-field
            :label="\$tc('sw-cms.blocks.heroBlocks.${camel}.config.title')"
            :model-value="block.customFields?.title || ''"
            @update:model-value="(value) => onConfigChange(value, 'title')"
        />
        #}
        
        <sw-alert variant="info">
            {{ \$tc('sw-cms.blocks.heroBlocks.${camel}.config.info') }}
        </sw-alert>
    </sw-container>
    
</div>
{% endblock %}
EOF

    # Config SCSS
    cat > "${dir}/config/sw-cms-block-config-${name}.scss" << EOF
/**
 * ${name} Block Config Styles
 */
.sw-cms-block-config-${name} {
    padding: 1rem 0;
    
    // Add custom styles here
}
EOF
}

create_storefront_template() {
    local dir="$1"
    local name="$2"
    local underscore="$3"
    
    cat > "${dir}/cms-block-${name}.html.twig" << EOF
{#
    ${name} Block - Storefront Template
    
    Block Config (from customFields):
    - block.customFields.*
    
    Available Slots:
    - block.slots.getSlot('content')
    
    @package HeroBlocks
    @author Matt Interfaces
#}

{% block block_${underscore} %}
<div class="cms-block-${name}"
     data-${name}="true">
    
    {# Read config from customFields #}
    {% set config = block.customFields|default({}) %}
    
    {# Render slot content #}
    {% set element = block.slots.getSlot('content') %}
    {% if element and element.type %}
        {% sw_include '@Storefront/storefront/element/cms-element-' ~ element.type ~ '.html.twig' ignore missing %}
    {% endif %}
    
</div>
{% endblock %}
EOF
}

# =============================================================================
# Release Command
# =============================================================================

cmd_release() {
    print_header
    
    # Run the existing create-release-zip.sh script
    if [ -f "${PLUGIN_DIR}/create-release-zip.sh" ]; then
        bash "${PLUGIN_DIR}/create-release-zip.sh"
    else
        print_error "create-release-zip.sh not found!"
        exit 1
    fi
}

# =============================================================================
# Test Command
# =============================================================================

cmd_test() {
    print_header
    check_container
    
    print_step "Running PHPUnit tests..."
    
    if [ -f "${PLUGIN_DIR}/phpunit.xml" ]; then
        docker_exec php vendor/bin/phpunit --configuration ${SHOPWARE_PATH}/custom/plugins/HeroBlocks/phpunit.xml
    else
        print_warning "No phpunit.xml found. Skipping tests."
    fi
}

# =============================================================================
# Help Command
# =============================================================================

cmd_help() {
    print_header
    
    cat << EOF
${BOLD}Usage:${NC}
  ./mi-cli.sh <command> [options]

${BOLD}Commands:${NC}
  ${CYAN}build${NC} [admin|storefront]  Build assets (default: all)
  ${CYAN}cache${NC}                      Clear Shopware cache
  ${CYAN}create-block${NC}               Create new CMS block (interactive wizard)
  ${CYAN}release${NC}                    Create release ZIP for GitHub
  ${CYAN}test${NC}                       Run PHPUnit tests
  ${CYAN}help${NC}                       Show this help message

${BOLD}Examples:${NC}
  ./mi-cli.sh build              # Build all assets
  ./mi-cli.sh build admin        # Build admin assets only
  ./mi-cli.sh build storefront   # Build storefront only
  ./mi-cli.sh create-block       # Interactive block creation
  ./mi-cli.sh cache              # Clear cache

${BOLD}Block Creation:${NC}
  The create-block command generates all required files for a new CMS block:
  
  Admin files:
    - src/Resources/app/administration/src/module/sw-cms/blocks/<category>/<name>/
      ├── index.js              # Block registration
      ├── component/            # Admin preview component
      ├── preview/              # Sidebar preview
      └── config/               # Block configuration
  
  Storefront files:
    - src/Resources/views/storefront/block/cms-block-<name>.html.twig

${BOLD}Available Block Categories:${NC}
  text, image, text-image, commerce, video, form, sidebar, html

${BOLD}After Creating a Block:${NC}
  1. Import in main.js
  2. Add snippets (de-DE.json, en-GB.json)
  3. Add enable toggle in config.xml (optional)
  4. Build with: ./mi-cli.sh build admin

${BOLD}Links:${NC}
  Documentation: https://developer.shopware.com/docs/guides/plugins/plugins/content/cms/
  Support: info@matt-interfaces.ch
  Website: https://matt-interfaces.ch

EOF
}

# =============================================================================
# Main Entry Point
# =============================================================================

main() {
    local command="${1:-help}"
    shift || true
    
    case "$command" in
        build)
            cmd_build "$@"
            ;;
        cache)
            cmd_cache "$@"
            ;;
        create-block|create)
            cmd_create_block "$@"
            ;;
        release)
            cmd_release "$@"
            ;;
        test)
            cmd_test "$@"
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
