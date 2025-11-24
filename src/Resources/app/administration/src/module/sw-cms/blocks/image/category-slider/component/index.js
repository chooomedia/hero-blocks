import template from './sw-cms-block-category-slider.html.twig';
import './sw-cms-block-category-slider.scss';

export default {
    template,

    props: {
        block: {
            type: Object,
            required: true,
        },
    },
};

