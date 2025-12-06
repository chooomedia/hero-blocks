/**
 * Hero Booking Form Element Registration
 * 
 * HOREX Probefahrt-/Buchungsformular CMS Element
 * Gemäß Shopware Best Practices für Custom CMS Elements
 */

// WICHTIG: Component, Config und Preview async registrieren
// @private
Shopware.Component.register('sw-cms-el-hero-booking-form', () => import('./component/index.js'));
// @private
Shopware.Component.register('sw-cms-el-config-hero-booking-form', () => import('./config/index.js'));
// @private
Shopware.Component.register('sw-cms-el-preview-hero-booking-form', () => import('./preview/index.js'));

/**
 * @private
 */
Shopware.Service('cmsService').registerCmsElement({
    name: 'hero-booking-form',
    label: 'sw-cms.elements.heroBookingForm.label',
    component: 'sw-cms-el-hero-booking-form',
    configComponent: 'sw-cms-el-config-hero-booking-form',
    previewComponent: 'sw-cms-el-preview-hero-booking-form',
    defaultConfig: {
        // === CONTENT TAB ===
        // Formular-Titel
        title: {
            source: 'static',
            value: 'Probefahrt anfragen',
        },
        // Bestätigungstext nach erfolgreicher Übermittlung
        confirmationText: {
            source: 'static',
            value: '',
        },
        
        // === SETTINGS TAB ===
        // E-Mail-Empfänger (wie Contact Form)
        mailReceiver: {
            source: 'static',
            value: [],
        },
        // Standard-Empfänger verwenden
        defaultMailReceiver: {
            source: 'static',
            value: true,
        },
        
        // === LOCATION OPTIONS TAB ===
        // Wunschort Dropdown Items (aktiv, konfigurierbar)
        // Format: Array von Objekten mit {label, value}
        preferredLocations: {
            source: 'static',
            value: [
                { label: 'Abholort 1', value: 'München' },
                { label: 'Abholort 2', value: 'Berlin' },
            ],
        },
        
        // === COMING SOON ===
        // Webhook URL (Coming Soon)
        webhookUrl: {
            source: 'static',
            value: '',
        },
        // Model Category ID (Coming Soon)
        modelCategoryId: {
            source: 'static',
            value: '',
        },
        // Google Maps API Key (Coming Soon)
        googleMapsApiKey: {
            source: 'static',
            value: '',
        },
        
        // WICHTIG: verticalAlign für Shopware's checkRequiredSlotConfigField
        verticalAlign: {
            source: 'static',
            value: 'center',
        },
    },
});

console.warn('[HeroBlocks] ✅ Hero Booking Form Element registered');
