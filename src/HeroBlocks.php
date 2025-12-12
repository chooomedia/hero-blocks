<?php declare(strict_types=1);

namespace HeroBlocks;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\InstallContext;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;

/**
 * Hero Blocks Plugin
 * 
 * HINWEIS: Dieses Plugin implementiert NICHT ThemeInterface.
 * SCSS-Styles werden vom aktiven Theme (z.B. HorexShopTheme) kompiliert.
 * 
 * Die SCSS-Quelldateien befinden sich in:
 * - src/Resources/app/storefront/src/scss/components/
 * 
 * Diese werden vom Theme importiert und kompiliert.
 */
class HeroBlocks extends Plugin
{
    /**
     * Returns the path to the plugin icon (SVG or PNG)
     * Used in Admin Extension Config Header
     * 
     * @return string|null Base64 encoded icon or path to icon file
     */
    public function getIcon(): ?string
    {
        $iconPath = $this->getPath() . '/src/Resources/config/plugin-icon.svg';
        
        if (file_exists($iconPath)) {
            $svgContent = file_get_contents($iconPath);
            if ($svgContent !== false) {
                return 'data:image/svg+xml;base64,' . base64_encode($svgContent);
            }
        }
        
        return null;
    }
    public function install(InstallContext $installContext): void
    {
        parent::install($installContext);
        
        // Setze initiale Lizenz-Informationen bei Installation
        $this->setInitialLicenseInfo($installContext->getContext());
    }

    public function activate(ActivateContext $activateContext): void
    {
        parent::activate($activateContext);
        
        // Setze initiale Lizenz-Informationen bei Aktivierung (falls noch nicht gesetzt)
        $this->setInitialLicenseInfo($activateContext->getContext());
    }

    /**
     * Plugin Update Methode
     * Wird bei Plugin-Updates aufgerufen (bin/console plugin:update HeroBlocks)
     */
    public function update(UpdateContext $updateContext): void
    {
        $context = $updateContext->getContext();
        $currentVersion = $updateContext->getCurrentPluginVersion();
        $updateVersion = $updateContext->getUpdatePluginVersion();
        
        /** @var SystemConfigService|null $configService */
        $configService = $this->container->get('Shopware\\Core\\System\\SystemConfig\\SystemConfigService');
        if ($configService) {
            // Log Update-Version für Debugging
            $configService->set('HeroBlocks.config.lastUpdateVersion', $updateVersion);
            $configService->set('HeroBlocks.config.lastUpdateDate', (new \DateTime())->format('c'));
            
            // Clear Update-Flags nach erfolgreichem Update
            $configService->set('HeroBlocks.config.updateAvailable', false);
            $configService->set('HeroBlocks.config.latestVersion', null);
        }
        
        // Version-spezifische Updates
        // Beispiel: if (version_compare($currentVersion, '1.1.0', '<=')) { ... }
        // if (version_compare($currentVersion, '1.2.0', '<=')) { ... }
        
        parent::update($updateContext);
    }

    /**
     * Post-Update Hook
     * Wird nach erfolgreichem Update aufgerufen
     */
    public function postUpdate(UpdateContext $updateContext): void
    {
        parent::postUpdate($updateContext);
        
        // Optional: Update-Check nach erfolgreichem Update
        // $this->checkForUpdates($updateContext->getContext());
    }

    /**
     * Setzt initiale Lizenz-Informationen basierend auf Installation Date + licenseValidYears
     */
    private function setInitialLicenseInfo(Context $context): void
    {
        /** @var SystemConfigService|null $configService */
        $configService = $this->container->get('Shopware\\Core\\System\\SystemConfig\\SystemConfigService');
        if (!$configService) {
            return;
        }

        // Setze initiale Werte (immer, damit sie korrekt sind)
        $configService->set('HeroBlocks.config.licenseStatus', 'active');
        $configService->set('HeroBlocks.config.licenseValidYears', 2);
        
        // Prüfe ob licenseExpiresAt bereits gesetzt ist (z.B. durch Webhook)
        $existingExpiresAt = $configService->get('HeroBlocks.config.licenseExpiresAt');
        if ($existingExpiresAt) {
            try {
                // Validierung: Prüfe ob Datum in der Zukunft liegt
                $expiresDate = new \DateTime($existingExpiresAt);
                $now = new \DateTime();
                if ($expiresDate > $now) {
                    return; // Bereits gesetzt und gültig, nicht überschreiben
                }
            } catch (\Exception $e) {
                // Ungültiges Datum, neu berechnen
            }
        }
        
        // Berechne Ablaufsdatum: Aktuelles Datum (Installation) + 2 Jahre
        $installedAt = new \DateTime();
        $licenseValidYears = 2;
        $expiresAt = (clone $installedAt)->modify("+{$licenseValidYears} years")->format('c');
        
        $configService->set('HeroBlocks.config.licenseExpiresAt', $expiresAt);
    }
}
