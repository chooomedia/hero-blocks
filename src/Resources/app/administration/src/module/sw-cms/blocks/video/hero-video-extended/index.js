/**
 * Hero Video Extended Block Registration
 * 
 * Features:
 * - Video upload via Media Manager (max 2-5MB recommended)
 * - Autoplay loop (infinite)
 * - Angled text overlay (like Hero Image Overlay)
 * - Scroll animation
 * - Async on-scroll loading in storefront
 * 
 * Controlled via System-Config: HeroBlocks.config.enableHeroVideoExtended
 */

// CMS constant for preview image
const CMS = {
    MEDIA: {
        previewMountain: 'bundles/administration/administration/static/img/cms/preview_mountain_large.jpg',
    },
};

console.log('[HeroBlocks] 🎬 Registering Hero Video Extended Block...');

// Register Components
Shopware.Component.register('sw-cms-block-hero-video-extended', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-preview-hero-video-extended', () => import('./preview/index.js'));
Shopware.Component.register('sw-cms-block-config-hero-video-extended', () => import('./config/index.js'));

/**
 * @private
 */
Shopware.Service('cmsService').registerCmsBlock({
    name: 'hero-video-extended',
    label: 'sw-cms.blocks.heroBlocks.heroVideoExtended.label',
    category: 'video',
    component: 'sw-cms-block-hero-video-extended',
    previewComponent: 'sw-cms-preview-hero-video-extended',
    configComponent: 'sw-cms-block-config-hero-video-extended',
    defaultConfig: {
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'full-width',
        // Video settings
        autoplay: {
            source: 'static',
            value: true,
        },
        loop: {
            source: 'static',
            value: true,
        },
        muted: {
            source: 'static',
            value: true,
        },
        // Overlay position: top-left, middle-left, bottom-left, top-right, middle-right, bottom-right
        overlayPosition: {
            source: 'static',
            value: 'bottom-right',
        },
        // Overlay background color (accent color by default)
        overlayBackgroundColor: {
            source: 'static',
            value: '', // Empty = use CSS variable --sw-color-accent
        },
        // Overlay text color (white by default)
        overlayTextColor: {
            source: 'static',
            value: '#ffffff',
        },
        // Overlay headline
        overlayHeadline: {
            source: 'static',
            value: '',
        },
        // Overlay text (HTML)
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
        // Video media ID (stored in customFields)
        videoMediaId: {
            source: 'static',
            value: null,
        },
        // Poster image media ID (stored in customFields)
        posterMediaId: {
            source: 'static',
            value: null,
        },
    },
    slots: {
        // No slots - video is configured via block settings
    },
});

console.log('[HeroBlocks] ✅ Hero Video Extended Block registered successfully');
