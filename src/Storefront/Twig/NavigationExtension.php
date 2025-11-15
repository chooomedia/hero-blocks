<?php declare(strict_types=1);

namespace HeroBlocks\Storefront\Twig;

use Shopware\Core\Content\Category\Service\NavigationLoaderInterface;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Twig Extension für Navigation im Mega Menu Block
 * 
 * WICHTIG: Lädt Navigation Tree für Templates
 * Gemäß Shopware Best Practices für Twig Extensions
 */
class NavigationExtension extends AbstractExtension
{
    public function __construct(
        private readonly NavigationLoaderInterface $navigationLoader
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('hero_mega_menu_navigation', [$this, 'loadNavigationTree'], [
                'needs_context' => true,
            ]),
        ];
    }

    /**
     * Lädt Navigation Tree für Mega Menu Block
     * 
     * @param array<string, mixed> $context Twig Context
     * @return \Shopware\Core\Content\Category\Tree\Tree|null
     */
    public function loadNavigationTree(array $context): ?\Shopware\Core\Content\Category\Tree\Tree
    {
        /** @var SalesChannelContext|null $salesChannelContext */
        $salesChannelContext = $context['context'] ?? null;
        
        if (!$salesChannelContext instanceof SalesChannelContext) {
            return null;
        }

        $salesChannel = $salesChannelContext->getSalesChannel();
        $rootNavigationId = $salesChannel->getNavigationCategoryId();
        
        // WICHTIG: NavigationId aus Request holen (falls vorhanden)
        $request = $context['request'] ?? null;
        $navigationId = $rootNavigationId;
        
        if ($request instanceof \Symfony\Component\HttpFoundation\Request) {
            $navigationId = $request->attributes->get('navigationId', $rootNavigationId) ?? $rootNavigationId;
        }

        // Navigation Tree laden
        return $this->navigationLoader->load(
            $navigationId,
            $salesChannelContext,
            $rootNavigationId,
            $salesChannel->getNavigationCategoryDepth()
        );
    }
}

