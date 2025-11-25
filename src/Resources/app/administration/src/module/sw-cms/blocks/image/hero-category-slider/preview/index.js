import template from './sw-cms-preview-hero-category-slider.html.twig';
import './sw-cms-preview-hero-category-slider.scss';

export default {
    template,

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },
    },
};

