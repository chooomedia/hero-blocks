import template from './sw-cms-block-hero-block-slider.html.twig';
import './sw-cms-block-hero-block-slider.scss';

export default {
    template,

    props: {
        block: {
            type: Object,
            required: true,
        },
    },

    computed: {
        blockClass() {
            const classes = ['sw-cms-block-hero-block-slider'];

            // Add sizing mode class (full_width or boxed)
            const sizingMode = this.block?.sizingMode || 'full_width';
            if (sizingMode === 'full_width') {
                classes.push('is--full-width');
            } else {
                classes.push('is--boxed');
            }

            return classes.join(' ');
        },
    },
};
