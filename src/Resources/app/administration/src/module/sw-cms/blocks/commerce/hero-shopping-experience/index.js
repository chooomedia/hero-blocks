/**
 * Hero Shopping Experience Block Registration
 * 
 * WICHTIG: Block ist aktuell disabled (In Development)
 * Wird über System-Config gesteuert: HeroBlocks.config.enableShoppingExperience
 */

import './component';
import './preview';
import './config';

// Register Component
Shopware.Component.register('sw-cms-block-hero-shopping-experience', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-preview-hero-shopping-experience', () => import('./preview/index.js'));
Shopware.Component.register('sw-cms-block-config-hero-shopping-experience', () => import('./config/index.js'));

// WICHTIG: Block-Sichtbarkeit basierend auf System-Config
const configKey = 'HeroBlocks.config.enableShoppingExperience';

/**
 * @private
 */
const blockConfig = {
    name: 'hero-shopping-experience',
    label: 'sw-cms.blocks.heroBlocks.heroShoppingExperience.label',
    category: 'commerce',
    component: 'sw-cms-block-hero-shopping-experience',
    previewComponent: 'sw-cms-preview-hero-shopping-experience',
    configComponent: 'sw-cms-block-config-hero-shopping-experience',
    defaultConfig: {
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'boxed',
    },
    slots: {
        products: {
            type: 'product-slider',
            default: {
                config: {
                    // Product Slider Settings
                    products: {
                        source: 'static',
                        value: [],
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
                        value: '<h2>Shopping Experience</h2><p>In Development</p>',
                    },
                },
                data: {},
            },
        },
    },
};

// Block registrieren
Shopware.Service('cmsService').registerCmsBlock(blockConfig);

console.log('[HeroBlocks] Hero Shopping Experience Block registered (disabled, in development)');

