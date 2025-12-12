<?php declare(strict_types=1);

namespace HeroBlocks\Storefront\Twig;

use Shopware\Core\Content\Category\CategoryEntity;
use Shopware\Core\Content\Category\Service\NavigationLoaderInterface;
use Shopware\Core\Content\Category\Tree\Tree;
use Shopware\Core\Content\Category\Tree\TreeItem;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Twig Extension für Navigation im Mega Menu Block
 * 
 * WICHTIG: Lädt Navigation Tree für Templates
 * Gemäß Shopware Best Practices für Twig Extensions
 * 
 * NEU: Lädt auch Produkte für Kategorien (Mini-Produkt-Items im Mega Menu)
 */
class NavigationExtension extends AbstractExtension
{
    public function __construct(
        private readonly NavigationLoaderInterface $navigationLoader,
        private readonly EntityRepository $categoryRepository
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
     * Step-by-step:
     * 1. Navigation Tree laden
     * 2. Produkte für alle Kategorien laden (rekursiv)
     * 3. Tree zurückgeben
     * 
     * @param array<string, mixed> $context Twig Context
     * @return Tree|null
     */
    public function loadNavigationTree(array $context): ?Tree
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
        $tree = $this->navigationLoader->load(
            $navigationId,
            $salesChannelContext,
            $rootNavigationId,
            $salesChannel->getNavigationCategoryDepth()
        );

        // NEU: Produkte für alle Kategorien im Tree laden
        if ($tree !== null) {
            $this->loadProductsForTree($tree->getTree(), $salesChannelContext);
        }

        return $tree;
    }

    /**
     * Rekursiv Produkte für alle Kategorien im Navigation Tree laden
     * 
     * @param TreeItem[] $tree
     */
    private function loadProductsForTree(array $tree, SalesChannelContext $context): void
    {
        foreach ($tree as $treeItem) {
            if (!$treeItem instanceof TreeItem) {
                continue;
            }

            $category = $treeItem->getCategory();
            if ($category instanceof CategoryEntity) {
                $this->loadProductsForCategory($category, $context);
            }

            // Rekursiv in Kinder
            $children = $treeItem->getChildren();
            if (!empty($children)) {
                $this->loadProductsForTree($children, $context);
            }
        }
    }

    /**
     * Produkte für eine einzelne Kategorie laden
     * 
     * @param CategoryEntity $category
     * @param SalesChannelContext $context
     */
    private function loadProductsForCategory(CategoryEntity $category, SalesChannelContext $context): void
    {
        // Überspringe wenn Produkte bereits geladen
        if ($category->getProducts() !== null && $category->getProducts()->count() > 0) {
            return;
        }

        // Kategorie mit Produkten laden
        $criteria = new Criteria([$category->getId()]);
        $criteria->addAssociation('products');
        $criteria->addAssociation('products.cover');
        $criteria->addAssociation('products.cover.media');
        
        // Varianten-Bilder für Hover-Wechsel im Mega-Menu
        $criteria->addAssociation('products.children');
        $criteria->addAssociation('products.children.cover');
        $criteria->addAssociation('products.children.cover.media');
        $criteria->addAssociation('products.children.options');
        $criteria->addAssociation('products.children.options.group');
        
        // Produkt-Optionen für Farb-Erkennung
        $criteria->addAssociation('products.options');
        $criteria->addAssociation('products.options.group');
        
        // Limit: Max 4 Produkte (Performance)
        $criteria->getAssociation('products')->setLimit(4);
        // Limit: Max 6 Varianten pro Produkt
        $criteria->getAssociation('products.children')->setLimit(6);

        $result = $this->categoryRepository->search($criteria, $context->getContext());
        $loadedCategory = $result->first();

        if ($loadedCategory instanceof CategoryEntity && $loadedCategory->getProducts() !== null) {
            // Produkte auf Original-Kategorie setzen
            $category->setProducts($loadedCategory->getProducts());
        }
    }
}

