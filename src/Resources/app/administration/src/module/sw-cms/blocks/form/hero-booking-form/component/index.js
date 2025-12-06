import template from "./sw-cms-block-hero-booking-form.html.twig";
import "./sw-cms-block-hero-booking-form.scss";

const { Mixin } = Shopware;

// Component für große Vorschau im CMS Editor
export default {
  template,

  mixins: [
    Mixin.getByName('cms-state'),
  ],

  // Block wird als Prop übergeben (von sw-cms-block Wrapper)
  props: {
    block: {
      type: Object,
      required: true,
    },
  },
};
