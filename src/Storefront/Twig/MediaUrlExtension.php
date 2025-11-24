<?php declare(strict_types=1);

namespace HeroBlocks\Storefront\Twig;

use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Twig Extension für Media-URLs aus IDs
 * 
 * WICHTIG: Generiert Media-URLs aus Media-IDs für Background Images
 * Gemäß Shopware Best Practices für Twig Extensions
 */
class MediaUrlExtension extends AbstractExtension
{
    public function __construct(
        private readonly EntityRepository $mediaRepository
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('hero_media_url', [$this, 'getMediaUrl'], [
                'needs_context' => true,
            ]),
        ];
    }

    /**
     * Generiert Media-URL aus Media-ID
     * 
     * @param array<string, mixed> $context Twig Context
     * @param string|null $mediaId Media-ID
     * @return string|null Media-URL oder null wenn nicht gefunden
     */
    public function getMediaUrl(array $context, ?string $mediaId): ?string
    {
        if (!$mediaId) {
            return null;
        }

        /** @var SalesChannelContext|null $salesChannelContext */
        $salesChannelContext = $context['context'] ?? null;
        
        if (!$salesChannelContext instanceof SalesChannelContext) {
            return null;
        }

        try {
            $criteria = new Criteria([$mediaId]);
            
            /** @var MediaEntity|null $media */
            $media = $this->mediaRepository->search(
                $criteria,
                $salesChannelContext->getContext()
            )->first();

            if (!$media || !$media->hasFile()) {
                return null;
            }

            return $media->getUrl();
        } catch (\Exception $e) {
            // Log error but don't break rendering
            return null;
        }
    }
}

