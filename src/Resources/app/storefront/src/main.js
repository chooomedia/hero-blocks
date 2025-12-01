/**
 * Hero Blocks Storefront Main Entry Point
 *
 * WICHTIG: Registriert alle Storefront JavaScript Plugins
 * Gemäß Shopware 6 Best Practices für Storefront JavaScript
 *
 * Best Practice: Immer prüfen, ob PluginManager existiert
 * Quelle: https://developer.shopware.com/docs/guides/plugins/plugins/storefront/add-custom-javascript
 */

// ============================================================================
// SCSS Styles - NICHT hier importieren!
// ============================================================================
// WICHTIG: SCSS-Dateien werden NICHT in JavaScript importiert!
// Die Styles werden über das Theme (HorexShopTheme) geladen.
//
// ⚠️ HINWEIS: Alle Komponenten-Styles sind im Child-Theme aktiv:
// - HorexShopTheme/src/.../components-hero-blocks/_hero-slider.scss
// - HorexShopTheme/src/.../components-hero-blocks/_hero-mega-menu.scss
// - etc.

// ============================================================================
// Import JavaScript Plugin Classes
// ============================================================================
// WICHTIG: Nur Plugins die NICHT base-slider nutzen brauchen eigene Plugins
// Hero-Slider, Category-Slider, Instagram nutzen Shopware's base-slider System

// ============================================================================
// DEAKTIVIERT: Parallax Plugin (konfligiert mit HorexShopTheme)
// ============================================================================
// WICHTIG: Das HeroTwoColumnsParallaxPlugin wurde DEAKTIVIERT, da es mit dem
// HeroTwoColumnsScrollAnimationPlugin aus HorexShopTheme konfligiert.
//
// Das Plugin aus HorexShopTheme ist korrekt implementiert:
// - Keine Rotation (rotate) - nur translate
// - Diagonal-Animation im 33° Winkel
// - Intersection Observer für Scroll-Trigger
//
// import HeroTwoColumnsParallaxPlugin from "./hero-two-columns-parallax/hero-two-columns-parallax.plugin";

// Video Plugin (Play/Pause Control für Hero Video Extended)
import HeroVideoExtendedPlugin from "./hero-video-extended/hero-video-extended.plugin";

// Mega Menu (Auto-initialisiert sich selbst via DOMContentLoaded)
// WICHTIG: Kein PluginManager, da Legacy-Code mit eigenem Event-System
import "./hero-mega-menu/hero-mega-menu";

// ============================================================================
// Register Plugins with Shopware PluginManager
// ============================================================================
// WICHTIG: Shopware PluginManager kann undefined sein, wenn:
// - Theme-JavaScript fehlerhaft ist
// - Ladereihenfolge falsch ist
// - Webpack Build Fehler hat

// Safety Check: Prüfe ob PluginManager existiert
if (typeof window.PluginManager !== "undefined" && window.PluginManager) {
  // ========================================================================
  // DEAKTIVIERT: Hero Two Columns Parallax Plugin
  // ========================================================================
  // Konfligiert mit HeroTwoColumnsScrollAnimationPlugin aus HorexShopTheme
  // Das Plugin aus HorexShopTheme ist korrekt implementiert (ohne rotate)
  //
  // window.PluginManager.register(
  //   "HeroTwoColumnsParallax",
  //   HeroTwoColumnsParallaxPlugin,
  //   "[data-hero-two-columns-parallax]"
  // );
  // console.log(
  //   '[HeroBlocks] Plugin "HeroTwoColumnsParallax" registered successfully'
  // );

  // ========================================================================
  // Hero Video Extended Plugin
  // ========================================================================
  // Intersection Observer für Play/Pause Control
  // + Autoplay nur wenn Video im Viewport sichtbar
  window.PluginManager.register(
    "HeroVideoExtended",
    HeroVideoExtendedPlugin,
    "[data-hero-video-extended]"
  );
  console.log(
    '[HeroBlocks] Plugin "HeroVideoExtended" registered successfully'
  );

  // ========================================================================
  // HINWEIS: Folgende Blocks nutzen Shopware's base-slider (KEIN eigenes Plugin nötig)
  // ========================================================================
  // - Hero Block Slider (hero-slider Element)
  // - Hero Category Slider (hero-category-slider Element)
  // - Hero Instagram Feed (grid + slider Modus)
  //
  // Diese Blocks nutzen data-base-slider="true" und werden automatisch
  // von Shopware's base-slider Plugin initialisiert

  console.log("[HeroBlocks] ✅ All plugins registered successfully");
} else {
  console.error(
    "[HeroBlocks] ❌ PluginManager not available! Cannot register plugins."
  );
  console.error("[HeroBlocks] This is usually caused by:");
  console.error("[HeroBlocks] 1. Theme JavaScript errors");
  console.error("[HeroBlocks] 2. Missing Shopware Core JavaScript");
  console.error("[HeroBlocks] 3. Incorrect build configuration");
}
