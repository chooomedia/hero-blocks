import template from './sw-cms-preview-category-slider.html.twig';
import './sw-cms-preview-category-slider.scss';

export default {
    template,

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },
    },
};

