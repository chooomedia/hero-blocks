import template from "./sw-cms-el-hero-booking-form.html.twig";
import "./sw-cms-el-hero-booking-form.scss";

const { Mixin } = Shopware;

// Element Component für CMS Editor (große Vorschau mit allen Formular-Feldern)
export default {
  template,

  mixins: [
    Mixin.getByName('cms-element'),
  ],

  computed: {
    formTitle() {
      return this.element?.config?.title?.value || this.$tc('sw-cms.elements.heroBookingForm.config.titlePlaceholder');
    },
  },
};
