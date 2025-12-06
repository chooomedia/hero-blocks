<?php declare(strict_types=1);

namespace HeroBlocks\Content\Cms\TypeDataResolver;

use Shopware\Core\Content\Cms\Aggregate\CmsSlot\CmsSlotEntity;
use Shopware\Core\Content\Cms\DataResolver\CriteriaCollection;
use Shopware\Core\Content\Cms\DataResolver\Element\AbstractCmsElementResolver;
use Shopware\Core\Content\Cms\DataResolver\Element\ElementDataCollection;
use Shopware\Core\Content\Cms\DataResolver\ResolverContext\ResolverContext;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\Salutation\SalesChannel\AbstractSalutationRoute;
use Shopware\Core\System\Salutation\SalutationEntity;
use Symfony\Component\HttpFoundation\Request;

/**
 * Hero Booking Form TypeDataResolver
 * 
 * Loads salutations for the booking form dropdown.
 * This is required because the standard contact form uses FormCmsElementResolver
 * which loads salutations into element.data.
 * 
 * @see \Shopware\Core\Content\Cms\DataResolver\Element\FormCmsElementResolver
 */
class HeroBookingFormTypeDataResolver extends AbstractCmsElementResolver
{
    public function __construct(
        private readonly AbstractSalutationRoute $salutationRoute
    ) {
    }

    public function getType(): string
    {
        return 'hero-booking-form';
    }

    public function collect(CmsSlotEntity $slot, ResolverContext $resolverContext): ?CriteriaCollection
    {
        return null;
    }

    public function enrich(CmsSlotEntity $slot, ResolverContext $resolverContext, ElementDataCollection $result): void
    {
        $context = $resolverContext->getSalesChannelContext();

        // Load salutations from SalutationRoute (same as FormCmsElementResolver)
        $salutations = $this->salutationRoute->load(new Request(), $context, new Criteria())->getSalutations();

        // Sort salutations by key (descending) - same as FormCmsElementResolver
        $salutations->sort(fn (SalutationEntity $a, SalutationEntity $b) => $b->getSalutationKey() <=> $a->getSalutationKey());

        // Set salutations as element data (accessible via element.data in Twig)
        $slot->setData($salutations);
    }
}

