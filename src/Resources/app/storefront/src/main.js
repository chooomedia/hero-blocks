/**
 * Hero Blocks Storefront Main Entry Point
 * 
 * WICHTIG: Registriert alle Storefront JavaScript Plugins
 * Gemäß Shopware 6 Best Practices für Storefront JavaScript
 * 
 * Best Practice: Immer prüfen, ob PluginManager existiert
 * Quelle: https://developer.shopware.com/docs/guides/plugins/plugins/storefront/add-custom-javascript
 */

// Import Plugin Classes
import HeroTwoColumnsParallaxPlugin from './hero-two-columns-parallax/hero-two-columns-parallax.plugin';

// Import Mega Menu (Auto-initialisiert sich selbst via DOMContentLoaded)
import './hero-mega-menu/hero-mega-menu';

// Register Plugins - mit Safety Check
// WICHTIG: Shopware PluginManager kann undefined sein, wenn:
// - Theme-JavaScript fehlerhaft ist
// - Ladereihenfolge falsch ist
// - Webpack Build Fehler hat

// Safety Check: Prüfe ob PluginManager existiert
if (typeof window.PluginManager !== 'undefined' && window.PluginManager) {
    // Register Plugin
    window.PluginManager.register(
        'HeroTwoColumnsParallax',
        HeroTwoColumnsParallaxPlugin,
        '[data-hero-two-columns-parallax]'
    );
    
    console.log('[HeroBlocks] Plugin "HeroTwoColumnsParallax" registered successfully');
} else {
    console.error('[HeroBlocks] PluginManager not available! Cannot register HeroTwoColumnsParallax plugin.');
    console.error('[HeroBlocks] This is usually caused by:');
    console.error('[HeroBlocks] 1. Theme JavaScript errors');
    console.error('[HeroBlocks] 2. Missing Shopware Core JavaScript');
    console.error('[HeroBlocks] 3. Incorrect build configuration');
}

