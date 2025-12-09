/**
 * Hero Timeline Block Registration
 * - Displays a hero timeline with year navigation, text and image slider
 * - Visibility controlled via system config enableHeroTimeline
 * 
 * WICHTIG: Slot-Definition MUSS default.config haben, um "reading 'entity'" Fehler zu vermeiden!
 */

// Components
Shopware.Component.register('sw-cms-preview-hero-timeline', () => import('./preview'));
Shopware.Component.register('sw-cms-block-hero-timeline', () => import('./component'));

const configKey = 'HeroBlocks.config.enableHeroTimeline';

const blockConfig = {
    name: 'hero-timeline',
    label: 'sw-cms.blocks.heroBlocks.heroTimeline.label',
    category: 'text-image',
    component: 'sw-cms-block-hero-timeline',
    previewComponent: 'sw-cms-preview-hero-timeline',
    defaultConfig: {
        marginBottom: '20px',
        marginTop: '20px',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'boxed',
    },
    slots: {
        timeline: {
            type: 'hero-timeline',
            default: {
                config: {
                    timelineItems: {
                        source: 'static',
                        value: [],
                    },
                    verticalAlign: {
                        source: 'static',
                        value: 'center',
                    },
                },
                data: {
                    timelineItems: [],
                },
            },
        },
    },
    hidden: false,
};

Shopware.Service('cmsService').registerCmsBlock(blockConfig);

Shopware.Service('systemConfigApiService')
    .getValues('HeroBlocks.config')
    .then((values) => {
        if (values && values[configKey] !== undefined) {
            const enabled = values[configKey] === true;
            const blockRegistry = Shopware.Service('cmsService').getCmsBlockRegistry();
            if (blockRegistry['hero-timeline']) {
                blockRegistry['hero-timeline'].hidden = !enabled;
            }
        }
    })
    .catch(() => {
        // Leave default visibility if config cannot be loaded
    });
