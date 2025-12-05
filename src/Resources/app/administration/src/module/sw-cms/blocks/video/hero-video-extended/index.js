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
 * 
 * WICHTIG: SPRACHABHÄNGIGE TEXTE
 * Die Texte (Headline, Content) werden im 'textOverlay' Slot (text Element) gespeichert.
 * CMS-Elemente haben eine cms_slot_translation Tabelle, daher sind die Texte SPRACHABHÄNGIG!
 * 
 * Nicht-übersetzbare Einstellungen (Video, Position, Farben, Animation) werden in block.customFields gespeichert.
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
 * WICHTIG: 
 * - Block-Config (Video, Position, Farben) wird in block.customFields gespeichert (NICHT übersetzbar)
 * - Text-Content wird im textOverlay Slot gespeichert (ÜBERSETZBAR via cms_slot_translation)
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
        // WICHTIG: Text Element für SPRACHABHÄNGIGE Texte
        // Die Config wird in cms_slot_translation.config gespeichert und ist somit übersetzbar!
        // Wir verwenden den Standard "text" Element-Typ, da dieser bereits übersetzbar ist
        // Slot-Name: "content" (für Kompatibilität mit bestehenden Blocks)
        content: {
            type: 'text',
            default: {
                config: {
                    content: {
                        source: 'static',
                        // WICHTIG: Inline styles für weiße Farbe (wie bei hero-image-overlay)
                        // margin-bottom: 0.25rem für konsistenten Abstand zwischen Headline und Text
                        value: '<h2 class="hero-overlay-headline" style="color: #ffffff; margin-bottom: 0.25rem;">Ihre Überschrift</h2><p class="hero-overlay-text" style="color: #ffffff;">Ihr Beschreibungstext hier eingeben...</p>',
                    },
                    // WICHTIG: verticalAlign für Shopware's checkRequiredSlotConfigField
                    verticalAlign: { source: 'static', value: 'center' },
                },
            },
        },
    },
});

console.log('[HeroBlocks] ✅ Hero Video Extended Block registered successfully');
