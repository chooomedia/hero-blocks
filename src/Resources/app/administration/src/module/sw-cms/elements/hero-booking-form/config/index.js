import template from "./sw-cms-el-config-hero-booking-form.html.twig";
import "./sw-cms-el-config-hero-booking-form.scss";

const { Mixin } = Shopware;

/**
 * Hero Booking Form Element Config Component
 * 
 * Konfiguration für das Probefahrt-/Buchungsformular Element
 * Mit Tabs für Content, Settings und Location Options
 */
export default {
  template,

  inject: ['systemConfigApiService'],

  mixins: [
    Mixin.getByName('cms-element'),
  ],

  data() {
    return {
      // Neuer Standort Input
      newLocationLabel: '',
      newLocationValue: '',
    };
  },

  computed: {
    // === CONTENT TAB ===
    title: {
      get() {
        return this.element?.config?.title?.value || '';
      },
      set(value) {
        if (this.element?.config?.title) {
          this.element.config.title.value = value;
          this.$emit('element-update', this.element);
        }
      },
    },

    confirmationText: {
      get() {
        return this.element?.config?.confirmationText?.value || '';
      },
      set(value) {
        if (this.element?.config?.confirmationText) {
          this.element.config.confirmationText.value = value;
          this.$emit('element-update', this.element);
        }
      },
    },

    // === SETTINGS TAB ===
    mailReceiver: {
      get() {
        return this.element?.config?.mailReceiver?.value || [];
      },
      set(value) {
        if (this.element?.config?.mailReceiver) {
          this.element.config.mailReceiver.value = value;
          this.$emit('element-update', this.element);
        }
      },
    },

    defaultMailReceiver: {
      get() {
        return this.element?.config?.defaultMailReceiver?.value ?? true;
      },
      set(value) {
        if (this.element?.config?.defaultMailReceiver) {
          this.element.config.defaultMailReceiver.value = value;
          this.$emit('element-update', this.element);
        }
      },
    },

    // === LOCATION OPTIONS TAB ===
    preferredLocations: {
      get() {
        return this.element?.config?.preferredLocations?.value || [];
      },
      set(value) {
        if (this.element?.config?.preferredLocations) {
          this.element.config.preferredLocations.value = value;
          this.$emit('element-update', this.element);
        }
      },
    },

    // CSS Klasse für letzten Mail-Tag
    getLastMailClass() {
      if (this.mailReceiver.length === 1) {
        return 'is--last';
      }
      return '';
    },
  },

  created() {
    this.createdComponent();
  },

  methods: {
    createdComponent() {
      this.initElementConfig('hero-booking-form');
    },

    // === MAIL RECEIVER METHODS ===
    updateMailReceiver(value) {
      this.mailReceiver = value;
    },

    // === LOCATION METHODS ===
    addLocation() {
      if (!this.newLocationLabel || !this.newLocationValue) {
        return;
      }

      const locations = [...this.preferredLocations];
      locations.push({
        label: this.newLocationLabel,
        value: this.newLocationValue.toLowerCase().replace(/\s+/g, '-'),
      });

      this.preferredLocations = locations;
      this.newLocationLabel = '';
      this.newLocationValue = '';
    },

    removeLocation(index) {
      const locations = [...this.preferredLocations];
      locations.splice(index, 1);
      this.preferredLocations = locations;
    },

    moveLocationUp(index) {
      if (index === 0) return;
      const locations = [...this.preferredLocations];
      const temp = locations[index];
      locations[index] = locations[index - 1];
      locations[index - 1] = temp;
      this.preferredLocations = locations;
    },

    moveLocationDown(index) {
      if (index >= this.preferredLocations.length - 1) return;
      const locations = [...this.preferredLocations];
      const temp = locations[index];
      locations[index] = locations[index + 1];
      locations[index + 1] = temp;
      this.preferredLocations = locations;
    },
  },
};
