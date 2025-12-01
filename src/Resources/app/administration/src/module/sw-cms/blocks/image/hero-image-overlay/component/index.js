/**
 * Hero Image Overlay Block - Component
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

        overlayHeadline() {
            return this.block?.customFields?.overlayHeadline || '';
        },

        overlayText() {
            return this.block?.customFields?.overlayText || '';
        },

        overlayStyles() {
            const styles = {
                color: this.overlayTextColor,
            };
            
            // Nur backgroundColor setzen wenn explizit definiert
            // Sonst wird CSS var(--sw-color-brand-accent) verwendet
            if (this.overlayBackgroundColor) {
                styles.backgroundColor = this.overlayBackgroundColor;
            }
            
            return styles;
        },
    },
};

