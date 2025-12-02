/**
 * Hero Image Overlay Block
 * 
 * Full-width image with angled text overlay panel.
 * Features:
 * - Position: top-left, middle-left, bottom-left, top-right, middle-right, bottom-right
 * - Angled edge (33°) pointing inward
 * - Scroll animation from outside
 * - Accent color background
 * - Responsive design
 */

// CMS constant import removed - using direct values instead
const CMS = {
    MEDIA: {
        previewMountain: 'bundles/administration/administration/static/img/cms/preview_mountain_large.jpg',
    },
};

/**
 * @private
 */
Shopware.Component.register('sw-cms-preview-hero-image-overlay', () => import('./preview/index.js'));
/**
 * @private
 */
Shopware.Component.register('sw-cms-block-hero-image-overlay', () => import('./component/index.js'));
/**
 * @private
 */
Shopware.Component.register('sw-cms-block-config-hero-image-overlay', () => import('./config/index.js'));

/**
 * @private
 */
console.log('[HeroBlocks] 🖼️ Registering Hero Image Overlay Block...');

Shopware.Service('cmsService').registerCmsBlock({
    name: 'hero-image-overlay',
    label: 'sw-cms.blocks.heroBlocks.heroImageOverlay.label',
    category: 'image',
    component: 'sw-cms-block-hero-image-overlay',
    previewComponent: 'sw-cms-preview-hero-image-overlay',
    configComponent: 'sw-cms-block-config-hero-image-overlay',
    defaultConfig: {
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'full-width',
        // Overlay position: top-left, middle-left, bottom-left, top-right, middle-right, bottom-right
        overlayPosition: {
            source: 'static',
            value: 'top-left',
        },
        // Overlay background color (accent color by default)
        overlayBackgroundColor: {
            source: 'static',
            value: '#007bff', // Accent color
        },
        // Overlay text color (white by default)
        overlayTextColor: {
            source: 'static',
            value: '#ffffff', // White
        },
        // Overlay headline
        overlayHeadline: {
            source: 'static',
            value: '',
        },
        // Overlay text
        overlayText: {
            source: 'static',
            value: '',
        },
        // Enable scroll animation
        enableScrollAnimation: {
            source: 'static',
            value: true,
        },
        // Minimum height
        minHeight: {
            source: 'static',
            value: '500px',
        },
    },
    slots: {
        image: {
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
    },
});

console.log('[HeroBlocks] ✅ Hero Image Overlay Block registered successfully');

