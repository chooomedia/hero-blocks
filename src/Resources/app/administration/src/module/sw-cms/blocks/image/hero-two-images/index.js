/**
 * Hero Block Two Images Block Registration
 * 
 * WICHTIG: Statischer Block für zwei Bilder nebeneinander
 * Gemäß Shopware Best Practices für Custom CMS Blocks
 */

// WICHTIG: Snippets werden aus Root-Snippets geladen (app/administration/src/snippet/)

// WICHTIG: Block-Komponenten immer registrieren (für dynamisches Laden)
Shopware.Component.register('sw-cms-preview-hero-two-images', () => import('./preview/index.js'));
Shopware.Component.register('sw-cms-block-hero-two-images', () => import('./component/index.js'));

// WICHTIG: Block-Sichtbarkeit basierend auf System-Config
const configKey = 'HeroBlocks.config.enableTwoImages';
let isEnabled = false;

// Versuche Config synchron zu lesen (wenn System-Config bereits geladen)
try {
    const systemConfigApi = Shopware.Service('systemConfigApiService');
    if (systemConfigApi && systemConfigApi.getValues) {
        const cachedConfig = systemConfigApi.getValues();
        if (cachedConfig && cachedConfig[configKey] !== undefined) {
            isEnabled = cachedConfig[configKey] === true;
        }
    }
} catch (e) {
    // Config noch nicht geladen - wird asynchron geladen
}

const blockConfig = {
    name: 'hero-two-images',
    label: 'sw-cms.blocks.heroBlocks.twoImages.label',
    category: 'image',
    component: 'sw-cms-block-hero-two-images',
    previewComponent: 'sw-cms-preview-hero-two-images',
    defaultConfig: {
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'boxed',
    },
    slots: {
        left: {
            type: 'image',
            default: {
                config: {
                    displayMode: { source: 'static', value: 'cover' },
                    minHeight: { source: 'static', value: '340px' },
                },
            },
        },
        right: {
            type: 'image',
            default: {
                config: {
                    displayMode: { source: 'static', value: 'cover' },
                    minHeight: { source: 'static', value: '340px' },
                },
            },
        },
    },
};

// Block registrieren
Shopware.Service('cmsService').registerCmsBlock(blockConfig);

// WICHTIG: Block-Sichtbarkeit dynamisch aktualisieren wenn System-Config geladen wird
Shopware.Service('systemConfigApiService').getValues('HeroBlocks.config').then((values) => {
    if (values && values[configKey] !== undefined) {
        const enabled = values[configKey] === true;
        const blockRegistry = Shopware.Service('cmsService').getCmsBlockRegistry();
        if (blockRegistry['two-images']) {
            blockRegistry['two-images'].hidden = !enabled;
        }
    }
}).catch(() => {
    // Config noch nicht verfügbar - Block bleibt versteckt
});

