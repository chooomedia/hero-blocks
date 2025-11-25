/**
 * Hero Block Category Slider Block Registration
 * 
 * WICHTIG: Block wird nur angezeigt wenn enableCategorySlider aktiviert ist
 * Gemäß Shopware Best Practices für Custom CMS Blocks
 */

// WICHTIG: Snippets importieren und registrieren (für Übersetzungen)
import deDE from '../../../snippet/de-DE.json';
import enGB from '../../../snippet/en-GB.json';

// Snippets registrieren
Shopware.Locale.extend('de-DE', deDE);
Shopware.Locale.extend('en-GB', enGB);

// WICHTIG: Block-Komponenten immer registrieren (für dynamisches Laden)
Shopware.Component.register('sw-cms-preview-hero-category-slider', () => import('./preview/index.js'));
Shopware.Component.register('sw-cms-block-hero-category-slider', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-block-config-hero-category-slider', () => import('./config/index.js'));

// WICHTIG: Block-Sichtbarkeit basierend auf System-Config
// Prüfe Config synchron (wenn bereits geladen) oder asynchron
const configKey = 'HeroBlocks.config.enableCategorySlider';
let isEnabled = false;

// WICHTIG: Config wird asynchron geladen (siehe unten)
// Kein synchroner getValues() Aufruf ohne Parameter (verursacht 400 Fehler)

// WICHTIG: Block registrieren (ohne hidden Flag - wie Mega Menu)
// Sichtbarkeit wird über System-Config Watcher gesteuert
/**
 * @private
 */
const blockConfig = {
    name: 'hero-category-slider',
    label: 'sw-cms.blocks.heroBlocks.categorySlider.label',
    category: 'image',
    component: 'sw-cms-block-hero-category-slider',
    previewComponent: 'sw-cms-preview-hero-category-slider',
    configComponent: 'sw-cms-block-config-hero-category-slider',
    defaultConfig: {
        // WICHTIG: Nur Standard Block-Settings (Margins, Sizing)
        // ALLE Custom Settings (Category, Image Count, Navigation, etc.) sind im Element-Modal!
        marginBottom: '0',
        marginTop: '0',
        marginLeft: null,
        marginRight: null,
        sizingMode: 'boxed',
    },
    slots: {
        categoryImages: {
            type: 'hero-category-slider', // WICHTIG: Eigenes Category Slider Element (nicht image-gallery)
            default: {
                // WICHTIG: Default-Config wird aus Element-Registrierung geladen (siehe elements/hero-category-slider/index.js)
                // Alle Settings werden im Element-Modal konfiguriert
                config: {},
                data: {
                    category: null,
                    categoryImages: [],
                },
            },
        },
    },
    // WICHTIG: Block NICHT mit hidden Flag registrieren
    // Sichtbarkeit wird über sw-cms-sidebar Override gesteuert (basierend auf System-Config)
    // hidden: false, // Block wird immer registriert, Sichtbarkeit über Sidebar Override
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
        if (blockRegistry['hero-category-slider']) {
            blockRegistry['hero-category-slider'].hidden = !enabled;
        }
    }
}).catch(() => {
    // Config noch nicht verfügbar - Block bleibt versteckt (hidden: true)
    // Block wird nach System-Config Änderung und Reload sichtbar gemacht
});

