import template from './sw-cms-preview-hero-two-columns.html.twig';
import './sw-cms-preview-hero-two-columns.scss';

export default {
    template,

    props: {
        block: {
            type: Object,
            required: false,
            default() {
                return {};
            },
        },
    },

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },

        // WICHTIG: Layout-Einstellungen aus block.customFields lesen (NICHT block.config!)
        layoutDesktop() {
            if (!this.block || !this.block.customFields) {
                return 'image-left';
            }
            return this.block.customFields.layoutDesktop || this.block.customFields.layout || 'image-left';
        },

        layoutTablet() {
            if (!this.block || !this.block.customFields) {
                return 'image-left';
            }
            return this.block.customFields.layoutTablet || this.block.customFields.layout || 'image-left';
        },

        layout() {
            if (!this.block || !this.block.customFields) {
                return 'image-left';
            }
            return this.block.customFields.layout || 'image-left';
        },

        // WICHTIG: CSS-Klassen für Reihenfolge basierend auf Layout
        previewClasses() {
            // Desktop/Tablet: layoutDesktop bestimmt die Reihenfolge
            // Mobile: layout bestimmt die Reihenfolge
            const isTextLeft = this.layoutDesktop === 'text-left';
            
            return {
                'is--text-left': isTextLeft,
                'is--image-left': !isTextLeft,
            };
        },
    },

    // WICHTIG: Watch block.customFields Änderungen für reaktive Updates
    watch: {
        'block.customFields.layoutDesktop': {
            handler() {
                this.$forceUpdate();
            },
            immediate: false,
        },
        'block.customFields.layoutTablet': {
            handler() {
                this.$forceUpdate();
            },
            immediate: false,
        },
        'block.customFields.layout': {
            handler() {
                this.$forceUpdate();
            },
            immediate: false,
        },
        // Deep watch für alle customFields Änderungen
        'block.customFields': {
            handler() {
                this.$forceUpdate();
            },
            deep: true,
            immediate: false,
        },
    },
};

