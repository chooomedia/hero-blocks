/**
 * Category Slider Element Registration
 * 
 * WICHTIG: Eigenes Element für Category Slider (nicht image-gallery)
 * Zeigt Category Slider spezifische Config (Kategorie-Auswahl, Image Count, etc.)
 * 
 * WICHTIG: Snippets werden bereits in main.js registriert (VOR diesem Import)
 * Keine doppelte Registrierung hier nötig!
 */

Shopware.Component.register('sw-cms-el-hero-category-slider', () => import('./component/index.js'));
Shopware.Component.register('sw-cms-el-config-hero-category-slider', () => import('./config/index.js'));
Shopware.Component.register('sw-cms-el-preview-hero-category-slider', () => import('./preview/index.js'));

Shopware.Service('cmsService').registerCmsElement({
    name: 'hero-category-slider',
    label: 'sw-cms.elements.categorySlider.label',
    component: 'sw-cms-el-hero-category-slider',
    configComponent: 'sw-cms-el-config-hero-category-slider',
    previewComponent: 'sw-cms-el-preview-hero-category-slider',
    defaultConfig: {
        // WICHTIG: Category Slider verwendet Kategorie-Bilder (nicht manuelle Media-Auswahl)
        // Bilder werden aus den ausgewählten Kategorien geladen
        categoryIds: {
            source: 'static',
            value: [],
            entity: {
                name: 'category',
            },
        },
        // WICHTIG: Subcategory Levels (Feature aus Shopware Store Extension)
        // 0 = keine Subkategorien, 1-5 = Anzahl der Ebenen
        subcategoryLevels: {
            source: 'static',
            value: 0,
        },
        // WICHTIG: Image Count (1 or 2) - aus Block-Config ins Modal verschoben
        imageCount: {
            source: 'static',
            value: '1', // '1' or '2'
        },
        // WICHTIG: Image Width - aus Block-Config ins Modal verschoben
        imageWidth: {
            source: 'static',
            value: 'inner-full-width', // 'inner-full-width' or 'full-width'
        },
        // Slider Settings (alle im Modal verfügbar)
        navigationArrows: {
            source: 'static',
            value: 'outside',
        },
        navigationDots: {
            source: 'static',
            value: 'bottom', // WICHTIG: Wie Hero Slider - 'none' oder 'bottom'
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
        displayMode: {
            source: 'static',
            value: 'cover',
        },
        minHeight: {
            source: 'static',
            value: '340px',
        },
    },
    enrich: function enrich(slot, data) {
        // WICHTIG: Category Slider lädt Bilder aus den ausgewählten Kategorien
        // Die Bilder werden über TypeDataResolver geladen (siehe CategorySliderTypeDataResolver)
        if (!slot || !slot.config || Object.keys(data).length < 1) {
            return;
        }

        // WICHTIG: Sicherstellen, dass categoryIds korrekt initialisiert ist
        if (!slot.config.categoryIds || typeof slot.config.categoryIds !== 'object') {
            slot.config.categoryIds = {
                source: 'static',
                value: [],
                entity: {
                    name: 'category',
                },
            };
            return;
        }

        // WICHTIG: Sicherstellen, dass entity definiert ist
        if (!slot.config.categoryIds.entity) {
            slot.config.categoryIds.entity = {
                name: 'category',
            };
        }

        // Kategorien-Entities laden (wenn categoryIds vorhanden)
        if (slot.config.categoryIds.value && Array.isArray(slot.config.categoryIds.value) && slot.config.categoryIds.value.length > 0) {
            const entity = slot.config.categoryIds.entity;
            const entityKey = `entity-${entity.name}-0`;
            
            if (data[entityKey]) {
                // Multi-Select: Lade alle ausgewählten Kategorien
                slot.data.categories = [];
                slot.config.categoryIds.value.forEach((categoryId) => {
                    const category = data[entityKey].get(categoryId);
                    if (category) {
                        slot.data.categories.push(category);
                    }
                });
            }
        }
    },
});

