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
 * 
 * WICHTIG: Block-Config wird in block.customFields gespeichert (NICHT in block.config)
 * Das defaultConfig hier definiert nur Standard-Werte für margin/sizing.
 * Alle anderen Einstellungen werden über customFields verwaltet.
 */
Shopware.Service('cmsService').registerCmsBlock({
    name: 'hero-video-extended',
    label: 'sw-cms.blocks.heroBlocks.heroVideoExtended.label',
    category: 'video',
    component: 'sw-cms-block-hero-video-extended',
    previewComponent: 'sw-cms-preview-hero-video-extended',
    configComponent: 'sw-cms-block-config-hero-video-extended',
    defaultConfig: {
        // Standard Shopware Block-Config (margin, sizing)
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'full-width',
        // WICHTIG: Keine Block-spezifischen Einstellungen hier!
        // Diese werden in block.customFields gespeichert (siehe config/index.js)
    },
    slots: {
        // No slots - video is configured via block settings
    },
});

console.log('[HeroBlocks] ✅ Hero Video Extended Block registered successfully');
