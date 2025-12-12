<?php declare(strict_types=1);

namespace HeroBlocks\Content\Cms\TypeDataResolver;

use Shopware\Core\Content\Cms\Aggregate\CmsSlot\CmsSlotEntity;
use Shopware\Core\Content\Cms\DataResolver\CriteriaCollection;
use Shopware\Core\Content\Cms\DataResolver\Element\AbstractCmsElementResolver;
use Shopware\Core\Content\Cms\DataResolver\Element\ElementDataCollection;
use Shopware\Core\Content\Cms\DataResolver\ResolverContext\ResolverContext;
use Shopware\Core\Content\Product\ProductDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Struct\ArrayStruct;

/**
 * Hero Product Landing - TypeDataResolver
 * 
 * Loads product entity data for CMS Landing Pages.
 * This allows using {{ element.data.product.translated.description }} etc.
 * in Storefront templates on Landing Pages (not Product Detail Pages).
 * 
 * USAGE:
 * - In CMS Admin: Select a product via product picker
 * - In Storefront Template: Access product via element.data.product
 * 
 * AVAILABLE VARIABLES IN TEMPLATE:
 * 
 * Basic Info:
 * - {{ element.data.product.id }}                          - Product UUID
 * - {{ element.data.product.productNumber }}               - SKU/Article Number
 * - {{ element.data.product.ean }}                         - EAN Number
 * - {{ element.data.product.translated.name }}             - Product Name (translated)
 * - {{ element.data.product.translated.description }}      - Full Description (HTML)
 * - {{ element.data.product.translated.metaTitle }}        - SEO Meta Title
 * - {{ element.data.product.translated.metaDescription }}  - SEO Meta Description
 * - {{ element.data.product.translated.keywords }}         - SEO Keywords
 * 
 * Pricing:
 * - {{ element.data.product.calculatedPrice.totalPrice|currency }}  - Formatted Price
 * - {{ element.data.product.calculatedPrice.unitPrice }}            - Unit Price
 * - {{ element.data.product.calculatedTaxes.first.taxRate }}        - Tax Rate (e.g. 19)
 * 
 * Media:
 * - {{ element.data.product.cover.media }}                 - Cover Image MediaEntity
 * - {{ element.data.product.media }}                       - All Product Images (Collection)
 * 
 * Properties (Eigenschaften wie Leistung, Drehmoment, Zylinder):
 * - {{ element.data.product.properties }}                  - PropertyGroupOptionCollection
 * - {{ element.data.product.sortedProperties }}            - Sorted Properties (Shopware 6.5+)
 *   For each property:
 *   - property.group.translated.name                       - Property Group Name (e.g. "Leistung")
 *   - property.translated.name                             - Property Value (e.g. "161 PS")
 * 
 * Custom Fields (Custom Fields aus Admin):
 * - {{ element.data.product.translated.customFields }}     - All Custom Fields (object)
 * - {{ element.data.product.translated.customFields.custom_horex_tagline }}
 * - {{ element.data.product.translated.customFields.custom_horex_specs_highlight }}
 * - {{ element.data.product.translated.customFields.custom_horex_badge_text }}
 * 
 * Manufacturer:
 * - {{ element.data.product.manufacturer.translated.name }}       - Manufacturer Name
 * - {{ element.data.product.manufacturer.translated.description }}- Manufacturer Description
 * - {{ element.data.product.manufacturer.media }}                 - Manufacturer Logo
 * - {{ element.data.product.manufacturer.link }}                  - Manufacturer Website
 * 
 * Options/Variants (Varianten wie Farben):
 * - {{ element.data.product.options }}                     - OptionCollection
 *   For each option:
 *   - option.group.translated.name                         - Option Group (e.g. "Farbe")
 *   - option.translated.name                               - Option Value (e.g. "Schwarz")
 *   - option.colorHexCode                                  - Color Hex Code (if color option)
 *   - option.media                                         - Option Image (if set)
 * 
 * Categories:
 * - {{ element.data.product.categories }}                  - Category Collection
 * 
 * Stock & Availability:
 * - {{ element.data.product.stock }}                       - Stock Level
 * - {{ element.data.product.availableStock }}              - Available Stock
 * - {{ element.data.product.isCloseout }}                  - Closeout Product
 * - {{ element.data.product.minPurchase }}                 - Minimum Purchase Quantity
 * - {{ element.data.product.maxPurchase }}                 - Maximum Purchase Quantity
 * - {{ element.data.product.purchaseSteps }}               - Purchase Steps
 * 
 * Dimensions & Weight:
 * - {{ element.data.product.weight }}                      - Weight (kg)
 * - {{ element.data.product.width }}                       - Width (mm)
 * - {{ element.data.product.height }}                      - Height (mm)
 * - {{ element.data.product.length }}                      - Length (mm)
 * 
 * SEO & URLs:
 * - {{ element.data.product.seoUrls }}                     - SEO URL Collection
 * - {{ seoUrl('frontend.detail.page', {'productId': element.data.product.id}) }}
 */
