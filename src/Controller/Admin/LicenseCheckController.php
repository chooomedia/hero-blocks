<?php declare(strict_types=1);

namespace HeroBlocks\Controller\Admin;

use HeroBlocks\Service\InstagramTokenCheckService;
use HeroBlocks\Service\LicenseCheckService;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Context;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * API Controller für License Check via n8n Webhook
 */
class LicenseCheckController extends AbstractController
{
    private LicenseCheckService $licenseCheckService;
    private InstagramTokenCheckService $instagramTokenCheckService;
    private LoggerInterface $logger;
    private SystemConfigService $systemConfigService;

    public function __construct(
        LicenseCheckService $licenseCheckService,
        InstagramTokenCheckService $instagramTokenCheckService,
        LoggerInterface $logger,
        SystemConfigService $systemConfigService
    ) {
        $this->licenseCheckService = $licenseCheckService;
        $this->instagramTokenCheckService = $instagramTokenCheckService;
        $this->logger = $logger;
        $this->systemConfigService = $systemConfigService;
    }

    /**
     * Prüft die Lizenz über n8n Webhook
     * 
     * Request Body (von Shopware):
     * {
     *   "plugin": "hero-blocks",
     *   "timestamp": "2024-10-29T12:00:00Z",
     *   "version": "1.0.0",
     *   "shopwareVersion": "6.7.0",
     *   "checkDate": "2024-10-29T12:00:00Z"
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "valid": true,
     *     "expiresAt": "2026-10-29T12:00:00.000Z",
     *     "daysRemaining": 730
     *   }
     * }
     */
    #[Route(path: '/api/_action/hero-blocks/check-license', name: 'api.action.hero-blocks.check-license', defaults: ['_routeScope' => ['api']], methods: ['POST'])]
    public function checkLicense(Request $request, Context $context): JsonResponse
    {
        $startTime = microtime(true);
        
        try {
            // DEBUG: Log vor Service-Aufruf
            $this->logger->info('LicenseCheckController: Starting license check', [
                'requestUri' => $request->getUri(),
                'method' => $request->getMethod(),
                'timestamp' => (new \DateTime())->format('c'),
            ]);
            
            $result = $this->licenseCheckService->checkLicense();
            
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            // DEBUG: Log nach Service-Aufruf
            $this->logger->info('LicenseCheckController: License check completed', [
                'result' => $result,
                'durationMs' => $duration,
            ]);
            
            return new JsonResponse([
                'success' => true,
                'data' => $result,
                'debug' => [
                    'durationMs' => $duration,
                    'timestamp' => (new \DateTime())->format('c'),
                ],
            ]);
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            // DEBUG: Detaillierter Error-Log
            $this->logger->error('LicenseCheckController: Exception during license check', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'durationMs' => $duration,
                'trace' => $e->getTraceAsString(),
            ]);
            
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    [
                        'code' => 'CHECK_FAILED',
                        'detail' => $e->getMessage(),
                        'status' => '500',
                        'errorType' => get_class($e),
                    ]
                ],
                'debug' => [
                    'durationMs' => $duration,
                    'timestamp' => (new \DateTime())->format('c'),
                ],
            ], 500);
        }
    }

    /**
     * Debug-Endpoint: Gibt aktuelle Webhook-URL und Environment-Status zurück
     * Hilft beim Debuggen ohne tatsächlichen Webhook-Call
     */
    #[Route(path: '/api/_action/hero-blocks/debug-webhook', name: 'api.action.hero-blocks.debug-webhook', defaults: ['_routeScope' => ['api']], methods: ['GET'])]
    public function debugWebhook(Request $request, Context $context): JsonResponse
    {
        $debug = [
            'timestamp' => (new \DateTime())->format('c'),
            'environment' => [
                'HERO_BLOCKS_WEBHOOK_URL ($_ENV)' => $_ENV['HERO_BLOCKS_WEBHOOK_URL'] ?? null,
                'HOREX_SLIDER_WEBHOOK_URL ($_ENV)' => $_ENV['HOREX_SLIDER_WEBHOOK_URL'] ?? null,
                'HERO_BLOCKS_WEBHOOK_URL ($_SERVER)' => $_SERVER['HERO_BLOCKS_WEBHOOK_URL'] ?? null,
                'HOREX_SLIDER_WEBHOOK_URL ($_SERVER)' => $_SERVER['HOREX_SLIDER_WEBHOOK_URL'] ?? null,
                'HERO_BLOCKS_WEBHOOK_URL (getenv)' => getenv('HERO_BLOCKS_WEBHOOK_URL') ?: null,
                'HOREX_SLIDER_WEBHOOK_URL (getenv)' => getenv('HOREX_SLIDER_WEBHOOK_URL') ?: null,
            ],
            'systemConfig' => [
                'licenseWebhookUrl' => $this->systemConfigService->get('HeroBlocks.config.licenseWebhookUrl'),
            ],
        ];

        // WICHTIG: Prüfe tatsächliche Webhook-URL aus LicenseCheckService
        // Verwende Reflection, um private Methode aufzurufen
        try {
            $reflection = new \ReflectionClass($this->licenseCheckService);
            $method = $reflection->getMethod('getWebhookUrl');
            $method->setAccessible(true);
            $webhookUrl = $method->invoke($this->licenseCheckService);
            $debug['webhookUrl'] = $webhookUrl;
            $debug['webhookUrlFound'] = !empty($webhookUrl);
        } catch (\Exception $e) {
            $debug['webhookUrl'] = null;
            $debug['webhookUrlError'] = $e->getMessage();
        }

        // Prüfe .env Datei direkt
        $envFile = dirname(__DIR__, 5) . '/.env';
        if (file_exists($envFile)) {
            $envContent = file_get_contents($envFile);
            $debug['envFile'] = [
                'exists' => true,
                'path' => $envFile,
                'hasHERO_BLOCKS_WEBHOOK_URL' => strpos($envContent, 'HERO_BLOCKS_WEBHOOK_URL') !== false,
                'hasHOREX_SLIDER_WEBHOOK_URL' => strpos($envContent, 'HOREX_SLIDER_WEBHOOK_URL') !== false,
            ];
        } else {
            $debug['envFile'] = [
                'exists' => false,
                'path' => $envFile,
            ];
        }

        return new JsonResponse([
            'success' => true,
            'debug' => $debug,
        ]);
    }

    /**
     * Validiert Instagram API Credentials
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "valid": true,
     *     "message": "Instagram API Credentials sind gültig. Verbunden mit Account: @username",
     *     "details": {
     *       "appId": true,
     *       "appSecret": true,
     *       "accessToken": true,
     *       "redirectUri": true,
     *       "tokenValid": true,
     *       "userId": "123456789",
     *       "username": "username",
     *       "tokenExpiresAt": "2024-12-29T12:00:00.000Z"
     *     }
     *   }
     * }
     */
    #[Route(path: '/api/_action/hero-blocks/check-instagram-token', name: 'api.action.hero-blocks.check-instagram-token', defaults: ['_routeScope' => ['api']], methods: ['POST'])]
    public function checkInstagramToken(Request $request, Context $context): JsonResponse
    {
        $startTime = microtime(true);
        
        try {
            // WICHTIG: Prüfe ob Lizenz abgelaufen ist
            $licenseStatus = $this->systemConfigService->get('HeroBlocks.config.licenseStatus');
            if ($licenseStatus === 'expired') {
                return new JsonResponse([
                    'success' => false,
                    'errors' => [
                        [
                            'code' => 'LICENSE_EXPIRED',
                            'detail' => 'Ihre Lizenz ist abgelaufen. Instagram Feed API-Anfragen sind nicht mehr möglich. Bitte verlängern Sie Ihre Lizenz.',
                            'status' => '403',
                        ]
                    ],
                ], 403);
            }

            $this->logger->info('InstagramTokenCheckController: Starting Instagram token validation', [
                'requestUri' => $request->getUri(),
                'method' => $request->getMethod(),
                'timestamp' => (new \DateTime())->format('c'),
            ]);
            
            $result = $this->instagramTokenCheckService->validateInstagramCredentials();
            
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            $this->logger->info('InstagramTokenCheckController: Instagram token validation completed', [
                'result' => $result,
                'durationMs' => $duration,
            ]);
            
            return new JsonResponse([
                'success' => true,
                'data' => $result,
                'debug' => [
                    'durationMs' => $duration,
                    'timestamp' => (new \DateTime())->format('c'),
                ],
            ]);
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            $this->logger->error('InstagramTokenCheckController: Exception during Instagram token validation', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'durationMs' => $duration,
                'trace' => $e->getTraceAsString(),
            ]);
            
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    [
                        'code' => 'VALIDATION_FAILED',
                        'detail' => $e->getMessage(),
                        'status' => '500',
                        'errorType' => get_class($e),
                    ]
                ],
                'debug' => [
                    'durationMs' => $duration,
                    'timestamp' => (new \DateTime())->format('c'),
                ],
            ], 500);
        }
    }
    
    /**
     * TEST-Methode: Sendet Test-E-Mail für License-Expiry-Reminder (DEV ONLY)
     * 
     * Route: /api/_action/hero-blocks/test-expiry-email
     * Method: POST
     */
    #[Route(
        path: '/api/_action/hero-blocks/test-expiry-email',
        name: 'api.action.hero-blocks.test-expiry-email',
        methods: ['POST']
    )]
    public function testExpiryEmail(Request $request, Context $context): JsonResponse
    {
        $startTime = microtime(true);
        
        try {
            $this->logger->info('[HeroBlocks] Test Expiry Email: Starting manual test');
            
            // Trigger den Handler manuell (simuliert Scheduled Task)
            /** @var \HeroBlocks\ScheduledTask\LicenseExpiryReminderTaskHandler $handler */
            $handler = $this->container->get(\HeroBlocks\ScheduledTask\LicenseExpiryReminderTaskHandler::class);
            
            // Force execution (ignore thresholds for testing)
            $licenseStatus = $this->systemConfigService->getString('HeroBlocks.config.licenseStatus');
            $expiresAt = $this->systemConfigService->getString('HeroBlocks.config.licenseExpiresAt');
            $daysRemaining = $this->systemConfigService->getInt('HeroBlocks.config.daysRemaining');
            
            // Berechne verbleibende Tage neu
            if (!empty($expiresAt)) {
                $expiryDate = new \DateTime($expiresAt);
                $now = new \DateTime();
                $daysRemaining = (int) $now->diff($expiryDate)->days;
            }
            
            // Test-E-Mail senden (unabhängig von Schwellenwerten)
            $adminEmail = $this->systemConfigService->getString('core.basicInformation.email');
            
            if (empty($adminEmail)) {
                throw new \Exception('No admin email configured in system settings');
            }
            
            // Sende Test-E-Mail via Shopware MailService
            /** @var \Shopware\Core\Content\Mail\Service\MailService $mailService */
            $mailService = $this->container->get(\Shopware\Core\Content\Mail\Service\MailService::class);
            
            $subject = sprintf('🧪 TEST: HeroBlocks License Expiry Reminder (%d days)', $daysRemaining);
            $bodyHtml = sprintf(
                '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' .
                '<h2 style="color: #ff6b6b;">🧪 TEST-EMAIL</h2>' .
                '<h3>⚠️ Your HeroBlocks license expires soon!</h3>' .
                '<table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">' .
                '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>License Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">%s</td></tr>' .
                '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Days Remaining:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">%d</td></tr>' .
                '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Expiry Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">%s</td></tr>' .
                '</table>' .
                '<p><a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 4px; margin: 10px 0;">Renew License Now</a></p>' .
                '<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">' .
                '<p style="color: #666; font-size: 12px;">This is a TEST email sent from the HeroBlocks License System. In production, this email is sent automatically 30 days before license expiry.</p>' .
                '</div>',
                $licenseStatus,
                $daysRemaining,
                !empty($expiresAt) ? (new \DateTime($expiresAt))->format('d.m.Y') : 'N/A',
                'https://matt-interfaces.ch/shopware-hero-block?plugin=hero-blocks&action=renew'
            );
            
            $data = [
                'recipients' => [$adminEmail => $adminEmail],
                'senderName' => 'HeroBlocks License System (TEST)',
                'salesChannelId' => null,
                'contentHtml' => $bodyHtml,
                'contentPlain' => strip_tags($bodyHtml),
                'subject' => $subject,
            ];
            
            $mailService->send($data, $context, []);
            
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            $this->logger->info('[HeroBlocks] Test email sent successfully', [
                'recipient' => $adminEmail,
                'daysRemaining' => $daysRemaining,
                'durationMs' => $duration,
            ]);
            
            return new JsonResponse([
                'success' => true,
                'data' => [
                    'recipient' => $adminEmail,
                    'daysRemaining' => $daysRemaining,
                    'licenseStatus' => $licenseStatus,
                    'expiresAt' => $expiresAt,
                ],
                'message' => 'Test email sent successfully',
                'debug' => [
                    'durationMs' => $duration,
                    'timestamp' => (new \DateTime())->format('c'),
                ],
            ]);
            
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            $this->logger->error('[HeroBlocks] Failed to send test email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    [
                        'code' => 'EMAIL_SEND_FAILED',
                        'detail' => $e->getMessage(),
                        'status' => '500',
                    ]
                ],
                'debug' => [
                    'durationMs' => $duration,
                    'timestamp' => (new \DateTime())->format('c'),
                ],
            ], 500);
        }
    }
}

