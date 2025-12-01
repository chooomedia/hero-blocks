/**
 * Hero Image Overlay Block - Config Component
 */
import template from './sw-cms-block-config-hero-image-overlay.html.twig';
import './sw-cms-block-config-hero-image-overlay.scss';

const { Component, Mixin } = Shopware;

export default {
    template,

    inject: ['repositoryFactory', 'cmsService'],

    mixins: [
        Mixin.getByName('cms-state'),
    ],

    props: {
        block: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            positionOptions: [
                { value: 'top-left', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.position.topLeft') },
                { value: 'middle-left', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.position.middleLeft') },
                { value: 'bottom-left', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.position.bottomLeft') },
                { value: 'top-right', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.position.topRight') },
                { value: 'middle-right', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.position.middleRight') },
                { value: 'bottom-right', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.position.bottomRight') },
            ],
            // Default colors - leer lassen für Theme Accent Color
            defaultBackgroundColor: '', // Leer = Theme Accent Color (CSS Variable)
            defaultTextColor: '#ffffff', // White
        };
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

    computed: {
        /**
         * WICHTIG: Block-Konfiguration wird in block.customFields gespeichert
         * (nicht in block.config - das ist für Shopware Standard-Einstellungen)
         */
        overlayPosition: {
            get() {
                return this.block?.customFields?.overlayPosition || 'top-left';
            },
            set(value) {
                this.updateCustomField('overlayPosition', value);
            },
        },

        overlayBackgroundColor: {
            get() {
                return this.block?.customFields?.overlayBackgroundColor || '';
            },
            set(value) {
                this.updateCustomField('overlayBackgroundColor', value);
            },
        },

        overlayTextColor: {
            get() {
                return this.block?.customFields?.overlayTextColor || '#ffffff'; // Default: white
            },
            set(value) {
                this.updateCustomField('overlayTextColor', value);
            },
        },

        overlayHeadline: {
            get() {
                return this.block?.customFields?.overlayHeadline || '';
            },
            set(value) {
                this.updateCustomField('overlayHeadline', value);
            },
        },

        overlayText: {
            get() {
                // WICHTIG: Wert aus customFields lesen
                const value = this.block?.customFields?.overlayText;
                console.log('[Hero Image Overlay Config] overlayText get:', value);
                return value || '';
            },
            set(value) {
                console.log('[Hero Image Overlay Config] overlayText set:', value);
                this.updateCustomField('overlayText', value);
            },
        },

        enableScrollAnimation: {
            get() {
                return this.block?.customFields?.enableScrollAnimation !== false;
            },
            set(value) {
                this.updateCustomField('enableScrollAnimation', value);
            },
        },

        minHeight: {
            get() {
                return this.block?.customFields?.minHeight || '500px';
            },
            set(value) {
                this.updateCustomField('minHeight', value);
            },
        },
    },

    methods: {
        initializeBlockConfig() {
            if (!this.block) {
                return;
            }

            // Ensure customFields exists (Vue 3 compatible - direct assignment)
            if (!this.block.customFields) {
                this.block.customFields = {};
            }

            // Initialize default values
            // WICHTIG: overlayBackgroundColor leer lassen für Theme Accent Color
            const defaults = {
                overlayPosition: 'top-left',
                overlayBackgroundColor: '', // Leer = Theme Accent Color (CSS Variable)
                overlayTextColor: '#ffffff', // White (initial)
                overlayHeadline: '',
                overlayText: '',
                enableScrollAnimation: true,
                minHeight: '500px',
            };

            Object.keys(defaults).forEach((key) => {
                if (this.block.customFields[key] === undefined) {
                    // Vue 3: Direct assignment instead of $set
                    this.block.customFields[key] = defaults[key];
                }
            });
        },

        updateCustomField(key, value) {
            console.log('[Hero Image Overlay Config] updateCustomField called:', key, value);
            
            if (!this.block) {
                console.warn('[Hero Image Overlay Config] block is null/undefined!');
                return;
            }

            if (!this.block.customFields) {
                // Vue 3: Direct assignment instead of $set
                console.log('[Hero Image Overlay Config] Initializing customFields');
                this.block.customFields = {};
            }

            // Vue 3: Direct assignment instead of $set
            this.block.customFields[key] = value;
            console.log('[Hero Image Overlay Config] customFields after update:', JSON.stringify(this.block.customFields));
            this.$emit('block-update');
        },

        /**
         * WICHTIG: sw-text-editor verwendet @update:value Event
         * Diese Methode wird aufgerufen wenn der Text-Editor-Inhalt geändert wird
         */
        onOverlayTextChange(value) {
            console.log('[Hero Image Overlay Config] onOverlayTextChange called with:', value);
            this.updateCustomField('overlayText', value);
        },
    },
};

