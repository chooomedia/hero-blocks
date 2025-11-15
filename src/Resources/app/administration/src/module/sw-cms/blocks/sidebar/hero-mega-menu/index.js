/**
 * Hero Mega Menu Block Registration
 * 
 * WICHTIG: Block wird nur registriert wenn enableMegaMenu aktiviert ist
 * Gemäß Shopware Best Practices für Custom CMS Blocks
 */

// Conditional import based on system config
// WICHTIG: Block wird immer geladen, aber nur angezeigt wenn enableMegaMenu aktiviert ist
Shopware.Component.register('sw-cms-preview-hero-mega-menu', () => import('./preview/index.js'));
Shopware.Component.register('sw-cms-block-hero-mega-menu', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-block-config-hero-mega-menu', () => import('./config/index.js'));

/**
 * @private
 */
Shopware.Service('cmsService').registerCmsBlock({
    name: 'hero-mega-menu',
    label: 'sw-cms.blocks.heroBlocks.heroMegaMenu.label',
    category: 'sidebar',
    component: 'sw-cms-block-hero-mega-menu',
    previewComponent: 'sw-cms-preview-hero-mega-menu',
    configComponent: 'sw-cms-block-config-hero-mega-menu',
    defaultConfig: {
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'full_width',
        // Widget-Konfiguration
        widgets: {
            source: 'static',
            value: [], // Array von Widget-Konfigurationen
        },
        // Layout-Optionen
        layout: {
            source: 'static',
            value: 'full-width', // 'full-width', 'boxed', 'container'
        },
        // Produkt-Anzeige
        showProducts: {
            source: 'static',
            value: false,
        },
        // Produkt-Anzahl (wenn showProducts aktiviert)
        productsCount: {
            source: 'static',
            value: 4,
        },
        // Instagram Feed
        showInstagramFeed: {
            source: 'static',
            value: false,
        },
        // Instagram Feed Username (wenn showInstagramFeed aktiviert)
        instagramUsername: {
            source: 'static',
            value: '',
        },
        // Styling: Link-Farbe
        linkColor: {
            source: 'static',
            value: null, // null = Theme Default
        },
        // Styling: Link-Hover-Farbe
        linkHoverColor: {
            source: 'static',
            value: null, // null = Theme Default
        },
        // Styling: Dropdown-Hintergrund
        dropdownBackground: {
            source: 'static',
            value: null, // null = Theme Default
        },
        // Styling: Dropdown-Padding (Top/Bottom)
        dropdownPadding: {
            source: 'static',
            value: '2rem', // Standard: 2rem
        },
    },
    slots: {
        content: {
            type: 'text',
            default: {
                config: {},
                data: {},
            },
        },
        widget: {
            type: 'text',
            default: {
                config: {},
                data: {},
            },
        },
    },
});

