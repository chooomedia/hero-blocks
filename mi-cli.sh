#!/bin/bash
#
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                        Matt Interfaces CLI                                ║
# ║              Hero Blocks Development & Build Tool                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./mi-cli.sh [command] [options]
#
# Commands:
#   build         Build assets (admin, storefront, or full)
#   cache         Clear all caches
#   create-block  Create new CMS block (interactive)
#   release       Create release ZIP
#   test          Run webhook tests
#   help          Show this help
#

set -e

# Configuration
CONTAINER_NAME="horex-shopware"
PROJECT_ROOT="/var/www/html"
ADMIN_ROOT="/var/www/html/vendor/shopware/administration"
ADMIN_WORK_DIR="/var/www/html/vendor/shopware/administration/Resources/app/administration"
PLUGIN_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_NAME="HeroBlocks"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Helper functions
print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║            🚀 Matt Interfaces CLI - Hero Blocks              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if container is running
check_container() {
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        print_error "Container '$CONTAINER_NAME' is not running!"
        echo -e "${YELLOW}Start it with: cd dockware && docker-compose up -d${NC}"
        exit 1
    fi
}

# =============================================================================
# BUILD COMMANDS
# =============================================================================

build_storefront() {
    print_step "Building Storefront Assets..."
    
    docker exec "$CONTAINER_NAME" php bin/console cache:clear
    docker exec "$CONTAINER_NAME" php bin/console plugin:refresh
    docker exec "$CONTAINER_NAME" php bin/console theme:compile
    docker exec "$CONTAINER_NAME" php bin/console cache:clear
    
    print_success "Storefront build complete!"
}

build_admin() {
    print_step "Building Admin Assets..."
    
    docker exec "$CONTAINER_NAME" php bin/console cache:clear
    docker exec "$CONTAINER_NAME" php bin/console plugin:refresh
    docker exec "$CONTAINER_NAME" php bin/console bundle:dump
    
    docker exec -e PROJECT_ROOT="$PROJECT_ROOT" \
               -e ADMIN_ROOT="$ADMIN_ROOT" \
               -e SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1 \
               -e VITE_MODE=production \
               -w "$ADMIN_WORK_DIR" \
               "$CONTAINER_NAME" npm run build
    
    docker exec "$CONTAINER_NAME" php bin/console assets:install
    docker exec "$CONTAINER_NAME" php bin/console cache:clear
    
    print_success "Admin build complete!"
    print_warning "Remember: Hard refresh your browser (Cmd+Shift+R)"
}

build_full() {
    print_step "Building Full Assets (Storefront + Admin)..."
    build_storefront
    echo ""
    build_admin
    print_success "Full build complete!"
}

cmd_build() {
    check_container
    
    case "${1:-full}" in
        storefront|s)
            build_storefront
            ;;
        admin|a)
            build_admin
            ;;
        full|f|*)
            build_full
            ;;
    esac
}

# =============================================================================
# CACHE COMMANDS
# =============================================================================

cmd_cache() {
    check_container
    print_step "Clearing all caches..."
    
    docker exec "$CONTAINER_NAME" php bin/console cache:clear
    docker exec "$CONTAINER_NAME" php bin/console cache:pool:clear cache.global_clearer 2>/dev/null || true
    
    print_success "Cache cleared!"
}

# =============================================================================
# CREATE BLOCK COMMAND
# =============================================================================

cmd_create_block() {
    print_header
    echo -e "${BOLD}🧩 Create New CMS Block${NC}"
    echo ""
    
    # Block Categories
    echo -e "${CYAN}Available Categories:${NC}"
    echo "  1) text         - Text-only blocks"
    echo "  2) image        - Image blocks"
    echo "  3) text-image   - Text & image blocks"
    echo "  4) commerce     - Product/commerce blocks"
    echo "  5) video        - Video blocks"
    echo "  6) form         - Form blocks"
    echo "  7) sidebar      - Sidebar blocks"
    echo "  8) html         - Custom HTML blocks"
    echo ""
    
    read -p "Select category (1-8): " category_num
    
    case $category_num in
        1) CATEGORY="text" ;;
        2) CATEGORY="image" ;;
        3) CATEGORY="text-image" ;;
        4) CATEGORY="commerce" ;;
        5) CATEGORY="video" ;;
        6) CATEGORY="form" ;;
        7) CATEGORY="sidebar" ;;
        8) CATEGORY="html" ;;
        *) print_error "Invalid category"; exit 1 ;;
    esac
    
    echo ""
    read -p "Block name (e.g., 'hero-testimonial'): " BLOCK_NAME
    
    if [[ -z "$BLOCK_NAME" ]]; then
        print_error "Block name is required"
        exit 1
    fi
    
    # Convert to PascalCase for component names
    BLOCK_NAME_PASCAL=$(echo "$BLOCK_NAME" | sed -r 's/(^|-)(\w)/\U\2/g')
    BLOCK_NAME_CAMEL=$(echo "$BLOCK_NAME_PASCAL" | sed 's/^./\L&/')
    
    echo ""
    print_step "Creating block: $BLOCK_NAME (Category: $CATEGORY)"
    
    # Paths
    ADMIN_BLOCKS_PATH="$PLUGIN_PATH/src/Resources/app/administration/src/module/sw-cms/blocks/$CATEGORY/$BLOCK_NAME"
    STOREFRONT_BLOCK_PATH="$PLUGIN_PATH/src/Resources/views/storefront/block"
    
    # Create directories
    mkdir -p "$ADMIN_BLOCKS_PATH/component"
    mkdir -p "$ADMIN_BLOCKS_PATH/preview"
    mkdir -p "$ADMIN_BLOCKS_PATH/config"
    mkdir -p "$STOREFRONT_BLOCK_PATH"
    
    # Create block index.js
    cat > "$ADMIN_BLOCKS_PATH/index.js" << EOF
