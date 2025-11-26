/**
 * Hero Instagram Feed Element Registration
 * 
 * WICHTIG: Element (nicht Block) - wird in Block-Slot eingebettet
 * TypeDataResolver lädt Instagram Posts in element.data.instagramPosts
 */

// Component Registrierung
Shopware.Component.register('sw-cms-el-hero-instagram-feed', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-el-config-hero-instagram-feed', () => import('./config/index.js'));
Shopware.Component.register('sw-cms-el-preview-hero-instagram-feed', () => import('./preview/index.js'));

// Element Registrierung
Shopware.Service('cmsService').registerCmsElement({
    name: 'hero-instagram-feed',
    label: 'sw-cms.elements.heroInstagramFeed.label',
    component: 'sw-cms-el-hero-instagram-feed',
    configComponent: 'sw-cms-el-config-hero-instagram-feed',
    previewComponent: 'sw-cms-el-preview-hero-instagram-feed',
    defaultConfig: {
        // WICHTIG: Element-Config (falls nötig - meiste Config kommt vom Block)
        // Element dient nur als Slot-Platzhalter, Block hat die eigentliche Config
    },
    // WICHTIG: Keine enrich-Funktion nötig - TypeDataResolver macht das
});

