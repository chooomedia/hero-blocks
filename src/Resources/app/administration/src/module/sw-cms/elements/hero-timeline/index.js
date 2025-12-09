/**
 * Hero Timeline Element Registration
 * - Provides configurable timeline items (year, title, text, media gallery)
 * - Uses custom TypeDataResolver to enrich media entities
 * 
 * WICHTIG: defaultConfig MUSS korrekte Struktur haben, um "reading 'entity'" Fehler zu vermeiden!
 */

Shopware.Component.register('sw-cms-el-hero-timeline', () => import('./component'));
Shopware.Component.register('sw-cms-el-config-hero-timeline', () => import('./config'));
Shopware.Component.register('sw-cms-el-preview-hero-timeline', () => import('./preview'));

Shopware.Service('cmsService').registerCmsElement({
    name: 'hero-timeline',
    label: 'sw-cms.elements.heroTimeline.label',
    component: 'sw-cms-el-hero-timeline',
    configComponent: 'sw-cms-el-config-hero-timeline',
    previewComponent: 'sw-cms-el-preview-hero-timeline',
    defaultConfig: {
        timelineItems: {
            source: 'static',
            value: [],
        },
        verticalAlign: {
            source: 'static',
            value: 'center',
        },
    },
    // WICHTIG: Keine entity-Referenz in defaultData, da timelineItems ein Array ist
    defaultData: {
        timelineItems: [],
    },
});
