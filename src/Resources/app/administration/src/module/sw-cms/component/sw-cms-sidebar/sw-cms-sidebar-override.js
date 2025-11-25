/**
 * Override für sw-cms-sidebar
 * Filtert Blöcke basierend auf System-Config (enableCategorySlider, enableMegaMenu, etc.)
 */
Shopware.Component.override('sw-cms-sidebar', {
    data() {
        return {
            heroBlocksConfig: {
                enableCategorySlider: false,
                enableMegaMenu: false,
                enableHeroInstagramFeed: false,
            },
        };
    },

    created() {
        // WICHTIG: Lade System-Config asynchron beim Component-Erstellen
        this.loadHeroBlocksConfig();
    },

    computed: {
        cmsBlocks() {
            const currentPageType = Shopware.Store.get('cmsPage').currentPageType;

            if (!currentPageType) {
                return {};
            }

            // WICHTIG: Filtere Blöcke basierend auf System-Config
            const blocks = Object.entries(this.cmsService.getCmsBlockRegistry()).filter(
                ([
                    name,
                    block,
                ]) => {
                    // Standard-Filter: hidden und pageType
                    if (!block || block.hidden || !this.cmsService.isBlockAllowedInPageType(name, currentPageType)) {
                        return false;
                    }

                    // WICHTIG: Zusätzliche Filter für Hero Blocks basierend auf System-Config
                    // Hero Block Category Slider Block
                    if (name === 'hero-category-slider') {
                        if (!this.heroBlocksConfig.enableCategorySlider) {
                            return false;
                        }
                    }

                    // Mega Menu Block
                    if (name === 'hero-mega-menu') {
                        if (!this.heroBlocksConfig.enableMegaMenu) {
                            return false;
                        }
                    }

                    // Instagram Feed Block
                    if (name === 'hero-instagram-feed') {
                        if (!this.heroBlocksConfig.enableHeroInstagramFeed) {
                            return false;
                        }
                    }

                    return true;
                },
            );

            return Object.fromEntries(blocks);
        },
    },

    methods: {
        async loadHeroBlocksConfig() {
            try {
                const systemConfigApi = Shopware.Service('systemConfigApiService');
                if (!systemConfigApi) {
                    return;
                }

                // WICHTIG: getValues erwartet Domain-String (z.B. 'HeroBlocks.config'), nicht Array von Keys
                // Die API gibt alle Config-Werte für diese Domain zurück
                const values = await systemConfigApi.getValues('HeroBlocks.config');
                
                if (values) {
                    this.heroBlocksConfig = {
                        enableCategorySlider: values['HeroBlocks.config.enableCategorySlider'] === true,
                        enableMegaMenu: values['HeroBlocks.config.enableMegaMenu'] === true,
                        enableHeroInstagramFeed: values['HeroBlocks.config.enableHeroInstagramFeed'] === true,
                    };
                }
            } catch (e) {
                // Config noch nicht verfügbar - verwende Default-Werte (false)
                console.warn('HeroBlocks: System-Config konnte nicht geladen werden', e);
            }
        },
    },
});

