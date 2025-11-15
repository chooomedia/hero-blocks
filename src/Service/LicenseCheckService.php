<?php declare(strict_types=1);

namespace HeroBlocks\Service;

use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\Exception\HttpExceptionInterface;

class LicenseCheckService
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
        // BEST PRACTICE: Verwende injizierten HttpClient statt HttpClient::create()
        // HttpClient::create() erstellt neuen Client ohne Logger/Config
        // Symfony's injizierter Client nutzt Logger und hat besseres Error-Handling
        $this->httpClient = $httpClient;
        $this->systemConfigService = $systemConfigService;
        $this->logger = $logger;
        $this->pluginRepository = $pluginRepository;
    }

    /**
     * Prüft die Lizenz über n8n Webhook
     *
     * @return array{valid: bool, expiresAt: string, daysRemaining: int}
     */
    public function checkLicense(): array
    {
        $webhookUrl = $this->getWebhookUrl('license');
        
        if (!$webhookUrl) {
            // Fallback: Wenn keine URL konfiguriert, als gültig ansehen
            $this->logger->info('License check: No webhook URL configured, using fallback (Installation Date + licenseValidYears)');
            return $this->getDefaultValidResponse();
        }

        $timestamp = (new \DateTime())->format('c'); // ISO 8601
        $shopwareVersion = '6.7.0';
        $pluginVersion = '1.0.0';
        
        $requestData = [
            'plugin' => 'hero-blocks',
            'timestamp' => $timestamp,
            'version' => $pluginVersion,
            'shopwareVersion' => $shopwareVersion,
            'checkDate' => $timestamp,
        ];
        
        $this->logger->info('License check: Calling webhook', [
            'url' => $webhookUrl,
            'requestData' => $requestData,
        ]);

        try {
            // DEBUG: Log vor Request
            // n8n Webhook akzeptiert GET - verwende Query-Parameter statt JSON-Body
            $this->logger->info('License check: Sending HTTP request', [
                'method' => 'GET',
                'url' => $webhookUrl,
                'timeout' => 10,
                'queryParams' => $requestData,
            ]);

            // n8n Webhook erwartet GET - verwende query statt json für Request-Daten
            $response = $this->httpClient->request('GET', $webhookUrl, [
                'query' => $requestData, // Query-Parameter statt JSON-Body
                'timeout' => 10, // 10 Sekunden Timeout für n8n
                'headers' => [
                    'User-Agent' => 'Shopware-HeroSlider-Plugin/1.0.0',
                    'Accept' => 'application/json',
                ],
            ]);
            
            // WICHTIG: getStatusCode() kann Exception werfen - muss in try/catch
            try {
                $statusCode = $response->getStatusCode();
                $this->logger->info('License check: Webhook response received', [
                    'statusCode' => $statusCode,
                ]);
            } catch (\Exception $e) {
                $this->logger->error('License check: Failed to get status code', [
                    'error' => $e->getMessage(),
                    'errorType' => get_class($e),
                ]);
                throw $e;
            }

            // WICHTIG: getContent(false) liest Body, kann auch Exception werfen
            try {
                $content = $response->getContent(false);
                $this->logger->info('License check: Response content retrieved', [
                    'contentLength' => strlen($content),
                    'firstChars' => substr($content, 0, 200),
                ]);
            } catch (\Exception $e) {
                $this->logger->error('License check: Failed to get response content', [
                    'error' => $e->getMessage(),
                    'errorType' => get_class($e),
                    'statusCode' => $statusCode ?? 'unknown',
                ]);
                throw $e;
            }

            if ($statusCode !== 200) {
                $this->logger->warning('License check failed', [
                    'status' => $statusCode,
                    'response' => $content,
                ]);
                return $this->getDefaultValidResponse(); // Fallback: Gültig
            }

            $data = json_decode($content, true);
            
            $this->logger->info('License check: Parsed n8n response', [
                'rawContent' => substr($content, 0, 500), // Erste 500 Zeichen
                'parsedData' => $data,
                'isArray' => is_array($data),
            ]);
            
            // Handle n8n Response-Formate:
            // 1. {"message": "Workflow was started"} - Asynchrone Response (Webhook wartet nicht)
            // 2. {"valid": true, "expiresAt": "...", "daysRemaining": 730} - Direkte Response
            // 3. [{"valid": true, ...}, ...] - Array mit Response-Data
            
            // Prüfe ob asynchrone Response
            if (is_array($data) && isset($data['message']) && !isset($data['valid'])) {
                $this->logger->warning('n8n returned async response (workflow started but not waiting)', [
                    'message' => $data['message'],
                    'rawContent' => substr($content, 0, 500),
                ]);
                // Falls Webhook nicht auf "Wait for Response" gestellt ist, verwende Fallback
                return $this->getDefaultValidResponse();
            }
            
            // n8n kann Array oder Object zurückgeben - handle beide Fälle
            // Format 1: [{"valid": true, "expiresAt": "...", "daysRemaining": 776, ...}] - Array mit Request-Daten + Lizenz-Daten
            // Format 2: {"valid": true, "expiresAt": "...", "daysRemaining": 776} - Direktes Objekt
            $responseData = null;
            if (is_array($data)) {
                // Prüfe ob Array von Objekten (n8n gibt oft Array zurück)
                if (isset($data[0]) && is_array($data[0])) {
                    // Array mit Objekten - suche nach Element mit 'valid' key
                    // n8n kann Request-Daten + Lizenz-Daten in einem Objekt mischen
                    foreach ($data as $item) {
                        if (is_array($item) && isset($item['valid'])) {
                            // Element mit 'valid' key gefunden - verwende es
                            $responseData = $item;
                            break;
                        }
                    }
                    // Falls kein Element mit 'valid' gefunden, versuche erstes Element
                    // (kann sein, dass 'valid' später hinzugefügt wird)
                    if ($responseData === null && isset($data[0])) {
                        $responseData = $data[0];
                    }
                } elseif (isset($data['valid'])) {
                    // Direktes Objekt mit 'valid' key (kein Array-Wrapper)
                    $responseData = $data;
                }
            }
            
            // Prüfe ob Response-Format korrekt ist
            if ($responseData === null || !is_array($responseData) || !isset($responseData['valid'])) {
                $this->logger->warning('Invalid license response format from n8n', [
                    'data' => $data,
                    'responseData' => $responseData,
                    'rawContent' => substr($content, 0, 500),
                ]);
                return $this->getDefaultValidResponse();
            }
            
            // Verwende die extrahierte Response-Struktur
            $data = $responseData;
            
            $this->logger->info('License check: Valid response from n8n', [
                'valid' => $data['valid'],
                'expiresAt' => $data['expiresAt'] ?? 'not set',
                'daysRemaining' => $data['daysRemaining'] ?? 'not set',
            ]);

            // Speichere das Ergebnis in System Config
            $this->systemConfigService->set('HeroBlocks.config.licenseStatus', $data['valid'] ? 'active' : 'expired');
            
            // Ablaufsdatum: Verwende expiresAt von n8n oder Fallback (Installation Date + licenseValidYears)
            if (isset($data['expiresAt']) && !empty($data['expiresAt'])) {
                // Prüfe ob expiresAt gültiges ISO 8601 Format ist
                try {
                    $expiresDate = new \DateTime($data['expiresAt']);
                    // ISO 8601 Format mit Zeitzone für korrekte Lokalisierung
                    $expiresAt = $expiresDate->format('c'); // z.B. "2026-10-29T12:00:00+00:00"
                } catch (\Exception $e) {
                    $this->logger->warning('Invalid expiresAt format from n8n', [
                        'expiresAt' => $data['expiresAt'] ?? 'null',
                        'error' => $e->getMessage(),
                    ]);
                    // Fallback: Installation Date + licenseValidYears
                    $expiresAt = $this->calculateExpirationDateFromInstallation();
                }
            } else {
                // Fallback: Installation Date + licenseValidYears wenn expiresAt fehlt
                $expiresAt = $this->calculateExpirationDateFromInstallation();
            }
            $this->systemConfigService->set('HeroBlocks.config.licenseExpiresAt', $expiresAt);

            // Verwende daysRemaining aus n8n Response, oder berechne es selbst
            $daysRemaining = (int) ($data['daysRemaining'] ?? 0);
            if ($daysRemaining === 0 && isset($data['expiresAt']) && !empty($data['expiresAt'])) {
                try {
                    $expiresDate = new \DateTime($data['expiresAt']);
                    $now = new \DateTime();
                    $diff = $expiresDate->diff($now);
                    $daysRemaining = max(0, (int) $diff->days);
                } catch (\Exception $e) {
                    // Ignore
                }
            }

            return [
                'valid' => (bool) ($data['valid'] ?? false),
                'expiresAt' => $expiresAt ?? $data['expiresAt'] ?? '',
                'daysRemaining' => $daysRemaining,
            ];
        } catch (HttpExceptionInterface $e) {
            // HTTP Fehler (4xx, 5xx, Timeout, etc.)
            $this->logger->error('License check HTTP exception', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
                'code' => $e->getCode(),
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->getDefaultValidResponse(); // Fallback: Gültig
        } catch (\Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface $e) {
            // Transport Fehler (Network, DNS, Connection, etc.)
            $this->logger->error('License check transport exception', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
                'code' => $e->getCode(),
                'webhookUrl' => $webhookUrl,
            ]);
            return $this->getDefaultValidResponse(); // Fallback: Gültig
        } catch (\Symfony\Contracts\HttpClient\Exception\TimeoutExceptionInterface $e) {
            // Timeout Fehler
            $this->logger->error('License check timeout exception', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
                'webhookUrl' => $webhookUrl,
                'timeout' => 10,
            ]);
            return $this->getDefaultValidResponse(); // Fallback: Gültig
        } catch (\Exception $e) {
            // Alle anderen Fehler
            $this->logger->error('License check general exception', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->getDefaultValidResponse(); // Fallback: Gültig
        }
    }

    /**
     * Berechnet Ablaufsdatum basierend auf Installation Date + licenseValidYears
     */
    private function calculateExpirationDateFromInstallation(): string
    {
        try {
            // Lade Plugin Entity
            $criteria = new Criteria();
            $criteria->addFilter(new EqualsFilter('baseClass', 'HeroBlocks\\HeroBlocks'));
            $criteria->addAssociation('translations');
            
            $plugin = $this->pluginRepository->search($criteria, \Shopware\Core\Framework\Context::createDefaultContext())->first();
            
            if ($plugin && $plugin->getInstalledAt()) {
                $installedAt = $plugin->getInstalledAt();
                $licenseValidYears = (int) $this->systemConfigService->get('HeroBlocks.config.licenseValidYears') ?: 2;
                
                // Installation Date + licenseValidYears
                $expiresDate = (new \DateTime($installedAt->format('c')))->modify("+{$licenseValidYears} years");
                $expiresAt = $expiresDate->format('c');
                
                $this->logger->info('License expiration calculated from installation date', [
                    'installedAt' => $installedAt->format('c'),
                    'licenseValidYears' => $licenseValidYears,
                    'expiresAt' => $expiresAt,
                ]);
                
                return $expiresAt;
            }
        } catch (\Exception $e) {
            $this->logger->warning('Failed to get plugin installation date', [
                'error' => $e->getMessage(),
            ]);
        }
        
        // Fallback: Aktuelles Datum + 2 Jahre
        $licenseValidYears = (int) $this->systemConfigService->get('HeroBlocks.config.licenseValidYears') ?: 2;
        $expiresAt = (new \DateTime())->modify("+{$licenseValidYears} years")->format('c');
        
        return $expiresAt;
    }

    /**
     * Gibt Standard-Response zurück (gültig basierend auf Installation Date + licenseValidYears)
     */
    private function getDefaultValidResponse(): array
    {
        $expiresAt = $this->calculateExpirationDateFromInstallation();
        $expiresDate = new \DateTime($expiresAt);
        $now = new \DateTime();
        $daysRemaining = max(0, (int) $expiresDate->diff($now)->days);
        
        return [
            'valid' => true,
            'expiresAt' => $expiresAt,
            'daysRemaining' => $daysRemaining,
        ];
    }

    /**
     * Gibt n8n Webhook URL mit dynamischem {checkType} Path-Parameter zurück
     * 
     * Environment Variable: HERO_BLOCKS_WEBHOOK_URL
     * Format: https://n8n.chooomedia.com/webhook/{checkType}/hero-blocks
     * 
     * @param string $checkType 'license' oder 'update'
     * @return string|null Gibt vollständige URL mit ersetztem {checkType} zurück
     */
    private function getWebhookUrl(string $checkType = 'license'): ?string
    {
        // Validiere checkType
        if (!in_array($checkType, ['license', 'update'], true)) {
            $checkType = 'license'; // Default für Backwards Compatibility
        }
        
        // Primär: Environment Variable (aus .env Datei)
        // Symfony/Shopware lädt .env automatisch beim Kernel-Start
        
        // 1. $_ENV (wird von Symfony Dotenv befüllt - PRIMÄR!)
        // Prüfe beide Varianten: HERO_BLOCKS_WEBHOOK_URL und HOREX_SLIDER_WEBHOOK_URL
        $baseUrl = $_ENV['HERO_BLOCKS_WEBHOOK_URL'] ?? $_ENV['HOREX_SLIDER_WEBHOOK_URL'] ?? null;
        
        // 2. $_SERVER (wird manchmal von Web-Server gesetzt)
        if (empty($baseUrl)) {
            $baseUrl = $_SERVER['HERO_BLOCKS_WEBHOOK_URL'] ?? $_SERVER['HOREX_SLIDER_WEBHOOK_URL'] ?? null;
        }
        
        // 3. getenv() mit putenv Support (Fallback für CLI/Docker)
        if (empty($baseUrl)) {
            $baseUrl = getenv('HERO_BLOCKS_WEBHOOK_URL') ?: getenv('HOREX_SLIDER_WEBHOOK_URL') ?: null;
        }
        
        // 4. Direkt aus .env Datei lesen (falls alles andere fehlschlägt)
        // Prüfe beide Varianten: HERO_BLOCKS_WEBHOOK_URL und HOREX_SLIDER_WEBHOOK_URL
        if (empty($baseUrl)) {
            $envFile = dirname(__DIR__, 5) . '/.env';
            if (file_exists($envFile)) {
                $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                $envVars = ['HERO_BLOCKS_WEBHOOK_URL', 'HOREX_SLIDER_WEBHOOK_URL'];
                foreach ($lines as $line) {
                    foreach ($envVars as $envVar) {
                        if (strpos($line, $envVar) === 0 || preg_match('/^' . preg_quote($envVar, '/') . '\s*=/', $line)) {
                            $parts = explode('=', $line, 2);
                            if (count($parts) === 2) {
                                $baseUrl = trim($parts[1], " \t\n\r\0\x0B\"'");
                                if (!empty($baseUrl)) {
                                    break 2; // Break both loops
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // 5. Fallback: System Config (für Migration/Backwards Compatibility)
        if (empty($baseUrl)) {
            $baseUrl = $this->systemConfigService->get('HeroBlocks.config.licenseWebhookUrl');
        }
        
        // Bereinige Base-URL (trim whitespace)
        if (empty($baseUrl)) {
        $this->logger->warning('No webhook URL configured - using fallback (Installation Date + licenseValidYears)', [
            'env_check' => [
                'HERO_BLOCKS_WEBHOOK_URL ($_ENV)' => isset($_ENV['HERO_BLOCKS_WEBHOOK_URL']),
                'HOREX_SLIDER_WEBHOOK_URL ($_ENV)' => isset($_ENV['HOREX_SLIDER_WEBHOOK_URL']),
                'HERO_BLOCKS_WEBHOOK_URL ($_SERVER)' => isset($_SERVER['HERO_BLOCKS_WEBHOOK_URL']),
                'HOREX_SLIDER_WEBHOOK_URL ($_SERVER)' => isset($_SERVER['HOREX_SLIDER_WEBHOOK_URL']),
                'HERO_BLOCKS_WEBHOOK_URL (getenv)' => getenv('HERO_BLOCKS_WEBHOOK_URL') !== false,
                'HOREX_SLIDER_WEBHOOK_URL (getenv)' => getenv('HOREX_SLIDER_WEBHOOK_URL') !== false,
            ]
        ]);
        return null;
    }
        
        $baseUrl = trim($baseUrl);
        
        // WICHTIG: Entferne {checkType} Placeholder aus Base-URL und füge als Query-Parameter hinzu
        // Format: https://n8n.chooomedia.com/webhook/{checkType}/hero-blocks
        // → https://n8n.chooomedia.com/webhook/hero-blocks?checkType=license
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
        
        $this->logger->info('Webhook URL resolved with checkType', [
            'baseUrl' => $baseUrl,
            'checkType' => $checkType,
            'finalUrl' => $url,
            'source' => 'environment'
        ]);
        
        return $url;
    }
}

