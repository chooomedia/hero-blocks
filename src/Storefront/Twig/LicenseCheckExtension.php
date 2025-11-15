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
     * Prüft die Lizenz und gibt Status zurück
     *
     * @return array{valid: bool, expiresAt: string, daysRemaining: int}
     */
    public function checkLicense(): array
    {
        return $this->licenseCheckService->checkLicense();
    }
}

