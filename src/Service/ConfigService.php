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
    
    // ========================================
    // FAQ Block Configuration
    // ========================================
    
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

    public function getFaqColorTheme(?string $salesChannelId = null): string
    {
        return (string) $this->systemConfigService->get(
            'HeroBlocks.config.faqColorTheme',
            $salesChannelId
        ) ?: 'dark';
    }
    
    // ========================================
    // Shopping Experience (Product Detail)
    // ========================================
    
    /**
     * Prüft ob die erweiterte Produktdetailseite aktiviert ist
     * Wenn aktiviert, können Themes die erweiterten Features nutzen:
     * - 360° Gallery mit Scroll-Animation
     * - Varianten-Konfigurator mit Preisanzeige
     * - Serienausstattung aus Properties
     */
    public function isShoppingExperienceEnabled(?string $salesChannelId = null): bool
    {
        return (bool) $this->systemConfigService->get(
            'HeroBlocks.config.enableShoppingExperience', 
            $salesChannelId
        );
    }
    
    // ========================================
    // Instagram Feed Configuration
    // ========================================
    
    public function isInstagramFeedEnabled(?string $salesChannelId = null): bool
    {
        return (bool) $this->systemConfigService->get(
            'HeroBlocks.config.enableHeroInstagramFeed', 
            $salesChannelId
        );
    }
    
    public function getInstagramAccessToken(?string $salesChannelId = null): ?string
    {
        return $this->systemConfigService->get(
            'HeroBlocks.config.instagramAccessToken',
            $salesChannelId
        );
    }
    
    public function getInstagramFeedLimit(?string $salesChannelId = null): int
    {
        return (int) ($this->systemConfigService->get(
            'HeroBlocks.config.instagramFeedLimit',
            $salesChannelId
        ) ?: 12);
    }
    
    // ========================================
    // Video Extended Configuration
    // ========================================
    
    public function isVideoExtendedEnabled(?string $salesChannelId = null): bool
    {
        return (bool) $this->systemConfigService->get(
            'HeroBlocks.config.enableHeroVideoExtended', 
            $salesChannelId
        );
    }
    
    // ========================================
    // Mega Menu Configuration
    // ========================================
    
    public function isMegaMenuEnabled(?string $salesChannelId = null): bool
    {
        return (bool) $this->systemConfigService->get(
            'HeroBlocks.config.enableMegaMenu', 
            $salesChannelId
        );
    }
    
    // ========================================
    // Generic Config Getter
    // ========================================
    
    /**
     * Generischer Getter für beliebige HeroBlocks Config-Werte
     */
    public function get(string $key, ?string $salesChannelId = null): mixed
    {
        return $this->systemConfigService->get(
            'HeroBlocks.config.' . $key,
            $salesChannelId
        );
    }
}