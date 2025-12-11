/**
 * Hero Product Landing Element Registration
 *
 * CMS Element for Landing Pages that allows selecting a product
 * and accessing its data in Storefront templates.
 *
 * USAGE IN STOREFRONT TEMPLATE:
 * - {{ element.data.product.translated.name }}
 * - {{ element.data.product.translated.description }}
 * - {{ element.data.product.calculatedPrice.totalPrice|currency }}
 * - {{ element.data.product.cover.media.url }}
 * - {{ element.data.product.properties }}
 * - etc.
 *
 * WICHTIG: Snippets werden bereits in main.js registriert (VOR diesem Import)
 */

Shopware.Component.register("sw-cms-el-hero-product-landing", () =>
  import("./component/index.js")
);
Shopware.Component.register("sw-cms-el-config-hero-product-landing", () =>
  import("./config/index.js")
);
Shopware.Component.register("sw-cms-el-preview-hero-product-landing", () =>
  import("./preview/index.js")
);

Shopware.Service("cmsService").registerCmsElement({
  name: "hero-product-landing",
  label: "sw-cms.elements.heroProductLanding.label",
  component: "sw-cms-el-hero-product-landing",
  configComponent: "sw-cms-el-config-hero-product-landing",
  previewComponent: "sw-cms-el-preview-hero-product-landing",
  defaultConfig: {
    // Product ID - selected via product picker
    productId: {
      source: "static",
      value: null,
    },
    // Display Settings
    showName: {
      source: "static",
      value: true,
    },
    showDescription: {
      source: "static",
      value: true,
    },
    showPrice: {
      source: "static",
      value: true,
    },
    showProperties: {
      source: "static",
      value: true,
    },
    showManufacturer: {
      source: "static",
      value: false,
    },
    showBuyButton: {
      source: "static",
      value: true,
    },
    // Layout Options
    layout: {
      source: "static",
      value: "default", // 'default', 'compact', 'full'
    },
  },
  // Admin Preview Enrichment (loads product data for preview)
  enrich: function enrich(slot, data) {
    if (!slot || !slot.config || Object.keys(data).length < 1) {
      return;
    }

    const productId = slot.config.productId?.value;

    if (!productId) {
      slot.data = { product: null };
      return;
    }

    // Load product from data (comes from CMS service)
    const entityKey = "entity-product-0";
    if (data[entityKey]) {
      const product = data[entityKey].get(productId);
      slot.data = {
        product: product || null,
        productId: productId,
      };
      console.log(
        "[HeroProductLanding] Enriched product for preview:",
        product?.translated?.name
      );
    } else {
      slot.data = { product: null };
    }
  },
});
