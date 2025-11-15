/**
 * HeroBlocks Plugin - Administration Main Entry
 *
 * Based on: https://github.com/NinjaArmy/shopware-real-world-cms
 * Tutorial: https://ninja-army.hashnode.dev/how-to-create-a-cms-block-in-shopware-6
 */

// Import CMS elements (always needed)
// CRITICAL: Must use explicit index.js path for ES modules
import "./module/sw-cms/elements/hero-slider/index.js";

// Import License Check settings module
import "./module/sw-settings-license-check/index.js";

// Import Extension Card Override (Description)
import "./module/sw-extension/component/sw-extension-card-base-override.js";

// Import Extension Config Override (License Chip in Header)
import "./module/sw-extension/page/sw-extension-config-override.js";

// Import CMS Block Config Override (Dynamic Config Component Loading)
import "./module/sw-cms/component/sw-cms-block/sw-cms-block-config/sw-cms-block-config-override.js";

// WICHTIG: Matt Interfaces Branding für Hero Blocks
import "./app/assets/scss/_hero-blocks-branding.scss";

// Always import blocks - they will check config internally if needed
// CRITICAL: Must use explicit index.js path for ES modules
import "./module/sw-cms/blocks/image/hero-block-slider/index.js";
import "./module/sw-cms/blocks/text-image/hero-two-columns/index.js";
