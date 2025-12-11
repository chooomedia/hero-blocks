<?php declare(strict_types=1);

namespace HeroBlocks\Storefront\Twig;

use HeroBlocks\Service\ConfigService;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Twig Extension für Shopping Experience Features
 * 
 * Stellt Twig-Funktionen bereit, die in Theme-Templates verwendet werden können,
 * um zu prüfen ob erweiterte Produktdetail-Features aktiviert sind.
 * 
 * Verwendung in Twig:
 * {% if hero_blocks_shopping_experience_enabled() %}
 *     {# Erweiterte Produktdetailseite anzeigen #}
 * {% endif %}
 */
class ShoppingExperienceExtension extends AbstractExtension
{
    private ConfigService $configService;

    public function __construct(ConfigService $configService)
    {
        $this->configService = $configService;
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('hero_blocks_shopping_experience_enabled', [$this, 'isShoppingExperienceEnabled'], [
                'needs_context' => true,
            ]),
            new TwigFunction('hero_blocks_instagram_enabled', [$this, 'isInstagramFeedEnabled'], [
                'needs_context' => true,
            ]),
            new TwigFunction('hero_blocks_video_extended_enabled', [$this, 'isVideoExtendedEnabled'], [
                'needs_context' => true,
            ]),
            new TwigFunction('hero_blocks_mega_menu_enabled', [$this, 'isMegaMenuEnabled'], [
                'needs_context' => true,
            ]),
            new TwigFunction('hero_blocks_config', [$this, 'getConfig'], [
                'needs_context' => true,
            ]),
        ];
    }

    /**
     * Prüft ob die erweiterte Produktdetailseite aktiviert ist
     */
    public function isShoppingExperienceEnabled(array $context): bool
    {
        $salesChannelId = $this->getSalesChannelId($context);
        return $this->configService->isShoppingExperienceEnabled($salesChannelId);
    }

    /**
     * Prüft ob Instagram Feed aktiviert ist
     */
    public function isInstagramFeedEnabled(array $context): bool
    {
        $salesChannelId = $this->getSalesChannelId($context);
        return $this->configService->isInstagramFeedEnabled($salesChannelId);
    }

    /**
     * Prüft ob Video Extended aktiviert ist
     */
    public function isVideoExtendedEnabled(array $context): bool
    {
        $salesChannelId = $this->getSalesChannelId($context);
        return $this->configService->isVideoExtendedEnabled($salesChannelId);
    }

    /**
     * Prüft ob Mega Menu aktiviert ist
     */
    public function isMegaMenuEnabled(array $context): bool
    {
        $salesChannelId = $this->getSalesChannelId($context);
        return $this->configService->isMegaMenuEnabled($salesChannelId);
    }

    /**
     * Generischer Config-Getter für Twig
     * Verwendung: {{ hero_blocks_config('faqColorTheme') }}
     */
    public function getConfig(array $context, string $key): mixed
    {
        $salesChannelId = $this->getSalesChannelId($context);
        return $this->configService->get($key, $salesChannelId);
    }

    /**
     * Extrahiert die Sales Channel ID aus dem Twig Context
     */
    private function getSalesChannelId(array $context): ?string
    {
        if (isset($context['context']) && $context['context'] instanceof SalesChannelContext) {
            return $context['context']->getSalesChannelId();
        }
        
        if (isset($context['salesChannel']) && is_object($context['salesChannel'])) {
            return $context['salesChannel']->getId();
        }
        
        return null;
    }
}
