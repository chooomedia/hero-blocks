<?php declare(strict_types=1);

namespace HeroBlocks\Content\Cms\TypeDataResolver;

use Shopware\Core\Content\Cms\Aggregate\CmsSlot\CmsSlotEntity;
use Shopware\Core\Content\Cms\DataResolver\CriteriaCollection;
use Shopware\Core\Content\Cms\DataResolver\Element\AbstractCmsElementResolver;
use Shopware\Core\Content\Cms\DataResolver\Element\ElementDataCollection;
use Shopware\Core\Content\Cms\DataResolver\ResolverContext\ResolverContext;
use Shopware\Core\Content\Cms\SalesChannel\Struct\ImageSliderItemStruct;
use Shopware\Core\Content\Cms\SalesChannel\Struct\ImageSliderStruct;
use Shopware\Core\Content\Category\CategoryDefinition;
use Shopware\Core\Content\Product\ProductDefinition;
use Shopware\Core\Content\Product\SalesChannel\ProductAvailableFilter;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductDefinition;
use Shopware\Core\Content\Product\ProductVisibilityDefinition;
use Shopware\Core\Content\Media\MediaDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Sorting\FieldSorting;

class CategorySliderTypeDataResolver extends AbstractCmsElementResolver
{
    public function getType(): string
    {
        return 'image-gallery'; // Nutzt Standard image-gallery Element
    }

    public function collect(CmsSlotEntity $slot, ResolverContext $resolverContext): ?CriteriaCollection
    {
        // WICHTIG: Prüfe ob Block ein "category-slider" Block ist
        $block = $slot->getCmsBlock();
        if (!$block || $block->getType() !== 'category-slider') {
            return null;
        }

        $customFields = $block->getCustomFields();
        if (!$customFields || !isset($customFields['categoryId']) || !$customFields['categoryId']) {
            return null;
        }

        $categoryId = $customFields['categoryId'];

        // Lade Kategorie mit Media und Translations
        $categoryCriteria = new Criteria([$categoryId]);
        $categoryCriteria->addAssociation('media');
        $categoryCriteria->addAssociation('translations');
        // WICHTIG: Lade auch Produkte für Produktbilder (Cover-Bilder)
        // Aber nicht direkt als Association, sondern separat über ProductCriteria

        // Lade Produkte der Kategorie (für Produktbilder)
        // WICHTIG: Verwende SalesChannel-Kontext für korrekte Produkt-Filterung
        $productCriteria = new Criteria();
        $productCriteria->addFilter(new EqualsFilter('product.categories.id', $categoryId));
        $productCriteria->addFilter(new EqualsFilter('product.active', true));
        // WICHTIG: ProductAvailableFilter für SalesChannel-spezifische Produkt-Filterung
        $productCriteria->addFilter(
            new ProductAvailableFilter(
                $resolverContext->getSalesChannelContext()->getSalesChannelId(),
                ProductVisibilityDefinition::VISIBILITY_ALL
            )
        );
        $productCriteria->addAssociation('cover');
        $productCriteria->addAssociation('cover.media');
        $productCriteria->addSorting(new FieldSorting('product.createdAt', FieldSorting::DESCENDING));
        $productCriteria->setLimit(20); // Maximal 20 Produkte für Slider

        $criteriaCollection = new CriteriaCollection();
        $criteriaCollection->add('category_' . $slot->getUniqueIdentifier(), CategoryDefinition::class, $categoryCriteria);
        // WICHTIG: Verwende SalesChannelProductDefinition für SalesChannel-Kontext
        $criteriaCollection->add('products_' . $slot->getUniqueIdentifier(), SalesChannelProductDefinition::class, $productCriteria);

        return $criteriaCollection;
    }

    public function enrich(CmsSlotEntity $slot, ResolverContext $resolverContext, ElementDataCollection $result): void
    {
        // WICHTIG: Prüfe ob Block ein "category-slider" Block ist
        $block = $slot->getCmsBlock();
        if (!$block || $block->getType() !== 'category-slider') {
            return;
        }

        $customFields = $block->getCustomFields();
        if (!$customFields || !isset($customFields['categoryId']) || !$customFields['categoryId']) {
            return;
        }

        $categoryId = $customFields['categoryId'];
        $imageCount = (int)($customFields['imageCount'] ?? 1);

        // Lade Kategorie
        $categoryResult = $result->get('category_' . $slot->getUniqueIdentifier());
        if (!$categoryResult) {
            return;
        }

        $category = $categoryResult->get($categoryId);
        if (!$category) {
            return;
        }

        // WICHTIG: Kategorie als Extension speichern (für Template-Zugriff auf categoryTitle)
        // Nutze ArrayStruct für einfache Werte-Speicherung
        $slot->addArrayExtension('category', ['value' => $category]);

        // Erstelle ImageSliderStruct
        $imageSlider = new ImageSliderStruct();
        $slot->setData($imageSlider);

        // Lade Produkte
        $productsResult = $result->get('products_' . $slot->getUniqueIdentifier());
        $products = $productsResult ? $productsResult->getEntities() : null;

        $sliderItems = [];

        // WICHTIG: Priorität: 1. Kategorie-Media, 2. Produktbilder
        // Option 1: Kategorie-Media verwenden (falls vorhanden)
        if ($category->getMedia()) {
            $sliderItem = new ImageSliderItemStruct();
            $sliderItem->setMedia($category->getMedia());
            $sliderItems[] = $sliderItem;
        }

        // Option 2: Produktbilder verwenden (falls vorhanden und imageCount erlaubt)
        // WICHTIG: Wenn imageCount = 2, lade 2 Produktbilder (zusätzlich zu Kategorie-Media)
        if ($products && $products->count() > 0) {
            // Berechne wie viele Produktbilder geladen werden sollen
            // Wenn Kategorie-Media vorhanden: imageCount - 1, sonst imageCount
            $productLimit = $imageCount;
            if ($category->getMedia()) {
                // Kategorie-Media zählt als 1 Bild, daher -1 für Produktbilder
                $productLimit = max(0, $imageCount - 1);
            }
            
            $productCount = 0;
            foreach ($products as $product) {
                if ($productCount >= $productLimit) {
                    break;
                }

                $cover = $product->getCover();
                if ($cover && $cover->getMedia()) {
                    $sliderItem = new ImageSliderItemStruct();
                    $sliderItem->setMedia($cover->getMedia());
                    $sliderItems[] = $sliderItem;
                    $productCount++;
                }
            }
        }

        // Füge Slider-Items hinzu
        foreach ($sliderItems as $sliderItem) {
            $imageSlider->addSliderItem($sliderItem);
        }
    }
}

