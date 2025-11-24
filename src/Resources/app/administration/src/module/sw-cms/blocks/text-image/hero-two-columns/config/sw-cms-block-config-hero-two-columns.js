/**
 * Config Component für Hero Two Columns Block
 * Ermöglicht Konfiguration von Layout, Background, Min-Height etc.
 */
import template from './sw-cms-block-config-hero-two-columns.html.twig';
import './sw-cms-block-config-hero-two-columns.scss';

export default {
    template,

    inject: ['repositoryFactory', 'cmsService'],

    // WICHTIG: cms-state Mixin hinzufügen (wie Standard sw-cms-block-config)
    mixins: [
        Shopware.Mixin.getByName('cms-state'),
    ],

    props: {
        block: {
            type: Object,
            required: true,
        },
    },

    created() {
        // WICHTIG: Initialisiere Config-Werte, falls sie nicht existieren
        this.initializeBlockConfig();
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
        uploadTagBackground() {
            return `cms-block-hero-two-columns-background-${this.block.id}`;
        },

        uploadTagBackgroundLeft() {
            return `cms-block-hero-two-columns-background-left-${this.block.id}`;
        },

        uploadTagBackgroundRight() {
            return `cms-block-hero-two-columns-background-right-${this.block.id}`;
        },

        uploadTagAudio() {
            return `cms-block-hero-two-columns-audio-${this.block.id}`;
        },

        // WICHTIG: cmsPageState kommt aus cms-state Mixin (nicht manuell definieren)
        // Entfernt: cmsPageState() { return Shopware.Store.get('cmsPage'); },

        mediaRepository() {
            return this.repositoryFactory.create('media');
        },

        layoutOptions() {
            return [
                {
                    id: 'image-left',
                    value: 'image-left',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroTwoColumns.config.layout.options.imageLeft'),
                },
                {
                    id: 'text-left',
                    value: 'text-left',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroTwoColumns.config.layout.options.textLeft'),
                },
            ];
        },

        backgroundModeOptions() {
            return [
                {
                    id: 'none',
                    value: 'none',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroTwoColumns.config.backgroundMode.options.none'),
                },
                {
                    id: 'single',
                    value: 'single',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroTwoColumns.config.backgroundMode.options.single'),
                },
                {
                    id: 'two-images',
                    value: 'two-images',
                    label: this.$tc('sw-cms.blocks.heroBlocks.heroTwoColumns.config.backgroundMode.options.twoImages'),
                },
            ];
        },

        // WICHTIG: Default CSS Code für Background Images
        defaultBackgroundCss() {
            return 'background: repeating-linear-gradient(123deg, #46494A 0px, #46494A 6px, transparent 6px, transparent 12px);';
        },
    },

    methods: {
        /**
         * Initialisiert Block-Config-Werte, falls sie nicht existieren
         * WICHTIG: Verhindert "Cannot read properties of undefined" Fehler
         * WICHTIG: Verwendet $set für Vue 2 Reaktivität, falls nötig
         */
        initializeBlockConfig() {
            if (!this.block) {
                return;
            }
            
            // WICHTIG: Block-Config wird in block.customFields gespeichert (NICHT block.config!)
            // Stelle sicher, dass block.customFields existiert (reaktiv)
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
            // WICHTIG: Wir lesen aus defaultConfig.value (wenn vorhanden) oder direkt den Wert
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
                    if (this.$set) {
                        this.$set(this.block.customFields, key, value);
                    } else {
                        this.block.customFields[key] = value;
                    }
                }
            });
            
            // WICHTIG: Initialisiere Scroll-Animation Settings (wenn two-images Mode)
            if (this.block.customFields.backgroundMode === 'two-images') {
                // Scroll Animation Enabled: default true
                if (this.block.customFields.scrollAnimationEnabled === undefined) {
                    if (this.$set) {
                        this.$set(this.block.customFields, 'scrollAnimationEnabled', true);
                    } else {
                        this.block.customFields.scrollAnimationEnabled = true;
                    }
                }
                
                // Scroll Animation Angle: default 33
                if (!this.block.customFields.scrollAnimationAngle) {
                    if (this.$set) {
                        this.$set(this.block.customFields, 'scrollAnimationAngle', '33');
                    } else {
                        this.block.customFields.scrollAnimationAngle = '33';
                    }
                }
                
                // WICHTIG: Initialisiere CSS Code Defaults (wenn CSS Code verwendet wird)
                // Background Left CSS Code
                if (this.block.customFields.backgroundLeftUseCss === true) {
                    if (!this.block.customFields.backgroundLeftCss || this.block.customFields.backgroundLeftCss === '') {
                        if (this.$set) {
                            this.$set(this.block.customFields, 'backgroundLeftCss', this.defaultBackgroundCss);
                        } else {
                            this.block.customFields.backgroundLeftCss = this.defaultBackgroundCss;
                        }
                    }
                }
                
                // Background Right CSS Code
                if (this.block.customFields.backgroundRightUseCss === true) {
                    if (!this.block.customFields.backgroundRightCss || this.block.customFields.backgroundRightCss === '') {
                        if (this.$set) {
                            this.$set(this.block.customFields, 'backgroundRightCss', this.defaultBackgroundCss);
                        } else {
                            this.block.customFields.backgroundRightCss = this.defaultBackgroundCss;
                        }
                    }
                }
            }
        },

        onLayoutChange(value) {
            // WICHTIG: Block-Config wird in block.customFields gespeichert (NICHT block.config!)
            // CmsBlockEntity nutzt EntityCustomFieldsTrait - Config geht in customFields
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.layout = value;
        },

        onLayoutDesktopChange(value) {
            // WICHTIG: Block-Config in block.customFields speichern
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.layoutDesktop = value;
        },

        onLayoutTabletChange(value) {
            // WICHTIG: Block-Config in block.customFields speichern
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.layoutTablet = value;
        },

        onBackgroundModeChange(value) {
            // WICHTIG: Block-Config in block.customFields speichern
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.backgroundMode = value;
            
            // Reset background images when mode changes
            if (value === 'none') {
                this.block.customFields.backgroundImage = null;
                this.block.customFields.backgroundImageLeft = null;
                this.block.customFields.backgroundImageRight = null;
            } else if (value === 'single') {
                this.block.customFields.backgroundImageLeft = null;
                this.block.customFields.backgroundImageRight = null;
            } else if (value === 'two-images') {
                this.block.customFields.backgroundImage = null;
            }
        },

        onSetBackgroundImage([mediaItem]) {
            // WICHTIG: Block-Config in block.customFields speichern
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.backgroundImage = (mediaItem && mediaItem.id) ? mediaItem.id : null;
        },

        async onBackgroundImageUpload(uploadedMedia) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            if (uploadedMedia && uploadedMedia.targetId) {
                this.block.customFields.backgroundImage = uploadedMedia.targetId;
            }
        },

        onRemoveBackgroundImage() {
            if (!this.block || !this.block.customFields) {
                return;
            }
            this.block.customFields.backgroundImage = null;
        },

        onSetBackgroundImageLeft([mediaItem]) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.backgroundImageLeft = (mediaItem && mediaItem.id) ? mediaItem.id : null;
        },

        async onBackgroundImageLeftUpload(uploadedMedia) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            if (uploadedMedia && uploadedMedia.targetId) {
                this.block.customFields.backgroundImageLeft = uploadedMedia.targetId;
            }
        },

        onRemoveBackgroundImageLeft() {
            if (!this.block || !this.block.customFields) {
                return;
            }
            this.block.customFields.backgroundImageLeft = null;
        },

        onSetBackgroundImageRight([mediaItem]) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.backgroundImageRight = (mediaItem && mediaItem.id) ? mediaItem.id : null;
        },

        async onBackgroundImageRightUpload(uploadedMedia) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            if (uploadedMedia && uploadedMedia.targetId) {
                this.block.customFields.backgroundImageRight = uploadedMedia.targetId;
            }
        },

        onRemoveBackgroundImageRight() {
            if (!this.block || !this.block.customFields) {
                return;
            }
            this.block.customFields.backgroundImageRight = null;
        },

        onBackgroundLeftUseCssChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.backgroundLeftUseCss = value === true;
            
            // WICHTIG: Initialisiere CSS Code wenn aktiviert
            if (value === true && !this.block.customFields.backgroundLeftCss) {
                this.block.customFields.backgroundLeftCss = this.defaultBackgroundCss;
            }
        },

        onBackgroundLeftCssChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.backgroundLeftCss = value || this.defaultBackgroundCss;
        },

        onBackgroundRightUseCssChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.backgroundRightUseCss = value === true;
            
            // WICHTIG: Initialisiere CSS Code wenn aktiviert
            if (value === true && !this.block.customFields.backgroundRightCss) {
                this.block.customFields.backgroundRightCss = this.defaultBackgroundCss;
            }
        },

        onBackgroundRightCssChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.backgroundRightCss = value || this.defaultBackgroundCss;
        },

        onScrollAnimationAngleChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.scrollAnimationAngle = value || '33';
        },

        onScrollAnimationEnabledChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.scrollAnimationEnabled = value === true;
        },

        onSetAudioFile([mediaItem]) {
            // WICHTIG: Block-Config in block.customFields speichern
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.audioFile = (mediaItem && mediaItem.id) ? mediaItem.id : null;
        },

        async onAudioFileUpload(uploadedMedia) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            if (uploadedMedia && uploadedMedia.targetId) {
                this.block.customFields.audioFile = uploadedMedia.targetId;
            }
        },

        onRemoveAudioFile() {
            if (!this.block || !this.block.customFields) {
                return;
            }
            this.block.customFields.audioFile = null;
        },

        onElementLeftTranslateXChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.elementLeftTranslateX = value || '0';
        },

        onElementLeftTranslateYChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.elementLeftTranslateY = value || '0';
        },

        onElementLeftAnimateChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.elementLeftAnimate = value === true;
        },

        onElementRightTranslateXChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.elementRightTranslateX = value || '0';
        },

        onElementRightTranslateYChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.elementRightTranslateY = value || '0';
        },

        onElementRightAnimateChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.elementRightAnimate = value === true;
        },

        onMinHeightChange(value) {
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            this.block.customFields.minHeight = value;
        },

        onCssClassChange(value) {
            // WICHTIG: Direktes Setzen wie Standard sw-cms-block-config onBlockNameChange
            this.block.cssClass = value;
        },

        onMarginChange(value, field) {
            // WICHTIG: Margin-Felder direkt setzen (wie block.name, block.backgroundColor)
            if (field && this.block) {
                this.block[field] = value;
            }
        },
    },
};

