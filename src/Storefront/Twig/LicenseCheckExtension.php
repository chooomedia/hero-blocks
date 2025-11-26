<?php declare(strict_types=1);

namespace HeroBlocks\Storefront\Twig;

use HeroBlocks\Service\LicenseCheckService;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class LicenseCheckExtension extends AbstractExtension
{
    public function __construct(
        private readonly LicenseCheckService $licenseCheckService
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('hero_blocks_license_check', [$this, 'checkLicense']),
        ];
    }

    /**
     * WICHTIG: Gibt CACHED License-Status zurück (KEIN Webhook-Call!)
     * 
     * Diese Methode wird bei JEDEM Storefront-Request aufgerufen!
     * → NIEMALS checkLicense() verwenden (macht Webhook-Call)
     * → Nur getLicenseStatus() verwenden (liest aus Cache)
     * 
     * Cache wird aktualisiert durch:
     * - Manueller Button-Click im Admin
     * - Scheduled Task (1x täglich)
     *
     * @return array{valid: bool, expiresAt: string, daysRemaining: int}
     */
    public function checkLicense(): array
    {
        // WICHTIG: getLicenseStatus() statt checkLicense() - KEIN Webhook-Call!
        return $this->licenseCheckService->getLicenseStatus();
    }
}

