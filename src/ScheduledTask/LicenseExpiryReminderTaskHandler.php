<?php declare(strict_types=1);

namespace HeroBlocks\ScheduledTask;

use Shopware\Core\Framework\MessageQueue\ScheduledTask\ScheduledTaskHandler;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Core\Framework\Context;
use Shopware\Core\Content\Mail\Service\MailService;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Content\MailTemplate\MailTemplateEntity;
use Psr\Log\LoggerInterface;
use HeroBlocks\Service\LicenseCheckService;

/**
 * Handler für License Expiry Reminder Task
 * 
 * Prüft ob Lizenz bald abläuft und sendet E-Mail an Shop-Admin
 * Best Practice: Shopware 6 Scheduled Task Handler
 */
class LicenseExpiryReminderTaskHandler extends ScheduledTaskHandler
{
    private const REMINDER_THRESHOLD_DAYS = 30; // 1 Monat vor Ablauf
    private const MIN_REMINDER_INTERVAL_DAYS = 7; // Max 1 E-Mail pro Woche
    
    public function __construct(
        EntityRepository $scheduledTaskRepository,
        private readonly SystemConfigService $systemConfigService,
        private readonly MailService $mailService,
        private readonly LoggerInterface $logger,
        private readonly LicenseCheckService $licenseCheckService
    ) {
        parent::__construct($scheduledTaskRepository);
    }
    
    public static function getHandledMessages(): iterable
    {
        return [LicenseExpiryReminderTask::class];
    }
    
