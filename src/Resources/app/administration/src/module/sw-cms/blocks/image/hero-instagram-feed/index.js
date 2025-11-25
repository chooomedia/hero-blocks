/**
 * Hero Instagram Feed Block Registration
 * 
 * WICHTIG: Block wird nur angezeigt wenn enableHeroInstagramFeed aktiviert ist
 * Gemäß Shopware Best Practices für Custom CMS Blocks
 */

// Note: Import and register snippets for translations
import deDE from '../../../snippet/de-DE.json';
import enGB from '../../../snippet/en-GB.json';

// Register snippets
Shopware.Locale.extend('de-DE', deDE);
Shopware.Locale.extend('en-GB', enGB);

// WICHTIG: Block-Komponenten immer registrieren (für dynamisches Laden)
Shopware.Component.register('sw-cms-preview-hero-instagram-feed', () => import('./preview/index.js'));
Shopware.Component.register('sw-cms-block-hero-instagram-feed', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-block-config-hero-instagram-feed', () => import('./config/index.js'));

// WICHTIG: Block-Sichtbarkeit basierend auf System-Config
// Prüfe Config synchron (wenn bereits geladen) oder asynchron
const configKey = 'HeroBlocks.config.enableHeroInstagramFeed';
let isEnabled = false;

// WICHTIG: Config wird asynchron geladen (siehe unten)
// Kein synchroner getValues() Aufruf ohne Parameter (verursacht 400 Fehler)

/**
 * @private
 */
const blockConfig = {
    name: 'hero-instagram-feed',
    label: 'sw-cms.blocks.heroBlocks.heroInstagramFeed.label',
    category: 'image',
    component: 'sw-cms-block-hero-instagram-feed',
    previewComponent: 'sw-cms-preview-hero-instagram-feed',
    configComponent: 'sw-cms-block-config-hero-instagram-feed',
    defaultConfig: {
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'boxed',
        // WICHTIG: Instagram Feed spezifische Config (wird in block.customFields gespeichert)
        postLimit: {
            source: 'static',
            value: 12, // Anzahl der Posts (wird aus System-Config gelesen, kann hier überschrieben werden)
        },
        displayMode: {
            source: 'static',
            value: 'grid', // 'grid' oder 'slider'
        },
        columns: {
            source: 'static',
            value: 4, // Anzahl Spalten im Grid (1-6)
        },
        showCaptions: {
            source: 'static',
            value: true, // Captions anzeigen
        },
        showLikes: {
            source: 'static',
            value: false, // Likes anzeigen
        },
        showComments: {
            source: 'static',
            value: false, // Kommentare anzeigen
        },
        // Slider-spezifische Config (wenn displayMode = 'slider')
        navigationArrows: {
            source: 'static',
            value: 'outside', // 'none', 'inside', 'outside'
        },
        navigationDots: {
            source: 'static',
            value: true, // true oder false
        },
        autoSlide: {
            source: 'static',
            value: false,
        },
        autoplayTimeout: {
            source: 'static',
            value: 5000,
        },
        speed: {
            source: 'static',
            value: 300,
        },
    },
    slots: {
        // WICHTIG: Instagram Feed Block hat keine Slots - Daten kommen von API
        // Block rendert direkt Instagram Posts
    },
    // WICHTIG: Block NICHT mit hidden Flag registrieren
    // Sichtbarkeit wird über sw-cms-sidebar Override gesteuert (basierend auf System-Config)
};

// Block registrieren
Shopware.Service('cmsService').registerCmsBlock(blockConfig);

// WICHTIG: Block-Sichtbarkeit dynamisch aktualisieren wenn System-Config geladen wird
// WICHTIG: getValues erwartet Domain-String (z.B. 'HeroBlocks.config'), nicht Array von Keys
Shopware.Service('systemConfigApiService').getValues('HeroBlocks.config').then((values) => {
    if (values && values[configKey] !== undefined) {
        const enabled = values[configKey] === true;
        // Aktualisiere Block-Sichtbarkeit nach Config-Laden
        const blockRegistry = Shopware.Service('cmsService').getCmsBlockRegistry();
        if (blockRegistry['hero-instagram-feed']) {
            blockRegistry['hero-instagram-feed'].hidden = !enabled;
        }
    }
}).catch(() => {
    // Config noch nicht verfügbar - Block bleibt versteckt (hidden: true)
    // Block wird nach System-Config Änderung und Reload sichtbar gemacht
});

