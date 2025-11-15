/**
 * Override für sw-cms-block-config
 * Lädt block-spezifische Config-Komponenten dynamisch
 * 
 * WICHTIG: blockConfig ist bereits in der Basis-Komponente als computed property definiert
 * WICHTIG: Block Config benötigt KEINE Events - Shopware erkennt Änderungen über Vue's Reactivity
 */
import template from './sw-cms-block-config-override.html.twig';

Shopware.Component.override('sw-cms-block-config', {
    template,
    
    // WICHTIG: Keine onBlockUpdate Methode mehr - nicht benötigt
    // Shopware erkennt Änderungen automatisch über Vue's Reactivity
    // Repository.save() erkennt Änderungen am Page-Objekt automatisch
});

