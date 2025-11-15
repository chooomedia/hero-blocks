/**
 * Config Component Registration für Hero Two Columns Block
 * WICHTIG: Komponente muss als Standard-Export exportiert werden
 */
import component from './sw-cms-block-config-hero-two-columns.js';

// WICHTIG: Komponente registrieren
Shopware.Component.register('sw-cms-block-config-hero-two-columns', component);

// WICHTIG: Als Standard-Export exportieren für dynamischen Import
export default component;

