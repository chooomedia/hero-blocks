/**
 * Hero Shopping Experience Block
 * 
 * WICHTIG: Dieser Block ist aktuell DISABLED (In Vorbereitung)
 * Plugin-Setting: HeroBlocks.config.enableShoppingExperience (disabled=true)
 * 
 * TODO: Block wird in einer zukünftigen Version aktiviert
 * - Theme-spezifische Shopping Experience Blöcke
 * - Produkt-Slider + Content Kombinationen
 * - Erweiterte Layout-Optionen
 * 
 * HINWEIS: Da Block aktuell disabled ist (config.xml), wird er NICHT registriert
 * Um zu aktivieren: disabled="false" in config.xml setzen
 */

// WICHTIG: Block-Registrierung ist auskommentiert da Feature in Vorbereitung ist
// Uncomment when ready to activate:
/*
import './component';
import './preview';
import './config';

// Register Components
Shopware.Component.register('sw-cms-block-hero-shopping-experience', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-preview-hero-shopping-experience', () => import('./preview/index.js'));
Shopware.Component.register('sw-cms-block-config-hero-shopping-experience', () => import('./config/index.js'));

// Block Configuration
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
                        value: '<h2>Advanced Theme Shopping Experience</h2><p>In Vorbereitung / In Preparation</p>',
                    },
                },
                data: {},
            },
        },
    },
};

// Register Block
Shopware.Service('cmsService').registerCmsBlock(blockConfig);
console.log('[HeroBlocks] ✓ Hero Shopping Experience Block registered');
*/

console.log('[HeroBlocks] ⚠ Hero Shopping Experience Block NOT registered (feature in preparation)');

