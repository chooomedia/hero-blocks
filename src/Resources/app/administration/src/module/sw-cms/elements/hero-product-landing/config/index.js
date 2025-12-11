import template from "./sw-cms-el-config-hero-product-landing.html.twig";
import "./sw-cms-el-config-hero-product-landing.scss";

/**
 * Hero Product Landing - Config Component
 *
 * Allows selecting a product and configuring display options
 */
export default {
  template,

  inject: ["repositoryFactory"],

  mixins: [Shopware.Mixin.getByName("cms-element")],

  data() {
    return {
      productSearchTerm: "",
    };
  },

  computed: {
    productRepository() {
      return this.repositoryFactory.create("product");
    },

    productId: {
      get() {
        return this.element?.config?.productId?.value || null;
      },
      set(value) {
        this.element.config.productId.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showName: {
      get() {
        return this.element?.config?.showName?.value !== false;
      },
      set(value) {
        this.element.config.showName.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showDescription: {
      get() {
        return this.element?.config?.showDescription?.value !== false;
      },
      set(value) {
        this.element.config.showDescription.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showPrice: {
      get() {
        return this.element?.config?.showPrice?.value !== false;
      },
      set(value) {
        this.element.config.showPrice.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showProperties: {
      get() {
        return this.element?.config?.showProperties?.value !== false;
      },
      set(value) {
        this.element.config.showProperties.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showManufacturer: {
      get() {
        return this.element?.config?.showManufacturer?.value === true;
      },
      set(value) {
        this.element.config.showManufacturer.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showBuyButton: {
      get() {
        return this.element?.config?.showBuyButton?.value !== false;
      },
      set(value) {
        this.element.config.showBuyButton.value = value;
        this.$emit("element-update", this.element);
      },
    },

    layoutOptions() {
      return [
        {
          value: "default",
          label: this.$tc(
            "sw-cms.elements.heroProductLanding.config.layout.options.default"
          ),
        },
        {
          value: "compact",
          label: this.$tc(
            "sw-cms.elements.heroProductLanding.config.layout.options.compact"
          ),
        },
        {
          value: "full",
          label: this.$tc(
            "sw-cms.elements.heroProductLanding.config.layout.options.full"
          ),
        },
      ];
    },

    layout: {
      get() {
        return this.element?.config?.layout?.value || "default";
      },
      set(value) {
        this.element.config.layout.value = value;
        this.$emit("element-update", this.element);
      },
    },

    productCriteria() {
      const criteria = new Shopware.Data.Criteria(1, 25);
      criteria.addAssociation("cover");
      criteria.addAssociation("manufacturer");

      if (this.productSearchTerm) {
        criteria.setTerm(this.productSearchTerm);
      }

      return criteria;
    },
  },

  methods: {
    onProductChange(productId) {
      this.productId = productId;
    },

    onProductSearchTermChange(searchTerm) {
      this.productSearchTerm = searchTerm;
    },
  },
};
