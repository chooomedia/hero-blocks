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
            const classes = ['sw-cms-block-hero-two-columns'];
            const layout = this.block?.config?.layout?.value || 'image-left';
            classes.push(`is--layout-${layout}`);
            return classes.join(' ');
        },
    },
};

