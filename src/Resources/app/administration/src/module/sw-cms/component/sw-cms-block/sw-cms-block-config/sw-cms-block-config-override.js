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
    
    mounted() {
        // Debug: Block type (not name!) determines the block config
        console.log('[Block Config Override] Mounted! Block type:', this.block?.type, 'name:', this.block?.name);
        console.log('[Block Config Override] blockConfig:', this.blockConfig);
        console.log('[Block Config Override] configComponent:', this.blockConfig?.configComponent);
    },
    
    watch: {
        // CRITICAL: Watch block.type, NOT block.name!
        // block.name is a user-defined label (e.g., "regina-hero-slider")
        // block.type is the registered block type (e.g., "hero-block-slider")
        'block.type': {
            handler(newType) {
                console.log('[Block Config Override] Block type changed to:', newType, 'name:', this.block?.name);
                console.log('[Block Config Override] blockConfig:', this.blockConfig);
                console.log('[Block Config Override] configComponent:', this.blockConfig?.configComponent);
            },
            immediate: true,
        },
    },
    
    // WICHTIG: Keine onBlockUpdate Methode mehr - nicht benötigt
    // Shopware erkennt Änderungen automatisch über Vue's Reactivity
    // Repository.save() erkennt Änderungen am Page-Objekt automatisch
});

