<?php declare(strict_types=1);

namespace HeroBlocks\Subscriber;

use Shopware\Core\Content\Flow\Dispatching\Action\FlowMailVariables;
use Shopware\Core\Content\MailTemplate\Service\Event\MailBeforeValidateEvent;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Hero Booking Form Mail Subscriber
 * 
 * Modifies the email content for Hero Booking Form (Probefahrt-Formular) submissions.
 * 
 * Features:
 * - Extends email with additional fields (Model, City/ZIP, Preferred Location, Title)
 * - Changes "Kontakt-Formular" to "Hero Booking Form" / "Probefahrt-Formular"
 * - Adds "Powered by Matt Interfaces" branding if license is invalid
 * 
 * Best Practice: Uses MailBeforeValidateEvent to modify email content before sending.
 */
class HeroBookingFormMailSubscriber implements EventSubscriberInterface
{
    private const HERO_BOOKING_SUBJECT_IDENTIFIER = 'Probefahrt-Anfrage';
    private const MATT_INTERFACES_URL = 'https://matt-interfaces.ch/hero-blocks';

    public function __construct(
        private readonly SystemConfigService $systemConfigService
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            MailBeforeValidateEvent::class => 'onMailBeforeValidate',
        ];
    }

    /**
     * Modifies the email content before it is sent.
     * Adds custom fields and "Powered by Matt Interfaces" branding if needed.
     */
    public function onMailBeforeValidate(MailBeforeValidateEvent $event): void
    {
        $data = $event->getData();
        $templateData = $event->getTemplateData();
        
        // Check if this is a contact form email with our subject
        $contactFormData = $templateData[FlowMailVariables::CONTACT_FORM_DATA] ?? null;
        
        if (!$contactFormData || !$this->isHeroBookingForm($contactFormData)) {
            return;
        }

        // Get current content
        $contentHtml = $data['contentHtml'] ?? '';
        $contentPlain = $data['contentPlain'] ?? '';

        // Build additional fields content
        $additionalFieldsHtml = $this->buildAdditionalFieldsHtml($contactFormData);
        $additionalFieldsPlain = $this->buildAdditionalFieldsPlain($contactFormData);

        // Replace "Kontakt-Formular" with "Probefahrt-Formular" / "Hero Booking Form"
        $contentHtml = $this->replaceFormName($contentHtml, true);
        $contentPlain = $this->replaceFormName($contentPlain, false);

        // Insert additional fields after the form name line
        $contentHtml = $this->insertAdditionalFields($contentHtml, $additionalFieldsHtml, true);
        $contentPlain = $this->insertAdditionalFields($contentPlain, $additionalFieldsPlain, false);

        // Check license and add branding if invalid
        $salesChannelId = $templateData['salesChannel']['id'] ?? null;
        if (!$this->isLicenseValid($salesChannelId)) {
            $brandingHtml = $this->getBrandingHtml();
            $brandingPlain = $this->getBrandingPlain();
            
            $contentHtml .= $brandingHtml;
            $contentPlain .= $brandingPlain;
        }

        // Update the email data
        $data['contentHtml'] = $contentHtml;
        $data['contentPlain'] = $contentPlain;
        
        $event->setData($data);
    }

    /**
     * Checks if the contact form submission is from the Hero Booking Form
     */
    private function isHeroBookingForm(array $contactFormData): bool
    {
        $subject = $contactFormData['subject'] ?? '';
        return str_contains($subject, self::HERO_BOOKING_SUBJECT_IDENTIFIER);
    }

    /**
     * Builds HTML content for additional fields
     */
    private function buildAdditionalFieldsHtml(array $data): string
    {
        $fields = [];
        
        if (!empty($data['model'])) {
            $fields[] = '<p><strong>Modell:</strong> ' . htmlspecialchars($data['model']) . '</p>';
        }
        
        if (!empty($data['zip'])) {
            $fields[] = '<p><strong>Wohnort/PLZ:</strong> ' . htmlspecialchars($data['zip']) . '</p>';
        }
        
        if (!empty($data['preferredLocation'])) {
            $fields[] = '<p><strong>Wunschort:</strong> ' . htmlspecialchars($data['preferredLocation']) . '</p>';
        }
        
        if (!empty($data['title'])) {
            $fields[] = '<p><strong>Titel:</strong> ' . htmlspecialchars($data['title']) . '</p>';
        }

        return implode("\n", $fields);
    }

    /**
     * Builds plain text content for additional fields
     */
    private function buildAdditionalFieldsPlain(array $data): string
    {
        $fields = [];
        
        if (!empty($data['model'])) {
            $fields[] = 'Modell: ' . $data['model'];
        }
        
        if (!empty($data['zip'])) {
            $fields[] = 'Wohnort/PLZ: ' . $data['zip'];
        }
        
        if (!empty($data['preferredLocation'])) {
            $fields[] = 'Wunschort: ' . $data['preferredLocation'];
        }
        
        if (!empty($data['title'])) {
            $fields[] = 'Titel: ' . $data['title'];
        }

        return implode("\n", $fields);
    }

    /**
     * Replaces "Kontakt-Formular" with "Probefahrt-Formular"
     */
    private function replaceFormName(string $content, bool $isHtml): string
    {
        $replacements = [
            'Kontakt-Formular' => 'Probefahrt-Formular (Hero Booking Form)',
            'contact form' => 'Test Ride Request Form (Hero Booking Form)',
            'Contact Form' => 'Test Ride Request Form (Hero Booking Form)',
        ];

        foreach ($replacements as $search => $replace) {
            $content = str_replace($search, $replace, $content);
        }

        return $content;
    }

    /**
     * Inserts additional fields after the form name line
     */
    private function insertAdditionalFields(string $content, string $additionalFields, bool $isHtml): string
    {
        if (empty($additionalFields)) {
            return $content;
        }

        // Find the position after "gesendet." or "sent." and insert additional fields
        $patterns = [
            '/gesendet\.\s*(<br\s*\/?>|\n)/i',
            '/sent\.\s*(<br\s*\/?>|\n)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                $insertPosition = $matches[0][1] + strlen($matches[0][0]);
                $separator = $isHtml ? "<br>\n" : "\n";
                $content = substr($content, 0, $insertPosition) . 
                           $separator . $additionalFields . $separator .
                           substr($content, $insertPosition);
                break;
            }
        }

        return $content;
    }

    /**
     * Checks if the HeroBlocks license is valid
     */
    private function isLicenseValid(?string $salesChannelId = null): bool
    {
        $licenseKey = $this->systemConfigService->get('HeroBlocks.config.licenseKey', $salesChannelId);
        
        if (empty($licenseKey)) {
            return false;
        }

        // Check license status from cache/config
        $licenseStatus = $this->systemConfigService->get('HeroBlocks.config.licenseStatus', $salesChannelId);
        
        // If status is explicitly set to invalid, return false
        if ($licenseStatus === 'invalid' || $licenseStatus === 'expired') {
            return false;
        }

        // Default: Consider license valid if key exists
        // Actual validation happens via webhook in LicenseCheckService
        return true;
    }

    /**
     * Gets HTML branding for invalid license
     */
    private function getBrandingHtml(): string
    {
        return sprintf(
            '<br><hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">
                <a href="%s" style="color: #d6ab60; text-decoration: none;" target="_blank">
                    Powered by Hero Blocks by Matt Interfaces
                </a>
            </p>',
            self::MATT_INTERFACES_URL
        );
    }

    /**
     * Gets plain text branding for invalid license
     */
    private function getBrandingPlain(): string
    {
        return sprintf(
            "\n\n---\nPowered by Hero Blocks by Matt Interfaces\n%s",
            self::MATT_INTERFACES_URL
        );
    }
}

