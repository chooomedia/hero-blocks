/**
 * Hero FAQ Block Config Component Registration
 */
import template from "./sw-cms-block-config-hero-faq.html.twig";
import "./sw-cms-block-config-hero-faq.scss";

const { Mixin } = Shopware;

const component = {
  template,

  inject: ['cmsService'],

  mixins: [
    Mixin.getByName('cms-state'),
  ],

  computed: {
    block() {
      return this.cmsPageState.currentBlock;
    },

    // WICHTIG: Computed property mit getter/setter für direkte Reaktivität
    faqItems: {
      get() {
        if (!this.block) return [];
        if (!this.block.customFields) {
          this.$set(this.block, 'customFields', {});
        }
        if (!this.block.customFields.faqItems) {
          this.$set(this.block.customFields, 'faqItems', []);
        }
        return this.block.customFields.faqItems;
      },
      set(value) {
        if (!this.block.customFields) {
          this.$set(this.block, 'customFields', {});
        }
        this.$set(this.block.customFields, 'faqItems', value);
      },
    },
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
      this.$set(this.faqItems[index], 'question', value);
    },

    onAnswerInput(index, value) {
      console.log('[FAQ Config] Answer input at index:', index);
      this.$set(this.faqItems[index], 'answer', value);
    },
  },
};

// WICHTIG: Component registrieren (wie bei anderen Hero Blocks)
Shopware.Component.register('sw-cms-block-config-hero-faq', component);

export default component;
