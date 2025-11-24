/**
 * Config Component für Hero Block Category Slider Block
 * 
 * WICHTIG: Block-Config enthält NUR Standard-Settings (Margins, Sizing)
 * ALLE Custom Settings (Category, Image Count, Navigation, etc.) sind im Element-Modal!
 * 
 * Dokumentation gemäß Shopware Best Practices:
 * - Standard Block-Settings: Margins, Sizing Mode (werden von Shopware bereitgestellt)
 * - Custom Settings: Werden im Element-Modal konfiguriert (siehe sw-cms-el-config-category-slider)
 */
import template from './sw-cms-block-config-category-slider.html.twig';
import './sw-cms-block-config-category-slider.scss';

export default {
    template,

    inject: ['cmsService'],

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
            // WICHTIG: Keine Custom Fields mehr - alle Settings sind im Element-Modal!
        };
    },

    created() {
        // WICHTIG: Nur Standard Block-Config initialisieren (Margins, Sizing)
        this.initializeBlockConfig();
    },

    mounted() {
        // WICHTIG: Stelle sicher, dass Block-Config nach Mount initialisiert ist
        this.$nextTick(() => {
            this.initializeBlockConfig();
        });
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
        // WICHTIG: Keine Custom Computed Properties mehr - alle Settings sind im Element-Modal!
    },

    methods: {
        /**
         * Initialisiert Block-Config-Werte (nur Standard-Settings: Margins, Sizing)
         * WICHTIG: Alle Custom Settings sind im Element-Modal!
         */
        initializeBlockConfig() {
            if (!this.block) {
                return;
            }

            // WICHTIG: Nur Standard Block-Settings initialisieren (Margins, Sizing)
            // Custom Settings (Category, Image Count, etc.) sind im Element-Modal!
            // Diese Methode wird nur für Standard-Settings benötigt (falls Shopware sie erwartet)
        },
    },
};

