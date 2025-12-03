<?php declare(strict_types=1);

namespace HeroBlocks\Content\Cms\TypeDataResolver;

use Shopware\Core\Content\Cms\Aggregate\CmsSlot\CmsSlotEntity;
use Shopware\Core\Content\Cms\DataResolver\CriteriaCollection;
use Shopware\Core\Content\Cms\DataResolver\Element\AbstractCmsElementResolver;
use Shopware\Core\Content\Cms\DataResolver\Element\ElementDataCollection;
use Shopware\Core\Content\Cms\DataResolver\ResolverContext\ResolverContext;
use Shopware\Core\Content\Cms\SalesChannel\Struct\ImageSliderItemStruct;
use Shopware\Core\Content\Cms\SalesChannel\Struct\ImageSliderStruct;
use Shopware\Storefront\Page\Cms\DefaultMediaResolver;
use Shopware\Core\Content\Media\MediaCollection;
use Shopware\Core\Content\Media\MediaDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;

class HeroSliderTypeDataResolver extends AbstractCmsElementResolver
{
    public function __construct(
        private readonly DefaultMediaResolver $mediaResolver
    ) {
    }

    public function getType(): string
    {
        return 'hero-slider';
    }

    public function collect(CmsSlotEntity $slot, ResolverContext $resolverContext): ?CriteriaCollection
    {
        $sliderItemsConfig = $slot->getFieldConfig()->get('sliderItems');
        
        if ($sliderItemsConfig === null || $sliderItemsConfig->isMapped() || $sliderItemsConfig->isDefault()) {
            return null;
        }

        $sliderItems = $sliderItemsConfig->getArrayValue();
        
        // Sammle sowohl Background Media IDs als auch Logo Image IDs
        $mediaIds = [];
        foreach ($sliderItems as $item) {
            if (!empty($item['mediaId'])) {
                $mediaIds[] = $item['mediaId'];
            }
            // Logo Media pro Slide
            if (!empty($item['logoImageId'])) {
                $mediaIds[] = $item['logoImageId'];
            }
        }
        
        $mediaIds = array_filter(array_unique($mediaIds));

        if (empty($mediaIds)) {
            return null;
        }

        $criteria = new Criteria($mediaIds);

        $criteriaCollection = new CriteriaCollection();
        $criteriaCollection->add('media_' . $slot->getUniqueIdentifier(), MediaDefinition::class, $criteria);

        return $criteriaCollection;
    }

    public function enrich(CmsSlotEntity $slot, ResolverContext $resolverContext, ElementDataCollection $result): void
    {
        $config = $slot->getFieldConfig();
        $imageSlider = new ImageSliderStruct();
        $slot->setData($imageSlider);

        $sliderItemsConfig = $config->get('sliderItems');
        if ($sliderItemsConfig === null) {
            return;
        }

        if ($sliderItemsConfig->isStatic()) {
            foreach ($sliderItemsConfig->getArrayValue() as $sliderItem) {
                $this->addMedia($slot, $imageSlider, $result, $sliderItem);
            }
        }

        if ($sliderItemsConfig->isDefault()) {
            foreach ($sliderItemsConfig->getArrayValue() as $sliderItem) {
                $this->addDefaultMedia($imageSlider, $sliderItem);
            }
        }
    }

    /**
     * @param array{url?: string, newTab?: bool, mediaId: string, headline?: string, text?: string, button1Text?: string, button1Url?: string, button1NewTab?: bool, button2Text?: string, button2Url?: string, button2NewTab?: bool} $config
     */
    private function addMedia(CmsSlotEntity $slot, ImageSliderStruct $imageSlider, ElementDataCollection $result, array $config): void
    {
        $imageSliderItem = new ImageSliderItemStruct();

        if (!empty($config['url'])) {
            $imageSliderItem->setUrl($config['url']);
            $imageSliderItem->setNewTab($config['newTab'] ?? false);
        }

        $searchResult = $result->get('media_' . $slot->getUniqueIdentifier());
        if (!$searchResult) {
            return;
        }

        /** @var \Shopware\Core\Content\Media\MediaEntity|null $media */
        $media = $searchResult->get($config['mediaId']);
        if (!$media) {
            return;
        }

        $imageSliderItem->setMedia($media);
        
        // Logo Media Entity auflösen und als Extension hinzufügen
        if (!empty($config['logoImageId'])) {
            /** @var \Shopware\Core\Content\Media\MediaEntity|null $logoMedia */
            $logoMedia = $searchResult->get($config['logoImageId']);
            if ($logoMedia) {
                // Logo Media als Extension speichern (für Template-Zugriff)
                $imageSliderItem->addArrayExtension('logoImage', ['value' => $logoMedia]);
            }
        }
        
        // Per-Slide Content als Extension hinzufügen (nutzt addArrayExtension für einfache Werte)
        // WICHTIG: Alle Felder die im Admin-Config gespeichert werden müssen hier aufgelistet sein!
        $contentFields = [
            // Text Content
            'headline', 'text', 
            // Button 1
            'button1Text', 'button1Url', 'button1NewTab', 'button1BgColor',
            // Button 2
            'button2Text', 'button2Url', 'button2NewTab', 'button2BgColor',
            // Colors
            'headlineColor', 'textColor',
            // Logo
            'logoImageId'
        ];
        foreach ($contentFields as $field) {
            if (isset($config[$field])) {
                $imageSliderItem->addArrayExtension($field, ['value' => $config[$field]]);
            }
        }

        $imageSlider->addSliderItem($imageSliderItem);
    }

    /**
     * @param array{fileName: string} $config
     */
    private function addDefaultMedia(ImageSliderStruct $imageSlider, array $config): void
    {
        $media = $this->mediaResolver->getDefaultCmsMediaEntity($config['fileName']);

        if ($media === null) {
            return;
        }

        $imageSliderItem = new ImageSliderItemStruct();
        $imageSliderItem->setMedia($media);
        $imageSlider->addSliderItem($imageSliderItem);
    }
}

