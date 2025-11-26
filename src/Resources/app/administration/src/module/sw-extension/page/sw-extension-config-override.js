/**
 * Override für sw-extension-config - Fügt Active License Chip im Header hinzu
 */
import overrideTemplate from "./sw-extension-config-override.html.twig";
import "./sw-extension-config-override.scss";

Shopware.Component.override("sw-extension-config", {
  template: overrideTemplate,

  inject: ["systemConfigApiService"],

  mixins: [Shopware.Mixin.getByName("notification")],

  data() {
    return {
      isSilentLicenseChecking: false,
      licenseStatus: null, // 'active' | 'expired' | null
      licenseExpiresAt: null,
      showLicenseChip: false,
    };
  },

  computed: {
    isHeroBlocksConfig() {
      return this.namespace === "HeroBlocks";
    },

    licenseChipText() {
      if (this.licenseStatus === "active") {
        return this.$tc("sw-settings-license-check.status.active");
      }
      if (this.licenseStatus === "expired") {
        return this.$tc("sw-settings-license-check.status.expired");
      }
      return "";
    },

    licenseChipColor() {
      if (this.licenseStatus === "active") {
        return "green";
      }
      if (this.licenseStatus === "expired") {
        return "red";
      }
      return "neutral";
    },

    // Prüft ob Lizenz in weniger als 2 Monaten abläuft
    shouldShowExpiryWarning() {
      if (!this.licenseExpiresAt || this.licenseStatus !== "active") {
        return false;
      }

      try {
        const expiresDate = new Date(this.licenseExpiresAt);
        const now = new Date();
        const twoMonthsFromNow = new Date();
        twoMonthsFromNow.setMonth(now.getMonth() + 2);

        return expiresDate <= twoMonthsFromNow;
      } catch (e) {
        return false;
      }
    },
  },

  watch: {
    // Watch für Config-Datenänderungen (nach Silent Check)
    "$refs.systemConfig.actualConfigData": {
      deep: true,
      handler(newVal) {
        if (this.isHeroBlocksConfig && newVal) {
          this.updateLicenseStatusFromConfig(newVal);
        }
      },
    },
  },

  mounted() {
    if (this.isHeroBlocksConfig) {
      // Silent License Check beim Öffnen der Config-Seite
      this.$nextTick(() => {
        setTimeout(() => {
          this.performSilentLicenseCheck();
        }, 500);
      });
    }
  },

  methods: {
    // Silent License Check - ohne Notification, nur Status-Update
    async performSilentLicenseCheck() {
      if (this.isSilentLicenseChecking) {
        return;
      }

      this.isSilentLicenseChecking = true;

      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          return;
        }

        const response = await httpClient.post(
          "/_action/hero-blocks/check-license",
          {},
          {
            headers: this.systemConfigApiService.getBasicHeaders(),
          }
        );

        if (response?.data?.success && response?.data?.data) {
          const result = response.data.data;

          // Update Status (wird vom sw-system-config Override gespeichert)
          // Warte kurz und lade dann Config-Daten neu
          await this.$nextTick();
          setTimeout(async () => {
            // Force reload Config Data
            if (this.$refs.systemConfig) {
              await this.$refs.systemConfig.loadCurrentSalesChannelConfig();
              await this.$nextTick();

              // Warte kurz bis Config-Daten geladen sind
              setTimeout(() => {
                this.updateLicenseStatusFromConfig(
                  this.$refs.systemConfig?.actualConfigData
                );

                // Prüfe ob Notification nötig (nur wenn weniger als 2 Monate)
                if (this.shouldShowExpiryWarning && result.expiresAt) {
                  this.showLicenseExpiryNotification(result);
                }
              }, 500);
            }
          }, 1000);
        }
      } catch (error) {
        console.warn("Silent license check failed:", error);
        // Keine Notification bei Silent Check
      } finally {
        this.isSilentLicenseChecking = false;
      }
    },

    // Update License Status aus Config-Daten
    updateLicenseStatusFromConfig(configData) {
      if (!configData || !this.isHeroBlocksConfig) {
        return;
      }

      try {
        const salesChannelId =
          this.$refs.systemConfig?.currentSalesChannelId || null;

        const status =
          configData[salesChannelId]?.["HeroBlocks.config.licenseStatus"] ||
          configData[salesChannelId]?.["licenseStatus"] ||
          null;

        const expiresAt =
          configData[salesChannelId]?.["HeroBlocks.config.licenseExpiresAt"] ||
          configData[salesChannelId]?.["licenseExpiresAt"] ||
          null;

        if (status) {
          this.licenseStatus = status;
          this.showLicenseChip = true;
        } else {
          // Wenn kein Status, versuche aus null Sales Channel zu lesen
          const nullStatus =
            configData[null]?.["HeroBlocks.config.licenseStatus"] ||
            configData[null]?.["licenseStatus"] ||
            null;

          if (nullStatus) {
            this.licenseStatus = nullStatus;
            this.showLicenseChip = true;
          }
        }

        if (expiresAt) {
          this.licenseExpiresAt = expiresAt;
        } else {
          // Wenn kein expiresAt, versuche aus null Sales Channel zu lesen
          const nullExpiresAt =
            configData[null]?.["HeroBlocks.config.licenseExpiresAt"] ||
            configData[null]?.["licenseExpiresAt"] ||
            null;

          if (nullExpiresAt) {
            this.licenseExpiresAt = nullExpiresAt;
          }
        }
      } catch (e) {
        console.warn("Failed to update license status from config:", e);
      }
    },

    // Zeige Notification nur wenn weniger als 2 Monate bis Ablauf
    showLicenseExpiryNotification(result) {
      if (!result.expiresAt) {
        return;
      }

      try {
        const expiresDate = new Date(result.expiresAt);
        const now = new Date();
        const daysRemaining = Math.ceil(
          (expiresDate - now) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining > 0 && daysRemaining <= 60) {
          // Nur wenn weniger als 60 Tage (2 Monate)
          this.createNotificationWarning({
            title: this.$tc("sw-settings-license-check.warning.expiryTitle"),
            message: this.$tc(
              "sw-settings-license-check.warning.expiryMessage",
              { days: daysRemaining }
            ),
            autoClose: false,
          });
        }
      } catch (e) {
        console.warn("Failed to show expiry notification:", e);
      }
    },

    // Click auf License Chip - öffnet Modal (delegiert an sw-system-config)
    onLicenseChipClick() {
      if (this.$refs.systemConfig) {
        // Trigger License Check Button Click (öffnet Modal mit Details)
        this.$refs.systemConfig.checkHeroBlocksLicense?.();
      }
    },
  },
});
