/**
 * Override für sw-extension-card-base - Fügt Description hinzu
 * Best Practice: Beschreibung aus Extension-Metadaten (composer.json) anzeigen
 */
import overrideTemplate from "./sw-extension-card-base-override.html.twig";
import "./sw-extension-card-base-override.scss";

Shopware.Component.override("sw-extension-card-base", {
    template: overrideTemplate,
    
    methods: {
        /**
         * Hole Extension-Beschreibung aus Extension-Metadaten (composer.json)
         * Best Practice: Nur aus Extension-Metadaten laden, keine hardcodierten Werte
         */
        getExtensionDescription(extension) {
            if (!extension) {
                return null;
            }
            
            // Best Practice: Prüfe verschiedene Beschreibungsquellen aus Extension-Metadaten
            // 1. Translated description (aus composer.json extra.description) - Hauptquelle
            if (extension.translated && extension.translated.description) {
                return extension.translated.description;
            }
            
            // 2. Direct description (Fallback, falls translated nicht verfügbar)
            if (extension.description) {
                return extension.description;
            }
            
            // Keine hardcodierte Beschreibung - nur aus Extension-Metadaten
            return null;
        },
    },
});

