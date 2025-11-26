import template from "./sw-cms-el-config-hero-category-slider.html.twig";
import "./sw-cms-el-config-hero-category-slider.scss";

/**
 * Category Slider Config Component - V3.0 SLIDE MANAGEMENT
 * 
 * Full Hero-Slider-Style UI mit:
 * - Add/Remove/Sort Slides
 * - Pro Slide: Category Selection + Custom Overrides
 * - Tab-Navigation für Slides
 * - Reaktive Preview
 */

const { Mixin } = Shopware;
const {
  moveItem,
  object: { cloneDeep },
} = Shopware.Utils;
const Criteria = Shopware.Data.Criteria;

export default {
  template,

  inject: ["repositoryFactory", "cmsService", "cmsPageState"],

  mixins: [Mixin.getByName("cms-element"), Mixin.getByName("notification")],

  emits: ["element-update"],

  props: {
    element: {
      type: Object,
      required: true,
      default() {
        return {
          config: {},
        };
      },
    },
  },

  data() {
    return {
      // V3.0 - Slide Management State
      categorySlides: [], // Array von Slide-Objekten
      activeSlideIndex: 0, // Aktuell ausgewählter Slide für Tab-Navigation
      
      // Category Loading
      categoryOptions: [], // Alle verfügbaren Kategorien für Dropdowns
      isLoadingCategories: false,
      loadedCategoryEntities: {}, // Cache: categoryId → Category Entity
      
      // Custom Image Modals (pro Slide)
      slideImageModals: {}, // { slideIndex: boolean }
      slideImageMedia: {}, // { slideIndex: Media Entity }
    };
  },

  computed: {
    categoryRepository() {
      return this.repositoryFactory.create("category");
    },

    mediaRepository() {
      return this.repositoryFactory.create("media");
    },

    // V3.0 - Category Slides aus element.config
    slides() {
      if (!this.element?.config?.categorySlides?.value) {
        return [];
      }
      return this.element.config.categorySlides.value;
    },

    // Current active slide
    activeSlide() {
      if (this.slides.length === 0) {
        return null;
      }
      const index = Math.min(this.activeSlideIndex, this.slides.length - 1);
      return this.slides[index] || null;
    },

    // Navigation Options (wie Hero Slider)
    navigationArrowsOptions() {
      if (!this.$tc) return [];
      return [
        {
          value: "none",
          label: this.$tc(
            "sw-cms.elements.imageSlider.config.label.navigationPositionNone"
          ),
        },
        {
          value: "inside",
          label: this.$tc(
            "sw-cms.elements.imageSlider.config.label.navigationPositionInside"
          ),
        },
        {
          value: "outside",
          label: this.$tc(
            "sw-cms.elements.imageSlider.config.label.navigationPositionOutside"
          ),
        },
      ];
    },

    navigationDotsOptions() {
      if (!this.$tc) return [];
      return [
        {
          value: "none",
          label: this.$tc(
            "sw-cms.elements.imageSlider.config.label.navigationPositionNone"
          ),
        },
        {
          value: "bottom",
          label: this.$tc(
            "sw-cms.elements.imageSlider.config.label.navigationPositionBottom"
          ),
        },
      ];
    },

    displayModeOptions() {
      if (!this.$tc) return [];
      return [
        {
          value: "standard",
          label: this.$tc(
            "sw-cms.elements.imageSlider.config.label.displayModeStandard"
          ),
        },
        {
          value: "cover",
          label: this.$tc(
            "sw-cms.elements.imageSlider.config.label.displayModeCover"
          ),
        },
        {
          value: "contain",
          label: this.$tc(
            "sw-cms.elements.imageSlider.config.label.displayModeContain"
          ),
        },
      ];
    },

    imageCountOptions() {
      return [
        { value: "1", label: "1 Image" },
        { value: "2", label: "2 Images" },
        { value: "3", label: "3 Images" },
        { value: "4", label: "4 Images" },
      ];
    },

    imageWidthOptions() {
      if (!this.$tc) return [];
      return [
        {
          value: "inner-full-width",
          label: this.$tc(
            "sw-cms.elements.categorySlider.config.imageWidth.innerFullWidth"
          ),
        },
        {
          value: "full-width",
          label: this.$tc(
            "sw-cms.elements.categorySlider.config.imageWidth.fullWidth"
          ),
        },
      ];
    },

    uploadTag() {
      return `cms-element-category-slider-${this.element?.id || "new"}`;
    },

    defaultFolderName() {
      return this.cmsPageState?.pageEntityName || "CMS Media";
    },
  },

  created() {
    console.log("[CategorySlider Config V3.0] created() - SLIDE MANAGEMENT!");

    // Initialize categorySlides
    if (!this.element?.config?.categorySlides) {
      if (!this.element.config) {
        this.element.config = {};
      }
      this.element.config.categorySlides = {
        source: "static",
        value: [],
      };
    }

    // Initialize defaults
    this.initElementConfig("hero-category-slider");

    // MIGRATION: Alte categoryIds zu Slides konvertieren
    this.migrateOldCategoryIds();

    // Load all available categories
    this.loadAllCategories();
  },

  mounted() {
    console.log("[CategorySlider Config V3.0] Mounted:", {
      slides: this.slides,
      categoryOptions: this.categoryOptions.length,
    });
  },

  methods: {
    // ========================================
    // MIGRATION & INITIALIZATION
    // ========================================

    migrateOldCategoryIds() {
      const oldIds = this.element?.config?.categoryIds?.value || [];
      const existingSlides = this.element?.config?.categorySlides?.value || [];

      if (oldIds.length > 0 && existingSlides.length === 0) {
        console.log(
          "[CategorySlider Config V3.0] Migrating old categoryIds:",
          oldIds
        );

        this.element.config.categorySlides.value = oldIds.map((categoryId) => ({
          id: this.generateUniqueId(),
          categoryId: categoryId,
          customTitle: null,
          customImageId: null,
          customText: null,
          customLink: null,
        }));

        // Clear old categoryIds
        this.element.config.categoryIds.value = [];

        console.log(
          "[CategorySlider Config V3.0] Migrated to slides:",
          this.element.config.categorySlides.value
        );
      }
    },

    generateUniqueId() {
      return `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // ========================================
    // CATEGORY LOADING
    // ========================================

    async loadAllCategories() {
      console.log("[CategorySlider Config V3.0] loadAllCategories() START");
      this.isLoadingCategories = true;

      try {
        const criteria = new Criteria(1, 500);
        criteria.addFilter(Criteria.equals("active", true));
        criteria.addFilter(
          Criteria.multi("OR", [
            Criteria.equals("type", "page"),
            Criteria.equals("type", "landing_page"),
          ])
        );
        criteria.addAssociation("translations");
        criteria.addAssociation("media");
        criteria.addAssociation("media.thumbnails");
        criteria.addSorting(Criteria.sort("name", "ASC"));

        const result = await this.categoryRepository.search(
          criteria,
          Shopware.Context.api
        );

        console.log(
          "[CategorySlider Config V3.0] Loaded categories:",
          result.total
        );

        // Build Options für Dropdowns
        this.categoryOptions = Array.from(result).map((category) => ({
          label: category.translated?.name || category.name || "Unknown",
          value: category.id,
        }));

        // Cache Entities
        result.forEach((category) => {
          this.loadedCategoryEntities[category.id] = category;
        });

        console.log(
          "[CategorySlider Config V3.0] categoryOptions built:",
          this.categoryOptions.length
        );
      } catch (error) {
        console.error(
          "[CategorySlider Config V3.0] Error loading categories:",
          error
        );
      } finally {
        this.isLoadingCategories = false;
      }
    },

    // ========================================
    // SLIDE MANAGEMENT
    // ========================================

    addSlide() {
      console.log("[CategorySlider Config V3.0] addSlide()");

      const newSlide = {
        id: this.generateUniqueId(),
        categoryId: null, // User muss Kategorie wählen
        customTitle: null,
        customImageId: null,
        customText: null,
        customLink: null,
      };

      if (!this.element.config.categorySlides) {
        this.element.config.categorySlides = {
          source: "static",
          value: [],
        };
      }

      this.element.config.categorySlides.value.push(newSlide);

      // Set active to new slide
      this.activeSlideIndex = this.slides.length - 1;

      this.emitUpdateEl();

      console.log("[CategorySlider Config V3.0] Slide added:", newSlide);
    },

    removeSlide(index) {
      console.log("[CategorySlider Config V3.0] removeSlide:", index);

      if (!this.element.config.categorySlides?.value) {
        return;
      }

      this.element.config.categorySlides.value.splice(index, 1);

      // Adjust active index
      if (this.activeSlideIndex >= this.slides.length) {
        this.activeSlideIndex = Math.max(0, this.slides.length - 1);
      }

      this.emitUpdateEl();
    },

    setActiveSlide(index) {
      console.log("[CategorySlider Config V3.0] setActiveSlide:", index);
      this.activeSlideIndex = index;
    },

    onSlideDragSort(dragData, dropData) {
      console.log("[CategorySlider Config V3.0] onSlideDragSort:", {
        from: dragData.position,
        to: dropData.position,
      });

      if (!this.element.config.categorySlides?.value) {
        return;
      }

      const slides = this.element.config.categorySlides.value;
      moveItem(slides, dragData.position, dropData.position);

      this.emitUpdateEl();
    },

    // ========================================
    // PER-SLIDE SETTINGS
    // ========================================

    onCategoryChange(slideIndex, categoryId) {
      console.log("[CategorySlider Config V3.0] onCategoryChange:", {
        slideIndex,
        categoryId,
      });

      if (!this.slides[slideIndex]) {
        return;
      }

      this.slides[slideIndex].categoryId = categoryId;

      this.emitUpdateEl();
    },

    onCustomTitleChange(slideIndex, value) {
      if (!this.slides[slideIndex]) return;
      this.slides[slideIndex].customTitle = value;
      this.emitUpdateEl();
    },

    onCustomTextChange(slideIndex, value) {
      if (!this.slides[slideIndex]) return;
      this.slides[slideIndex].customText = value;
      this.emitUpdateEl();
    },

    onCustomLinkChange(slideIndex, value) {
      if (!this.slides[slideIndex]) return;
      this.slides[slideIndex].customLink = value;
      this.emitUpdateEl();
    },

    // ========================================
    // CUSTOM IMAGE UPLOAD (PRO SLIDE)
    // ========================================

    openImageModal(slideIndex) {
      console.log("[CategorySlider Config V3.0] openImageModal:", slideIndex);
      this.$set(this.slideImageModals, slideIndex, true);
    },

    closeImageModal(slideIndex) {
      this.$set(this.slideImageModals, slideIndex, false);
    },

    async onImageUpload(slideIndex, { targetId }) {
      console.log("[CategorySlider Config V3.0] onImageUpload:", {
        slideIndex,
        targetId,
      });

      if (!this.slides[slideIndex]) return;

      // Load media entity
      try {
        const media = await this.mediaRepository.get(
          targetId,
          Shopware.Context.api
        );
        
        // Cache media entity
        this.$set(this.slideImageMedia, slideIndex, media);
        
        // Save mediaId to slide
        this.slides[slideIndex].customImageId = targetId;

        this.emitUpdateEl();

        console.log("[CategorySlider Config V3.0] Image uploaded:", media);
      } catch (error) {
        console.error(
          "[CategorySlider Config V3.0] Error loading media:",
          error
        );
      }
    },

    onImageRemove(slideIndex) {
      console.log("[CategorySlider Config V3.0] onImageRemove:", slideIndex);

      if (!this.slides[slideIndex]) return;

      this.slides[slideIndex].customImageId = null;
      this.$delete(this.slideImageMedia, slideIndex);

      this.emitUpdateEl();
    },

    onImageSelectionChange(slideIndex, selection) {
      console.log("[CategorySlider Config V3.0] onImageSelectionChange:", {
        slideIndex,
        selection,
      });

      if (selection && selection.length > 0) {
        const mediaId = selection[0].id;
        this.onImageUpload(slideIndex, { targetId: mediaId });
      }

      this.closeImageModal(slideIndex);
    },

    // Get media entity for slide (from cache or slide config)
    getSlideImageMedia(slideIndex) {
      if (this.slideImageMedia[slideIndex]) {
        return this.slideImageMedia[slideIndex];
      }

      const slide = this.slides[slideIndex];
      if (slide?.customImageId) {
        // Load async (will be cached)
        this.loadSlideImage(slideIndex, slide.customImageId);
      }

      return null;
    },

    async loadSlideImage(slideIndex, mediaId) {
      try {
        const media = await this.mediaRepository.get(
          mediaId,
          Shopware.Context.api
        );
        this.$set(this.slideImageMedia, slideIndex, media);
      } catch (error) {
        console.error(
          "[CategorySlider Config V3.0] Error loading slide image:",
          error
        );
      }
    },

    // ========================================
    // GLOBAL SETTINGS (NON-SLIDE-SPECIFIC)
    // ========================================

    onChangeNavigationArrows(value) {
      if (!this.element?.config?.navigationArrows) return;
      this.element.config.navigationArrows.value = value;
      this.emitUpdateEl();
    },

    onChangeNavigationDots(value) {
      if (!this.element?.config?.navigationDots) return;
      this.element.config.navigationDots.value = value;
      this.emitUpdateEl();
    },

    onChangeAutoSlide(value) {
      if (!this.element?.config?.autoSlide) return;
      this.element.config.autoSlide.value = value;
      this.emitUpdateEl();
    },

    onChangeAutoplayTimeout(value) {
      if (!this.element?.config?.autoplayTimeout) return;
      this.element.config.autoplayTimeout.value = value;
      this.emitUpdateEl();
    },

    onChangeSpeed(value) {
      if (!this.element?.config?.speed) return;
      this.element.config.speed.value = value;
      this.emitUpdateEl();
    },

    onChangeDisplayMode(value) {
      if (!this.element?.config?.displayMode) return;
      this.element.config.displayMode.value = value;
      this.emitUpdateEl();
    },

    onChangeMinHeight(value) {
      if (!this.element?.config?.minHeight) return;
      this.element.config.minHeight.value = value;
      this.emitUpdateEl();
    },

    onChangeImageCount(value) {
      if (!this.element?.config?.imageCount) return;
      this.element.config.imageCount.value = value;
      this.emitUpdateEl();
    },

    onChangeImageWidth(value) {
      if (!this.element?.config?.imageWidth) return;
      this.element.config.imageWidth.value = value;
      this.emitUpdateEl();
    },

    onChangeSubcategoryLevels(value) {
      if (!this.element?.config?.subcategoryLevels) return;
      this.element.config.subcategoryLevels.value = value;
      this.emitUpdateEl();
    },

    // ========================================
    // HELPER
    // ========================================

    emitUpdateEl() {
      this.$emit("element-update", this.element);
    },

    getCategoryName(categoryId) {
      const category = this.loadedCategoryEntities[categoryId];
      return category?.translated?.name || category?.name || "Unknown Category";
    },
  },
};
