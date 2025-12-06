<?php declare(strict_types=1);

namespace HeroBlocks\Controller\Storefront;

use HeroBlocks\Event\BookingFormEvent;
use HeroBlocks\Service\LicenseCheckService;
use Shopware\Core\Content\Mail\Service\AbstractMailService;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\Framework\Validation\DataValidationDefinition;
use Shopware\Core\Framework\Validation\DataValidator;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Controller\StorefrontController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;
use Psr\Log\LoggerInterface;

/**
 * BookingFormController - Custom Controller for Hero Booking Form
 * 
 * This controller handles the booking form submission with all custom fields.
 * Unlike the standard ContactFormRoute, this controller:
 * - Accepts ALL custom fields (model, zip, preferredLocation, title, etc.)
 * - Dispatches a custom BookingFormEvent for Flow Builder integration
 * - Sends emails with complete booking data
 * 
 * @Route(defaults={"_routeScope"={"storefront"}})
 */
#[Route(defaults: ['_routeScope' => ['storefront']])]
class BookingFormController extends StorefrontController
{
    public function __construct(
        private readonly AbstractMailService $mailService,
        private readonly DataValidator $validator,
        private readonly EventDispatcherInterface $eventDispatcher,
        private readonly SystemConfigService $systemConfigService,
        private readonly LoggerInterface $logger,
        private readonly LicenseCheckService $licenseCheckService
    ) {
    }

