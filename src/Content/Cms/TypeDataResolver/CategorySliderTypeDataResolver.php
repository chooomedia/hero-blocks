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
        // V3.0 - SLIDE-BASED SYSTEM
        $config = $slot->getConfig();
        if (!$config) {
            return null;
        }

        $categoryIds = [];
        $customImageIds = [];

        // V3.0: categorySlides (preferred)
        if (isset($config['categorySlides']) && is_array($config['categorySlides']['value'])) {
            $slides = $config['categorySlides']['value'];
            
            foreach ($slides as $slide) {
                // Category IDs sammeln
                if (isset($slide['categoryId']) && !empty($slide['categoryId'])) {
                    $categoryIds[] = $slide['categoryId'];
                }
                
                // Custom Image IDs sammeln (wenn override definiert)
                if (isset($slide['customImageId']) && !empty($slide['customImageId'])) {
                    $customImageIds[] = $slide['customImageId'];
                }
            }
        }
        // BACKWARD COMPATIBILITY: Alte categoryIds (deprecated)
        elseif (isset($config['categoryIds']) && is_array($config['categoryIds']['value'])) {
            $categoryIds = $config['categoryIds']['value'];
        }

        if (empty($categoryIds) && empty($customImageIds)) {
            return null;
        }

        $criteriaCollection = new CriteriaCollection();

        // Lade Categories
        if (!empty($categoryIds)) {
            $categoryCriteria = new Criteria($categoryIds);
            $categoryCriteria->addAssociation('media');
            $categoryCriteria->addAssociation('media.thumbnails');
            $categoryCriteria->addAssociation('translations');
            $criteriaCollection->add('categories_' . $slot->getUniqueIdentifier(), CategoryDefinition::class, $categoryCriteria);
        }

        // Lade Custom Images
        if (!empty($customImageIds)) {
            $mediaCriteria = new Criteria($customImageIds);
            $mediaCriteria->addAssociation('thumbnails');
            $criteriaCollection->add('custom_images_' . $slot->getUniqueIdentifier(), MediaDefinition::class, $mediaCriteria);
        }

        return $criteriaCollection;
    }

    public function enrich(CmsSlotEntity $slot, ResolverContext $resolverContext, ElementDataCollection $result): void
    {
        // V3.0 - SLIDE-BASED SYSTEM
        $config = $slot->getConfig();
        if (!$config) {
            return;
        }

        $slides = [];
        
        // V3.0: categorySlides (preferred)
        if (isset($config['categorySlides']) && is_array($config['categorySlides']['value'])) {
            $slides = $config['categorySlides']['value'];
        }
        // BACKWARD COMPATIBILITY: Alte categoryIds konvertieren
        elseif (isset($config['categoryIds']) && is_array($config['categoryIds']['value'])) {
            $categoryIds = $config['categoryIds']['value'];
            foreach ($categoryIds as $categoryId) {
                $slides[] = [
                    'categoryId' => $categoryId,
                    'customTitle' => null,
                    'customImageId' => null,
                    'customText' => null,
                    'customLink' => null,
                ];
            }
        }

        if (empty($slides)) {
            return;
        }

        // Lade Category & Media Results
        $categoriesResult = $result->get('categories_' . $slot->getUniqueIdentifier());
        $customImagesResult = $result->get('custom_images_' . $slot->getUniqueIdentifier());

        // Erstelle ImageSliderStruct
        $imageSlider = new ImageSliderStruct();
        $slot->setData($imageSlider);

        // Erstelle Slider-Items für JEDES Slide
        foreach ($slides as $slide) {
            $categoryId = $slide['categoryId'] ?? null;
            
            if (!$categoryId) {
                continue; // Skip slides ohne Category
            }

            // Lade Category Entity
            $category = $categoriesResult ? $categoriesResult->get($categoryId) : null;
            
            if (!$category) {
                continue; // Skip nicht gefundene Kategorien
            }

            // Erstelle Slider Item
            $imageSliderItem = new ImageSliderItemStruct();
            
            // WICHTIG: Custom Image Override (wenn definiert)
            $customImageId = $slide['customImageId'] ?? null;
            if ($customImageId && $customImagesResult) {
                $customImage = $customImagesResult->get($customImageId);
                if ($customImage) {
                    $imageSliderItem->setMedia($customImage);
                } else {
                    // Fallback: Category Media
                    $imageSliderItem->setMedia($category->getMedia());
                }
            } else {
                // Default: Category Media
                $imageSliderItem->setMedia($category->getMedia());
            }

            // Skip wenn kein Media vorhanden
            if (!$imageSliderItem->getMedia()) {
                continue;
            }
            
            // WICHTIG: Speichere Slide-Daten als Extensions (wie Hero Slider)
            // ImageSliderItemStruct hat KEINE setCustomFields(), sondern addArrayExtension()!
            
            // Category Data
            $imageSliderItem->addArrayExtension('categoryId', ['value' => $categoryId]);
            $imageSliderItem->addArrayExtension('categoryTitle', [
                'value' => $category->getTranslated()['name'] ?? $category->getName()
            ]);
            
            // Category Link (SEO URL wenn vorhanden)
            $categoryLink = null;
            if ($category->getSeoUrls() && $category->getSeoUrls()->first()) {
                $categoryLink = '/' . $category->getSeoUrls()->first()->getSeoPathInfo();
            }
            $imageSliderItem->addArrayExtension('categoryLink', ['value' => $categoryLink]);
            
            // V3.0 - Custom Overrides (nur wenn definiert)
            if (!empty($slide['customTitle'])) {
                $imageSliderItem->addArrayExtension('customTitle', ['value' => $slide['customTitle']]);
            }
            
            if (!empty($slide['customText'])) {
                $imageSliderItem->addArrayExtension('customText', ['value' => $slide['customText']]);
            }
            
            if (!empty($slide['customLink'])) {
                $imageSliderItem->addArrayExtension('customLink', ['value' => $slide['customLink']]);
            }
            
            if (!empty($customImageId)) {
                $imageSliderItem->addArrayExtension('hasCustomImage', ['value' => true]);
            }
            
            $imageSlider->addSliderItem($imageSliderItem);
        }
    }
}

