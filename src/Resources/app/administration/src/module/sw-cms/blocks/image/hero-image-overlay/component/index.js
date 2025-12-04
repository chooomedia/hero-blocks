/**
 * Hero Image Overlay Block - Component
 * 
 * WICHTIG: Der Text-Inhalt wird aus dem textOverlay Slot gelesen (sprachabhängig!)
 * Die Daten werden in cms_slot_translation.config gespeichert.
 */
import template from './sw-cms-block-hero-image-overlay.html.twig';
import './sw-cms-block-hero-image-overlay.scss';

const { Component, Mixin } = Shopware;

export default {
    template,

    mixins: [
        Mixin.getByName('cms-state'),
    ],

    // Block wird als Prop übergeben (von sw-cms-block Wrapper)
    props: {
        block: {
            type: Object,
            required: true,
        },
    },

    computed: {
        /**
         * Zugriff auf den textOverlay Slot
         * WICHTIG: Hier werden die sprachabhängigen Texte gespeichert!
         */
        textOverlaySlot() {
            if (!this.block?.slots) {
                return null;
            }
            // slots kann ein Array oder eine Collection sein
            if (Array.isArray(this.block.slots)) {
                return this.block.slots.find((slot) => slot.slot === 'textOverlay');
            }
            // Falls es eine Collection ist
            if (this.block.slots.getSlot) {
                return this.block.slots.getSlot('textOverlay');
            }
            return null;
        },

        /**
         * Der gesamte HTML-Inhalt aus dem textOverlay Slot
         * Enthält Headline und Text als HTML
         */
        overlayContent() {
            return this.textOverlaySlot?.config?.content?.value || '';
        },

        overlayPosition() {
            return this.block?.customFields?.overlayPosition || 'top-left';
        },

        isLeftPosition() {
            return this.overlayPosition.includes('left');
        },

        isRightPosition() {
            return this.overlayPosition.includes('right');
        },

        overlayClasses() {
            return {
                'sw-cms-block-hero-image-overlay__overlay--top-left': this.overlayPosition === 'top-left',
                'sw-cms-block-hero-image-overlay__overlay--middle-left': this.overlayPosition === 'middle-left',
                'sw-cms-block-hero-image-overlay__overlay--bottom-left': this.overlayPosition === 'bottom-left',
                'sw-cms-block-hero-image-overlay__overlay--top-right': this.overlayPosition === 'top-right',
                'sw-cms-block-hero-image-overlay__overlay--middle-right': this.overlayPosition === 'middle-right',
                'sw-cms-block-hero-image-overlay__overlay--bottom-right': this.overlayPosition === 'bottom-right',
            };
        },

        overlayBackgroundColor() {
            // Verwende Theme-Akzentfarbe als Fallback (CSS Variable)
            // Die tatsächliche Farbe wird über CSS var(--sw-color-brand-accent) gesetzt
            return this.block?.customFields?.overlayBackgroundColor || '';
        },

        overlayTextColor() {
            return this.block?.customFields?.overlayTextColor || '#ffffff'; // White (default)
        },

        /**
         * Bild-Ausrichtung (vertikal)
         */
        imageVerticalAlign() {
            return this.block?.customFields?.imageVerticalAlign || 'center';
        },

        /**
         * Bild-Ausrichtung (horizontal)
         */
        imageHorizontalAlign() {
            return this.block?.customFields?.imageHorizontalAlign || 'center';
        },

        /**
         * Computed Style für das Bild (object-position)
         */
        imageStyles() {
            return {
                objectPosition: `${this.imageHorizontalAlign} ${this.imageVerticalAlign}`,
            };
        },

        /**
         * Fallback für alte Daten: overlayHeadline aus customFields
         * @deprecated - Verwende overlayContent stattdessen
         */
        overlayHeadline() {
            return this.block?.customFields?.overlayHeadline || '';
        },

        /**
         * Fallback für alte Daten: overlayText aus customFields
         * @deprecated - Verwende overlayContent stattdessen
         */
        overlayText() {
            return this.block?.customFields?.overlayText || '';
        },

        /**
         * Prüft ob Inhalt vorhanden ist (entweder aus Slot oder Legacy customFields)
         */
        hasContent() {
            return !!(this.overlayContent || this.overlayHeadline || this.overlayText);
        },

        overlayStyles() {
            const styles = {
                color: this.overlayTextColor,
            };
            
            // Hintergrundfarbe direkt setzen (clip-path schneidet ab)
            if (this.overlayBackgroundColor) {
                styles.backgroundColor = this.overlayBackgroundColor;
            }
            
            return styles;
        },
    },
};

