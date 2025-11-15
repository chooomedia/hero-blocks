import template from './sw-cms-block-hero-mega-menu.html.twig';
import './sw-cms-block-hero-mega-menu.scss';

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
            const classes = ['sw-cms-block-hero-mega-menu'];

            // Add sizing mode class
            const sizingMode = this.block?.sizingMode || 'full_width';
            if (sizingMode === 'full_width') {
                classes.push('is--full-width');
            } else {
                classes.push('is--boxed');
            }

            // Add layout class
            const layout = this.block?.config?.layout?.value || 'full-width';
            classes.push(`is--layout-${layout}`);

            return classes.join(' ');
        },
    },
};

