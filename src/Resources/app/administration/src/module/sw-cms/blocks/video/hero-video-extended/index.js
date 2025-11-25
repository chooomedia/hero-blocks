/**
 * Hero Video Extended Block Registration
 * 
 * WICHTIG: Block ist aktuell disabled (Coming Soon)
 * Wird über System-Config gesteuert: HeroBlocks.config.enableHeroVideoExtended
 */

import './component';
import './preview';
import './config';

// Register Component
Shopware.Component.register('sw-cms-block-hero-video-extended', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-preview-hero-video-extended', () => import('./preview/index.js'));
Shopware.Component.register('sw-cms-block-config-hero-video-extended', () => import('./config/index.js'));

// WICHTIG: Block-Sichtbarkeit basierend auf System-Config
const configKey = 'HeroBlocks.config.enableHeroVideoExtended';

/**
 * @private
 */
const blockConfig = {
    name: 'hero-video-extended',
    label: 'sw-cms.blocks.heroBlocks.heroVideoExtended.label',
    category: 'video', // WICHTIG: Video Category für Sidebar-Auswahl
    component: 'sw-cms-block-hero-video-extended',
    previewComponent: 'sw-cms-preview-hero-video-extended',
    configComponent: 'sw-cms-block-config-hero-video-extended',
    defaultConfig: {
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'full_width',
    },
    slots: {
        video: {
            type: 'video', // WICHTIG: Verwendet Shopware Standard Video Element
            default: {
                config: {
                    // Video Settings
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
                    controls: {
                        source: 'static',
                        value: false,
                    },
                },
                data: {},
            },
        },
        content: {
            type: 'text',
            default: {
                config: {
                    content: {
                        source: 'static',
                        value: '<h2>Hero Video</h2><p>Your message here</p>',
                    },
                },
                data: {},
            },
        },
    },
};

// Block registrieren
Shopware.Service('cmsService').registerCmsBlock(blockConfig);

console.log('[HeroBlocks] Hero Video Extended Block registered (disabled, coming soon)');

