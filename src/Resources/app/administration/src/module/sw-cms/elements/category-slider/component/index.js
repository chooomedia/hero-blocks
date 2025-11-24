import template from './sw-cms-el-category-slider.html.twig';
import './sw-cms-el-category-slider.scss';

// WICHTIG: Snippets importieren und registrieren (für Übersetzungen)
// WICHTIG: Pfad von component/ aus: ../../../snippet/
import deDE from '../../../snippet/de-DE.json';
import enGB from '../../../snippet/en-GB.json';

// Snippets registrieren
Shopware.Locale.extend('de-DE', deDE);
Shopware.Locale.extend('en-GB', enGB);

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
    
    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },
        
        // Kategorie-Entity (wenn vorhanden)
        category() {
            return this.element?.data?.category || null;
        },
        
        // Kategorie-Bilder (aus TypeDataResolver)
        categoryImages() {
            // WICHTIG: categoryImages kommt aus element.data (ImageSliderStruct)
            const imageSlider = this.element?.data;
            if (imageSlider && imageSlider.sliderItems && Array.isArray(imageSlider.sliderItems)) {
                return imageSlider.sliderItems;
            }
            return [];
        },
        
        // WICHTIG: Prüfe ob Kategorie ausgewählt ist
        // Kategorie kann in element.config.categoryId.value ODER im Block customFields.categoryId sein
        hasCategory() {
            // Prüfe Element-Config (wichtig: prüfe auf truthy value, nicht nur !== null)
            const elementCategoryId = this.element?.config?.categoryId?.value;
            if (elementCategoryId) {
                return true;
            }
            
            // Prüfe Block customFields (wenn Block verfügbar)
            const block = this.element?.cmsBlock;
            if (block && block.customFields && block.customFields.categoryId) {
                return true;
            }
            
            // Prüfe auch ob category-Entity vorhanden ist
            if (this.category) {
                return true;
            }
            
            return false;
        },
        
        // Preview-Bild (erstes Bild aus Kategorie oder Fallback)
        previewImageUrl() {
            if (this.categoryImages && this.categoryImages.length > 0) {
                const firstImage = this.categoryImages[0];
                if (firstImage?.media?.url) {
                    return firstImage.media.url;
                }
            }
            
            // Fallback: Verwende Preview-Bild auch wenn keine Kategorie-Bilder geladen
            return this.assetFilter('/administration/administration/static/img/cms/preview_mountain_large.jpg');
        },
        
        // Kategorie-Name (für Preview)
        categoryName() {
            if (this.category?.translated?.name) {
                return this.category.translated.name;
            }
            // Fallback: Verwende Snippet-Key wenn keine Kategorie geladen
            return this.$tc('sw-cms.elements.categorySlider.label');
        },
    },
};

