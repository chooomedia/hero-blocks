/**
 * Hero Image Overlay Block - Config Component
 * 
 * WICHTIG: SPRACHABHÄNGIGE TEXTE
 * Die Texte werden im 'textOverlay' Slot (Standard "text" Element) gespeichert.
 * CMS-Elemente haben eine cms_slot_translation Tabelle, daher sind die Texte SPRACHABHÄNGIG!
 * 
 * Der Content wird als HTML gespeichert - die Headline kann als <h2> im HTML definiert werden.
 * 
 * Nicht-übersetzbare Einstellungen (Position, Farben, Animation, Höhe) werden in block.customFields gespeichert.
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
            // Bild-Ausrichtung Optionen (nur bei Cover Display Mode)
            imageVerticalAlignOptions: [
                { value: 'top', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.imageAlign.top') },
                { value: 'center', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.imageAlign.center') },
                { value: 'bottom', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.imageAlign.bottom') },
            ],
            imageHorizontalAlignOptions: [
                { value: 'left', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.imageAlign.left') },
                { value: 'center', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.imageAlign.center') },
                { value: 'right', label: this.$tc('sw-cms.blocks.heroBlocks.heroImageOverlay.config.imageAlign.right') },
            ],
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
         * Holt den textOverlay Slot aus dem Block
         */
        textOverlaySlot() {
            if (!this.block?.slots) {
                return null;
            }
            // Slots können als Array oder Collection vorliegen
            const slots = this.block.slots;
            if (Array.isArray(slots)) {
                return slots.find(slot => slot.slot === 'textOverlay');
            }
            // EntityCollection
            if (slots.getAt) {
                for (let i = 0; i < slots.length; i++) {
                    const slot = slots.getAt(i);
                    if (slot.slot === 'textOverlay') {
                        return slot;
                    }
                }
            }
            return null;
        },

        /**
         * Holt die Element-Config des textOverlay Slots
         */
        textOverlayConfig() {
            return this.textOverlaySlot?.config || {};
        },

        // ========================================================================
        // NICHT-ÜBERSETZBARE EINSTELLUNGEN (aus block.customFields)
        // ========================================================================
        
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
                return this.block?.customFields?.overlayTextColor || '#ffffff';
            },
            set(value) {
                this.updateCustomField('overlayTextColor', value);
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

        // ========================================================================
        // BILD-AUSRICHTUNG (nur bei Cover Display Mode sichtbar)
        // ========================================================================
        
        /**
         * Prüft ob das Bild im "Cover" Modus ist
         */
        isCoverMode() {
            const imageSlot = this.imageSlot;
            if (!imageSlot?.config?.displayMode?.value) {
                return true; // Default: Cover
            }
            return imageSlot.config.displayMode.value === 'cover';
        },

        /**
         * Holt den image Slot aus dem Block
         */
        imageSlot() {
            if (!this.block?.slots) {
                return null;
            }
            const slots = this.block.slots;
            if (Array.isArray(slots)) {
                return slots.find(slot => slot.slot === 'image');
            }
            if (slots.getAt) {
                for (let i = 0; i < slots.length; i++) {
                    const slot = slots.getAt(i);
                    if (slot.slot === 'image') {
                        return slot;
                    }
                }
            }
            return null;
        },

        imageVerticalAlign: {
            get() {
                return this.block?.customFields?.imageVerticalAlign || 'center';
            },
            set(value) {
                this.updateCustomField('imageVerticalAlign', value);
            },
        },

        imageHorizontalAlign: {
            get() {
                return this.block?.customFields?.imageHorizontalAlign || 'center';
            },
            set(value) {
                this.updateCustomField('imageHorizontalAlign', value);
            },
        },

        // ========================================================================
        // SPRACHABHÄNGIGER CONTENT (aus textOverlay Element-Slot)
        // ========================================================================

        /**
         * SPRACHABHÄNGIG: Content aus dem textOverlay Element (Standard "text" Element)
         * Der Content wird als HTML gespeichert - Headline kann als <h2> definiert werden
         */
        overlayContent: {
            get() {
                return this.textOverlayConfig?.content?.value || '';
            },
            set(value) {
                this.updateElementConfig('content', value);
            },
        },
    },

    methods: {
        initializeBlockConfig() {
            if (!this.block) {
                return;
            }

            // Ensure customFields exists
            if (!this.block.customFields) {
                this.block.customFields = {};
            }

            // Initialize default values for NON-TRANSLATABLE settings
            const defaults = {
                overlayPosition: 'top-left',
                overlayBackgroundColor: '',
                overlayTextColor: '#ffffff',
                enableScrollAnimation: true,
                minHeight: '500px',
                imageVerticalAlign: 'center',
                imageHorizontalAlign: 'center',
            };

            Object.keys(defaults).forEach((key) => {
                if (this.block.customFields[key] === undefined) {
                    this.block.customFields[key] = defaults[key];
                }
            });

            // Initialize textOverlay element config if slot exists
            this.initializeElementConfig();
        },

        /**
         * Initialisiert die Element-Config des textOverlay Slots
         */
        initializeElementConfig() {
            const slot = this.textOverlaySlot;
            if (!slot) {
                console.log('[Hero Image Overlay Config] textOverlay slot not found');
                return;
            }

            if (!slot.config) {
                slot.config = {};
            }

            // Initialize translatable config value (nur content für Standard text Element)
            if (!slot.config.content) {
                slot.config.content = { source: 'static', value: '' };
            }
        },

        /**
         * Aktualisiert block.customFields (NICHT ÜBERSETZBAR)
         */
        updateCustomField(key, value) {
            if (!this.block) {
                return;
            }

            if (!this.block.customFields) {
                this.block.customFields = {};
            }

            this.block.customFields[key] = value;
            this.$emit('block-update');
        },

        /**
         * Aktualisiert die Element-Config des textOverlay Slots (SPRACHABHÄNGIG)
         */
        updateElementConfig(key, value) {
            const slot = this.textOverlaySlot;
            if (!slot) {
                console.warn('[Hero Image Overlay Config] textOverlay slot not found');
                return;
            }

            if (!slot.config) {
                slot.config = {};
            }

            if (!slot.config[key]) {
                slot.config[key] = { source: 'static', value: null };
            }

            slot.config[key].value = value;
            this.$emit('block-update');
        },

        // ========================================================================
        // EVENT HANDLERS
        // ========================================================================

        onPositionChange(value) {
            this.updateCustomField('overlayPosition', value);
        },

        onBackgroundColorChange(value) {
            this.updateCustomField('overlayBackgroundColor', value);
        },

        onTextColorChange(value) {
            this.updateCustomField('overlayTextColor', value);
        },

        onScrollAnimationChange(value) {
            this.updateCustomField('enableScrollAnimation', value);
        },

        onOverlayContentChange(value) {
            this.updateElementConfig('content', value);
        },
    },
};
