<?php declare(strict_types=1);

namespace HeroBlocks\Content\Cms\TypeDataResolver;

use Shopware\Core\Content\Cms\Aggregate\CmsSlot\CmsSlotEntity;
use Shopware\Core\Content\Cms\DataResolver\CriteriaCollection;
use Shopware\Core\Content\Cms\DataResolver\Element\AbstractCmsElementResolver;
use Shopware\Core\Content\Cms\DataResolver\Element\ElementDataCollection;
use Shopware\Core\Content\Cms\DataResolver\ResolverContext\ResolverContext;
use Shopware\Core\Content\Media\MediaDefinition;
use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Struct\ArrayStruct;

/**
 * Enriched data resolver for the hero-timeline element.
 * Resolves media collections for each timeline item based on media IDs stored in the element config.
 */
class HeroTimelineTypeDataResolver extends AbstractCmsElementResolver
{
    public function getType(): string
    {
        return 'hero-timeline';
    }

    public function collect(CmsSlotEntity $slot, ResolverContext $resolverContext): ?CriteriaCollection
    {
        $timelineItemsConfig = $slot->getFieldConfig()->get('timelineItems');

        if ($timelineItemsConfig === null || $timelineItemsConfig->isMapped() || $timelineItemsConfig->isDefault()) {
            return null;
        }

        $timelineItems = $timelineItemsConfig->getArrayValue();
        $mediaIds = [];

        foreach ($timelineItems as $item) {
            if (!isset($item['media']) || !\is_array($item['media'])) {
                continue;
            }

            foreach ($item['media'] as $mediaItem) {
                if (!empty($mediaItem['mediaId'])) {
                    $mediaIds[] = $mediaItem['mediaId'];
                }
            }
        }

        $mediaIds = array_values(array_unique(array_filter($mediaIds)));

        if (empty($mediaIds)) {
            return null;
        }

        $criteriaCollection = new CriteriaCollection();
        $criteriaCollection->add('media_' . $slot->getUniqueIdentifier(), MediaDefinition::class, new Criteria($mediaIds));

        return $criteriaCollection;
    }

    public function enrich(CmsSlotEntity $slot, ResolverContext $resolverContext, ElementDataCollection $result): void
    {
        $config = $slot->getFieldConfig();
        $timelineItemsConfig = $config->get('timelineItems');

        if ($timelineItemsConfig === null) {
            return;
        }

        $timelineItems = $timelineItemsConfig->getArrayValue();

        $searchResult = $result->get('media_' . $slot->getUniqueIdentifier());

        $enrichedItems = [];

        foreach ($timelineItems as $item) {
            $mediaEntities = [];

            if ($searchResult && isset($item['media']) && \is_array($item['media'])) {
                foreach ($item['media'] as $mediaItem) {
                    if (empty($mediaItem['mediaId'])) {
                        continue;
                    }

                    /** @var MediaEntity|null $media */
                    $media = $searchResult->get($mediaItem['mediaId']);
                    if ($media) {
                        $mediaEntities[] = $media;
                    }
                }
            }

            $enrichedItems[] = [
                'year' => $item['year'] ?? '',
                'title' => $item['title'] ?? '',
                'text' => $item['text'] ?? '',
                'media' => $mediaEntities,
            ];
        }

        $slot->setData(new ArrayStruct([
            'timelineItems' => $enrichedItems,
        ]));
    }
}