/**
 * Hero ${BLOCK_NAME_PASCAL} Block
 * 
 * Category: ${CATEGORY}
 * Created by Matt Interfaces CLI
 */
import './component/index.js';
import './preview/index.js';
import './config/index.js';

Shopware.Service('cmsService').registerCmsBlock({
    name: '${BLOCK_NAME}',
    label: 'sw-cms.blocks.heroBlocks.${BLOCK_NAME_CAMEL}.label',
    category: '${CATEGORY}',
    component: 'sw-cms-block-${BLOCK_NAME}',
    previewComponent: 'sw-cms-preview-${BLOCK_NAME}',
    configComponent: 'sw-cms-block-config-${BLOCK_NAME}',
    defaultConfig: {
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'boxed',
    },
    slots: {
        content: {
            type: 'text',
        },
    },
});
EOF

    # Create component index.js
    cat > "$ADMIN_BLOCKS_PATH/component/index.js" << EOF
import template from './sw-cms-block-${BLOCK_NAME}.html.twig';
import './sw-cms-block-${BLOCK_NAME}.scss';

Shopware.Component.register('sw-cms-block-${BLOCK_NAME}', {
    template,
});

export default Shopware.Component.build('sw-cms-block-${BLOCK_NAME}');
EOF

    # Create component template
    cat > "$ADMIN_BLOCKS_PATH/component/sw-cms-block-${BLOCK_NAME}.html.twig" << EOF
{% block sw_cms_block_${BLOCK_NAME//-/_} %}
<div class="sw-cms-block-${BLOCK_NAME}">
    <slot name="content">
        <sw-cms-slot name="content" />
    </slot>
</div>
{% endblock %}
EOF

    # Create component SCSS
    cat > "$ADMIN_BLOCKS_PATH/component/sw-cms-block-${BLOCK_NAME}.scss" << EOF
.sw-cms-block-${BLOCK_NAME} {
    display: block;
    padding: 20px;
    background-color: #f5f5f5;
    border: 1px dashed #ccc;
    border-radius: 4px;
    min-height: 100px;
}
EOF

    # Create preview index.js
    cat > "$ADMIN_BLOCKS_PATH/preview/index.js" << EOF
import template from './sw-cms-preview-${BLOCK_NAME}.html.twig';
import './sw-cms-preview-${BLOCK_NAME}.scss';

Shopware.Component.register('sw-cms-preview-${BLOCK_NAME}', {
    template,
});

export default Shopware.Component.build('sw-cms-preview-${BLOCK_NAME}');
EOF

    # Create preview template
    cat > "$ADMIN_BLOCKS_PATH/preview/sw-cms-preview-${BLOCK_NAME}.html.twig" << EOF
{% block sw_cms_preview_${BLOCK_NAME//-/_} %}
<div class="sw-cms-preview-${BLOCK_NAME}">
    <div class="sw-cms-preview-${BLOCK_NAME}__icon">
        <mt-icon name="regular-layer-group" size="32" />
    </div>
    <div class="sw-cms-preview-${BLOCK_NAME}__label">
        ${BLOCK_NAME_PASCAL}
    </div>
</div>
{% endblock %}
EOF

    # Create preview SCSS
    cat > "$ADMIN_BLOCKS_PATH/preview/sw-cms-preview-${BLOCK_NAME}.scss" << EOF
.sw-cms-preview-${BLOCK_NAME} {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 15px;
    background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%);
    border-radius: 4px;
    min-height: 80px;

    &__icon {
        color: #ff5432;
    }

    &__label {
        font-size: 12px;
        font-weight: 600;
        color: #52667a;
    }
}
EOF

    # Create config index.js
    cat > "$ADMIN_BLOCKS_PATH/config/index.js" << EOF
import template from './sw-cms-block-config-${BLOCK_NAME}.html.twig';
import './sw-cms-block-config-${BLOCK_NAME}.scss';

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

    methods: {
        onConfigChange(value, configKey) {
            if (!this.block?.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields[configKey] = value;
            this.\$emit('block-update');
        },
    },
};

Shopware.Component.register('sw-cms-block-config-${BLOCK_NAME}', component);

export default component;
EOF

    # Create config template
    cat > "$ADMIN_BLOCKS_PATH/config/sw-cms-block-config-${BLOCK_NAME}.html.twig" << EOF
{% block sw_cms_block_config_${BLOCK_NAME//-/_} %}
<div class="sw-cms-block-config-${BLOCK_NAME}" v-if="block">
    <p class="sw-cms-block-config-${BLOCK_NAME}__hint">
        Configure your ${BLOCK_NAME_PASCAL} block here.
    </p>
    
    <!-- Add your config fields here -->
</div>
{% endblock %}
EOF

    # Create config SCSS
    cat > "$ADMIN_BLOCKS_PATH/config/sw-cms-block-config-${BLOCK_NAME}.scss" << EOF
.sw-cms-block-config-${BLOCK_NAME} {
    &__hint {
        color: #52667a;
        font-size: 13px;
        margin-bottom: 16px;
    }
}
EOF

    # Create storefront template
    cat > "$STOREFRONT_BLOCK_PATH/cms-block-${BLOCK_NAME}.html.twig" << EOF
{% block block_${BLOCK_NAME//-/_} %}
{#
    ${BLOCK_NAME_PASCAL} Block
    
    Category: ${CATEGORY}
    Created by Matt Interfaces CLI
    
    Usage:
    This block is automatically rendered by Shopware CMS.
    Access block config via: block.customFields.configKey
#}

<div class="cms-block-${BLOCK_NAME}" data-${BLOCK_NAME}="true">
    {# Slot: content #}
    {% set element = block.slots.getSlot('content') %}
    {% if element and element.type %}
        {% sw_include '@Storefront/storefront/element/cms-element-' ~ element.type ~ '.html.twig' ignore missing %}
    {% endif %}
</div>
{% endblock %}
EOF

    echo ""
    print_success "Block created successfully!"
    echo ""
    echo -e "${CYAN}Files created:${NC}"
    echo "  📁 $ADMIN_BLOCKS_PATH/"
    echo "     └── index.js (block registration)"
    echo "     └── component/ (admin preview)"
    echo "     └── preview/ (sidebar preview)"
    echo "     └── config/ (block settings)"
    echo "  📄 $STOREFRONT_BLOCK_PATH/cms-block-${BLOCK_NAME}.html.twig"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Add block import to main.js:"
    echo "     import './module/sw-cms/blocks/${CATEGORY}/${BLOCK_NAME}/index.js';"
    echo ""
    echo "  2. Add snippets to de-DE.json and en-GB.json:"
    echo "     \"${BLOCK_NAME_CAMEL}\": { \"label\": \"${BLOCK_NAME_PASCAL}\" }"
    echo ""
    echo "  3. Add enable toggle to config.xml (optional):"
    echo "     <name>enable${BLOCK_NAME_PASCAL}</name>"
    echo ""
    echo "  4. Build assets:"
    echo "     ./mi-cli.sh build admin"
    echo ""
}

# =============================================================================
# RELEASE COMMAND
# =============================================================================

cmd_release() {
    print_step "Creating Release ZIP..."
    
    if [[ -f "$PLUGIN_PATH/create-release-zip.sh" ]]; then
        bash "$PLUGIN_PATH/create-release-zip.sh"
    else
        print_error "create-release-zip.sh not found"
        exit 1
    fi
}

# =============================================================================
# TEST COMMAND
# =============================================================================

cmd_test() {
    print_step "Running Webhook Tests..."
    
    if [[ -f "$PLUGIN_PATH/test-webhook.sh" ]]; then
        bash "$PLUGIN_PATH/test-webhook.sh"
    else
        # Inline test
        echo "Testing License Check..."
        curl -s "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=license&plugin=hero-blocks&version=1.0.1" | jq '.'
        
        echo ""
        echo "Testing Update Check..."
        curl -s "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0" | jq '.'
    fi
}

# =============================================================================
# HELP COMMAND
# =============================================================================

cmd_help() {
    print_header
    echo -e "${BOLD}Usage:${NC}"
    echo "  ./mi-cli.sh [command] [options]"
    echo ""
    echo -e "${BOLD}Commands:${NC}"
    echo "  build [type]     Build assets"
    echo "                   - full (default): Build all"
    echo "                   - admin: Admin assets only"
    echo "                   - storefront: Storefront assets only"
    echo ""
    echo "  cache            Clear all caches"
    echo ""
    echo "  create-block     Create new CMS block (interactive)"
    echo ""
    echo "  release          Create release ZIP"
    echo ""
    echo "  test             Run webhook tests"
    echo ""
    echo "  help             Show this help"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  ./mi-cli.sh build                 # Full build"
    echo "  ./mi-cli.sh build admin           # Admin only"
    echo "  ./mi-cli.sh cache                 # Clear cache"
    echo "  ./mi-cli.sh create-block          # Create block (interactive)"
    echo ""
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    case "${1:-help}" in
        build|b)
            cmd_build "${2}"
            ;;
        cache|c)
            cmd_cache
            ;;
        create-block|cb|new)
            cmd_create_block
            ;;
        release|r)
            cmd_release
            ;;
        test|t)
            cmd_test
            ;;
        help|h|--help|-h)
            cmd_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run './mi-cli.sh help' for usage."
            exit 1
            ;;
    esac
}

main "$@"
