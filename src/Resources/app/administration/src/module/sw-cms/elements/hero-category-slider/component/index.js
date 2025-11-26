import template from "./sw-cms-el-hero-category-slider.html.twig";
import "./sw-cms-el-hero-category-slider.scss";

// V3.0 - SLIDE-BASED PREVIEW mit reaktiver Anzeige

export default {
    template,
    
    props: {
        element: {
            type: Object,
            required: true,
            default() {
                return {};
            },
        },
    },

  data() {
    return {
      renderCount: 0,
    };
  },

  watch: {
    // V3.0 - Watch categorySlides statt categoryIds
    "element.config.categorySlides.value": {
      deep: true,
      handler(newVal) {
        console.log("[CategorySlider Component V3.0] categorySlides changed:", newVal);
        this.renderCount++;
      },
    },
    "element.config.imageCount.value": {
      handler(newVal) {
        console.log("[CategorySlider Component V3.0] imageCount changed:", newVal);
        this.renderCount++;
      },
    },
    "element.data.categorySlides": {
      deep: true,
      handler(newVal) {
        console.log("[CategorySlider Component V3.0] categorySlides data changed:", newVal);
      },
    },
  },
    
    computed: {
        assetFilter() {
      return Shopware.Filter.getByName("asset");
        },
        
    // V3.0 - Slides aus Config
    slides() {
      const slides = this.element?.config?.categorySlides?.value || [];
      console.log("[CategorySlider Component V3.0] slides from config:", slides);
      return slides;
    },

    // V3.0 - Enriched Slides aus data (mit Category Entities)
    enrichedSlides() {
      const enriched = this.element?.data?.categorySlides || [];
      console.log("[CategorySlider Component V3.0] enriched slides:", enriched);
      return enriched;
    },

    // V3.0 - Slide Images für Preview
    slideImages() {
      const images = [];

      if (this.enrichedSlides && this.enrichedSlides.length > 0) {
        this.enrichedSlides.forEach((slide, index) => {
          console.log(`[CategorySlider Component V3.0] Processing slide ${index}:`, slide);

          if (slide.category?.media) {
            images.push({
              media: slide.category.media,
              title: slide.customTitle || slide.category.translated?.name || "Category",
              text: slide.customText || null,
            });
          }
        });
      }

      console.log("[CategorySlider Component V3.0] slideImages total:", images.length);
      return images;
    },

    // V3.0 - hasSlides prüft ob Slides definiert sind
    hasSlides() {
      const hasConfig = this.slides && this.slides.length > 0;
      const hasData = this.slideImages && this.slideImages.length > 0;

      console.log("[CategorySlider Component V3.0] hasSlides?", {
        hasConfig,
        hasData,
      });
      return hasConfig || hasData;
        },
        
    // V3.0 - Preview-Bilder für Großansicht (reaktiv basierend auf imageCount & Slides)
    previewImages() {
      const count = parseInt(this.imageCount, 10);
      const images = [];

      console.log(`[CategorySlider Component V3.0] Building ${count} preview images from ${this.slideImages.length} slides`);

      for (let i = 0; i < count; i++) {
        if (this.slideImages[i]) {
          // Echtes Slide-Bild
          images.push({
            url: this.slideImages[i].media?.url || this.getFallbackImage(i),
            title: this.slideImages[i].title || "Category Slide",
            text: this.slideImages[i].text || null,
            isReal: true,
          });
        } else {
          // Fallback-Bild (wenn weniger Slides als imageCount)
          images.push({
            url: this.getFallbackImage(i),
            title: this.slides[0]?.customTitle || "Category Slide",
            text: null,
            isReal: false,
          });
                }
            }
            
      console.log("[CategorySlider Component V3.0] previewImages:", images);
      return images;
    },

    // Image Count (1-4) - aus element.config - REAKTIV
    imageCount() {
      const count = this.element?.config?.imageCount?.value || "1";
      console.log("[CategorySlider Component V3.0] imageCount:", count);
      return count;
    },
  },

  methods: {
    // Helper: Fallback-Bilder basierend auf Index
    getFallbackImage(index) {
      const fallbacks = [
        "/administration/administration/static/img/cms/preview_mountain_large.jpg",
        "/administration/administration/static/img/cms/preview_mountain_small.jpg",
        "/administration/administration/static/img/cms/preview_plant_large.jpg",
        "/administration/administration/static/img/cms/preview_glasses_large.jpg",
      ];
      return this.assetFilter(fallbacks[index % fallbacks.length]);
    },
  },

  mounted() {
    console.log("[CategorySlider Component V3.0] MOUNTED - SLIDE MANAGEMENT");
    console.log("  → element.config:", this.element.config);
    console.log("  → element.data:", this.element.data);
    console.log("  → slides:", this.slides);
    console.log("  → enrichedSlides:", this.enrichedSlides);
    console.log("  → slideImages:", this.slideImages);
    console.log("  → imageCount:", this.imageCount);
    console.log("  → hasSlides:", this.hasSlides);
    },
};
