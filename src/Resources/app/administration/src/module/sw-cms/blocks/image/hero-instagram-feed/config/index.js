/**
 * Config Component für Hero Instagram Feed Block
 * Ermöglicht Konfiguration von Post Limit, Display Mode, Columns, etc.
 */
import template from './sw-cms-block-config-hero-instagram-feed.html.twig';
import './sw-cms-block-config-hero-instagram-feed.scss';

export default {
    template,

    inject: ['repositoryFactory', 'cmsService', 'systemConfigApiService'],

    // WICHTIG: cms-state Mixin hinzufügen (MANDATORY!)
    mixins: [
        Shopware.Mixin.getByName('cms-state'),
    ],

    props: {
        block: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            systemConfigPostLimit: 12, // Default aus System-Config
        };
    },

    created() {
        // WICHTIG: Initialisiere Config-Werte, falls sie nicht existieren
        this.initializeBlockConfig();
        this.loadSystemConfig();
    },

    watch: {
        // WICHTIG: Initialisiere Config-Werte, wenn Block geändert wird
        'block.type': {
            handler() {
                this.initializeBlockConfig();
            },
            immediate: true,
        },
    },

    computed: {
        displayModeOptions() {
            return [
                {
                    id: 'grid',
                    value: 'grid',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroInstagramFeed.config.displayMode.options.grid'),
                },
                {
                    id: 'slider',
                    value: 'slider',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroInstagramFeed.config.displayMode.options.slider'),
                },
            ];
        },

        columnsOptions() {
            return [
                { id: '1', value: 1, label: '1' },
                { id: '2', value: 2, label: '2' },
                { id: '3', value: 3, label: '3' },
                { id: '4', value: 4, label: '4' },
                { id: '5', value: 5, label: '5' },
                { id: '6', value: 6, label: '6' },
            ];
        },

        navigationArrowsOptions() {
            return [
                {
                    id: 'none',
                    value: 'none',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroInstagramFeed.config.navigationArrows.options.none'),
                },
                {
                    id: 'inside',
                    value: 'inside',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroInstagramFeed.config.navigationArrows.options.inside'),
                },
                {
                    id: 'outside',
                    value: 'outside',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroInstagramFeed.config.navigationArrows.options.outside'),
                },
            ];
        },

        // WICHTIG: Zeige Slider-spezifische Settings nur wenn Display Mode = 'slider'
        showSliderSettings() {
            return this.block?.customFields?.displayMode === 'slider';
        },
    },

    methods: {
        /**
         * Initialisiert Block-Config-Werte, falls sie nicht existieren
         * WICHTIG: Verhindert "Cannot read properties of undefined" Fehler
         */
        initializeBlockConfig() {
            if (!this.block) {
                return;
            }

            // WICHTIG: Block-Config wird in block.customFields gespeichert (NICHT block.config!)
            if (!this.block.customFields) {
                if (this.$set) {
                    this.$set(this.block, 'customFields', {});
                } else {
                    this.block.customFields = {};
                }
            }

            // Hole Default-Config aus Block-Registry
            const blockRegistry = this.cmsService.getCmsBlockRegistry();
            const blockConfig = blockRegistry[this.block.type];
            const defaultConfig = blockConfig?.defaultConfig || {};

            // Initialisiere fehlende Custom-Fields-Werte aus defaultConfig
            Object.keys(defaultConfig).forEach((key) => {
                // Überspringe Standard-Felder (werden direkt am Block gesetzt)
                if (['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'sizingMode'].includes(key)) {
                    return;
                }

                const defaultValue = defaultConfig[key];
                const value = (defaultValue && typeof defaultValue === 'object' && defaultValue.value !== undefined)
                    ? defaultValue.value
                    : defaultValue;

                // Initialisiere nur wenn noch nicht gesetzt
                if (this.block.customFields[key] === undefined || this.block.customFields[key] === null) {
                    // WICHTIG: Post Limit aus System-Config verwenden, falls verfügbar
                    if (key === 'postLimit' && this.systemConfigPostLimit) {
                        if (this.$set) {
                            this.$set(this.block.customFields, key, this.systemConfigPostLimit);
                        } else {
                            this.block.customFields[key] = this.systemConfigPostLimit;
                        }
                    } else {
                        if (this.$set) {
                            this.$set(this.block.customFields, key, value);
                        } else {
                            this.block.customFields[key] = value;
                        }
                    }
                }
            });
        },

        /**
         * Lade System-Config für Instagram Feed (Post Limit)
         */
        async loadSystemConfig() {
            try {
                const configKey = 'HeroBlocks.config.instagramFeedLimit';
                // WICHTIG: getValues erwartet Domain-String (z.B. 'HeroBlocks.config'), nicht Array von Keys
                const values = await this.systemConfigApiService.getValues('HeroBlocks.config');
                if (values && values[configKey] !== undefined) {
                    this.systemConfigPostLimit = values[configKey] || 12;
                    // Aktualisiere Block-Config wenn noch nicht gesetzt
                    if (!this.block?.customFields?.postLimit) {
                        this.onPostLimitChange(this.systemConfigPostLimit);
                    }
                }
            } catch (e) {
                // Config noch nicht verfügbar - verwende Default
                console.warn('HeroBlocks: Instagram Feed System-Config konnte nicht geladen werden', e);
            }
        },

        onPostLimitChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.postLimit = parseInt(value, 10) || 12;
            this.$emit('block-update');
        },

        onDisplayModeChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.displayMode = value;
            this.$emit('block-update');
        },

        onColumnsChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.columns = parseInt(value, 10) || 4;
            this.$emit('block-update');
        },

        onShowCaptionsChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.showCaptions = value === true;
            this.$emit('block-update');
        },

        onShowLikesChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.showLikes = value === true;
            this.$emit('block-update');
        },

        onShowCommentsChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.showComments = value === true;
            this.$emit('block-update');
        },

        onNavigationArrowsChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.navigationArrows = value;
            this.$emit('block-update');
        },

        onNavigationDotsChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.navigationDots = value === true;
            this.$emit('block-update');
        },

        onAutoSlideChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.autoSlide = value === true;
            this.$emit('block-update');
        },

        onAutoplayTimeoutChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.autoplayTimeout = parseInt(value, 10) || 5000;
            this.$emit('block-update');
        },

        onSpeedChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.speed = parseInt(value, 10) || 300;
            this.$emit('block-update');
        },
    },
};

