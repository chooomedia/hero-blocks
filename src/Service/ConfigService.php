<?php declare(strict_types=1);

namespace HeroBlocks\Service;

use Shopware\Core\System\SystemConfig\SystemConfigService;

class ConfigService
{
    private SystemConfigService $systemConfigService;
    
    public function __construct(SystemConfigService $systemConfigService)
    {
        $this->systemConfigService = $systemConfigService;
    }
    
    public function isFaqBlockEnabled(?string $salesChannelId = null): bool
    {
        return (bool) $this->systemConfigService->get(
            'HeroBlocks.config.enableFaqBlock', 
            $salesChannelId
        );
    }
    
    public function isFaqRichSnippetsEnabled(?string $salesChannelId = null): bool
    {
        return (bool) $this->systemConfigService->get(
            'HeroBlocks.config.enableFaqRichSnippets',
            $salesChannelId
        );
    }
    
    public function getFaqAccordionBehavior(?string $salesChannelId = null): string
    {
        return (string) $this->systemConfigService->get(
            'HeroBlocks.config.faqAccordionBehavior',
            $salesChannelId
        ) ?: 'single';
    }
    
    public function isFaqOpenFirstItem(?string $salesChannelId = null): bool
    {
        return (bool) $this->systemConfigService->get(
            'HeroBlocks.config.faqOpenFirstItem',
            $salesChannelId
        ) ?? true;
    }
}