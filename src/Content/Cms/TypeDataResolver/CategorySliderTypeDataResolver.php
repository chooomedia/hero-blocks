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
        return 'hero-category-slider'; // Hero Category Slider Element Type
    }

    public function collect(CmsSlotEntity $slot, ResolverContext $resolverContext): ?CriteriaCollection
    {
        // WICHTIG: Hole categoryIds aus Element-Config (nicht aus Block customFields)
        $config = $slot->getConfig();
        if (!$config || !isset($config['categoryIds']) || !$config['categoryIds']['value']) {
            return null;
        }

        $categoryIds = $config['categoryIds']['value'];
        if (!is_array($categoryIds) || empty($categoryIds)) {
            return null;
        }

        // Lade Kategorien mit Media und Translations
        $categoryCriteria = new Criteria($categoryIds);
        $categoryCriteria->addAssociation('media');
        $categoryCriteria->addAssociation('translations');
        $criteriaCollection = new CriteriaCollection();
        $criteriaCollection->add('categories_' . $slot->getUniqueIdentifier(), CategoryDefinition::class, $categoryCriteria);

        return $criteriaCollection;
    }

    public function enrich(CmsSlotEntity $slot, ResolverContext $resolverContext, ElementDataCollection $result): void
    {
        // Hole categoryIds aus Element-Config
        $config = $slot->getConfig();
        if (!$config || !isset($config['categoryIds']) || !$config['categoryIds']['value']) {
            return;
        }

        $categoryIds = $config['categoryIds']['value'];
        if (!is_array($categoryIds) || empty($categoryIds)) {
            return;
        }

        // Lade Kategorien
        $categoriesResult = $result->get('categories_' . $slot->getUniqueIdentifier());
        if (!$categoriesResult) {
            return;
        }

        // Erstelle ImageSliderStruct
        $imageSlider = new ImageSliderStruct();
        $slot->setData($imageSlider);

        // Erstelle Slider-Items für jede Kategorie (mit Kategorie-Media)
        foreach ($categoryIds as $categoryId) {
            $category = $categoriesResult->get($categoryId);
            
            if (!$category || !$category->getMedia()) {
                continue; // Skip categories ohne Media
            }

            $sliderItem = new ImageSliderItemStruct();
            $sliderItem->setMedia($category->getMedia());
            
            // WICHTIG: Speichere Kategorie-Titel für Overlay (als customFields)
            $sliderItem->setCustomFields([
                'categoryTitle' => $category->getTranslated()['name'] ?? $category->getName(),
                'categoryId' => $categoryId,
            ]);
            
            $imageSlider->addSliderItem($sliderItem);
        }
    }
}

