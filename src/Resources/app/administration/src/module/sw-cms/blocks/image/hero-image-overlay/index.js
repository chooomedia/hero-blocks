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
 * 
 * WICHTIG: SPRACHABHÄNGIGE TEXTE
 * Die Texte (Headline, Content) werden im 'textOverlay' Slot (hero-text-overlay Element) gespeichert.
 * CMS-Elemente haben eine cms_slot_translation Tabelle, daher sind die Texte SPRACHABHÄNGIG!
 * 
 * Nicht-übersetzbare Einstellungen (Position, Farben, Animation, Höhe) werden in block.customFields gespeichert.
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
        // NICHT-ÜBERSETZBARE EINSTELLUNGEN (werden in block.customFields gespeichert)
        // Overlay position: top-left, middle-left, bottom-left, top-right, middle-right, bottom-right
        overlayPosition: {
            source: 'static',
            value: 'top-left',
        },
        // Overlay background color (accent color by default)
        overlayBackgroundColor: {
            source: 'static',
            value: '', // Leer = Theme Accent Color
        },
        // Overlay text color (white by default)
        overlayTextColor: {
            source: 'static',
            value: '#ffffff', // White
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
        // Hintergrundbild
        image: {
            type: 'image',
            default: {
                config: {
                    displayMode: { source: 'static', value: 'cover' },
                    minHeight: { source: 'static', value: '' },
                    url: { source: 'static', value: null },
                    newTab: { source: 'static', value: false },
                },
                data: {
                    media: {
                        value: CMS.MEDIA.previewMountain,
                        source: 'default',
                    },
                },
            },
        },
        // WICHTIG: Text Element für SPRACHABHÄNGIGE Texte
        // Die Config wird in cms_slot_translation.config gespeichert und ist somit übersetzbar!
        // Wir verwenden den Standard "text" Element-Typ, da dieser bereits übersetzbar ist
        // Initial HTML-Struktur für einfache Anpassung durch Nicht-Programmierer
        textOverlay: {
            type: 'text',
            default: {
                config: {
                    content: {
                        source: 'static',
                        value: '<h2 class="hero-overlay-headline" style="color: #ffffff; margin-bottom: 0;">Ihre Überschrift</h2><p class="hero-overlay-text" style="color: #ffffff;">Ihr Beschreibungstext hier eingeben...</p>',
                    },
                    // WICHTIG: Zusätzliche Config-Felder für Shopware's checkRequiredSlotConfigField
                    verticalAlign: { source: 'static', value: 'center' },
                },
            },
        },
    },
});

console.log('[HeroBlocks] ✅ Hero Image Overlay Block registered successfully');

