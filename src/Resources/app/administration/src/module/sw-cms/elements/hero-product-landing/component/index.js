import template from "./sw-cms-el-hero-product-landing.html.twig";
import "./sw-cms-el-hero-product-landing.scss";

/**
 * Hero Product Landing - Admin Component
 *
 * Displays product preview in CMS editor
 */
export default {
  template,

  mixins: [Shopware.Mixin.getByName("cms-element")],

  computed: {
    product() {
      return this.element?.data?.product || null;
    },

    productName() {
      return this.product?.translated?.name || this.product?.name || "";
    },

    productDescription() {
      const desc =
        this.product?.translated?.description ||
        this.product?.description ||
        "";
      // Strip HTML tags for preview
      return (
        desc.replace(/<[^>]*>/g, "").substring(0, 200) +
        (desc.length > 200 ? "..." : "")
      );
    },

    productPrice() {
      const price = this.product?.calculatedPrice?.totalPrice;
      if (!price) return "";

      // Format price (simple formatting, proper formatting happens in Storefront)
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(price);
    },

    productImage() {
      return this.product?.cover?.media?.url || null;
    },

    hasProduct() {
      return !!this.product;
    },

    showName() {
      return this.element?.config?.showName?.value !== false;
    },

    showDescription() {
      return this.element?.config?.showDescription?.value !== false;
    },

    showPrice() {
      return this.element?.config?.showPrice?.value !== false;
    },
  },
};
