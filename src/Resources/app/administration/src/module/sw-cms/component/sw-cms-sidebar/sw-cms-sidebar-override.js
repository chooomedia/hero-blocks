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
                enableHeroVideoExtended: false,
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

                    // Hero Video Extended Block
                    if (name === 'hero-video-extended') {
                        if (!this.heroBlocksConfig.enableHeroVideoExtended) {
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
            console.log('[HeroBlocks] loadHeroBlocksConfig() called');
            try {
                const systemConfigApi = Shopware.Service('systemConfigApiService');
                if (!systemConfigApi) {
                    console.warn('[HeroBlocks] systemConfigApiService not available');
                    return;
                }

                // WICHTIG: getValues erwartet Domain-String (z.B. 'HeroBlocks.config'), nicht Array von Keys
                // Die API gibt alle Config-Werte für diese Domain zurück
                const values = await systemConfigApi.getValues('HeroBlocks.config');
                console.log('[HeroBlocks] Raw config values:', values);
                
                if (values) {
                    this.heroBlocksConfig = {
                        enableCategorySlider: values['HeroBlocks.config.enableCategorySlider'] === true,
                        enableMegaMenu: values['HeroBlocks.config.enableMegaMenu'] === true,
                        enableHeroInstagramFeed: values['HeroBlocks.config.enableHeroInstagramFeed'] === true,
                        enableHeroVideoExtended: values['HeroBlocks.config.enableHeroVideoExtended'] === true,
                    };
                    console.log('[HeroBlocks] Config loaded:', this.heroBlocksConfig);
                }
            } catch (e) {
                // Config noch nicht verfügbar - verwende Default-Werte (false)
                console.warn('[HeroBlocks] System-Config konnte nicht geladen werden:', e);
            }
        },
    },
});