    /**
     * Hauptlogik: Prüfe Lizenz-Ablauf und sende E-Mail wenn nötig
     * 
     * WICHTIG: Diese Methode wird täglich vom Shopware Message Queue ausgeführt!
     * - Ruft checkLicense(true) auf → Webhook-Call mit Cache-Refresh
     * - Prüft ob Lizenz bald abläuft (30 Tage)
     * - Sendet E-Mail wenn nötig (max 1x pro Woche)
     */
    public function run(): void
    {
        $this->logger->info('[HeroBlocks] License Expiry Reminder Task started');
        
        // WICHTIG: Rufe checkLicense(true) auf um Cache zu aktualisieren!
        // forceRefresh = true → Webhook-Call, ignoriere Cache
        try {
            $this->logger->info('[HeroBlocks] Scheduled Task: Refreshing license status via webhook');
            $result = $this->licenseCheckService->checkLicense(true);
            
            $this->logger->info('[HeroBlocks] Scheduled Task: License check completed', [
                'valid' => $result['valid'],
                'expiresAt' => $result['expiresAt'],
                'daysRemaining' => $result['daysRemaining'],
            ]);
        } catch (\Exception $e) {
            $this->logger->error('[HeroBlocks] Scheduled Task: Failed to refresh license status', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Continue mit cached Daten
        }
        
        // 1. Lizenz-Status abrufen (aus Cache - wurde gerade aktualisiert)
        $licenseStatus = $this->systemConfigService->getString('HeroBlocks.config.licenseStatus');
        $expiresAt = $this->systemConfigService->getString('HeroBlocks.config.licenseExpiresAt');
        $lastReminderSent = $this->systemConfigService->getString('HeroBlocks.config.lastReminderSent');
        
        // Prüfe ob Lizenz aktiv ist
        if ($licenseStatus !== 'active') {
            $this->logger->info('[HeroBlocks] License already expired - no reminder needed', [
                'status' => $licenseStatus
            ]);
            return;
        }
        
        // Prüfe ob expiresAt gesetzt ist
        if (empty($expiresAt)) {
            $this->logger->warning('[HeroBlocks] No expiry date set - cannot send reminder');
            return;
        }
        
        try {
            // 2. Berechne verbleibende Tage
            $expiryDate = new \DateTime($expiresAt);
            $now = new \DateTime();
            $daysRemaining = (int) $now->diff($expiryDate)->days;
            
            // Prüfe ob Datum in Zukunft liegt
            if ($expiryDate < $now) {
                $this->logger->info('[HeroBlocks] License expired - no reminder needed');
                return;
            }
            
            $this->logger->info('[HeroBlocks] License expiry check', [
                'daysRemaining' => $daysRemaining,
                'expiresAt' => $expiresAt,
            ]);
            
            // 3. Prüfe ob Reminder gesendet werden soll
            if ($daysRemaining > self::REMINDER_THRESHOLD_DAYS) {
                $this->logger->info('[HeroBlocks] License expiry too far away - no reminder needed', [
                    'daysRemaining' => $daysRemaining,
                    'threshold' => self::REMINDER_THRESHOLD_DAYS,
                ]);
                return;
            }
            
            // 4. Prüfe ob bereits kürzlich eine E-Mail gesendet wurde
            if (!empty($lastReminderSent)) {
                $lastSent = new \DateTime($lastReminderSent);
                $daysSinceLastReminder = (int) $lastSent->diff($now)->days;
                
                if ($daysSinceLastReminder < self::MIN_REMINDER_INTERVAL_DAYS) {
                    $this->logger->info('[HeroBlocks] Reminder sent recently - skipping', [
                        'lastSent' => $lastReminderSent,
                        'daysSince' => $daysSinceLastReminder,
                    ]);
                    return;
                }
            }
            
            // 5. Sende E-Mail
            $this->sendReminderEmail($daysRemaining, $expiryDate);
            
            // 6. Speichere Timestamp der letzten E-Mail
            $this->systemConfigService->set('HeroBlocks.config.lastReminderSent', $now->format('c'));
            
            $this->logger->info('[HeroBlocks] License expiry reminder sent successfully', [
                'daysRemaining' => $daysRemaining,
                'sentAt' => $now->format('c'),
            ]);
            
        } catch (\Exception $e) {
            $this->logger->error('[HeroBlocks] Failed to send license expiry reminder', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
    
    /**
     * Sendet E-Mail an Shop-Admin mit Lizenz-Ablauf-Warnung
     */
    private function sendReminderEmail(int $daysRemaining, \DateTime $expiryDate): void
    {
        // Hole Shop-Admin-E-Mail aus System-Config
        $adminEmail = $this->systemConfigService->getString('core.basicInformation.email');
        
        if (empty($adminEmail)) {
            $this->logger->warning('[HeroBlocks] No admin email configured - cannot send reminder');
            return;
        }
        
        // E-Mail-Template-Daten
        $subject = sprintf('⚠️ HeroBlocks License expires in %d days', $daysRemaining);
        $templateData = [
            'daysRemaining' => $daysRemaining,
            'expiryDate' => $expiryDate->format('d.m.Y'),
            'renewalUrl' => 'https://matt-interfaces.ch/shopware-hero-block?plugin=hero-blocks&action=renew',
        ];
        
        // Plain-Text Body (Fallback wenn HTML nicht unterstützt wird)
        $bodyPlain = sprintf(
            "⚠️ Your HeroBlocks license expires soon!\n\n" .
            "Days remaining: %d\n" .
            "Expiry date: %s\n\n" .
            "Renew now to continue using all premium features:\n" .
            "%s\n\n" .
            "Best regards,\n" .
            "Your HeroBlocks Team",
            $daysRemaining,
            $expiryDate->format('d.m.Y'),
            $templateData['renewalUrl']
        );
        
        // HTML Body
        $bodyHtml = sprintf(
            '<h2>⚠️ Your HeroBlocks license expires soon!</h2>' .
            '<p><strong>Days remaining:</strong> %d</p>' .
            '<p><strong>Expiry date:</strong> %s</p>' .
            '<p>Renew now to continue using all premium features:</p>' .
            '<p><a href="%s" style="display:inline-block;padding:12px 24px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:4px;">Renew License Now</a></p>' .
            '<p>Best regards,<br>Your HeroBlocks Team</p>',
            $daysRemaining,
            $expiryDate->format('d.m.Y'),
            $templateData['renewalUrl']
        );
        
        try {
            // Shopware Mail Service verwenden
            $data = [
                'recipients' => [
                    $adminEmail => $adminEmail,
                ],
                'senderName' => 'HeroBlocks License System',
                'salesChannelId' => null,
                'contentHtml' => $bodyHtml,
                'contentPlain' => $bodyPlain,
                'subject' => $subject,
            ];
            
            $this->mailService->send(
                $data,
                Context::createDefaultContext(),
                $templateData
            );
            
            $this->logger->info('[HeroBlocks] Reminder email sent', [
                'recipient' => $adminEmail,
                'daysRemaining' => $daysRemaining,
            ]);
            
        } catch (\Exception $e) {
            $this->logger->error('[HeroBlocks] Failed to send email', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}

