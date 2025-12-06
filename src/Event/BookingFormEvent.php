<?php declare(strict_types=1);

namespace HeroBlocks\Event;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Event\EventData\EventDataCollection;
use Shopware\Core\Framework\Event\EventData\MailRecipientStruct;
use Shopware\Core\Framework\Event\EventData\ScalarValueType;
use Shopware\Core\Framework\Event\FlowEventAware;
use Shopware\Core\Framework\Event\MailAware;
use Shopware\Core\Framework\Event\SalesChannelAware;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * BookingFormEvent - Custom Event for Hero Booking Form
 * 
 * This event is dispatched when a booking form is submitted.
 * It can be used in Flow Builder to trigger custom actions.
 * 
 * Available in Flow Builder as: "Booking form sent"
 */
class BookingFormEvent extends Event implements FlowEventAware, MailAware, SalesChannelAware
{
    public const EVENT_NAME = 'hero_blocks.booking_form.send';

    private MailRecipientStruct $mailRecipientStruct;

    public function __construct(
        private readonly Context $context,
        private readonly string $salesChannelId,
        private readonly array $bookingData,
        private readonly array $recipients
    ) {
        $this->mailRecipientStruct = new MailRecipientStruct($recipients);
    }

    public static function getAvailableData(): EventDataCollection
    {
        return (new EventDataCollection())
            // Booking specific fields
            ->add('model', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('zip', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('preferredLocation', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('title', new ScalarValueType(ScalarValueType::TYPE_STRING))
            // Contact fields
            ->add('salutationId', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('firstName', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('lastName', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('email', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('phone', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('comment', new ScalarValueType(ScalarValueType::TYPE_STRING))
            ->add('subject', new ScalarValueType(ScalarValueType::TYPE_STRING));
    }

    public function getName(): string
    {
        return self::EVENT_NAME;
    }

    public function getContext(): Context
    {
        return $this->context;
    }

    public function getSalesChannelId(): string
    {
        return $this->salesChannelId;
    }

    public function getMailStruct(): MailRecipientStruct
    {
        return $this->mailRecipientStruct;
    }

    public function getBookingData(): array
    {
        return $this->bookingData;
    }

    // Getter for individual fields (used by Flow Builder)
    public function getModel(): string
    {
        return $this->bookingData['model'] ?? '';
    }

    public function getZip(): string
    {
        return $this->bookingData['zip'] ?? '';
    }

    public function getPreferredLocation(): string
    {
        return $this->bookingData['preferredLocation'] ?? '';
    }

    public function getTitle(): string
    {
        return $this->bookingData['title'] ?? '';
    }

    public function getSalutationId(): string
    {
        return $this->bookingData['salutationId'] ?? '';
    }

    public function getFirstName(): string
    {
        return $this->bookingData['firstName'] ?? '';
    }

    public function getLastName(): string
    {
        return $this->bookingData['lastName'] ?? '';
    }

    public function getEmail(): string
    {
        return $this->bookingData['email'] ?? '';
    }

    public function getPhone(): string
    {
        return $this->bookingData['phone'] ?? '';
    }

    public function getComment(): string
    {
        return $this->bookingData['comment'] ?? '';
    }

    public function getSubject(): string
    {
        return $this->bookingData['subject'] ?? 'Probefahrt-Anfrage';
    }
}

