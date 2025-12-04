import template from "./sw-cms-el-config-hero-slider.html.twig";
import "./sw-cms-el-config-hero-slider.scss";

const { Mixin } = Shopware;
const {
  moveItem,
  object: { cloneDeep },
} = Shopware.Utils;
const Criteria = Shopware.Data.Criteria;

export default {
  template,

  inject: ["cmsService", "repositoryFactory", "cmsPageState"],

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
      mediaModalIsOpen: false,
      initialFolderId: null,
      mediaItems: [],
      activeSlideIndex: 0, // Aktiver Slide für Toggle-Navigation
      slideLogoModals: {}, // Pro Slide ein Logo-Modal State
      slideLogoMedia: {}, // Pro Slide gespeicherte Logo Media Entities
    };
  },

  computed: {
    entity() {
      return {
        name: "media",
      };
    },

    uploadTag() {
      return `cms-element-media-config-${this.element?.id || "new"}`;
    },

    mediaRepository() {
      return this.repositoryFactory.create("media");
    },

    defaultFolderName() {
      return this.cmsPageState?.pageEntityName || "CMS Media";
    },

    items() {
      if (!this.element?.config?.sliderItems) {
        return [];
      }
      return this.element.config.sliderItems.value || [];
    },

    navigationArrowsValueOptions() {
      if (!this.$tc) {
        return [];
      }
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

    navigationDotsValueOptions() {
      if (!this.$tc) {
        return [];
      }
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

    displayModeValueOptions() {
      if (!this.$tc) {
        return [];
      }
      return [
        {
          value: "standard",
          label: this.$tc(
            "sw-cms.elements.image.config.label.displayModeStandard"
          ),
        },
        {
          value: "cover",
          label: this.$tc(
            "sw-cms.elements.image.config.label.displayModeCover"
          ),
        },
        {
          value: "contain",
          label: this.$tc(
            "sw-cms.elements.image.config.label.displayModeContain"
          ),
        },
      ];
    },

    verticalAlignValueOptions() {
      if (!this.$tc) {
        return [];
      }
      return [
        {
          value: null,
          label: this.$tc(
            "sw-cms.elements.general.config.label.verticalAlignNone"
          ),
        },
        {
          value: "center",
          label: this.$tc(
            "sw-cms.elements.general.config.label.verticalAlignCenter"
          ),
        },
        {
          value: "flex-start",
          label: this.$tc(
            "sw-cms.elements.general.config.label.verticalAlignTop"
          ),
        },
        {
          value: "flex-end",
          label: this.$tc(
            "sw-cms.elements.general.config.label.verticalAlignBottom"
          ),
        },
      ];
    },

    // Content Styling Options
    headlineFontSizeOptions() {
      if (!this.$tc) return [];
      return [
        {
          value: null,
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.inherit"
          ),
        },
        {
          value: "1.5rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.small"
          ),
        },
        {
          value: "2rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.medium"
          ),
        },
        {
          value: "2.5rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.large"
          ),
        },
        {
          value: "3rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.xlarge"
          ),
        },
        {
          value: "3.5rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.xxlarge"
          ),
        },
      ];
    },

    textFontSizeOptions() {
      if (!this.$tc) return [];
      return [
        {
          value: null,
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.inherit"
          ),
        },
        {
          value: "0.875rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.xsmall"
          ),
        },
        {
          value: "1rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.small"
          ),
        },
        {
          value: "1.125rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.medium"
          ),
        },
        {
          value: "1.25rem",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.styling.fontSize.large"
          ),
        },
      ];
    },
    
    // Default CSS für Logo "outside" Position
    defaultLogoOutsideCss() {
      return `position: absolute;
top: 1rem;
left: 1rem;
max-width: 200px;
z-index: 10;`;
    },
  },

  created() {
    this.createdComponent();
  },

  watch: {
    items: {
      handler(newItems) {
        // Reset activeSlideIndex wenn Items gelöscht werden
        if (newItems.length > 0 && this.activeSlideIndex >= newItems.length) {
          this.activeSlideIndex = Math.max(0, newItems.length - 1);
        } else if (newItems.length === 0) {
          this.activeSlideIndex = 0;
        }
      },
      immediate: true,
    },
  },

  methods: {
    async createdComponent() {
      this.initElementConfig("hero-slider");

      if (
        this.element.config.sliderItems?.source !== "default" &&
        this.element.config.sliderItems?.value?.length > 0
      ) {
        // Sammle ALLE Media IDs (Background + Logo)
        const backgroundMediaIds = [];
        const logoMediaIds = [];
        
        this.element.config.sliderItems.value.forEach((configElement) => {
          if (configElement.mediaId) {
            backgroundMediaIds.push(configElement.mediaId);
          }
          if (configElement.logoImageId) {
            logoMediaIds.push(configElement.logoImageId);
          }
        });
        
        // Alle Media IDs kombinieren (ohne Duplikate)
        const allMediaIds = [...new Set([...backgroundMediaIds, ...logoMediaIds])].filter(Boolean);

        if (allMediaIds.length > 0) {
          const criteria = new Criteria(1, 50);
          criteria.setIds(allMediaIds);

          try {
            const searchResult = await this.mediaRepository.search(criteria);

            // Background Media Items zuweisen
            this.mediaItems = backgroundMediaIds
              .map((mediaId) => searchResult.get(mediaId))
              .filter((mediaItem) => mediaItem !== null);

            // Logo Media Items zuweisen (pro Slide Index)
            this.element.config.sliderItems.value.forEach((item, index) => {
              // Prüfe Background Media
              if (item.mediaId && searchResult.get(item.mediaId) === null) {
                this.onItemRemove({ id: item.mediaId }, index);
              }
              
              // Logo Media zuweisen
              if (item.logoImageId) {
                const logoMedia = searchResult.get(item.logoImageId);
                if (logoMedia) {
                  this.slideLogoMedia[index] = logoMedia;
                }
              }
            });
          } catch (error) {
            console.error("Error loading media items:", error);
            this.mediaItems = [];
          }
        }
      }
    },

    async onImageUpload(mediaItem) {
      // Warnung bei großen Dateien (>200KB)
      // Prüfe fileSize vom MediaEntity (wird vom Repository zurückgegeben)
      if (mediaItem && (mediaItem.fileSize || mediaItem.file?.size)) {
        const fileSize = mediaItem.fileSize || mediaItem.file?.size || 0;
        const maxSizeBytes = 200 * 1024; // 200KB in Bytes

        if (fileSize > maxSizeBytes) {
          const fileSizeKB = (fileSize / 1024).toFixed(1);
          const fileName =
            mediaItem.fileName ||
            mediaItem.name ||
            mediaItem.file?.name ||
            "Image";

          this.createNotificationWarning({
            title: this.$tc(
              "sw-cms.elements.heroSlider.config.uploadSizeWarning.title"
            ),
            message: this.$tc(
              "sw-cms.elements.heroSlider.config.uploadSizeWarning.message",
              0,
              {
                fileName: fileName,
                size: fileSizeKB,
                maxSize: "200",
              }
            ),
          });
        }
      }

      const sliderItems = this.element.config.sliderItems;
      if (sliderItems.source === "default") {
        sliderItems.value = [];
        sliderItems.source = "static";
      }

      // Check if mediaItem already exists
      const mediaItemExists = this.mediaItems.find((item) => {
        return item.id === mediaItem.id;
      });

      if (mediaItemExists) {
        this.mediaItems = this.mediaItems.filter((item) => {
          return item.id !== mediaItem.id;
        });

        sliderItems.value = sliderItems.value.filter((item) => {
          return item.mediaId !== mediaItem.id;
        });
      }

      sliderItems.value.push({
        mediaUrl: mediaItem.url,
        mediaId: mediaItem.id,
        url: null,
        newTab: false,
        // Per-Slide Content Fields
        logoImageId: null, // Logo Image pro Slide
        logoPosition: 'inside', // Logo Position: 'inside' (default) oder 'outside'
        logoTranslateX: 0, // Logo Position X (px) - nur bei 'inside'
        logoTranslateY: 0, // Logo Position Y (px) - nur bei 'inside'
        logoCustomCss: '', // Custom CSS für Logo - nur bei 'outside'
        headline: null,
        text: null,
        button1Text: null,
        button1Url: null,
        button1NewTab: false,
        button2Text: null,
        button2Url: null,
        button2NewTab: false,
      });

      this.mediaItems.push(mediaItem);

      this.updateMediaDataValue();
      this.emitUpdateEl();
    },

    onItemRemove(mediaItem, index) {
      const key = mediaItem.id;
      const { value } = this.element.config.sliderItems;

      this.element.config.sliderItems.value = value.filter((item, i) => {
        return item.mediaId !== key || i !== index;
      });

      this.mediaItems = this.mediaItems.filter((item, i) => {
        return item.id !== key || i !== index;
      });

      this.updateMediaDataValue();
      this.emitUpdateEl();
    },

    onItemSort(dragData, dropData) {
      moveItem(this.mediaItems, dragData.position, dropData.position);
      moveItem(
        this.element.config.sliderItems.value,
        dragData.position,
        dropData.position
      );

      this.updateMediaDataValue();
      this.emitUpdateEl();
    },

    updateMediaDataValue() {
      if (this.element.config.sliderItems.value) {
        const sliderItems = cloneDeep(this.element.config.sliderItems.value);

        sliderItems.forEach((sliderItem) => {
          this.mediaItems.forEach((mediaItem) => {
            if (sliderItem.mediaId === mediaItem.id) {
              sliderItem.media = mediaItem;
            }
          });
        });

        if (!this.element.data) {
          this.element.data = { sliderItems };
          return;
        }

        this.element.data.sliderItems = sliderItems;
      }
    },

    onOpenMediaModal() {
      this.mediaModalIsOpen = true;
    },

    onMediaSelectionChange(mediaItems) {
      const sliderItems = this.element.config.sliderItems;
      if (sliderItems.source === "default") {
        sliderItems.value = [];
        sliderItems.source = "static";
      }

      mediaItems.forEach((item) => {
        this.element.config.sliderItems.value.push({
          mediaUrl: item.url,
          mediaId: item.id,
          url: null,
          newTab: false,
          // Per-Slide Content Fields
          logoImageId: null,
          logoPosition: 'inside', // Logo Position: 'inside' (default) oder 'outside'
          logoTranslateX: 0, // Logo Position X (px) - nur bei 'inside'
          logoTranslateY: 0, // Logo Position Y (px) - nur bei 'inside'
          logoCustomCss: '', // Custom CSS für Logo - nur bei 'outside'
          headline: null,
          text: null,
          button1Text: null,
          button1Url: null,
          button1NewTab: false,
          button2Text: null,
          button2Url: null,
          button2NewTab: false,
        });
      });

      this.mediaItems.push(...mediaItems);

      this.updateMediaDataValue();
      this.emitUpdateEl();
    },

    onCloseMediaModal() {
      this.mediaModalIsOpen = false;
    },

    onChangeAutoSlide(value) {
      if (!this.element?.config?.autoSlide) return;
      this.element.config.autoSlide.value = value;
      this.$emit("element-update", this.element);
    },

    emitUpdateEl() {
      if (!this.element) return;
      this.$emit("element-update", this.element);
    },

    onChangeDisplayMode(value) {
      if (!this.element?.config?.displayMode) return;
      this.element.config.displayMode.value = value;

      // Deaktiviere verticalAlign wenn displayMode = 'cover'
      if (value === "cover") {
        this.element.config.verticalAlign.value = null;
      }

      this.$emit("element-update", this.element);
    },

    // Logo Image Handling pro Slide
    getSlideLogoImage(sliderItem, index) {
      if (!sliderItem?.logoImageId) {
        return null;
      }

      // Hole Logo Media aus slideLogoMedia oder suche in mediaItems
      if (this.slideLogoMedia[index]) {
        return this.slideLogoMedia[index];
      }

      const logoMedia = this.mediaItems.find(
        (item) => item.id === sliderItem.logoImageId
      );

      if (logoMedia) {
        // Vue 3: Direkte Zuweisung statt $set
        this.slideLogoMedia[index] = logoMedia;
        return logoMedia;
      }

      return null;
    },

    async onOpenSlideLogoModal(index) {
      // Vue 3: Direkte Zuweisung statt $set
      this.slideLogoModals[index] = true;
    },

    onCloseSlideLogoModal(index) {
      // Vue 3: Direkte Zuweisung statt $set
      this.slideLogoModals[index] = false;
    },

    async onSlideLogoSelectionChange(index, [logoMedia]) {
      if (!logoMedia || !logoMedia.id) {
        return;
      }

      const sliderItem = this.items[index];
      if (!sliderItem) {
        return;
      }

      sliderItem.logoImageId = logoMedia.id;
      // Vue 3: Direkte Zuweisung statt $set
      this.slideLogoMedia[index] = logoMedia;

      // Lade Logo Media Entity wenn noch nicht vorhanden
      if (!this.mediaItems.find((item) => item.id === logoMedia.id)) {
        try {
          const mediaEntity = await this.mediaRepository.get(logoMedia.id);
          if (mediaEntity) {
            this.mediaItems.push(mediaEntity);
          }
        } catch (error) {
          console.error("Error loading logo media:", error);
        }
      }

      this.emitUpdateEl();
      // Vue 3: Direkte Zuweisung statt $set
      this.slideLogoModals[index] = false;
    },

    async onSlideLogoUpload(index, uploadedMedia) {
      const sliderItem = this.items[index];
      if (!sliderItem || !uploadedMedia?.targetId) {
        return;
      }

      try {
        const mediaEntity = await this.mediaRepository.get(
          uploadedMedia.targetId
        );
        if (mediaEntity) {
          sliderItem.logoImageId = mediaEntity.id;
          // Vue 3: Direkte Zuweisung statt $set
          this.slideLogoMedia[index] = mediaEntity;

          if (!this.mediaItems.find((item) => item.id === mediaEntity.id)) {
            this.mediaItems.push(mediaEntity);
          }

          this.emitUpdateEl();
        }
      } catch (error) {
        console.error("Error uploading logo media:", error);
      }
    },

    onSlideLogoRemove(index) {
      const sliderItem = this.items[index];
      if (!sliderItem) {
        return;
      }

      sliderItem.logoImageId = null;
      // Vue 3: Direkte Zuweisung statt $set
      this.slideLogoMedia[index] = null;
      this.emitUpdateEl();
    },

    // Content Alignment Options
    contentVerticalAlignValueOptions() {
      if (!this.$tc) {
        return [];
      }
      return [
        {
          value: "top",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.contentVerticalAlignTop"
          ),
        },
        {
          value: "center",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.contentVerticalAlignCenter"
          ),
        },
        {
          value: "bottom",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.contentVerticalAlignBottom"
          ),
        },
      ];
    },

    contentHorizontalAlignValueOptions() {
      if (!this.$tc) {
        return [];
      }
      return [
        {
          value: "left",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.contentHorizontalAlignLeft"
          ),
        },
        {
          value: "center",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.contentHorizontalAlignCenter"
          ),
        },
        {
          value: "right",
          label: this.$tc(
            "sw-cms.elements.heroSlider.config.contentHorizontalAlignRight"
          ),
        },
      ];
    },

    onChangeMinHeight(value) {
      if (!this.element?.config?.minHeight) return;
      this.element.config.minHeight.value = value;
      this.$emit("element-update", this.element);
    },

    onChangeMaxHeight(value) {
      if (!this.element?.config?.maxHeight) return;
      this.element.config.maxHeight.value = value;
      this.$emit("element-update", this.element);
    },

    onChangeFullHeight(value) {
      if (!this.element?.config?.fullHeight) return;
      this.element.config.fullHeight.value = value;
      // Wenn fullHeight aktiviert, setze minHeight/maxHeight auf calc(100vh - var(--header-height, 80px))
      // Wenn fullHeight deaktiviert, behalte die Werte (Felder bleiben editierbar)
      if (value) {
        if (this.element?.config?.minHeight) {
          this.element.config.minHeight.value =
            "calc(100vh - var(--header-height, 80px))";
        }
        if (this.element?.config?.maxHeight) {
          this.element.config.maxHeight.value =
            "calc(100vh - var(--header-height, 80px))";
        }
      }
      // Emit update für Reaktivität
      this.$emit("element-update", this.element);
    },

    onChangeIsDecorative(value) {
      if (!this.element?.config?.isDecorative) return;
      this.element.config.isDecorative.value = value;
      this.$emit("element-update", this.element);
    },

    onChangeColor(colorKey, value) {
      if (!this.element?.config?.[colorKey]) {
        // Initialisiere Config wenn nicht vorhanden
        if (!this.element.config) {
          // Vue 3: Direkte Zuweisung statt $set
          this.element.config = {};
        }
        // Vue 3: Direkte Zuweisung statt $set
        this.element.config[colorKey] = {
          source: "static",
          value: null,
        };
      }
      // Setze Wert (null oder String)
      this.element.config[colorKey].value = value || null;
      this.emitUpdateEl();
    },

    onClearButtonUrl(sliderItem, key) {
      if (!sliderItem || !key) return;
      // Vue 3: Direkte Zuweisung statt $set
      sliderItem[key] = null;
      this.emitUpdateEl();
    },

    setActiveSlide(index) {
      this.activeSlideIndex = index;
    },

    // Slide löschen
    onDeleteSlide(index) {
      if (index < 0 || index >= this.items.length) {
        return;
      }

      // Entferne Slide aus items und mediaItems
      const sliderItem = this.items[index];
      if (sliderItem?.mediaId) {
        // Entferne aus mediaItems
        this.mediaItems = this.mediaItems.filter(
          (item) => item.id !== sliderItem.mediaId
        );
      }

      // Entferne aus sliderItems
      this.element.config.sliderItems.value.splice(index, 1);

      // Entferne zugehörige Logo Media
      if (this.slideLogoMedia[index]) {
        delete this.slideLogoMedia[index];
      }
      if (this.slideLogoModals[index]) {
        delete this.slideLogoModals[index];
      }

      // Aktualisiere activeSlideIndex
      if (this.activeSlideIndex >= this.items.length) {
        this.activeSlideIndex = Math.max(0, this.items.length - 1);
      }

      this.updateMediaDataValue();
      this.emitUpdateEl();
    },

    // Drag & Drop für Slide Navigation
    onSlideDragSort(dragData, dropData, valid) {
      if (!valid || !dragData || !dropData) {
        return;
      }

      const dragIndex = dragData.position;
      const dropIndex = dropData.position;

      if (
        dragIndex === dropIndex ||
        dragIndex === undefined ||
        dropIndex === undefined
      ) {
        return;
      }

      // Verschiebe in items (sliderItems.value)
      moveItem(this.element.config.sliderItems.value, dragIndex, dropIndex);

      // Verschiebe in mediaItems
      moveItem(this.mediaItems, dragIndex, dropIndex);

      // Aktualisiere activeSlideIndex
      if (this.activeSlideIndex === dragIndex) {
        this.activeSlideIndex = dropIndex;
      } else if (this.activeSlideIndex === dropIndex && dragIndex < dropIndex) {
        this.activeSlideIndex = dropIndex - 1;
      } else if (this.activeSlideIndex === dropIndex && dragIndex > dropIndex) {
        this.activeSlideIndex = dropIndex + 1;
      } else if (
        this.activeSlideIndex > dragIndex &&
        this.activeSlideIndex <= dropIndex
      ) {
        this.activeSlideIndex -= 1;
      } else if (
        this.activeSlideIndex < dragIndex &&
        this.activeSlideIndex >= dropIndex
      ) {
        this.activeSlideIndex += 1;
      }

      // Verschiebe Logo Media Daten
      const logoMedia = this.slideLogoMedia[dragIndex];
      const logoModal = this.slideLogoModals[dragIndex];

      if (logoMedia !== undefined) {
        // Entferne alte Position
        delete this.slideLogoMedia[dragIndex];
        // Setze neue Position
        this.slideLogoMedia[dropIndex] = logoMedia;
      }

      if (logoModal !== undefined) {
        // Entferne alte Position
        delete this.slideLogoModals[dragIndex];
        // Setze neue Position
        this.slideLogoModals[dropIndex] = logoModal;
      }

      this.updateMediaDataValue();
      this.emitUpdateEl();
    },

    // Per-Slide Color Change Handler
    onSlideColorChange(slideIndex, colorKey, value) {
      console.log(
        `[HeroSlider] Color changed: Slide ${slideIndex}, ${colorKey} = ${value}`
      );

      if (!this.element.config.sliderItems.value[slideIndex]) {
        console.warn(
          `[HeroSlider] Slide ${slideIndex} not found in sliderItems`
        );
        return;
      }

      // Set color value directly on sliderItem
      this.element.config.sliderItems.value[slideIndex][colorKey] = value;

      this.emitUpdateEl();
    },
  },
};
