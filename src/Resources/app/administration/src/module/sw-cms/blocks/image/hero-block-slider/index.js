/**
 * @private
 */
// Note: Import and register snippets for translations
import deDE from '../../../snippet/de-DE.json';
import enGB from '../../../snippet/en-GB.json';

// Register snippets
Shopware.Locale.extend('de-DE', deDE);
Shopware.Locale.extend('en-GB', enGB);

Shopware.Component.register("sw-cms-preview-hero-block-slider", () => import("./preview/index.js"));
/**
 * @private
 */
Shopware.Component.register("sw-cms-block-hero-block-slider", () => import("./component/index.js"));

/**
 * @private
 */
Shopware.Service("cmsService").registerCmsBlock({
  name: "hero-block-slider",
  label: "sw-cms.blocks.heroBlocks.heroBlockSlider.label",
  category: "image",
  component: "sw-cms-block-hero-block-slider",
  previewComponent: "sw-cms-preview-hero-block-slider",
  defaultConfig: {
    marginBottom: "0",
    marginTop: "0",
    marginLeft: null,
    marginRight: null,
    sizingMode: "full_width", // Initial: full_width (wie image-cover)
  },
  slots: {
    heroSlider: {
      type: "hero-slider",
      default: {
        config: {
          sliderItems: {
            source: "static",
            value: [
              {
                url: null,
                newTab: false,
                mediaId: null,
                fileName: "preview-mountain",
                mediaUrl: null,
              },
            ],
            entity: {
              name: "media",
            },
          },
          headline: {
            source: "static",
            value: "Hero Slider",
          },
          text: {
            source: "static",
            value: "Ihre Botschaft hier",
          },
          button1Text: {
            source: "static",
            value: "Mehr",
          },
          button1Url: {
            source: "static",
            value: "#",
          },
          button2Text: {
            source: "static",
            value: "Probefahrt",
          },
          button2Url: {
            source: "static",
            value: "#",
          },
          navigationArrows: {
            source: "static",
            value: "outside",
          },
          navigationDots: {
            source: "static",
            value: "bottom",
          },
          autoSlide: {
            source: "static",
            value: false,
          },
          autoplayTimeout: {
            source: "static",
            value: 5000,
          },
          speed: {
            source: "static",
            value: 300,
          },
        },
        data: {},
      },
    },
  },
});
