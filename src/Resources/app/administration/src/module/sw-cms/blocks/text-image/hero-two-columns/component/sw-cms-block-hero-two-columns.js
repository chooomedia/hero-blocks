import template from './sw-cms-block-hero-two-columns.html.twig';
import './sw-cms-block-hero-two-columns.scss';

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
            const classes = ['sw-cms-block-hero-two-columns', 'two-col'];
                   // WICHTIG: Layout aus block.customFields lesen (NICHT block.config!)
                   const layout = this.block?.customFields?.layout || 'image-left';
            classes.push(`is--layout-${layout}`);
            return classes.join(' ');
        },
    },
};

