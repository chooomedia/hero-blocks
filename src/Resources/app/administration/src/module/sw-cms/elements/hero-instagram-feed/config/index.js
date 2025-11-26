/**
 * Instagram Feed Element Config
 * WICHTIG: Config kommt vom Block, nicht vom Element
 */
import template from './sw-cms-el-config-hero-instagram-feed.html.twig';

export default {
    template,

    mixins: [
        Shopware.Mixin.getByName('cms-element'),
    ],
    
    // WICHTIG: Keine Config nötig - Block handhabt gesamte Config
};

