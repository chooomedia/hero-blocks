/**
 * Hero Product Landing Block Registration
 *
 * CMS Block for Landing Pages that displays product data.
 * Uses the hero-product-landing element which loads product data via TypeDataResolver.
 *
 * STOREFRONT USAGE:
 * - {{ element.data.product.translated.name }}
 * - {{ element.data.product.translated.description }}
 * - {{ element.data.product.calculatedPrice.totalPrice|currency }}
 * - etc.
 */

import "./component/index.js";
import "./preview/index.js";

Shopware.Service("cmsService").registerCmsBlock({
  name: "hero-product-landing",
  label: "sw-cms.blocks.heroBlocks.heroProductLanding.label",
  category: "commerce",
  component: "sw-cms-block-hero-product-landing",
  previewComponent: "sw-cms-preview-hero-product-landing",
  defaultConfig: {
    marginBottom: "20px",
    marginTop: "20px",
    marginLeft: null,
    marginRight: null,
    sizingMode: "boxed",
  },
  slots: {
    content: {
      type: "hero-product-landing",
    },
  },
});
