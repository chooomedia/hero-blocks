<?php declare(strict_types=1);

namespace HeroBlocks\Service;

use Psr\Log\LoggerInterface;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Service für Instagram Token Validation
 * Validiert Instagram Basic Display API Credentials
 */
class InstagramTokenCheckService
{
    private SystemConfigService $systemConfigService;
    private LoggerInterface $logger;
    private HttpClientInterface $httpClient;

    public function __construct(
        SystemConfigService $systemConfigService,
        LoggerInterface $logger,
        HttpClientInterface $httpClient
    ) {
        $this->systemConfigService = $systemConfigService;
        $this->logger = $logger;
        $this->httpClient = $httpClient;
    }

    /**
     * Validiert Instagram API Credentials
     * 
     * Prüft:
     * - App ID vorhanden
     * - App Secret vorhanden
     * - Access Token vorhanden und gültig
     * - Redirect URI korrekt konfiguriert
     * 
     * @return array{
     *     valid: bool,
     *     message: string,
     *     details?: array{
     *         appId: bool,
     *         appSecret: bool,
     *         accessToken: bool,
     *         redirectUri: bool,
     *         tokenValid: bool,
     *         tokenExpiresAt?: string,
     *         userId?: string,
     *         username?: string
     *     }
     * }
     */
    public function validateInstagramCredentials(): array
    {
        try {
            // Hole Config-Werte
            $appId = $this->systemConfigService->get('HeroBlocks.config.instagramAppId');
            $appSecret = $this->systemConfigService->get('HeroBlocks.config.instagramAppSecret');
            $accessToken = $this->systemConfigService->get('HeroBlocks.config.instagramAccessToken');
            $redirectUri = $this->systemConfigService->get('HeroBlocks.config.instagramRedirectUri');

            $details = [
                'appId' => !empty($appId),
                'appSecret' => !empty($appSecret),
                'accessToken' => !empty($accessToken),
                'redirectUri' => !empty($redirectUri),
                'tokenValid' => false,
            ];

            // Prüfe ob alle erforderlichen Felder vorhanden sind
            if (!$details['appId']) {
                return [
                    'valid' => false,
                    'message' => 'Instagram App ID fehlt. Bitte geben Sie Ihre App ID in den Plugin-Einstellungen ein.',
                    'details' => $details,
                ];
            }

            if (!$details['appSecret']) {
                return [
                    'valid' => false,
                    'message' => 'Instagram App Secret fehlt. Bitte geben Sie Ihr App Secret in den Plugin-Einstellungen ein.',
                    'details' => $details,
                ];
            }

            if (!$details['accessToken']) {
                return [
                    'valid' => false,
                    'message' => 'Instagram Access Token fehlt. Bitte geben Sie Ihren Access Token in den Plugin-Einstellungen ein.',
                    'details' => $details,
                ];
            }

            if (!$details['redirectUri']) {
                return [
                    'valid' => false,
                    'message' => 'Instagram Redirect URI fehlt. Bitte geben Sie Ihre Redirect URI in den Plugin-Einstellungen ein.',
                    'details' => $details,
                ];
            }

            // WICHTIG: Validiere Access Token über Instagram API
            // Instagram Basic Display API: GET /me?fields=id,username
            try {
                $response = $this->httpClient->request('GET', 'https://graph.instagram.com/me', [
                    'query' => [
                        'fields' => 'id,username',
                        'access_token' => $accessToken,
                    ],
                    'timeout' => 10,
                ]);

                $statusCode = $response->getStatusCode();
                $responseData = $response->toArray(false);

                if ($statusCode === 200 && isset($responseData['id'])) {
                    // Token ist gültig
                    $details['tokenValid'] = true;
                    $details['userId'] = $responseData['id'] ?? null;
                    $details['username'] = $responseData['username'] ?? null;

                    // Prüfe Token-Ablaufdatum (falls verfügbar)
                    // Instagram Basic Display API gibt expires_in zurück (in Sekunden)
                    if (isset($responseData['expires_in'])) {
                        $expiresIn = (int) $responseData['expires_in'];
                        $expiresAt = (new \DateTime())->modify("+{$expiresIn} seconds");
                        $details['tokenExpiresAt'] = $expiresAt->format('c');
                    }

                    $this->logger->info('Instagram Token Validation: Success', [
                        'userId' => $details['userId'],
                        'username' => $details['username'],
                        'expiresAt' => $details['tokenExpiresAt'] ?? null,
                    ]);

                    return [
                        'valid' => true,
                        'message' => sprintf(
                            'Instagram API Credentials sind gültig. Verbunden mit Account: @%s',
                            $details['username'] ?? 'unknown'
                        ),
                        'details' => $details,
                    ];
                } else {
                    // Token ist ungültig oder abgelaufen
                    $errorMessage = $responseData['error']['message'] ?? 'Unknown error';
                    $errorType = $responseData['error']['type'] ?? 'unknown';

                    $this->logger->warning('Instagram Token Validation: Invalid token', [
                        'statusCode' => $statusCode,
                        'error' => $errorMessage,
                        'errorType' => $errorType,
                    ]);

                    return [
                        'valid' => false,
                        'message' => sprintf(
                            'Instagram Access Token ist ungültig oder abgelaufen: %s (%s)',
                            $errorMessage,
                            $errorType
                        ),
                        'details' => $details,
                    ];
                }
            } catch (\Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface $e) {
                // Network Error
                $this->logger->error('Instagram Token Validation: Network error', [
                    'error' => $e->getMessage(),
                ]);

                return [
                    'valid' => false,
                    'message' => sprintf(
                        'Netzwerkfehler bei der Token-Validierung: %s',
                        $e->getMessage()
                    ),
                    'details' => $details,
                ];
            } catch (\Symfony\Contracts\HttpClient\Exception\HttpExceptionInterface $e) {
                // HTTP Error (z.B. 400, 401, 403, 500)
                $statusCode = $e->getResponse()->getStatusCode();
                $responseData = $e->getResponse()->toArray(false);
                $errorMessage = $responseData['error']['message'] ?? $e->getMessage();

                $this->logger->error('Instagram Token Validation: HTTP error', [
                    'statusCode' => $statusCode,
                    'error' => $errorMessage,
                ]);

                return [
                    'valid' => false,
                    'message' => sprintf(
                        'Instagram API Fehler (HTTP %d): %s',
                        $statusCode,
                        $errorMessage
                    ),
                    'details' => $details,
                ];
            } catch (\Exception $e) {
                // Allgemeiner Fehler
                $this->logger->error('Instagram Token Validation: Exception', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return [
                    'valid' => false,
                    'message' => sprintf(
                        'Fehler bei der Token-Validierung: %s',
                        $e->getMessage()
                    ),
                    'details' => $details,
                ];
            }
        } catch (\Exception $e) {
            $this->logger->error('Instagram Token Validation: Fatal error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'valid' => false,
                'message' => sprintf(
                    'Unerwarteter Fehler: %s',
                    $e->getMessage()
                ),
            ];
        }
    }
}

