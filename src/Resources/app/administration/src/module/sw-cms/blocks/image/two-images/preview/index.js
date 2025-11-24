import template from './sw-cms-preview-two-images.html.twig';
import './sw-cms-preview-two-images.scss';

export default {
    template,

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },
    },
};

