import template from './sw-cms-block-hero-two-images.html.twig';
import './sw-cms-block-hero-two-images.scss';

export default {
    template,

    props: {
        block: {
            type: Object,
            required: true,
        },
    },
};

