import template from "./sw-cms-el-hero-slider.html.twig";
import "./sw-cms-el-hero-slider.scss";

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

  methods: {
    // Parse CSS String zu Object für :style binding
    parseCssString(cssString) {
      if (!cssString || typeof cssString !== 'string') {
        return {};
      }
      
      const styles = {};
      const declarations = cssString.split(';').filter(d => d.trim());
      
      declarations.forEach(declaration => {
        const [property, value] = declaration.split(':').map(s => s.trim());
        if (property && value) {
          // Convert kebab-case to camelCase
          const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          styles[camelProperty] = value;
        }
      });
      
      return styles;
    },
  },
  
  computed: {
    assetFilter() {
      return Shopware.Filter.getByName("asset");
    },
    displaySlide() {
      // Safety check: element und config müssen existieren
      if (!this.element || !this.element.config) {
        return false;
      }

      // Prüfe sowohl data als auch config (wie Image Gallery)
      const dataItems = this.element?.data?.sliderItems;
      const configItems = this.element?.config?.sliderItems?.value;

      // Wenn data Items vorhanden sind (nach enrich), zeige Content
      if (Array.isArray(dataItems) && dataItems.length > 0) {
        return true;
      }

      // Wenn config Items vorhanden sind (auch Placeholder!), zeige Content
      // Placeholder haben fileName/mediaUrl, echte Items haben mediaId/media
      if (Array.isArray(configItems) && configItems.length > 0) {
        // Akzeptiere sowohl Placeholder (fileName/mediaUrl) als auch echte Items (mediaId/media)
        const hasContent = configItems.some(
          (item) => item.mediaId || item.media || item.fileName || item.mediaUrl
        );
        return hasContent;
      }

      return false;
    },
    // Erstes Slide-Item (für Preview)
    firstSlide() {
      const dataItems = this.element?.data?.sliderItems;
      const configItems = this.element?.config?.sliderItems?.value;

      // Priorität: data (nach enrich) > config
      if (Array.isArray(dataItems) && dataItems.length > 0) {
        return dataItems[0];
      }
      if (Array.isArray(configItems) && configItems.length > 0) {
        return configItems[0];
      }
      return null;
    },
    // Preview-Bild URL (aus erster Slide)
    previewImageUrl() {
      if (!this.firstSlide) {
        return this.assetFilter(
          "/administration/administration/static/img/cms/preview_mountain_large.jpg"
        );
      }

      // Wenn media Entity vorhanden ist (data)
      if (this.firstSlide.media && this.firstSlide.media.url) {
        return this.firstSlide.media.url;
      }

      // Wenn mediaUrl in config vorhanden ist
      if (this.firstSlide.mediaUrl) {
        return this.firstSlide.mediaUrl;
      }

      // Fallback
      return this.assetFilter(
        "/administration/administration/static/img/cms/preview_mountain_large.jpg"
      );
    },
    // Headline (aus erster Slide oder global)
    headline() {
      if (this.firstSlide) {
        // Per-Slide Headline (aus Extension oder direkt)
        const slideHeadlineExt = this.firstSlide.extensions?.headline;
        if (slideHeadlineExt?.value) {
          return slideHeadlineExt.value;
        }
        if (this.firstSlide.headline) {
          return this.firstSlide.headline;
        }
      }
      // Global Headline
      return this.element?.config?.headline?.value || "";
    },
    // Text (aus erster Slide oder global)
    text() {
      if (this.firstSlide) {
        // Per-Slide Text (aus Extension oder direkt)
        const slideTextExt = this.firstSlide.extensions?.text;
        if (slideTextExt?.value) {
          return slideTextExt.value;
        }
        if (this.firstSlide.text) {
          return this.firstSlide.text;
        }
      }
      // Global Text
      return this.element?.config?.text?.value || "";
    },
    // Button 1 Text (aus erster Slide oder global)
    button1Text() {
      if (this.firstSlide) {
        // Per-Slide Button (aus Extension oder direkt)
        const slideButton1TextExt = this.firstSlide.extensions?.button1Text;
        if (slideButton1TextExt?.value) {
          return slideButton1TextExt.value;
        }
        if (this.firstSlide.button1Text) {
          return this.firstSlide.button1Text;
        }
      }
      // Global Button
      return this.element?.config?.button1Text?.value || "";
    },
    // Button 2 Text (aus erster Slide oder global)
    button2Text() {
      if (this.firstSlide) {
        // Per-Slide Button (aus Extension oder direkt)
        const slideButton2TextExt = this.firstSlide.extensions?.button2Text;
        if (slideButton2TextExt?.value) {
          return slideButton2TextExt.value;
        }
        if (this.firstSlide.button2Text) {
          return this.firstSlide.button2Text;
        }
      }
      // Global Button
      return this.element?.config?.button2Text?.value || "";
    },
    // Anzahl Slides (für Navigation-Anzeige)
    slidesCount() {
      const dataItems = this.element?.data?.sliderItems;
      const configItems = this.element?.config?.sliderItems?.value;

      if (Array.isArray(dataItems) && dataItems.length > 0) {
        return dataItems.length;
      }
      if (Array.isArray(configItems) && configItems.length > 0) {
        return configItems.length;
      }
      return 0;
    },
    // Navigation anzeigen?
    showNavigation() {
      return this.slidesCount > 1;
    },
    
    // ========================================
    // LOGO SETTINGS (REAKTIV)
    // ========================================
    
    // Logo URL (aus erster Slide)
    logoUrl() {
      if (!this.firstSlide) {
        return null;
      }
      
      // Prüfe ob Logo Media vorhanden ist
      if (this.firstSlide.logoMedia && this.firstSlide.logoMedia.url) {
        return this.firstSlide.logoMedia.url;
      }
      
      // Prüfe logoMediaUrl (config)
      if (this.firstSlide.logoMediaUrl) {
        return this.firstSlide.logoMediaUrl;
      }
      
      // Prüfe logoMediaId und lade Media
      if (this.firstSlide.logoMediaId) {
        // Media ist möglicherweise noch nicht geladen
        return null;
      }
      
      return null;
    },
    
    // Logo Position (aus erster Slide)
    logoPosition() {
      if (this.firstSlide?.logoPosition) {
        return this.firstSlide.logoPosition;
      }
      return 'inside'; // Default: im Content-Bereich
    },
    
    // Logo Custom CSS (aus erster Slide)
    logoCustomCss() {
      if (this.firstSlide?.logoCustomCss) {
        return this.firstSlide.logoCustomCss;
      }
      return '';
    },
    
    // Styles für Logo Outside
    logoOutsideStyles() {
      const styles = {
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        right: 'auto',
        zIndex: 10,
        maxWidth: '150px',
      };
      
      // Parse custom CSS und überschreibe
      if (this.logoCustomCss) {
        const cssProps = this.parseCssString(this.logoCustomCss);
        Object.assign(styles, cssProps);
      }
      
      return styles;
    },
    
    // Styles für Logo Inside
    logoInsideStyles() {
      return {
        marginBottom: '1rem',
        maxWidth: '200px',
      };
    },
    
    // ========================================
    // REAKTIVE FARBEN FÜR PREVIEW
    // ========================================
    
    // Headline Color (aus erster Slide)
    headlineColor() {
      if (this.firstSlide?.headlineColor) {
        return this.firstSlide.headlineColor;
      }
      return '#ffffff'; // Default white
    },
    
    // Text Color (aus erster Slide)
    textColor() {
      if (this.firstSlide?.textColor) {
        return this.firstSlide.textColor;
      }
      return '#ffffff'; // Default white
    },
    
    // Button 1 Background Color (aus erster Slide)
    button1BgColor() {
      if (this.firstSlide?.button1BgColor) {
        return this.firstSlide.button1BgColor;
      }
      return '#007bff'; // Default blue
    },
    
    // Button 2 Background Color (aus erster Slide)
    button2BgColor() {
      if (this.firstSlide?.button2BgColor) {
        return this.firstSlide.button2BgColor;
      }
      return 'transparent'; // Default transparent
    },
    
    // Computed Styles für reaktive Farben
    contentStyles() {
      return {};
    },
    
    headlineStyles() {
      return {
        color: this.headlineColor,
      };
    },
    
    textStyles() {
      return {
        color: this.textColor,
      };
    },
    
    button1Styles() {
      return {
        backgroundColor: this.button1BgColor,
        borderColor: this.button1BgColor,
        color: '#ffffff',
      };
    },
    
    button2Styles() {
      const bgColor = this.button2BgColor;
      const isTransparent = !bgColor || bgColor === 'transparent';
      return {
        backgroundColor: isTransparent ? 'transparent' : bgColor,
        borderColor: isTransparent ? '#ffffff' : bgColor,
        color: isTransparent ? '#ffffff' : '#ffffff',
      };
    },
  },
};
