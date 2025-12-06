/**
 * Hero Booking Form Block Registration
 * 
 * HOREX Probefahrt-/Buchungsformular CMS Block
 * - Modell-Auswahl (dynamisch aus Category)
 * - Wohnort/PLZ + Wunschort
 * - Anrede + Titel
 * - Vorname + Nachname
 * - E-Mail + Telefon
 * - Nachricht (Textarea)
 * 
 * Gemäß Shopware Best Practices für Custom CMS Blocks
 */

// WICHTIG: Preview und Component async
// @private
Shopware.Component.register('sw-cms-preview-hero-booking-form', () => import('./preview/index.js'));
// @private
Shopware.Component.register('sw-cms-block-hero-booking-form', () => import('./component/index.js'));

/**
 * @private
 */
const blockConfig = {
    name: 'hero-booking-form',
    label: 'sw-cms.blocks.heroBlocks.heroBookingForm.label',
    category: 'form',
    component: 'sw-cms-block-hero-booking-form',
    previewComponent: 'sw-cms-preview-hero-booking-form',
    defaultConfig: {
        marginBottom: '20px',
        marginTop: '20px',
        marginLeft: '20px',
        marginRight: '20px',
        sizingMode: 'boxed',
    },
    slots: {
        content: {
            type: 'hero-booking-form',
            default: {
                config: {
                    // WICHTIG: verticalAlign für Shopware's checkRequiredSlotConfigField
                    verticalAlign: { source: 'static', value: 'center' },
                },
                data: {},
            },
        },
    },
    // Block ist initial hidden - wird über System-Config gesteuert
    hidden: false,
};

// Block registrieren
console.warn('[HeroBlocks] 🎉 Registering Hero Booking Form Block', blockConfig);
Shopware.Service('cmsService').registerCmsBlock(blockConfig);
console.warn('[HeroBlocks] ✅ Hero Booking Form Block registered successfully');
