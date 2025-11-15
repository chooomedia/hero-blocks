import template from './sw-cms-block-config-hero-mega-menu.html.twig';
import './sw-cms-block-config-hero-mega-menu.scss';

export default {
    template,

    inject: ['repositoryFactory', 'cmsService'],

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
        this.initializeBlockConfig();
    },

    watch: {
        'block.type': {
            handler() {
                this.initializeBlockConfig();
            },
            immediate: true,
        },
    },

    methods: {
        /**
         * Initialisiert Block-Config-Werte mit Reaktivität
         * WICHTIG: Block-Config wird in block.customFields gespeichert (NICHT block.config!)
         * CmsBlockEntity nutzt EntityCustomFieldsTrait - Custom-Config geht in customFields
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
        },

        /**
         * Config-Werte ändern
         * WICHTIG: Block-Config wird in block.customFields gespeichert (NICHT block.config!)
         */
        onConfigChange(value, configKey) {
            if (!this.block) {
                return;
            }

            // WICHTIG: Block-Config in block.customFields speichern
            if (!this.block.customFields) {
                if (this.$set) {
                    this.$set(this.block, 'customFields', {});
                } else {
                    this.block.customFields = {};
                }
            }

            // Wert direkt setzen
            if (this.$set) {
                this.$set(this.block.customFields, configKey, value);
            } else {
                this.block.customFields[configKey] = value;
            }
        },
    },
};

