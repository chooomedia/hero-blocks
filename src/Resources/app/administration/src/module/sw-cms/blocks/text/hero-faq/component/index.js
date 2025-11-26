import template from "./sw-cms-block-hero-faq.html.twig";
import "./sw-cms-block-hero-faq.scss";

const { Mixin } = Shopware;

// Component für große Vorschau im CMS Editor
export default {
  template,

  mixins: [
    Mixin.getByName('cms-state'),
  ],

  computed: {
    block() {
      return this.cmsPageState.currentBlock;
    },

    faqItems() {
      // FAQ Items aus Block customFields auslesen
      if (!this.block || !this.block.customFields || !this.block.customFields.faqItems) {
        return [];
      }
      return this.block.customFields.faqItems;
    },
  },

  watch: {
    'block.customFields.faqItems': {
      handler() {
        // Force re-render bei FAQ-Änderungen
        this.$forceUpdate();
      },
      deep: true,
    },
  },
};
