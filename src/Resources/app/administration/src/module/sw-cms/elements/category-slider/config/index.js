import template from './sw-cms-el-config-category-slider.html.twig';
import './sw-cms-el-config-category-slider.scss';

// WICHTIG: Snippets werden bereits in elements/category-slider/index.js registriert
// Keine doppelte Registrierung hier nötig!

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
        // WICHTIG: Lade Category Collection neu, wenn categoryIds geändert wird
        selectedCategoryIds: {
            handler(newValue) {
                if (newValue && newValue.length > 0) {
                    this.loadCategories(newValue);
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
        
        // WICHTIG: Multi-Select Kategorie-Auswahl (aus Element-Config) mit getter/setter für v-model
        selectedCategoryIds: {
            get() {
                return this.element?.config?.categoryIds?.value || [];
            },
            set(value) {
                if (!this.element?.config?.categoryIds) {
                    this.$set(this.element.config, 'categoryIds', {
                        source: 'static',
                        value: [],
                        entity: {
                            name: 'category',
                        },
                    });
                }
                this.element.config.categoryIds.value = value || [];
                console.log('[CategorySlider Config] selectedCategoryIds set:', value);
                this.emitUpdateEl();
            }
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
            
            // DEBUG: Console-Log für Debugging
            console.log('[CategorySlider Config] Mounted:', {
                categoryCollection: this.categoryCollection,
                categoryCriteria: this.categoryCriteria,
                selectedCategoryId: this.selectedCategoryId
            });
        });
    },
    
    methods: {
        createdComponent() {
            this.initElementConfig('category-slider');
            
            // Category Criteria für Kategorie-Auswahl
            // WICHTIG: Erlaube Standard-Kategorien (page) und Landing Page Kategorien (landing_page)
            // WICHTIG: translations association für sw-entity-single-select
            // WICHTIG: media association für Dropdown-Bilder
            // WICHTIG: Filter nach Kategorien mit Media (mediaId IS NOT NULL)
            if (!this.categoryCriteria) {
                this.categoryCriteria = new Criteria(1, 500);
                this.categoryCriteria.addFilter(Criteria.equals('active', true));
                this.categoryCriteria.addFilter(
                    Criteria.multi('OR', [
                        Criteria.equals('type', 'page'),
                        Criteria.equals('type', 'landing_page'),
                    ])
                );
                // WICHTIG: Nur Kategorien mit Media anzeigen (mediaId IS NOT NULL)
                // Syntax: Criteria.not('AND', [Criteria.equals('mediaId', null)]) = "NOT (mediaId = null)" = "mediaId IS NOT NULL"
                this.categoryCriteria.addFilter(Criteria.not('AND', [Criteria.equals('mediaId', null)]));
                
                // WICHTIG: Associations für sw-entity-single-select
                this.categoryCriteria.addAssociation('translations');
                this.categoryCriteria.addAssociation('media');
                this.categoryCriteria.addAssociation('media.thumbnails');
                
                this.categoryCriteria.addSorting(Criteria.sort('name', 'ASC'));
                
                console.log('[CategorySlider Config] Criteria created:', this.categoryCriteria);
            }
            
            // Category Collection initialisieren (immer EntityCollection)
            if (!this.categoryCollection) {
                this.categoryCollection = this.categoryRepository.create();
            }
            
            // Wenn Kategorien bereits ausgewählt, lade sie
            if (this.selectedCategoryIds && this.selectedCategoryIds.length > 0) {
                this.loadCategories(this.selectedCategoryIds);
            }
        },
        
        async loadCategories(categoryIds) {
            console.log('[CategorySlider Config] loadCategories called:', categoryIds);
            
            if (!categoryIds || categoryIds.length === 0) {
                this.categoryCollection = this.categoryRepository.create();
                console.log('[CategorySlider Config] Empty categoryCollection created');
                return;
            }
            
            try {
                const criteria = new Criteria();
                criteria.addFilter(Criteria.equalsAny('id', categoryIds));
                criteria.addAssociation('translations');
                criteria.addAssociation('media');
                criteria.addAssociation('media.thumbnails');
                
                const categories = await this.categoryRepository.search(criteria, Shopware.Context.api);
                console.log('[CategorySlider Config] Categories loaded:', categories);
                
                if (categories && categories.length > 0) {
                    this.categoryCollection = categories;
                    console.log('[CategorySlider Config] Categories added to collection:', this.categoryCollection);
                } else {
                    this.categoryCollection = this.categoryRepository.create();
                    console.warn('[CategorySlider Config] Categories not found:', categoryIds);
                }
            } catch (error) {
                console.error('[CategorySlider Config] Error loading categories:', error);
                this.categoryCollection = this.categoryRepository.create();
            }
        },
        
        async onCategoryChange(categoryIds) {
            console.log('[CategorySlider Config] onCategoryChange called:', categoryIds);
            
            // selectedCategoryIds setter wird automatisch aufgerufen
            this.selectedCategoryIds = categoryIds || [];
            
            // Category Collection aktualisieren
            if (categoryIds && categoryIds.length > 0) {
                await this.loadCategories(categoryIds);
            } else {
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

