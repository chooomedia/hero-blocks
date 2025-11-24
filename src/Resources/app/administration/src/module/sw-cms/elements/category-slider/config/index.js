import template from './sw-cms-el-config-category-slider.html.twig';
import './sw-cms-el-config-category-slider.scss';

// WICHTIG: Snippets importieren und registrieren (für Übersetzungen)
// WICHTIG: Pfad von config/ aus: ../../../snippet/
import deDE from '../../../snippet/de-DE.json';
import enGB from '../../../snippet/en-GB.json';

// Snippets registrieren
Shopware.Locale.extend('de-DE', deDE);
Shopware.Locale.extend('en-GB', enGB);

const { Mixin } = Shopware;
const Criteria = Shopware.Data.Criteria;

export default {
    template,
    
    inject: ['repositoryFactory', 'cmsService', 'cmsPageState'],
    
    mixins: [
        Mixin.getByName('cms-element'),
        Mixin.getByName('notification'),
    ],
    
    emits: ['element-update'],
    
    props: {
        element: {
            type: Object,
            required: true,
            default() {
                return {
                    config: {},
                };
            },
        },
    },
    
    data() {
        return {
            categoryCollection: null,
            categoryCriteria: null,
        };
    },
    
    watch: {
        // WICHTIG: Lade Category Collection neu, wenn categoryId geändert wird
        selectedCategoryId: {
            handler(newValue) {
                if (newValue) {
                    this.loadCategory(newValue);
                } else {
                    this.categoryCollection = this.categoryRepository.create();
                }
            },
            immediate: false,
        },
    },
    
    computed: {
        categoryRepository() {
            return this.repositoryFactory.create('category');
        },
        
        // WICHTIG: Kategorie-Auswahl (aus Element-Config)
        selectedCategoryId() {
            return this.element?.config?.categoryId?.value || null;
        },
        
        // Navigation Arrows Options (wie Hero Slider - Standard Shopware Keys)
        navigationArrowsOptions() {
            if (!this.$tc) {
                return [];
            }
            return [
                {
                    value: 'none',
                    label: this.$tc('sw-cms.elements.imageSlider.config.label.navigationPositionNone'),
                },
                {
                    value: 'inside',
                    label: this.$tc('sw-cms.elements.imageSlider.config.label.navigationPositionInside'),
                },
                {
                    value: 'outside',
                    label: this.$tc('sw-cms.elements.imageSlider.config.label.navigationPositionOutside'),
                },
            ];
        },
        
        // Display Mode Options (wie Hero Slider - Standard Shopware Keys)
        displayModeOptions() {
            if (!this.$tc) {
                return [];
            }
            return [
                {
                    value: 'standard',
                    label: this.$tc('sw-cms.elements.image.config.label.displayModeStandard'),
                },
                {
                    value: 'cover',
                    label: this.$tc('sw-cms.elements.image.config.label.displayModeCover'),
                },
                {
                    value: 'contain',
                    label: this.$tc('sw-cms.elements.image.config.label.displayModeContain'),
                },
            ];
        },
        
        // Navigation Dots Options (wie Hero Slider - Standard Shopware Keys)
        navigationDotsOptions() {
            if (!this.$tc) {
                return [];
            }
            return [
                {
                    value: 'none',
                    label: this.$tc('sw-cms.elements.imageSlider.config.label.navigationPositionNone'),
                },
                {
                    value: 'bottom',
                    label: this.$tc('sw-cms.elements.imageSlider.config.label.navigationPositionBottom'),
                },
            ];
        },
        
        // WICHTIG: Image Count Options (1 or 2) - aus Block-Config ins Modal verschoben
        imageCountOptions() {
            if (!this.$tc) {
                return [];
            }
            return [
                {
                    value: '1',
                    label: this.$tc('sw-cms.elements.categorySlider.config.imageCount.options.one'),
                },
                {
                    value: '2',
                    label: this.$tc('sw-cms.elements.categorySlider.config.imageCount.options.two'),
                },
            ];
        },
        
        // WICHTIG: Image Width Options - aus Block-Config ins Modal verschoben
        imageWidthOptions() {
            if (!this.$tc) {
                return [];
            }
            return [
                {
                    value: 'inner-full-width',
                    label: this.$tc('sw-cms.elements.categorySlider.config.imageWidth.options.innerFullWidth'),
                },
                {
                    value: 'full-width',
                    label: this.$tc('sw-cms.elements.categorySlider.config.imageWidth.options.fullWidth'),
                },
            ];
        },
    },
    
    created() {
        this.createdComponent();
    },
    
    mounted() {
        // WICHTIG: Stelle sicher, dass categoryCollection nach Mount initialisiert ist
        this.$nextTick(() => {
            if (!this.categoryCollection) {
                this.categoryCollection = this.categoryRepository.create();
            }
            if (!this.categoryCriteria) {
                this.createdComponent();
            }
        });
    },
    
    methods: {
        createdComponent() {
            this.initElementConfig('category-slider');
            
            // Category Criteria für Kategorie-Auswahl
            // WICHTIG: Erlaube Standard-Kategorien (page) und Landing Page Kategorien (landing_page)
            if (!this.categoryCriteria) {
                this.categoryCriteria = new Criteria(1, 500);
                this.categoryCriteria.addFilter(Criteria.equals('active', true));
                this.categoryCriteria.addFilter(
                    Criteria.multi('OR', [
                        Criteria.equals('type', 'page'),
                        Criteria.equals('type', 'landing_page'),
                    ])
                );
                this.categoryCriteria.addSorting(Criteria.sort('name', 'ASC'));
            }
            
            // Category Collection initialisieren (immer EntityCollection)
            if (!this.categoryCollection) {
                this.categoryCollection = this.categoryRepository.create();
            }
            
            // Wenn Kategorie bereits ausgewählt, lade sie
            if (this.selectedCategoryId) {
                this.loadCategory(this.selectedCategoryId);
            }
        },
        
        async loadCategory(categoryId) {
            if (!categoryId) {
                // WICHTIG: categoryCollection immer als EntityCollection initialisieren
                this.categoryCollection = this.categoryRepository.create();
                return;
            }
            
            try {
                // WICHTIG: translations association hinzufügen, damit translated.name verfügbar ist
                const criteria = new Criteria();
                criteria.addAssociation('translations');
                criteria.addAssociation('media');
                const category = await this.categoryRepository.get(categoryId, Shopware.Context.api, criteria);
                if (category) {
                    // WICHTIG: categoryCollection immer als EntityCollection initialisieren
                    this.categoryCollection = this.categoryRepository.create();
                    this.categoryCollection.add(category);
                } else {
                    // Fallback: Leere EntityCollection wenn Kategorie nicht gefunden
                    this.categoryCollection = this.categoryRepository.create();
                }
            } catch (error) {
                console.error('Error loading category:', error);
                // WICHTIG: categoryCollection immer als EntityCollection initialisieren
                this.categoryCollection = this.categoryRepository.create();
            }
        },
        
        async onCategoryChange(category) {
            // WICHTIG: category kann ein Array sein (selection-add) oder null (selection-remove)
            let categoryId = null;
            
            if (Array.isArray(category) && category.length > 0) {
                // selection-add: category ist ein Array mit der ausgewählten Kategorie
                categoryId = category[0].id;
            } else if (category && category.id) {
                // Fallback: category ist direkt die Entity
                categoryId = category.id;
            } else if (category === null) {
                // selection-remove: category ist null
                categoryId = null;
            }
            
            // Element config aktualisieren
            if (!this.element.config.categoryId) {
                this.$set(this.element.config, 'categoryId', {
                    source: 'static',
                    value: null,
                    entity: {
                        name: 'category',
                    },
                });
            }
            this.element.config.categoryId.value = categoryId;
            
            // WICHTIG: Category Collection aktualisieren (lade Kategorie neu mit translations)
            if (categoryId) {
                await this.loadCategory(categoryId);
            } else {
                // WICHTIG: categoryCollection immer als EntityCollection initialisieren
                this.categoryCollection = this.categoryRepository.create();
            }
            
            this.emitUpdateEl();
        },
        
        onChangeNavigationArrows(value) {
            if (!this.element?.config?.navigationArrows) return;
            this.element.config.navigationArrows.value = value;
            this.emitUpdateEl();
        },
        
        onChangeNavigationDots(value) {
            if (!this.element?.config?.navigationDots) return;
            // WICHTIG: navigationDots kann 'none' oder 'bottom' sein (wie Hero Slider)
            this.element.config.navigationDots.value = value;
            this.emitUpdateEl();
        },
        
        onChangeAutoSlide(value) {
            if (!this.element?.config?.autoSlide) return;
            this.element.config.autoSlide.value = value;
            this.emitUpdateEl();
        },
        
        onChangeAutoplayTimeout(value) {
            if (!this.element?.config?.autoplayTimeout) return;
            this.element.config.autoplayTimeout.value = value;
            this.emitUpdateEl();
        },
        
        onChangeSpeed(value) {
            if (!this.element?.config?.speed) return;
            this.element.config.speed.value = value;
            this.emitUpdateEl();
        },
        
        onChangeDisplayMode(value) {
            if (!this.element?.config?.displayMode) return;
            this.element.config.displayMode.value = value;
            this.emitUpdateEl();
        },
        
        onChangeMinHeight(value) {
            if (!this.element?.config?.minHeight) return;
            this.element.config.minHeight.value = value;
            this.emitUpdateEl();
        },
        
        // WICHTIG: Subcategory Levels Handler (Feature aus Shopware Store Extension)
        onChangeSubcategoryLevels(value) {
            if (!this.element?.config?.subcategoryLevels) return;
            this.element.config.subcategoryLevels.value = parseInt(value, 10) || 0;
            this.emitUpdateEl();
        },
        
        // WICHTIG: Image Count Handler (aus Block-Config ins Modal verschoben)
        onChangeImageCount(value) {
            if (!this.element?.config?.imageCount) return;
            this.element.config.imageCount.value = value;
            this.emitUpdateEl();
        },
        
        // WICHTIG: Image Width Handler (aus Block-Config ins Modal verschoben)
        onChangeImageWidth(value) {
            if (!this.element?.config?.imageWidth) return;
            this.element.config.imageWidth.value = value;
            this.emitUpdateEl();
        },
        
        emitUpdateEl() {
            if (!this.element) return;
            this.$emit('element-update', this.element);
        },
    },
};

