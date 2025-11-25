/**
 * Override für sw-cms-slot
 * Zeigt Element-Namen korrekt im Modal-Titel an
 */
import template from './sw-cms-slot-override.html.twig';

Shopware.Component.override('sw-cms-slot', {
    template,
});

