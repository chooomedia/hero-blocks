import template from './sw-cms-block-hero-category-slider.html.twig';
import './sw-cms-block-hero-category-slider.scss';

export default {
    template,

    props: {
        block: {
            type: Object,
            required: true,
        },
    },

    // WICHTIG: Keine Custom Computed Properties nötig
    // Standard-Buttons werden vom sw-cms-slot Component bereitgestellt
    // Block-Settings werden über den Parent sw-cms-block__config-overlay geöffnet
    // Preview wird im Element-Component angezeigt (wenn keine Kategorie ausgewählt)
    computed: {},

    // WICHTIG: Keine Custom Methods nötig
    // Standard-Buttons werden vom sw-cms-slot Component bereitgestellt
    // Block-Settings werden über den Parent sw-cms-block__config-overlay geöffnet
    methods: {},
};

