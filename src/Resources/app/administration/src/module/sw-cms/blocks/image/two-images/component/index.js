import template from './sw-cms-block-two-images.html.twig';
import './sw-cms-block-two-images.scss';

export default {
    template,

    props: {
        block: {
            type: Object,
            required: true,
        },
    },
};

