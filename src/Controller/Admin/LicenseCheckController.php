<?php declare(strict_types=1);

namespace HeroBlocks\Controller\Admin;

use HeroBlocks\Service\InstagramTokenCheckService;
use HeroBlocks\Service\LicenseCheckService;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Core\Content\Mail\Service\MailService;
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
    private MailService $mailService;
    private EntityRepository $userRepository;

    public function __construct(
        LicenseCheckService $licenseCheckService,
        InstagramTokenCheckService $instagramTokenCheckService,
        LoggerInterface $logger,
        SystemConfigService $systemConfigService,
        MailService $mailService,
        EntityRepository $userRepository
    ) {
        $this->licenseCheckService = $licenseCheckService;
        $this->instagramTokenCheckService = $instagramTokenCheckService;
        $this->logger = $logger;
        $this->systemConfigService = $systemConfigService;
        $this->mailService = $mailService;
        $this->userRepository = $userRepository;
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
     * WICHTIG: Diese Methode ist ISOLIERT von der produktiven License-Check-Logik!
     * - Keine Manipulation der Live-Funktionalität möglich
     * - Ändert KEINE Config-Werte
     * - Nur E-Mail-Versand (kein Storefront-Effekt)
     * - Funktioniert unabhängig von License-Status
     * 
     * Route: /api/_action/hero-blocks/test-expiry-email
     * Method: POST
     */
    #[Route(
        path: '/api/_action/hero-blocks/test-expiry-email',
        name: 'api.action.hero-blocks.test-expiry-email',
        defaults: ['_routeScope' => ['api']],
        methods: ['POST']
    )]
    public function testExpiryEmail(Request $request, Context $context): JsonResponse
    {
        $startTime = microtime(true);
        
        try {
            $this->logger->info('[HeroBlocks] 🧪 DEV Test Expiry Email: Starting isolated test (no config changes)');
            
            // =====================================================================
            // SICHERHEIT: Nur Daten LESEN - NIEMALS schreiben!
            // Diese Methode darf KEINE Config-Werte ändern!
            // =====================================================================
            
            // Hole aktuelle Config-Werte (READ-ONLY)
            $licenseStatus = $this->systemConfigService->getString('HeroBlocks.config.licenseStatus') ?: 'active';
            $expiresAt = $this->systemConfigService->getString('HeroBlocks.config.licenseExpiresAt');
            $daysRemaining = 0;
            
            // Berechne verbleibende Tage (nur für E-Mail-Anzeige)
            if (!empty($expiresAt)) {
                try {
                    $expiryDate = new \DateTime($expiresAt);
                    $now = new \DateTime();
                    $diff = $now->diff($expiryDate);
                    $daysRemaining = $expiryDate > $now ? (int) $diff->days : 0;
                } catch (\Exception $e) {
                    $daysRemaining = 0;
                }
            }
            
            // =====================================================================
            // WICHTIG: Hole E-Mail des ersten aktiven Admin-Benutzers (DYNAMISCH!)
            // Nicht die statische System-E-Mail aus Basic Information!
            // =====================================================================
            
            $criteria = new Criteria();
            $criteria->addFilter(new EqualsFilter('admin', true));
            $criteria->addFilter(new EqualsFilter('active', true));
            $criteria->setLimit(1);
            
            $adminUser = $this->userRepository->search($criteria, $context)->first();
            
            if (!$adminUser || !$adminUser->getEmail()) {
                throw new \Exception('No active admin user found. Please ensure at least one admin user exists with a valid email address.');
            }
            
            $adminEmail = $adminUser->getEmail();
            $adminName = trim($adminUser->getFirstName() . ' ' . $adminUser->getLastName()) ?: 'Admin';
            
            $this->logger->info('[HeroBlocks] 🧪 Test email will be sent to first active admin', [
                'email' => $adminEmail,
                'name' => $adminName,
                'userId' => $adminUser->getId(),
            ]);
            
            // =====================================================================
            // TEST-E-MAIL Template (Modern, Fancy UX/UI)
            // WICHTIG: Klare Kennzeichnung als TEST-E-Mail
            // =====================================================================
            
            $subject = sprintf('🧪 DEV TEST: HeroBlocks License Expiry Reminder (%d days)', $daysRemaining);
            
            // Matt Interfaces Logo als Base64 (Original SVG Logo)
            $logoBase64 = 'data:image/svg+xml;base64,PHN2ZyBpZD0ic3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCwgMCwgNDAwLDQwMCI+PGcgaWQ9InN2Z2ciPjxwYXRoIGlkPSJwYXRoMCIgZD0iTTQ4LjQ3MyAxMzkuMDk1IEMgMzAuNjU5IDE0Mi43ODgsMjAuNDk3IDE2My4yNTksMjguNTE2IDE3OS4yOTcgQyAzMi4wOTQgMTg2LjQ1NCwxMTQuMjQyIDI2OC42MjcsMTIwLjgzNyAyNzEuNjQ2IEMgMTQyLjQ3OCAyODEuNTU0LDE2Ni40NzggMjYxLjk3NCwxNjAuNjM4IDIzOS4xNzggQyAxNTkuOTQzIDIzNi40NjcsMTU5LjM3NSAyMzQuMDkwLDE1OS4zNzUgMjMzLjg5NiBDIDE1OS4zNzUgMjMzLjcwMywxNjYuMTQ3IDI0MC4zMjMsMTc0LjQyNCAyNDguNjA4IEMgMTk5LjIxNSAyNzMuNDI0LDIwMS4zNDggMjc0Ljc5NCwyMTQuMDU1IDI3NC4wNTggQyAyMzIuNjE4IDI3Mi45ODQsMjQ1Ljk4OCAyNTIuMTcyLDIzOC43OTUgMjM1LjU0NyBDIDIzNy42ODYgMjMyLjk4NCwyNDAuNzg1IDIzNS43NDYsMjU2LjAyNiAyNTAuOTA3IEMgMjc4LjQ2OSAyNzMuMjMyLDI3OS4zNzkgMjczLjgyOCwyOTEuMDE2IDI3My44MjggQyAzMDMuMzYxIDI3My44MjgsMzEzLjYzNSAyNjcuMDAzLDMxNy41MDkgMjU2LjIzMCBMIDMxOC45NjYgMjUyLjE4MCAzMjAuMjI1IDI1NS43NDAgQyAzMjguMzk0IDI3OC44NDEsMzYxLjcyMiAyODAuNDA1LDM3Mi42ODEgMjU4LjIwMyBDIDM3NS4yNTcgMjUyLjk4NSwzNzYuMDc3IDIyMC43MzcsMzczLjgxMiAyMTMuNzU0IEMgMzcxLjIxMyAyMDUuNzQxLDM2NC42MjYgMTk5LjE0NSwzNTYuMTk2IDE5Ni4xMTMgQyAzNTMuNzAzIDE5NS4yMTcsMzUyLjY4MiAxOTQuNTc2LDM1My43MTkgMTk0LjU1OSBDIDM2OC41NTAgMTk0LjMyMywzODAuMDEyIDE2OS45NzMsMzcyLjQ5MiAxNTQuNjc4IEMgMzY0LjA3NCAxMzcuNTU3LDM0MC4wMjIgMTMzLjU1OCwzMjYuNjU3IDE0Ny4wNTYgQyAzMTEuODI5IDE2Mi4wMzMsMzIwLjkwMCAxOTQuMjU0LDM0MC4wMzEgMTk0LjU1OSBDIDM0MS4wNjggMTk0LjU3NiwzNDAuMDQ3IDE5NS4yMTcsMzM3LjU1NCAxOTYuMTEzIEMgMzI0LjAxOSAyMDAuOTgxLDMxOC43ODggMjA5LjgxNCwzMTguNjk1IDIyNy45NTcgQyAzMTguNjQ0IDIzNy43OTcsMzE4LjU1NSAyMzguNDQxLDMxNy42MDIgMjM1Ljg1MSBDIDMxNS40ODAgMjMwLjA4NiwzMTEuNzM1IDIyNi4wNDYsMjcwLjU4MSAxODUuMTE4IEMgMjI2LjI3NCAxNDEuMDU0LDIyNS45MDAgMTQwLjczMSwyMTcuMTA0IDEzOS4wMzIgQyAxOTUuNTg5IDEzNC44NzUsMTc3Ljc1OCAxNTYuNzY5LDE4NS41ODMgMTc3LjczNCBDIDE4NS45MDMgMTc4LjU5NCwxNzcuNzY1IDE3MC45OTUsMTY3LjQ5NyAxNjAuODQ5IEMgMTUwLjU2OSAxNDQuMTIxLDE0OC4zOTEgMTQyLjIzNSwxNDQuMTQxIDE0MC42MTkgQyAxMjAuNTAyIDEzMS42MzYsOTguMTg1IDE1My44NDIsMTA2Ljc0NiAxNzcuODI5IEMgMTA3LjAzNCAxNzguNjM2LDk4Ljg2NiAxNzEuMDE1LDg4LjU5NiAxNjAuODk0IEMgNjYuMzg1IDEzOS4wMDUsNjEuNTU5IDEzNi4zODMsNDguNDczIDEzOS4wOTUgIiBzdHJva2U9Im5vbmUiIGZpbGw9IiNmZjU0MzIiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PC9wYXRoPjwvZz48L3N2Zz4=';
            
            $bodyHtml = sprintf(
                '<!DOCTYPE html>' .
                '<html lang="en">' .
                '<head>' .
                '<meta charset="UTF-8">' .
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">' .
                '<title>HeroBlocks License Expiry Reminder</title>' .
                '</head>' .
                '<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; background-color: #f5f7fa;">' .
                
                // Container
                '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">' .
                
                // HEADER mit Logo und Branding (Matt Interfaces Rot-Gradient)
                '<div style="background: linear-gradient(135deg, #ff5432 0%%, #ff7a59 100%%); padding: 30px 20px; text-align: center; border-radius: 0;">' .
                '<img src="%s" alt="Matt Interfaces" style="max-width: 120px; height: auto; margin-bottom: 15px; display: inline-block; filter: brightness(0) invert(1);">' .
                '<h1 style="color: white; margin: 10px 0 5px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Hero Blocks</h1>' .
                '<p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px; font-weight: 400;">Premium Shopware Plugin by Matt Interfaces</p>' .
                '</div>' .
                
                // DEV-TEST Banner (Matt Interfaces Rot)
                '<div style="background-color: #ff5432; color: white; padding: 15px 20px; text-align: center; border-bottom: 3px solid #e63a1a;">' .
                '<p style="margin: 0; font-size: 16px; font-weight: 600;">🧪 DEVELOPMENT TEST EMAIL</p>' .
                '<p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.95;">This is NOT a real license expiry notification!</p>' .
                '</div>' .
                
                // Content Area
                '<div style="padding: 40px 30px;">' .
                
                // Personalisierte Begrüßung (Matt Interfaces Rot für Highlight)
                '<p style="font-size: 16px; color: #2d3748; margin: 0 0 20px 0;">Hello <strong style="color: #ff5432;">%s</strong>,</p>' .
                
                // Hauptnachricht
                '<div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px;">' .
                '<h2 style="color: #856404; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">⚠️ License Expiry Reminder</h2>' .
                '<p style="color: #856404; margin: 0; font-size: 15px; line-height: 1.6;">Your HeroBlocks license will expire soon. Please renew to continue enjoying all premium features, updates, and support.</p>' .
                '</div>' .
                
                // Info-Tabelle (Modern Card-Style)
                '<div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #e9ecef;">' .
                '<table style="width: 100%%; border-collapse: separate; border-spacing: 0 10px;">' .
                '<tr>' .
                '<td style="padding: 12px 15px; background-color: white; border-radius: 6px; font-weight: 600; color: #495057; width: 45%%;">📊 License Status:</td>' .
                '<td style="padding: 12px 15px; background-color: white; border-radius: 6px; color: %s; font-weight: 500;">%s</td>' .
                '</tr>' .
                '<tr>' .
                '<td style="padding: 12px 15px; background-color: white; border-radius: 6px; font-weight: 600; color: #495057;">⏳ Days Remaining:</td>' .
                '<td style="padding: 12px 15px; background-color: white; border-radius: 6px; color: %s; font-weight: 700; font-size: 18px;">%d days</td>' .
                '</tr>' .
                '<tr>' .
                '<td style="padding: 12px 15px; background-color: white; border-radius: 6px; font-weight: 600; color: #495057;">📅 Expiry Date:</td>' .
                '<td style="padding: 12px 15px; background-color: white; border-radius: 6px; color: #495057; font-weight: 500;">%s</td>' .
                '</tr>' .
                '<tr>' .
                '<td style="padding: 12px 15px; background-color: white; border-radius: 6px; font-weight: 600; color: #495057;">🧪 Test Sent At:</td>' .
                '<td style="padding: 12px 15px; background-color: white; border-radius: 6px; color: #6c757d; font-size: 13px;">%s</td>' .
                '</tr>' .
                '</table>' .
                '</div>' .
                
                // CTA Button (Matt Interfaces Rot-Gradient)
                '<div style="text-align: center; margin: 35px 0;">' .
                '<a href="%s" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ff5432 0%%, #ff7a59 100%%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 84, 50, 0.4); transition: all 0.3s ease;">✨ Renew License Now</a>' .
                '</div>' .
                
                // Vorteile der Verlängerung (Hellrot/Koralle)
                '<div style="background-color: #fff5f3; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #ff5432;">' .
                '<h3 style="color: #e63a1a; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🚀 Why Renew?</h3>' .
                '<ul style="margin: 0; padding-left: 20px; color: #495057; line-height: 1.8;">' .
                '<li>✅ Continue using all premium features</li>' .
                '<li>✅ Receive automatic updates & security patches</li>' .
                '<li>✅ Access to priority support</li>' .
                '<li>✅ Future feature releases included</li>' .
                '</ul>' .
                '</div>' .
                
                '</div>' .
                
                // TEST-MODE Footer
                '<div style="background-color: #fff3cd; padding: 20px 30px; border-top: 3px solid #ffc107;">' .
                '<p style="margin: 0; color: #856404; font-size: 13px; text-align: center;"><strong>ℹ️ TEST MODE:</strong> This is a development test email. In production, this email is sent automatically 30 days before license expiry. <strong>No config values were changed.</strong></p>' .
                '</div>' .
                
                // Footer mit Branding (Matt Interfaces Rot-Akzente)
                '<div style="background-color: #2d3748; color: white; padding: 25px 30px; text-align: center;">' .
                '<p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Powered by <strong style="color: #ff7a59;">Matt Interfaces</strong></p>' .
                '<p style="margin: 0; font-size: 12px; opacity: 0.7;">Professional Shopware Solutions</p>' .
                '<p style="margin: 15px 0 0 0; font-size: 11px; opacity: 0.6;">' .
                '<a href="https://matt-interfaces.ch" style="color: #ff7a59; text-decoration: none;">matt-interfaces.ch</a> | ' .
                '<a href="mailto:info@matt-interfaces.ch" style="color: #ff7a59; text-decoration: none;">info@matt-interfaces.ch</a>' .
                '</p>' .
                '</div>' .
                
                '</div>' .
                '</body>' .
                '</html>',
                $logoBase64, // Matt Interfaces Logo
                $adminName, // Admin-Name für personalisierte Begrüßung
                $licenseStatus === 'active' ? '#28a745' : '#dc3545', // Grün wenn aktiv, rot wenn abgelaufen
                $licenseStatus,
                $daysRemaining <= 30 ? '#dc3545' : ($daysRemaining <= 90 ? '#ffc107' : '#28a745'), // Farbe je nach Dringlichkeit
                $daysRemaining,
                !empty($expiresAt) ? (new \DateTime($expiresAt))->format('d.m.Y H:i') : 'N/A',
                (new \DateTime())->format('d.m.Y H:i:s'),
                'https://matt-interfaces.ch/shopware-hero-block?plugin=hero-blocks&action=renew&test=true&utm_source=email&utm_medium=reminder&utm_campaign=license-expiry'
            );
            
            // Plain Text Version (für E-Mail-Clients ohne HTML)
            $bodyPlain = sprintf(
                "=================================================\n" .
                "HERO BLOCKS - LICENSE EXPIRY REMINDER\n" .
                "by Matt Interfaces\n" .
                "=================================================\n\n" .
                "🧪 DEVELOPMENT TEST EMAIL\n" .
                "This is NOT a real license expiry notification!\n\n" .
                "Hello %s,\n\n" .
                "⚠️ License Expiry Reminder Preview\n" .
                "Your HeroBlocks license will expire soon.\n\n" .
                "License Details:\n" .
                "-------------------------------------------------\n" .
                "📊 License Status:    %s\n" .
                "⏳ Days Remaining:    %d days\n" .
                "📅 Expiry Date:       %s\n" .
                "🧪 Test Sent At:      %s\n" .
                "-------------------------------------------------\n\n" .
                "🚀 Why Renew?\n" .
                "✅ Continue using all premium features\n" .
                "✅ Receive automatic updates & security patches\n" .
                "✅ Access to priority support\n" .
                "✅ Future feature releases included\n\n" .
                "Renew Now:\n" .
                "%s\n\n" .
                "=================================================\n" .
                "ℹ️ TEST MODE: This is a development test email.\n" .
                "In production, this email is sent automatically\n" .
                "30 days before license expiry.\n" .
                "No config values were changed.\n" .
                "=================================================\n\n" .
                "Powered by Matt Interfaces\n" .
                "Professional Shopware Solutions\n" .
                "Web: https://matt-interfaces.ch\n" .
                "Email: info@matt-interfaces.ch\n",
                $adminName,
                $licenseStatus,
                $daysRemaining,
                !empty($expiresAt) ? (new \DateTime($expiresAt))->format('d.m.Y H:i') : 'N/A',
                (new \DateTime())->format('d.m.Y H:i:s'),
                'https://matt-interfaces.ch/shopware-hero-block?plugin=hero-blocks&action=renew&test=true&utm_source=email&utm_medium=reminder&utm_campaign=license-expiry'
            );
            
            // =====================================================================
            // E-MAIL SENDEN (ISOLIERT - KEINE CONFIG-ÄNDERUNGEN!)
            // =====================================================================
            
            $data = [
                'recipients' => [$adminEmail => $adminEmail],
                'senderName' => 'HeroBlocks License System (DEV TEST)',
                'salesChannelId' => null,
                'contentHtml' => $bodyHtml,
                'contentPlain' => $bodyPlain,
                'subject' => $subject,
            ];
            
            // WICHTIG: NUR E-Mail senden - KEINE Config-Werte ändern!
            $this->mailService->send($data, $context, []);
            
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            $this->logger->info('[HeroBlocks] 🧪 DEV Test email sent successfully (isolated, no config changes)', [
                'recipient' => $adminEmail,
                'daysRemaining' => $daysRemaining,
                'licenseStatus' => $licenseStatus,
                'durationMs' => $duration,
                'NOTE' => 'This is a DEV test - no production data was modified',
            ]);
            
            return new JsonResponse([
                'success' => true,
                'data' => [
                    'recipient' => $adminEmail,
                    'recipientName' => $adminName,
                    'daysRemaining' => $daysRemaining,
                    'licenseStatus' => $licenseStatus,
                    'expiresAt' => $expiresAt,
                ],
                'message' => sprintf('Test email sent successfully to %s (%s)', $adminName, $adminEmail),
                'debug' => [
                    'durationMs' => $duration,
                    'timestamp' => (new \DateTime())->format('c'),
                    'note' => 'This is a DEV test - no production data was modified',
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

