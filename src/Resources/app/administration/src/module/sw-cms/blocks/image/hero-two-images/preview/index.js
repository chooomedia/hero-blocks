import template from './sw-cms-preview-hero-two-images.html.twig';
import './sw-cms-preview-hero-two-images.scss';

export default {
    template,

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },
    },
};

