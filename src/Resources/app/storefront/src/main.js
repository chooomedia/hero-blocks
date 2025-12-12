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
// SCSS Styles - Werden über theme.json geladen!
// ============================================================================
// WICHTIG: HeroBlocks implementiert ThemeInterface und kompiliert eigene SCSS.
// Alle Styles sind in: src/Resources/app/storefront/src/scss/base.scss
// Theme-Variablen (--sw-color-*, --bs-*) werden vom aktiven Theme vererbt.

// ============================================================================
// Import JavaScript Plugin Classes
// ============================================================================
// WICHTIG: Nur Plugins die NICHT base-slider nutzen brauchen eigene Plugins
// Hero-Slider, Category-Slider, Instagram nutzen Shopware's base-slider System

// ============================================================================
// Smart Magnifier Plugin (Living Zoom Lens)
// ============================================================================
// Komplett eigenständige Implementierung (KEINE Shopware-Overrides!)
// Basiert auf: https://medium.com/@ignatovich.dm/creating-magnifying-glass-effects-in-html-css-and-javascript-7d42083bdf0e
//
// Technik: Dupliziertes Bild innerhalb der Lupe, positioniert per Cursor.
//
// States:
// - idle (5rem): Klein, subtil, folgt Cursor
// - approaching (5-7rem atmend): In der Nähe eines Produktbildes
// - zooming (7rem): Über Produktbild, zeigt gezoomten Inhalt
// - smartZoom (+30%): Nach 1.5s Stillstand
//
import SmartMagnifierPlugin from "./smart-magnifier/smart-magnifier.plugin";

// ============================================================================
// Hero Two Columns Parallax Plugin
// ============================================================================
// WICHTIG: Dieses Plugin verarbeitet:
// - Parallax-Effekte für Background-Bilder
// - Element-Animationen (Scroll-Trigger)
// - Custom CSS via data-Attribute (data-custom-css, data-image-container-css)
//
import HeroTwoColumnsParallaxPlugin from "./hero-two-columns-parallax/hero-two-columns-parallax.plugin";

// Video Plugin (Play/Pause Control für Hero Video Extended)
import HeroVideoExtendedPlugin from "./hero-video-extended/hero-video-extended.plugin";

// Timeline Plugin
import HeroTimelinePlugin from "./hero-timeline/hero-timeline.plugin";

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
  // Hero Two Columns Parallax Plugin
  // ========================================================================
  // Verarbeitet:
  // - Parallax-Effekte für Background-Bilder
  // - Element-Animationen (Scroll-Trigger)
  // - Custom CSS via data-Attribute (data-custom-css, data-image-container-css)
  //
  window.PluginManager.register(
    "HeroTwoColumnsParallax",
    HeroTwoColumnsParallaxPlugin,
    ".cms-block-hero-two-columns"
  );
  console.warn(
    '[HeroBlocks] Plugin "HeroTwoColumnsParallax" registered successfully'
  );

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
  console.warn(
    '[HeroBlocks] Plugin "HeroVideoExtended" registered successfully'
  );

  // ========================================================================
  // Hero Timeline Plugin
  // ========================================================================
  // Timeline mit Jahr-Buttons, Content-Bereich und Bilder-Slider
  try {
    if (HeroTimelinePlugin) {
      window.PluginManager.register(
        "HeroTimeline",
        HeroTimelinePlugin,
        "[data-hero-timeline]"
      );
      console.warn(
        '[HeroBlocks] Plugin "HeroTimeline" registered successfully'
      );
    } else {
      console.error("[HeroBlocks] HeroTimelinePlugin is undefined");
    }
  } catch (e) {
    console.error("[HeroBlocks] Error registering HeroTimeline plugin:", e);
  }

  // ========================================================================
  // Smart Magnifier Plugin (Living Zoom Lens)
  // ========================================================================
  // Eigenständige Implementierung ohne Shopware-Overrides!
  // - idle → approaching → zooming → smartZoom
  // - Dupliziertes Bild in Lupe (Medium-Artikel Technik)
  try {
    if (SmartMagnifierPlugin) {
      window.PluginManager.register(
        "SmartMagnifier",
        SmartMagnifierPlugin,
        "[data-smart-magnifier]"
      );
      console.warn(
        '[HeroBlocks] Plugin "SmartMagnifier" registered successfully'
      );
    }
  } catch (e) {
    console.error("[HeroBlocks] Error registering SmartMagnifier plugin:", e);
  }

  // ========================================================================
  // HINWEIS: Folgende Blocks nutzen Shopware's base-slider (KEIN eigenes Plugin nötig)
  // ========================================================================
  // - Hero Block Slider (hero-slider Element)
  // - Hero Category Slider (hero-category-slider Element)
  // - Hero Instagram Feed (grid + slider Modus)
  //
  // Diese Blocks nutzen data-base-slider="true" und werden automatisch
  // von Shopware's base-slider Plugin initialisiert

  console.warn("[HeroBlocks] ✅ All plugins registered successfully");
} else {
  console.error(
    "[HeroBlocks] ❌ PluginManager not available! Cannot register plugins."
  );
  console.error("[HeroBlocks] This is usually caused by:");
  console.error("[HeroBlocks] 1. Theme JavaScript errors");
  console.error("[HeroBlocks] 2. Missing Shopware Core JavaScript");
  console.error("[HeroBlocks] 3. Incorrect build configuration");
}