class HeroProductLandingTypeDataResolver extends AbstractCmsElementResolver
{
    public function getType(): string
    {
        return 'hero-product-landing';
    }

    public function collect(CmsSlotEntity $slot, ResolverContext $resolverContext): ?CriteriaCollection
    {
        $config = $slot->getFieldConfig();
        
        // Get productId from slot config
        $productIdConfig = $config->get('productId');
        
        if ($productIdConfig === null || $productIdConfig->isMapped() || $productIdConfig->getValue() === null) {
            return null;
        }

        $productId = $productIdConfig->getValue();
        
        if (empty($productId)) {
            return null;
        }

        // Create criteria with all necessary associations for a complete product
        $criteria = new Criteria([$productId]);
        
        // Media & Cover
        $criteria->addAssociation('cover');
        $criteria->addAssociation('cover.media');
        $criteria->addAssociation('cover.media.thumbnails');
        $criteria->addAssociation('media');
        $criteria->addAssociation('media.media');
        $criteria->addAssociation('media.media.thumbnails');
        
        // Properties (for specifications like Leistung, Drehmoment, Zylinder, etc.)
        $criteria->addAssociation('properties');
        $criteria->addAssociation('properties.group');
        $criteria->addAssociation('properties.group.translations');
        // Sorted Properties (Shopware 6.5+) - sorted by position
        $criteria->addAssociation('sortedProperties');
        $criteria->addAssociation('sortedProperties.group');
        $criteria->addAssociation('sortedProperties.group.translations');
        
        // Manufacturer
        $criteria->addAssociation('manufacturer');
        $criteria->addAssociation('manufacturer.media');
        $criteria->addAssociation('manufacturer.translations');
        
        // Options (variants like colors)
        $criteria->addAssociation('options');
        $criteria->addAssociation('options.group');
        $criteria->addAssociation('options.group.translations');
        $criteria->addAssociation('options.media'); // Option images (color swatches)
        
        // Children (Variants)
        $criteria->addAssociation('children');
        $criteria->addAssociation('children.cover');
        $criteria->addAssociation('children.cover.media');
        $criteria->addAssociation('children.options');
        $criteria->addAssociation('children.options.group');
        
        // Parent (if this is a variant)
        $criteria->addAssociation('parent');
        
        // Categories
        $criteria->addAssociation('categories');
        $criteria->addAssociation('categories.translations');
        
        // Prices (for tier pricing, etc.)
        $criteria->addAssociation('prices');
        
        // SEO URLs
        $criteria->addAssociation('seoUrls');
        
        // Translations (includes customFields translations)
        $criteria->addAssociation('translations');
        
        // Unit (for weight, dimensions display)
        $criteria->addAssociation('unit');
        $criteria->addAssociation('unit.translations');
        
        // Cross-Selling & Related
        $criteria->addAssociation('crossSellings');
        $criteria->addAssociation('crossSellings.assignedProducts');
        $criteria->addAssociation('crossSellings.assignedProducts.product');
        $criteria->addAssociation('crossSellings.assignedProducts.product.cover');
        $criteria->addAssociation('crossSellings.assignedProducts.product.cover.media');

        $criteriaCollection = new CriteriaCollection();
        $criteriaCollection->add(
            'product_' . $slot->getUniqueIdentifier(),
            ProductDefinition::class,
            $criteria
        );

        return $criteriaCollection;
    }

    public function enrich(CmsSlotEntity $slot, ResolverContext $resolverContext, ElementDataCollection $result): void
    {
        $config = $slot->getFieldConfig();
        $productIdConfig = $config->get('productId');
        
        if ($productIdConfig === null || $productIdConfig->getValue() === null) {
            // Set empty data struct
            $slot->setData(new ArrayStruct(['product' => null]));
            return;
        }

        $productId = $productIdConfig->getValue();
        
        // Get product from result collection
        $searchResult = $result->get('product_' . $slot->getUniqueIdentifier());
        
        if (!$searchResult || $searchResult->count() === 0) {
            $slot->setData(new ArrayStruct(['product' => null]));
            return;
        }

        /** @var \Shopware\Core\Content\Product\ProductEntity|null $product */
        $product = $searchResult->get($productId);
        
        if (!$product) {
            $slot->setData(new ArrayStruct(['product' => null]));
            return;
        }

        // Set product as slot data
        // Template access: {{ element.data.product.translated.name }}
        $slot->setData(new ArrayStruct([
            'product' => $product,
            'productId' => $productId,
        ]));
    }
}
