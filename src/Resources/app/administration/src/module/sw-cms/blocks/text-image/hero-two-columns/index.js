// CMS constant import removed - using direct values instead
const CMS = {
    MEDIA: {
        previewMountain: 'bundles/administration/administration/static/img/cms/preview_mountain_large.jpg',
    },
};

// WICHTIG: Snippets werden aus Root-Snippets geladen (app/administration/src/snippet/)

/**
 * @private
 */
Shopware.Component.register('sw-cms-preview-hero-two-columns', () => import('./preview/index.js'));
/**
 * @private
 */
Shopware.Component.register('sw-cms-block-hero-two-columns', () => import('./component/index.js'));
/**
 * @private
 */
Shopware.Component.register('sw-cms-block-config-hero-two-columns', () => import('./config/index.js'));

/**
 * @private
 */
Shopware.Service('cmsService').registerCmsBlock({
    name: 'hero-two-columns',
    label: 'sw-cms.blocks.heroBlocks.heroTwoColumns.label',
    category: 'text-image',
    component: 'sw-cms-block-hero-two-columns',
    previewComponent: 'sw-cms-preview-hero-two-columns',
    configComponent: 'sw-cms-block-config-hero-two-columns',
    defaultConfig: {
        marginBottom: '20px',
        marginTop: '20px',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'boxed',
        layout: {
            source: 'static',
            value: 'image-left', // 'image-left' or 'text-left'
        },
        layoutDesktop: {
            source: 'static',
            value: 'image-left', // 'image-left' or 'text-left'
        },
        layoutTablet: {
            source: 'static',
            value: 'image-left', // 'image-left' or 'text-left'
        },
        backgroundMode: {
            source: 'static',
            value: 'none', // 'none', 'single', 'two-images'
        },
        backgroundImage: {
            source: 'static',
            value: null,
            entity: {
                name: 'media',
            },
        },
        backgroundImageLeft: {
            source: 'static',
            value: null,
            entity: {
                name: 'media',
            },
        },
        backgroundImageRight: {
            source: 'static',
            value: null,
            entity: {
                name: 'media',
            },
        },
        backgroundZIndex: {
            source: 'static',
            value: '0',
        },
        minHeight: {
            source: 'static',
            value: null, // e.g., '500px', '80vh'
        },
    },
    slots: {
        left: {
            type: 'image',
            default: {
                config: {
                    displayMode: { source: 'static', value: 'cover' },
                },
                data: {
                    media: {
                        value: CMS.MEDIA.previewMountain,
                        source: 'default',
                    },
                },
            },
        },
        right: 'text',
    },
});

