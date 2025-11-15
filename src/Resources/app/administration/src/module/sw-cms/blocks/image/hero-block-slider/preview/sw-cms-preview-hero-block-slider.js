import template from "./sw-cms-preview-hero-block-slider.html.twig";
import "./sw-cms-preview-hero-block-slider.scss";

export default {
  template,
  computed: {
    assetFilter() {
      return Shopware.Filter.getByName("asset");
    },
  },
};
