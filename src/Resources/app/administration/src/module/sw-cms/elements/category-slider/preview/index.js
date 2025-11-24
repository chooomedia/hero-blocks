import template from './sw-cms-el-preview-category-slider.html.twig';
import './sw-cms-el-preview-category-slider.scss';

// WICHTIG: Snippets importieren und registrieren (für Übersetzungen)
// WICHTIG: Pfad von preview/ aus: ../../../snippet/
import deDE from '../../../snippet/de-DE.json';
import enGB from '../../../snippet/en-GB.json';

// Snippets registrieren
Shopware.Locale.extend('de-DE', deDE);
Shopware.Locale.extend('en-GB', enGB);

export default {
    template,
};

