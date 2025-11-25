/**
 * HeroBlocks Plugin - Administration Main Entry
 *
 * Based on: https://github.com/NinjaArmy/shopware-real-world-cms
 * Tutorial: https://ninja-army.hashnode.dev/how-to-create-a-cms-block-in-shopware-6
 */

// WICHTIG: Snippets global registrieren (für alle Komponenten verfügbar)
// CRITICAL: Muss VOR allen anderen Imports sein, damit Snippets verfügbar sind
// WICHTIG: Snippets aus Haupt-Snippet-Dateien laden (werden auch über API geladen)
import deDE from "./snippet/de-DE.json";
import enGB from "./snippet/en-GB.json";

// Snippets global registrieren
Shopware.Locale.extend("de-DE", deDE);
Shopware.Locale.extend("en-GB", enGB);

// Import CMS elements (always needed)
// CRITICAL: Must use explicit index.js path for ES modules
import "./module/sw-cms/elements/hero-slider/index.js";
import "./module/sw-cms/elements/category-slider/index.js";

// Import License Check settings module
import "./module/sw-settings-license-check/index.js";

// Import Extension Card Override (Description)
import "./module/sw-extension/component/sw-extension-card-base-override.js";

// Import Extension Config Override (License Chip in Header)
import "./module/sw-extension/page/sw-extension-config-override.js";

// Import CMS Block Config Override (Dynamic Config Component Loading)
import "./module/sw-cms/component/sw-cms-block/sw-cms-block-config/sw-cms-block-config-override.js";
// Import CMS Sidebar Override (Block Visibility based on System Config)
import "./module/sw-cms/component/sw-cms-sidebar/sw-cms-sidebar-override.js";
// Import CMS Slot Override (Modal Title with Element Name)
import "./module/sw-cms/component/sw-cms-slot/sw-cms-slot-override.js";

// WICHTIG: Matt Interfaces Branding für Hero Blocks
import "./app/assets/scss/_hero-blocks-branding.scss";

// Always import blocks - they will check config internally if needed
// CRITICAL: Must use explicit index.js path for ES modules
import "./module/sw-cms/blocks/image/hero-block-slider/index.js";
import "./module/sw-cms/blocks/text-image/hero-two-columns/index.js";
// WICHTIG: Mega Menu Block - wird nur angezeigt wenn enableMegaMenu aktiviert ist
import "./module/sw-cms/blocks/sidebar/hero-mega-menu/index.js";
// WICHTIG: Hero Block Category Slider Block - wird nur angezeigt wenn enableCategorySlider aktiviert ist
import "./module/sw-cms/blocks/image/category-slider/index.js";
// WICHTIG: Hero Instagram Feed Block - wird nur angezeigt wenn enableHeroInstagramFeed aktiviert ist
import "./module/sw-cms/blocks/image/hero-instagram-feed/index.js";
