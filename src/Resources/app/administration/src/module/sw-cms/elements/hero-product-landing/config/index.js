import template from "./sw-cms-el-config-hero-product-landing.html.twig";
import "./sw-cms-el-config-hero-product-landing.scss";

/**
 * Hero Product Landing - Config Component
 *
 * Allows selecting a product and configuring display options.
 * Supports custom fields, properties, variants, and extended product data.
 *
 * AVAILABLE CUSTOM FIELDS (create in Admin > Settings > System > Custom Fields):
 * - custom_horex_tagline: Short tagline above product name
 * - custom_horex_badge_text: Badge text (e.g. 'NEW', 'LIMITED')
 * - custom_horex_specs_highlight: Specs highlight (e.g. '161 PS | 128 Nm')
 * - custom_horex_specs_short: Short specifications as text
 * - custom_horex_video_url: YouTube/Vimeo video URL
 * - custom_horex_cta_text: Custom CTA button text
 * - custom_horex_cta_url: Custom CTA button URL
 * - custom_horex_highlight_features: HTML features list
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

    // ==================== PRODUCT SELECTION ====================
    productId: {
      get() {
        return this.element?.config?.productId?.value || null;
      },
      set(value) {
        this.element.config.productId.value = value;
        this.$emit("element-update", this.element);
      },
    },

    // ==================== BASIC DISPLAY OPTIONS ====================
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

    // ==================== CUSTOM FIELDS & EXTENDED DATA ====================
    showCustomFields: {
      get() {
        return this.element?.config?.showCustomFields?.value !== false;
      },
      set(value) {
        this.element.config.showCustomFields.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showTagline: {
      get() {
        return this.element?.config?.showTagline?.value !== false;
      },
      set(value) {
        this.element.config.showTagline.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showBadge: {
      get() {
        return this.element?.config?.showBadge?.value !== false;
      },
      set(value) {
        this.element.config.showBadge.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showSpecs: {
      get() {
        return this.element?.config?.showSpecs?.value !== false;
      },
      set(value) {
        this.element.config.showSpecs.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showVariants: {
      get() {
        return this.element?.config?.showVariants?.value !== false;
      },
      set(value) {
        this.element.config.showVariants.value = value;
        this.$emit("element-update", this.element);
      },
    },

    showGallery: {
      get() {
        return this.element?.config?.showGallery?.value === true;
      },
      set(value) {
        this.element.config.showGallery.value = value;
        this.$emit("element-update", this.element);
      },
    },

    // ==================== LAYOUT OPTIONS ====================
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
        {
          value: "hero",
          label: this.$tc(
            "sw-cms.elements.heroProductLanding.config.layout.options.hero"
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

    // ==================== PRODUCT SEARCH CRITERIA ====================
    productCriteria() {
      const criteria = new Shopware.Data.Criteria(1, 25);

      // Load associations for preview and data access
      criteria.addAssociation("cover");
      criteria.addAssociation("cover.media");
      criteria.addAssociation("manufacturer");
      criteria.addAssociation("properties");
      criteria.addAssociation("properties.group");
      criteria.addAssociation("options");
      criteria.addAssociation("options.group");

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
