Shopware.Component.register("sw-cms-el-hero-slider", () =>
  import(
    /* webpackChunkName: "sw-cms-el-hero-slider" */ "./component/sw-cms-el-hero-slider"
  )
);
Shopware.Component.register("sw-cms-el-config-hero-slider", () =>
  import(
    /* webpackChunkName: "sw-cms-el-config-hero-slider" */ "./config/sw-cms-el-config-hero-slider"
  )
);
Shopware.Component.register("sw-cms-el-preview-hero-slider", () =>
  import(
    /* webpackChunkName: "sw-cms-el-preview-hero-slider" */ "./preview/sw-cms-el-preview-hero-slider"
  )
);

Shopware.Service("cmsService").registerCmsElement({
  name: "hero-slider",
  label: "sw-cms.elements.heroSlider.label",
  component: "sw-cms-el-hero-slider",
  configComponent: "sw-cms-el-config-hero-slider",
  previewComponent: "sw-cms-el-preview-hero-slider",
  defaultConfig: {
    sliderItems: {
      source: "static",
      value: [
        {
          url: null,
          newTab: false,
          mediaId: null,
          fileName: "preview-mountain",
          mediaUrl: "/administration/static/img/cms/preview_mountain_large.jpg",
        },
      ],
      required: true,
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
    button1NewTab: {
      source: "static",
      value: false,
    },
    button2Text: {
      source: "static",
      value: "Probefahrt",
    },
    button2Url: {
      source: "static",
      value: "#",
    },
    button2NewTab: {
      source: "static",
      value: false,
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
      value: true, // Initial: Auto-Slide aktiv
      source: "static",
    },
    autoplayTimeout: {
      value: 5000,
      source: "static",
    },
    speed: {
      value: 300,
      source: "static",
    },
    displayMode: {
      source: "static",
      value: "cover", // 'standard', 'cover', 'contain'
    },
    minHeight: {
      source: "static",
      value: "80vh", // Min-Höhe für cover mode
    },
    maxHeight: {
      source: "static",
      value: null, // Max-Höhe für cover mode (z.B. "100vh", "800px")
    },
    fullHeight: {
      source: "static",
      value: false, // Full-Height: 100vh minus Header (Desktop & Mobile)
    },
    verticalAlign: {
      source: "static",
      value: null, // 'center', 'flex-start', 'flex-end'
    },
    isDecorative: {
      source: "static",
      value: false,
    },
    logoImage: {
      source: "static",
      value: null,
      entity: {
        name: "media",
      },
    },
    contentVerticalAlign: {
      source: "static",
      value: "center", // 'top', 'center', 'bottom'
    },
    contentHorizontalAlign: {
      source: "static",
      value: "center", // 'left', 'center', 'right'
    },
    // Content Styling Options
    headlineColor: {
      source: "static",
      value: null, // CSS color (e.g., '#ffffff', 'rgba(255,255,255,1)')
    },
    headlineFontSize: {
      source: "static",
      value: null, // CSS font-size (e.g., '2rem', '48px')
    },
    textColor: {
      source: "static",
      value: null, // CSS color
    },
    textFontSize: {
      source: "static",
      value: null, // CSS font-size
    },
    button1BackgroundColor: {
      source: "static",
      value: null, // CSS color
    },
    button1TextColor: {
      source: "static",
      value: null, // CSS color
    },
    button2BackgroundColor: {
      source: "static",
      value: null, // CSS color
    },
    button2TextColor: {
      source: "static",
      value: null, // CSS color
    },
  },
  enrich: function enrich(slot, data) {
    if (Object.keys(data).length < 1) {
      return;
    }

    // Handle logoImage (single entity, not array)
    if (slot.config.logoImage?.entity && slot.config.logoImage?.value) {
      const entity = slot.config.logoImage.entity;
      const entityKey = `entity-${entity.name}-0`;

      if (data[entityKey]) {
        slot.data.logoImage = data[entityKey].get(slot.config.logoImage.value);
      }
    }

    let entityCount = 0;
    Object.keys(slot.config).forEach((configKey) => {
      const entity = slot.config[configKey].entity;

      if (!entity || configKey === "logoImage") {
        // Skip logoImage as it's handled above
        return;
      }

      const entityKey = `entity-${entity.name}-${entityCount}`;
      entityCount += 1;

      if (!data[entityKey]) {
        return;
      }

      Object.assign(slot.data, {
        [configKey]: [],
      });

      const items = slot.data[configKey];
      const config = slot.config[configKey];

      if (!Array.isArray(config.value)) {
        return;
      }

      config.value.forEach((sliderItem) => {
        const item = {
          newTab: sliderItem.newTab,
          url: sliderItem.url,
          media: data[entityKey].get(sliderItem.mediaId),
          // Per-Slide Content Fields (werden aus Config übertragen)
          headline: sliderItem.headline || null,
          text: sliderItem.text || null,
          button1Text: sliderItem.button1Text || null,
          button1Url: sliderItem.button1Url || null,
          button1NewTab: sliderItem.button1NewTab || false,
          button2Text: sliderItem.button2Text || null,
          button2Url: sliderItem.button2Url || null,
          button2NewTab: sliderItem.button2NewTab || false,
        };

        items.push(item);
      });
    });
  },
});
