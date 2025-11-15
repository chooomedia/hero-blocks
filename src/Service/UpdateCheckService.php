<?php declare(strict_types=1);

namespace HeroBlocks\Service;

use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\Exception\HttpExceptionInterface;

/**
 * Update Check Service
 * 
 * Prüft auf verfügbare Plugin-Updates via n8n Webhook
 * Gemäß Shopware Best Practices für Plugin-Updates
 */
class UpdateCheckService
{
    private HttpClientInterface $httpClient;
    private SystemConfigService $systemConfigService;
    private LoggerInterface $logger;
    private EntityRepository $pluginRepository;

    public function __construct(
        SystemConfigService $systemConfigService,
        LoggerInterface $logger,
        EntityRepository $pluginRepository,
        HttpClientInterface $httpClient
    ) {
        $this->httpClient = $httpClient;
        $this->systemConfigService = $systemConfigService;
        $this->logger = $logger;
        $this->pluginRepository = $pluginRepository;
    }

    /**
     * Prüft auf verfügbare Updates via n8n Webhook
     * 
     * WICHTIG: Update Check wird deaktiviert wenn License abgelaufen ist!
     * 
     * @return array{available: bool, currentVersion: string, latestVersion: string|null, downloadUrl: string|null, changelog: string|null, licenseExpired: bool}
     */
    public function checkForUpdates(): array
    {
        // WICHTIG: Prüfe zuerst ob License abgelaufen ist
        $licenseStatus = $this->systemConfigService->get('HeroBlocks.config.licenseStatus');
        $isLicenseExpired = ($licenseStatus === 'expired');
        
        if ($isLicenseExpired) {
            $this->logger->warning('Update check: License expired - Update Check deaktiviert', [
                'licenseStatus' => $licenseStatus,
            ]);
            
            // Gibt Default-Response zurück mit licenseExpired Flag
            $defaultResponse = $this->getDefaultResponse();
            $defaultResponse['licenseExpired'] = true;
            $defaultResponse['licenseExpiredMessage'] = 'License expired - Updates können nicht mehr geladen werden. Bitte verlängern Sie Ihre Lizenz.';
            
            return $defaultResponse;
        }
        
        $webhookUrl = $this->getWebhookUrl('update');
        
        // WICHTIG: Ohne n8n Webhook URL → Kein Update-Check möglich
        // Gibt Default-Response zurück: available=false, latestVersion=null
        // User muss Updates manuell installieren (bin/console plugin:update HeroBlocks)
        if (!$webhookUrl) {
            $this->logger->info('Update check: No webhook URL configured - returning default response (no update available)');
            return $this->getDefaultResponse();
        }

        $currentVersion = $this->getCurrentVersion();
        $shopwareVersion = $this->getShopwareVersion();
        
        $requestData = [
            'plugin' => 'hero-blocks',
            'currentVersion' => $currentVersion,
            'shopwareVersion' => $shopwareVersion,
            'timestamp' => (new \DateTime())->format('c'),
        ];
        
        $this->logger->info('Update check: Calling webhook', [
            'url' => $webhookUrl,
            'currentVersion' => $currentVersion,
            'shopwareVersion' => $shopwareVersion,
        ]);

        try {
            $response = $this->httpClient->request('GET', $webhookUrl, [
                'query' => $requestData,
                'timeout' => 10,
                'headers' => [
                    'User-Agent' => 'Shopware-HeroBlocks-Plugin/' . $currentVersion,
                    'Accept' => 'application/json',
                ],
            ]);
            
            $statusCode = $response->getStatusCode();
            $content = $response->getContent(false);

            if ($statusCode !== 200) {
                $this->logger->warning('Update check failed', [
                    'status' => $statusCode,
                    'response' => $content,
                ]);
                return $this->getDefaultResponse();
            }

            $data = json_decode($content, true);
            
            // Handle n8n Response-Formate
            // Format 1: {"available": true, "currentVersion": "1.0.0", "latestVersion": "1.1.0", "downloadUrl": "...", "changelog": "..."}
            // Format 2: [{"available": true, ...}] - Array mit Response-Data
            $responseData = null;
            if (is_array($data)) {
                if (isset($data[0]) && is_array($data[0])) {
                    // Array-Format: Suche nach Element mit 'latestVersion' oder 'available'
                    foreach ($data as $item) {
                        if (is_array($item) && (isset($item['latestVersion']) || isset($item['available']))) {
                            $responseData = $item;
                            break;
                        }
                    }
                    if ($responseData === null && isset($data[0])) {
                        $responseData = $data[0];
                    }
                } elseif (isset($data['latestVersion']) || isset($data['available'])) {
                    // Direktes Objekt-Format
                    $responseData = $data;
                }
            }
            
            if ($responseData === null || !is_array($responseData)) {
                $this->logger->warning('Invalid update response format from n8n', [
                    'data' => $data,
                ]);
                return $this->getDefaultResponse();
            }

            // Verwende 'available' Flag von n8n (falls vorhanden) oder berechne es selbst
            $latestVersion = $responseData['latestVersion'] ?? null;
            $available = $responseData['available'] ?? false;
            
            // Falls 'available' nicht gesetzt, aber 'latestVersion' vorhanden, berechne es
            if (!isset($responseData['available']) && $latestVersion) {
                $available = version_compare($currentVersion, $latestVersion, '<');
            }

            // Speichere Update-Info in System Config
            // WICHTIG: Alle Felder immer speichern (auch wenn available=false), damit Admin UI korrekt angezeigt wird
            $this->systemConfigService->set('HeroBlocks.config.updateAvailable', $available);
            $this->systemConfigService->set('HeroBlocks.config.currentVersion', $currentVersion); // WICHTIG: Für UI-Anzeige
            $this->systemConfigService->set('HeroBlocks.config.latestVersion', $latestVersion ?? $currentVersion);
            $this->systemConfigService->set('HeroBlocks.config.updateDownloadUrl', $responseData['downloadUrl'] ?? null);
            
            // WICHTIG: Changelog URL-decodieren (GitHub sendet URL-encoded: %0A = Newline)
            $changelog = $responseData['changelog'] ?? null;
            if ($changelog) {
                $changelog = urldecode($changelog);
            }
            $this->systemConfigService->set('HeroBlocks.config.updateChangelog', $changelog);
            $this->systemConfigService->set('HeroBlocks.config.updateCheckedAt', (new \DateTime())->format('c'));

            return [
                'available' => $available,
                'currentVersion' => $currentVersion,
                'latestVersion' => $latestVersion,
                'downloadUrl' => $responseData['downloadUrl'] ?? null,
                'changelog' => $responseData['changelog'] ?? null,
                'licenseExpired' => false,
            ];
        } catch (\Exception $e) {
            $this->logger->error('Update check exception', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
            ]);
            return $this->getDefaultResponse();
        }
    }

    /**
     * Gibt aktuelle Plugin-Version zurück
     */
    private function getCurrentVersion(): string
    {
        try {
            $criteria = new Criteria();
            $criteria->addFilter(new EqualsFilter('baseClass', 'HeroBlocks\\HeroBlocks'));
            $plugin = $this->pluginRepository->search($criteria, \Shopware\Core\Framework\Context::createDefaultContext())->first();
            
            if ($plugin && $plugin->getVersion()) {
                return $plugin->getVersion();
            }
        } catch (\Exception $e) {
            $this->logger->warning('Failed to get plugin version', [
                'error' => $e->getMessage(),
            ]);
        }
        
        // Fallback: Aus composer.json
        $composerJsonPath = dirname(__DIR__, 2) . '/composer.json';
        if (file_exists($composerJsonPath)) {
            $composerJson = json_decode(file_get_contents($composerJsonPath), true);
            return $composerJson['version'] ?? '1.0.0';
        }
        
        return '1.0.0';
    }

    /**
     * Gibt Shopware-Version zurück
     */
    private function getShopwareVersion(): string
    {
        // Shopware Version aus Kernel
        if (isset($_ENV['SHOPWARE_VERSION'])) {
            return $_ENV['SHOPWARE_VERSION'];
        }
        
        // Fallback: Aus composer.lock
        $composerLockPath = dirname(__DIR__, 5) . '/composer.lock';
        if (file_exists($composerLockPath)) {
            $composerLock = json_decode(file_get_contents($composerLockPath), true);
            foreach ($composerLock['packages'] ?? [] as $package) {
                if ($package['name'] === 'shopware/core') {
                    return $package['version'] ?? '6.7.0';
                }
            }
        }
        
        return '6.7.0';
    }

    /**
     * Gibt n8n Webhook URL mit dynamischem {checkType} Path-Parameter zurück
     * 
     * Environment Variable: HERO_BLOCKS_WEBHOOK_URL
     * Format: https://n8n.chooomedia.com/webhook/{checkType}/hero-blocks
     * 
     * WICHTIG: Verwendet dieselbe Base-URL wie License Check, ersetzt {checkType} mit 'update'
     * 
     * @param string $checkType 'license' oder 'update'
     * @return string|null Gibt vollständige URL mit ersetztem {checkType} zurück
     */
    private function getWebhookUrl(string $checkType = 'update'): ?string
    {
        // Validiere checkType
        if (!in_array($checkType, ['license', 'update'], true)) {
            $checkType = 'update'; // Default für Update Check
        }
        
        // Primär: Environment Variable HERO_BLOCKS_WEBHOOK_URL (gemeinsam mit License Check)
        // Format: https://n8n.chooomedia.com/webhook/{checkType}/hero-blocks
        $baseUrl = $_ENV['HERO_BLOCKS_WEBHOOK_URL'] ?? $_ENV['HOREX_SLIDER_WEBHOOK_URL'] ?? null;
        
        // Fallback: System Config (für Migration/Backwards Compatibility)
        if (empty($baseUrl)) {
            $baseUrl = $this->systemConfigService->get('HeroBlocks.config.licenseWebhookUrl');
        }
        
        // WICHTIG: Kein Fallback auf separate UPDATE_WEBHOOK_URL mehr!
        // Wir verwenden dieselbe Base-URL und ersetzen {checkType} dynamisch
        
        // Bereinige Base-URL (trim whitespace)
        if (empty($baseUrl)) {
            $this->logger->info('No webhook URL configured - update checks will return "no update available"', [
                'env_check' => [
                    'HERO_BLOCKS_WEBHOOK_URL ($_ENV)' => isset($_ENV['HERO_BLOCKS_WEBHOOK_URL']),
                    'HOREX_SLIDER_WEBHOOK_URL ($_ENV)' => isset($_ENV['HOREX_SLIDER_WEBHOOK_URL']),
                    'HERO_BLOCKS_WEBHOOK_URL ($_SERVER)' => isset($_SERVER['HERO_BLOCKS_WEBHOOK_URL']),
                    'HOREX_SLIDER_WEBHOOK_URL ($_SERVER)' => isset($_SERVER['HOREX_SLIDER_WEBHOOK_URL']),
                    'HERO_BLOCKS_WEBHOOK_URL (getenv)' => getenv('HERO_BLOCKS_WEBHOOK_URL') !== false,
                    'HOREX_SLIDER_WEBHOOK_URL (getenv)' => getenv('HOREX_SLIDER_WEBHOOK_URL') !== false,
                    'system_config' => $this->systemConfigService->get('HeroBlocks.config.licenseWebhookUrl') !== null,
                ]
            ]);
            return null;
        }
        
        $baseUrl = trim($baseUrl);
        
        // WICHTIG: Entferne {checkType} Placeholder aus Base-URL und füge als Query-Parameter hinzu
        // Format: https://n8n.chooomedia.com/webhook/{checkType}/hero-blocks
        // → https://n8n.chooomedia.com/webhook/hero-blocks?checkType=update
        // Fallback: Falls {checkType} im Path vorhanden, ersetze (Backwards Compatibility)
        if (strpos($baseUrl, '{checkType}') !== false) {
            // Altes Format: /webhook/{checkType}/hero-blocks
            $url = str_replace('{checkType}', '', $baseUrl);
            $url = str_replace('//', '/', $url); // Bereinige doppelte Slashes
            $url = rtrim($url, '/') . '/hero-blocks'; // Stelle sicher dass /hero-blocks am Ende steht
        } else {
            // Neues Format: Base-URL ist bereits /webhook/hero-blocks
            $url = rtrim($baseUrl, '/');
        }
        
        // Füge checkType als Query-Parameter hinzu
        $separator = strpos($url, '?') !== false ? '&' : '?';
        $url .= $separator . 'checkType=' . urlencode($checkType);
        
        // Validiere finale URL
        if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            $this->logger->warning('Invalid webhook URL after {checkType} replacement', [
                'baseUrl' => $baseUrl,
                'checkType' => $checkType,
                'finalUrl' => $url,
            ]);
            return null;
        }
        
        $this->logger->info('Update webhook URL resolved with checkType', [
            'baseUrl' => $baseUrl,
            'checkType' => $checkType,
            'finalUrl' => $url,
            'source' => 'environment'
        ]);
        
        return $url;
    }

    /**
     * Gibt Default-Response zurück
     */
    private function getDefaultResponse(): array
    {
        return [
            'available' => false,
            'currentVersion' => $this->getCurrentVersion(),
            'latestVersion' => null,
            'downloadUrl' => null,
            'changelog' => null,
            'licenseExpired' => false,
        ];
    }
}

