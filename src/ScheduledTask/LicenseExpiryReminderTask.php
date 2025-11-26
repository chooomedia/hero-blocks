<?php declare(strict_types=1);

namespace HeroBlocks\ScheduledTask;

use Shopware\Core\Framework\MessageQueue\ScheduledTask\ScheduledTask;

/**
 * Scheduled Task: License Expiry Reminder
 * 
 * Prüft täglich ob die Lizenz in 1 Monat abläuft und sendet eine E-Mail
 * Best Practice: Shopware 6 Scheduled Tasks
 * 
 * @see https://developer.shopware.com/docs/guides/plugins/plugins/framework/message-queue/add-scheduled-task.html
 */
class LicenseExpiryReminderTask extends ScheduledTask
{
    /**
     * Unique Task Name
     * Pattern: vendor.plugin.task_name
     */
    public static function getTaskName(): string
    {
        return 'hero_blocks.license_expiry_reminder';
    }
    
    /**
     * Default Interval: Täglich (86400 Sekunden = 24 Stunden)
     * 
     * Die Task wird einmal täglich ausgeführt und prüft ob:
     * - Lizenz in 30 Tagen oder weniger abläuft
     * - Noch keine E-Mail in den letzten 7 Tagen gesendet wurde
     */
    public static function getDefaultInterval(): int
    {
        return 86400; // 24 Stunden
    }
}

