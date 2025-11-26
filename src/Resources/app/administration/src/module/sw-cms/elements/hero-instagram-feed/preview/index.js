/**
 * Instagram Feed Element Preview
 * Zeigt Platzhalter in der Element-Auswahl
 */
import template from './sw-cms-el-preview-hero-instagram-feed.html.twig';
import './sw-cms-el-preview-hero-instagram-feed.scss';

export default {
    template,

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },
    },
};

