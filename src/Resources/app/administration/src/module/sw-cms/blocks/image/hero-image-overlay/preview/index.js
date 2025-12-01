/**
 * Hero Image Overlay Block - Preview Component
 */
import template from './sw-cms-preview-hero-image-overlay.html.twig';
import './sw-cms-preview-hero-image-overlay.scss';

const { Filter } = Shopware;

export default {
    template,

    computed: {
        assetFilter() {
            return Filter.getByName('asset');
        },
    },
};

