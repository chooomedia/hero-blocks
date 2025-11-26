import template from './sw-cms-preview-hero-instagram-feed.html.twig';
import './sw-cms-preview-hero-instagram-feed.scss';

export default {
    template,

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },
    },
};

