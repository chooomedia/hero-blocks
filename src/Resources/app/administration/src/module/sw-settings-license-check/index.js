// Import License Check Button Component Override
import "./license-check-button";

// Import Snippets
import deDE from "./snippet/de-DE.json";
import enGB from "./snippet/en-GB.json";

// Add snippets to global namespace so they can be used in overrides
Shopware.Locale.extend("de-DE", deDE);
Shopware.Locale.extend("en-GB", enGB);
