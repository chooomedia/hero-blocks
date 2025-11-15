/**
 * Override für sw-extension-card-base - Modern UI mit Description, Update Status Chip
 */
import overrideTemplate from "./sw-extension-card-base-override.html.twig";
import "./sw-extension-card-base-override.scss";

Shopware.Component.override("sw-extension-card-base", {
    template: overrideTemplate,
    
    computed: {
        // WICHTIG: isUpdateable wird von Parent Component bereitgestellt
        // Prüfe ob Update verfügbar ist
        isUpdateable() {
            return this.extension?.latestVersion && 
                   this.extension.latestVersion !== this.extension.version;
        },
    },
});

