/**
 * Hero FAQ Block Registration
 * 
 * WICHTIG: Block wird nur angezeigt wenn enableFaqBlock aktiviert ist
 * Gemäß Shopware Best Practices für Custom CMS Blocks
 * WICHTIG: Snippets werden aus Root-Snippets geladen (app/administration/src/snippet/)
 */

// WICHTIG: Preview und Component async
// @private
Shopware.Component.register('sw-cms-preview-hero-faq', () => import('./preview/index.js'));
// @private
Shopware.Component.register('sw-cms-block-hero-faq', () => import('./component/index.js'));

// WICHTIG: Config Component INLINE registrieren (nicht als separates Modul!)
import configTemplate from './config/sw-cms-block-config-hero-faq.html.twig';
import './config/sw-cms-block-config-hero-faq.scss';

const { Mixin } = Shopware;

Shopware.Component.register('sw-cms-block-config-hero-faq', {
  template: configTemplate,

  inject: ['cmsService'],

  mixins: [
    Mixin.getByName('cms-state'),
  ],

  // WICHTIG: Block wird als Prop übergeben (von Override Template), aber als Fallback auch aus cmsPageState
  props: {
    block: {
      type: Object,
      required: false, // nicht required weil wir Fallback haben!
    },
  },

  computed: {
    // WICHTIG: Block aus Prop ODER cmsPageState (Fallback)
    currentBlock() {
      const block = this.block || this.cmsPageState?.currentBlock;
      console.log('[FAQ Config] currentBlock:', block?.name, 'from', this.block ? 'prop' : 'cmsPageState');
      return block;
    },

    // WICHTIG: Computed property mit getter/setter für direkte Reaktivität
    // WICHTIG: Vue 3 braucht kein $set - direkte Zuweisung ist reaktiv!
    faqItems: {
      get() {
        const block = this.currentBlock;
        if (!block) {
          console.warn('[FAQ Config] No currentBlock!');
          return [];
        }
        // Vue 3: Direkte Zuweisung ist reaktiv
        if (!block.customFields) {
          console.log('[FAQ Config] Creating customFields');
          block.customFields = {};
        }
        if (!block.customFields.faqItems) {
          console.log('[FAQ Config] Creating faqItems array');
          block.customFields.faqItems = [];
        }
        return block.customFields.faqItems;
      },
      set(value) {
        const block = this.currentBlock;
        if (!block) {
          console.error('[FAQ Config] Cannot set faqItems - no currentBlock!');
          return;
        }
        // Vue 3: Direkte Zuweisung ist reaktiv
        if (!block.customFields) {
          block.customFields = {};
        }
        block.customFields.faqItems = value;
        console.log('[FAQ Config] faqItems updated:', value);
      },
    },
  },

  mounted() {
    console.log('[FAQ Config] Component mounted! Block:', this.currentBlock?.name);
    console.log('[FAQ Config] faqItems:', this.faqItems);
  },

  methods: {
    addFaq() {
      const newItem = {
        question: '',
        answer: '',
      };
      // WICHTIG: Neues Array erstellen für Reaktivität
      const newItems = [...this.faqItems, newItem];
      this.faqItems = newItems;
      console.log('[FAQ Config] Added new FAQ item, total:', this.faqItems.length);
      console.log('[FAQ Config] Current items:', this.faqItems);
    },

    removeFaq(index) {
      // WICHTIG: Neues Array ohne das Element erstellen
      const newItems = this.faqItems.filter((_, i) => i !== index);
      this.faqItems = newItems;
      console.log('[FAQ Config] Removed FAQ item at index:', index, ', remaining:', this.faqItems.length);
    },

    onQuestionInput(index, value) {
      console.log('[FAQ Config] Question input at index:', index, 'value:', value);
      this.faqItems[index].question = value;
    },

    onAnswerInput(index, value) {
      console.log('[FAQ Config] Answer input at index:', index);
      this.faqItems[index].answer = value;
    },
  },
});

// WICHTIG: Block-Sichtbarkeit basierend auf System-Config
// Prüfe Config synchron (wenn bereits geladen) oder asynchron
const configKey = 'HeroBlocks.config.enableFaqBlock';

/**
 * @private
 */
const blockConfig = {
    name: 'hero-faq',
    label: 'sw-cms.blocks.heroBlocks.heroFaq.label',
    category: 'text',
    component: 'sw-cms-block-hero-faq',
    previewComponent: 'sw-cms-preview-hero-faq',
    configComponent: 'sw-cms-block-config-hero-faq',
    defaultConfig: {
        marginBottom: '20px',
        marginTop: '20px',
        marginLeft: '20px',
        marginRight: '20px',
        sizingMode: 'boxed',
        // FAQ-spezifische Config (wird in block.customFields gespeichert)
        faqItems: {
            source: 'static',
            value: [],
        },
    },
    slots: {
        content: {
            type: 'text',
            default: {
                config: {},
                data: {},
            },
        },
    },
    // WICHTIG: Initial als hidden=false registrieren
    // Wird dann von sw-cms-sidebar Override UND asynchroner Config-Load gesteuert
    hidden: false,
};

// Block registrieren
console.warn('[HeroBlocks] 🎉 Registering Hero FAQ Block', blockConfig);
Shopware.Service('cmsService').registerCmsBlock(blockConfig);
console.warn('[HeroBlocks] ✅ Hero FAQ Block registered successfully');

// WICHTIG: Block-Sichtbarkeit dynamisch aktualisieren wenn System-Config geladen wird
// WICHTIG: getValues erwartet Domain-String (z.B. 'HeroBlocks.config'), nicht Array von Keys
Shopware.Service('systemConfigApiService').getValues('HeroBlocks.config').then((values) => {
    if (values && values[configKey] !== undefined) {
        const enabled = values[configKey] === true;
        // Aktualisiere Block-Sichtbarkeit nach Config-Laden
        const blockRegistry = Shopware.Service('cmsService').getCmsBlockRegistry();
        if (blockRegistry['hero-faq']) {
            blockRegistry['hero-faq'].hidden = !enabled;
            console.warn('[HeroBlocks] FAQ Block visibility updated based on config:', enabled);
        }
    }
}).catch((error) => {
    // Fehler beim Laden der Config - Block bleibt SICHTBAR (default: hidden: false)
    // Nutzer kann Block verwenden, auch wenn Config nicht geladen werden kann
    console.warn('[HeroBlocks] Could not load config for FAQ block, keeping visible:', error);
});
