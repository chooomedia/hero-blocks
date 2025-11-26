/**
 * Category Slider Element Registration - V3.0 SLIDE MANAGEMENT
 * 
 * WICHTIG: Slide-basiertes System wie Hero Slider
 * Jede Kategorie = 1 Slide mit individuellen Settings
 * 
 * V3.0 CHANGES:
 * - categoryIds → categorySlides (Array von Slide-Objekten)
 * - Pro Slide: Category + Custom Title/Image/Text/Link
 * - Full Hero-Slider-Style Management UI
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
        // V3.0 - SLIDE-BASED SYSTEM (wie Hero Slider)
        // WICHTIG: Jedes Slide = 1 Kategorie + Custom Overrides
        categorySlides: {
            source: 'static',
            value: [], // Array von Slide-Objekten: [{ categoryId, customTitle, customImageId, customText, customLink }, ...]
        },
        
        // DEPRECATED (for backward compatibility - wird zu Slides migriert)
        categoryIds: {
            source: 'static',
            value: [],
        },
        
        // WICHTIG: Subcategory Levels (Feature aus Shopware Store Extension)
        // 0 = keine Subkategorien, 1-5 = Anzahl der Ebenen
        subcategoryLevels: {
            source: 'static',
            value: 0,
        },
        
        // WICHTIG: Image Count (1-4) - wie viele Slides pro View
        imageCount: {
            source: 'static',
            value: '1', // '1', '2', '3', or '4'
        },
        
        // WICHTIG: Image Width
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
            value: 'bottom',
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
        // V3.0 - Slides-basiertes Enrichment
        if (!slot || !slot.config || Object.keys(data).length < 1) {
            return;
        }

        // MIGRATION: Alte categoryIds zu categorySlides konvertieren (Backward Compatibility)
        if (slot.config.categoryIds?.value?.length > 0 && (!slot.config.categorySlides?.value || slot.config.categorySlides.value.length === 0)) {
            console.log('[CategorySlider] Migrating old categoryIds to categorySlides...');
            slot.config.categorySlides = {
                source: 'static',
                value: slot.config.categoryIds.value.map((categoryId) => ({
                    categoryId: categoryId,
                    customTitle: null,
                    customImageId: null,
                    customText: null,
                    customLink: null,
                })),
            };
        }

        // Initialize categorySlides wenn nicht vorhanden
        if (!slot.config.categorySlides) {
            slot.config.categorySlides = {
                source: 'static',
                value: [],
            };
            return;
        }

        // Lade Category-Entities für ALLE Slides (für Admin Preview)
        const slides = slot.config.categorySlides.value;
        if (!Array.isArray(slides) || slides.length === 0) {
            slot.data.categorySlides = [];
            return;
        }

        // Sammle alle Category IDs aus Slides
        const categoryIds = slides
            .map((slide) => slide.categoryId)
            .filter((id) => id); // Filter null/undefined

        if (categoryIds.length === 0) {
            slot.data.categorySlides = [];
            return;
        }

        // Lade Categories aus data (kommt vom CMS Service)
        const entityKey = 'entity-category-0';
        if (data[entityKey]) {
            slot.data.categorySlides = slides.map((slide) => {
                const category = data[entityKey].get(slide.categoryId);
                return {
                    ...slide, // Spread slide config (customTitle, customText, customLink, etc.)
                    category: category || null, // Category-Entity anhängen
                };
            });
            console.log('[CategorySlider V3.0] Enriched slides for preview:', slot.data.categorySlides);
        } else {
            slot.data.categorySlides = [];
        }
    },
});

