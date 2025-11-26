/**
 * Instagram Feed Element Component
 * Admin-Preview für Element (zeigt Platzhalter + reagiert auf Block-Config)
 */
import template from './sw-cms-el-hero-instagram-feed.html.twig';
import './sw-cms-el-hero-instagram-feed.scss';

export default {
    template,

    mixins: [
        Shopware.Mixin.getByName('cms-element'),
    ],

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },

        // WICHTIG: Hole Block-Config für reaktive Vorschau
        displayMode() {
            return this.element?.block?.customFields?.displayMode || 'grid';
        },

        columns() {
            return this.element?.block?.customFields?.columns || 4;
        },

        postLimit() {
            return this.element?.block?.customFields?.postLimit || 12;
        },

        // WICHTIG: Grid-Klasse für Spalten-Layout
        gridClass() {
            return `sw-cms-el-hero-instagram-feed__grid--columns-${this.columns}`;
        },

        // WICHTIG: Dynamische Anzahl Items basierend auf postLimit
        previewItemCount() {
            return Math.min(this.postLimit, 12); // Max 12 für Preview
        },
    },
};

