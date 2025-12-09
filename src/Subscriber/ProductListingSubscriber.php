<?php declare(strict_types=1);

namespace HeroBlocks\Subscriber;

use Shopware\Core\Content\Product\Events\ProductListingCriteriaEvent;
use Shopware\Core\Content\Product\Events\ProductSearchCriteriaEvent;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Subscriber to add properties association to product listings
 * 
 * This ensures that product properties (like Leistung, Zylinder) are available
 * in the product listing context for display in product boxes.
 */
class ProductListingSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            ProductListingCriteriaEvent::class => 'onProductListingCriteria',
            ProductSearchCriteriaEvent::class => 'onProductSearchCriteria',
        ];
    }

    /**
     * Add properties association to product listing criteria
     */
    public function onProductListingCriteria(ProductListingCriteriaEvent $event): void
    {
        $this->addPropertiesAssociation($event->getCriteria());
    }

    /**
     * Add properties association to product search criteria
     */
    public function onProductSearchCriteria(ProductSearchCriteriaEvent $event): void
    {
        $this->addPropertiesAssociation($event->getCriteria());
    }

    /**
     * Add the properties association with group translation to the criteria
     */
    private function addPropertiesAssociation(Criteria $criteria): void
    {
        // Add properties association with group
        $criteria->addAssociation('properties.group');
        
        // Also add sortedProperties if available (Shopware 6.5+)
        $criteria->addAssociation('sortedProperties.group');
        
        // Add media for hover images
        $criteria->addAssociation('media');
        
        // Add customFields for fallback property values
        $criteria->addAssociation('customFields');
    }
}

