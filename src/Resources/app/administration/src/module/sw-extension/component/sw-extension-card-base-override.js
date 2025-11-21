/**
 * Override für sw-extension-card-base - Fügt Description hinzu
 */
import overrideTemplate from "./sw-extension-card-base-override.html.twig";
import "./sw-extension-card-base-override.scss";

Shopware.Component.override("sw-extension-card-base", {
    template: overrideTemplate,
});