    /**
     * Handle booking form submission
     * 
     * Accepts POST requests with booking form data and sends confirmation email.
     */
    #[Route(
        path: '/booking-form/send',
        name: 'frontend.booking-form.send',
        defaults: ['XmlHttpRequest' => true, '_captcha' => true],
        methods: ['POST']
    )]
    public function send(Request $request, RequestDataBag $data, SalesChannelContext $context): Response
    {

        // Validate form data
        $this->validateFormData($data);

        // Get all form data including custom fields
        $bookingData = $this->extractBookingData($data);

        // Get recipients from config or use default
        $recipients = $this->getRecipients($context->getSalesChannelId());

        // Dispatch custom event for Flow Builder
        $event = new BookingFormEvent(
            $context->getContext(),
            $context->getSalesChannelId(),
            $bookingData,
            $recipients
        );
        $this->eventDispatcher->dispatch($event, BookingFormEvent::EVENT_NAME);

        // Send email
        $this->sendBookingEmail($bookingData, $recipients, $context);

        // Log successful submission
        $this->logger->info('Booking form submitted successfully', [
            'email' => $bookingData['email'],
            'model' => $bookingData['model'] ?? 'not specified',
        ]);

        // Return success response
        return new JsonResponse([
            [
                'type' => 'success',
                'alert' => $this->trans('contact.success'),
            ]
        ]);
    }

    /**
     * Validate required form fields
     */
    private function validateFormData(RequestDataBag $data): void
    {
        $definition = new DataValidationDefinition('booking_form.send');

        // Required fields
        $definition->add('salutationId', new NotBlank());
        $definition->add('firstName', new NotBlank());
        $definition->add('lastName', new NotBlank());
        $definition->add('email', new NotBlank(), new Email());
        $definition->add('phone', new NotBlank());
        $definition->add('comment', new NotBlank());

        // Custom required fields for booking form
        $definition->add('model', new NotBlank());
        $definition->add('zip', new NotBlank());
        $definition->add('preferredLocation', new NotBlank());

        $this->validator->validate($data->all(), $definition);
    }

    /**
     * Extract all booking data from request
     */
    private function extractBookingData(RequestDataBag $data): array
    {
        return [
            // Standard contact fields
            'salutationId' => $data->get('salutationId'),
            'firstName' => $data->get('firstName'),
            'lastName' => $data->get('lastName'),
            'email' => $data->get('email'),
            'phone' => $data->get('phone'),
            'comment' => $data->get('comment'),
            'subject' => $data->get('subject', 'Probefahrt-Anfrage'),

            // Custom booking fields
            'model' => $data->get('model'),
            'zip' => $data->get('zip'),
            'preferredLocation' => $data->get('preferredLocation'),
            'title' => $data->get('title', ''),

            // Metadata
            'navigationId' => $data->get('navigationId'),
            'slotId' => $data->get('slotId'),
        ];
    }

    /**
     * Get email recipients from config or default
     */
    private function getRecipients(string $salesChannelId): array
    {
        // Try to get from HeroBlocks config
        $configRecipients = $this->systemConfigService->get(
            'HeroBlocks.config.bookingFormRecipients',
            $salesChannelId
        );

        if (!empty($configRecipients)) {
            // Config can be comma-separated list
            $emails = array_map('trim', explode(',', $configRecipients));
            $recipients = [];
            foreach ($emails as $email) {
                if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $recipients[$email] = $email;
                }
            }
            if (!empty($recipients)) {
                return $recipients;
            }
        }

        // Fallback to shop email
        $shopEmail = $this->systemConfigService->get(
            'core.basicInformation.email',
            $salesChannelId
        );

        if ($shopEmail) {
            return [$shopEmail => $shopEmail];
        }

        // Last resort
        return ['admin@localhost' => 'admin@localhost'];
    }

    /**
     * Check if license is valid (cached, no webhook call)
     */
    private function isLicenseValid(): bool
    {
        $licenseStatus = $this->licenseCheckService->getLicenseStatus();
        return $licenseStatus['valid'] ?? false;
    }

    /**
     * Get HOREX logo URL for email header (MUST be absolute URL for emails!)
     */
    private function getLogoUrl(SalesChannelContext $context): string
    {
        // Get base URL from Sales Channel domains
        $baseUrl = $this->getBaseUrl($context);
        
        // Get logo from theme config
        $logoPath = $this->systemConfigService->get(
            'HorexShopTheme.config.sw-logo-desktop',
            $context->getSalesChannelId()
        );

        if (!empty($logoPath)) {
            // If already absolute URL, return as-is
            if (str_starts_with($logoPath, 'http://') || str_starts_with($logoPath, 'https://')) {
                return $logoPath;
            }
            // Otherwise, prepend base URL
            return rtrim($baseUrl, '/') . '/' . ltrim($logoPath, '/');
        }

        // Fallback: Use HOREX logo from media folder (confirmed to exist)
        return rtrim($baseUrl, '/') . '/media/2e/bc/ab/1761699850/logo-horex-com.png';
    }

    /**
     * Get base URL from Sales Channel
     */
    private function getBaseUrl(SalesChannelContext $context): string
    {
        $domains = $context->getSalesChannel()->getDomains();
        
        if ($domains !== null && $domains->count() > 0) {
            // Get first domain URL
            $firstDomain = $domains->first();
            if ($firstDomain !== null) {
                return rtrim($firstDomain->getUrl(), '/');
            }
        }
        
        // Fallback: Use shop URL from config
        $shopUrl = $this->systemConfigService->get(
            'core.basicInformation.shopUrl',
            $context->getSalesChannelId()
        );
        
        if (!empty($shopUrl)) {
            return rtrim($shopUrl, '/');
        }
        
        // Last resort fallback
        return 'http://localhost';
    }

    /**
     * Send booking confirmation email
     */
    private function sendBookingEmail(array $bookingData, array $recipients, SalesChannelContext $context): void
    {
        // Check license status for "Powered by" footer
        $showPoweredBy = !$this->isLicenseValid();
        $logoUrl = $this->getLogoUrl($context);

        // Build email content
        $htmlContent = $this->buildHtmlEmailContent($bookingData, $showPoweredBy, $logoUrl);
        $plainContent = $this->buildPlainEmailContent($bookingData, $showPoweredBy);

        // Get sender info
        $senderEmail = $this->systemConfigService->get(
            'core.basicInformation.email',
            $context->getSalesChannelId()
        ) ?? 'noreply@localhost';

        $senderName = $this->systemConfigService->get(
            'core.basicInformation.shopName',
            $context->getSalesChannelId()
        ) ?? 'Shop';

        // Prepare mail data
        $mailData = [
            'recipients' => $recipients,
            'senderName' => $senderName,
            'senderEmail' => $senderEmail,
            'subject' => $bookingData['subject'] ?? 'Probefahrt-Anfrage',
            'contentHtml' => $htmlContent,
            'contentPlain' => $plainContent,
            'salesChannelId' => $context->getSalesChannelId(),
        ];

        // Send email
        $this->mailService->send($mailData, $context->getContext());
    }

    /**
     * Build HTML email content with all booking data
     * 
     * @param array $data Booking form data
     * @param bool $showPoweredBy Show "Powered by" footer (only if license invalid)
     * @param string $logoUrl URL to HOREX logo for email header
     */
    private function buildHtmlEmailContent(array $data, bool $showPoweredBy = true, string $logoUrl = ''): string
    {
        // Main container with explicit background color for Dark Mode compatibility
        $html = '<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; padding: 20px;">';
        
        // Header with HOREX Logo - dark background for contrast
        $html .= '<div style="text-align: center; padding: 20px; background-color: #1a1a1a; border-bottom: 3px solid #d6ab60; border-radius: 5px 5px 0 0;">';
        if (!empty($logoUrl)) {
            $html .= '<img src="' . htmlspecialchars($logoUrl) . '" alt="HOREX" style="width: 100px; max-width: 100px; height: auto;" />';
        }
        $html .= '</div>';
        
        $html .= '<h2 style="color: #1a1a1a; margin-top: 30px; font-size: 24px;">Neue Probefahrt-Anfrage</h2>';
        
        // Booking details section - explicit colors for Dark Mode
        $html .= '<div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e0e0e0;">';
        $html .= '<h3 style="margin-top: 0; color: #1a1a1a; font-size: 16px; border-bottom: 1px solid #d6ab60; padding-bottom: 8px;">Buchungsdetails</h3>';
        $html .= '<table style="width: 100%; border-collapse: collapse; color: #333333;">';
        
        if (!empty($data['model'])) {
            $html .= '<tr><td style="padding: 8px 0; font-weight: bold; color: #555555; width: 40%;">Gewünschtes Modell:</td><td style="padding: 8px 0; color: #1a1a1a;">' . htmlspecialchars($data['model']) . '</td></tr>';
        }
        if (!empty($data['zip'])) {
            $html .= '<tr><td style="padding: 8px 0; font-weight: bold; color: #555555; width: 40%;">Wohnort/PLZ:</td><td style="padding: 8px 0; color: #1a1a1a;">' . htmlspecialchars($data['zip']) . '</td></tr>';
        }
        if (!empty($data['preferredLocation'])) {
            $html .= '<tr><td style="padding: 8px 0; font-weight: bold; color: #555555; width: 40%;">Wunschort:</td><td style="padding: 8px 0; color: #1a1a1a;">' . htmlspecialchars($data['preferredLocation']) . '</td></tr>';
        }
        
        $html .= '</table></div>';
        
        // Contact details section - explicit colors for Dark Mode
        $html .= '<div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e0e0e0;">';
        $html .= '<h3 style="margin-top: 0; color: #1a1a1a; font-size: 16px; border-bottom: 1px solid #d6ab60; padding-bottom: 8px;">Kontaktdaten</h3>';
        $html .= '<table style="width: 100%; border-collapse: collapse; color: #333333;">';
        
        $fullName = trim(($data['title'] ?? '') . ' ' . $data['firstName'] . ' ' . $data['lastName']);
        $html .= '<tr><td style="padding: 8px 0; font-weight: bold; color: #555555; width: 40%;">Name:</td><td style="padding: 8px 0; color: #1a1a1a;">' . htmlspecialchars($fullName) . '</td></tr>';
        $html .= '<tr><td style="padding: 8px 0; font-weight: bold; color: #555555; width: 40%;">E-Mail:</td><td style="padding: 8px 0;"><a href="mailto:' . htmlspecialchars($data['email']) . '" style="color: #0066cc; text-decoration: underline;">' . htmlspecialchars($data['email']) . '</a></td></tr>';
        $html .= '<tr><td style="padding: 8px 0; font-weight: bold; color: #555555; width: 40%;">Telefon:</td><td style="padding: 8px 0;"><a href="tel:' . htmlspecialchars($data['phone']) . '" style="color: #0066cc; text-decoration: underline;">' . htmlspecialchars($data['phone']) . '</a></td></tr>';
        
        $html .= '</table></div>';
        
        // Message section - explicit colors for Dark Mode
        if (!empty($data['comment'])) {
            $html .= '<div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e0e0e0;">';
            $html .= '<h3 style="margin-top: 0; color: #1a1a1a; font-size: 16px; border-bottom: 1px solid #d6ab60; padding-bottom: 8px;">Nachricht</h3>';
            $html .= '<p style="margin: 0; white-space: pre-wrap; color: #333333;">' . htmlspecialchars($data['comment']) . '</p>';
            $html .= '</div>';
        }
        
        // Footer - only show "Powered by" if license is INVALID
        $html .= '<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">';
        if ($showPoweredBy) {
            $html .= '<p style="font-size: 12px; color: #666666; text-align: center; background-color: #f8f8f8; padding: 10px; border-radius: 3px;">';
            $html .= '<a href="https://matt-interfaces.ch/hero-blocks" style="color: #d6ab60; text-decoration: none; font-weight: bold;" target="_blank">';
            $html .= 'Powered by Hero Blocks by Matt Interfaces';
            $html .= '</a></p>';
        }
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Build plain text email content
     * 
     * @param array $data Booking form data
     * @param bool $showPoweredBy Show "Powered by" footer (only if license invalid)
     */
    private function buildPlainEmailContent(array $data, bool $showPoweredBy = true): string
    {
        $lines = [];
        $lines[] = 'NEUE PROBEFAHRT-ANFRAGE';
        $lines[] = str_repeat('=', 40);
        $lines[] = '';
        
        // Booking details
        $lines[] = 'BUCHUNGSDETAILS';
        $lines[] = str_repeat('-', 20);
        if (!empty($data['model'])) {
            $lines[] = 'Gewünschtes Modell: ' . $data['model'];
        }
        if (!empty($data['zip'])) {
            $lines[] = 'Wohnort/PLZ: ' . $data['zip'];
        }
        if (!empty($data['preferredLocation'])) {
            $lines[] = 'Wunschort: ' . $data['preferredLocation'];
        }
        $lines[] = '';
        
        // Contact details
        $lines[] = 'KONTAKTDATEN';
        $lines[] = str_repeat('-', 20);
        $fullName = trim(($data['title'] ?? '') . ' ' . $data['firstName'] . ' ' . $data['lastName']);
        $lines[] = 'Name: ' . $fullName;
        $lines[] = 'E-Mail: ' . $data['email'];
        $lines[] = 'Telefon: ' . $data['phone'];
        $lines[] = '';
        
        // Message
        if (!empty($data['comment'])) {
            $lines[] = 'NACHRICHT';
            $lines[] = str_repeat('-', 20);
            $lines[] = $data['comment'];
            $lines[] = '';
        }
        
        // Footer - only show "Powered by" if license is INVALID
        $lines[] = str_repeat('-', 40);
        if ($showPoweredBy) {
            $lines[] = 'Powered by Hero Blocks by Matt Interfaces';
            $lines[] = 'https://matt-interfaces.ch/hero-blocks';
        }
        
        return implode("\n", $lines);
    }
}

