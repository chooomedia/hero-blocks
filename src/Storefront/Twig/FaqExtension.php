<?php declare(strict_types=1);

namespace HeroBlocks\Storefront\Twig;

use HeroBlocks\Service\ConfigService;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class FaqExtension extends AbstractExtension
{
    private ConfigService $configService;
    
    public function __construct(ConfigService $configService)
    {
        $this->configService = $configService;
    }
    
    public function getFunctions(): array
    {
        return [
            new TwigFunction('hero_faq_is_enabled', [$this, 'isFaqEnabled']),
            new TwigFunction('hero_faq_rich_snippets_enabled', [$this, 'isRichSnippetsEnabled']),
            new TwigFunction('hero_faq_accordion_behavior', [$this, 'getAccordionBehavior']),
            new TwigFunction('hero_faq_open_first_item', [$this, 'isOpenFirstItem']),
            new TwigFunction('hero_faq_color_theme', [$this, 'getColorTheme']),
        ];
    }
    
    public function isFaqEnabled(?string $salesChannelId = null): bool
    {
        return $this->configService->isFaqBlockEnabled($salesChannelId);
    }
    
    public function isRichSnippetsEnabled(?string $salesChannelId = null): bool
    {
        return $this->configService->isFaqRichSnippetsEnabled($salesChannelId);
    }
    
    public function getAccordionBehavior(?string $salesChannelId = null): string
    {
        return $this->configService->getFaqAccordionBehavior($salesChannelId);
    }
    
    public function isOpenFirstItem(?string $salesChannelId = null): bool
    {
        return $this->configService->isFaqOpenFirstItem($salesChannelId);
    }

    public function getColorTheme(?string $salesChannelId = null): string
    {
        return $this->configService->getFaqColorTheme($salesChannelId);
    }
}