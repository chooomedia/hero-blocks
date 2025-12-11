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
 * - {{ element.data.product.translated.name }}
 * - {{ element.data.product.translated.description }}
 * - {{ element.data.product.translated.metaDescription }}
 * - {{ element.data.product.calculatedPrice.totalPrice|currency }}
 * - {{ element.data.product.cover.media.url }}
 * - {{ element.data.product.properties }}
 * - {{ element.data.product.manufacturer.translated.name }}
 * - {{ element.data.product.productNumber }}
 * - etc.
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
        
        // Properties (for specifications like Leistung, Drehmoment, etc.)
        $criteria->addAssociation('properties');
        $criteria->addAssociation('properties.group');
        
        // Manufacturer
        $criteria->addAssociation('manufacturer');
        $criteria->addAssociation('manufacturer.media');
        
        // Options (variants)
        $criteria->addAssociation('options');
        $criteria->addAssociation('options.group');
        
        // Categories
        $criteria->addAssociation('categories');
        
        // Prices
        $criteria->addAssociation('prices');
        
        // SEO URLs
        $criteria->addAssociation('seoUrls');
        
        // Translations
        $criteria->addAssociation('translations');

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
