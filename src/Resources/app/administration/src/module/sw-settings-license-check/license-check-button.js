/**
 * Override für sw-system-config - Fügt License Check Button hinzu
 */
import overrideTemplate from "./sw-system-config-override.html.twig";
import "./sw-system-config-override.scss";

// Debug-Modus (nur in Development - prüft ob Shopware in Dev-Mode läuft)
const DEBUG =
  typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

// Helper: Debug-Log nur in Development
const debugLog = (...args) => {
  if (DEBUG) {
    debugLog(...args);
  }
};

const debugError = (...args) => {
  if (DEBUG) {
    debugError(...args);
  }
};

const debugWarn = (...args) => {
  if (DEBUG) {
    debugWarn(...args);
  }
};

Shopware.Component.override("sw-system-config", {
  template: overrideTemplate,

  inject: ["systemConfigApiService", "repositoryFactory"],

  mixins: [Shopware.Mixin.getByName("notification")],

  data() {
    return {
      isLicenseChecking: false,
      isUpdateChecking: false,
      isUpdateDownloading: false,
      isInstagramTokenChecking: false,
      isEmailTestSending: false,
      // Feature-Validierung: Schritt-für-Schritt-Status
      featureValidation: {
        isRunning: false,
        currentFeature: null,
        currentStep: null,
        steps: [],
        results: {},
        debugInfo: {},
      },
      // Vorherige Config-Werte für Change-Detection
      previousConfig: {},
      // Modal-System für Feature-Card Settings
      showBlockSettingsModal: false,
      activeModalCard: null,
      // License Modal
      showLicenseModal: false,
      // License Check Cooldown (10 Sekunden)
      isLicenseCheckCooldown: false,
      licenseCheckCooldownSeconds: 0,
      licenseCheckCooldownTimer: null,
    };
  },

  computed: {
    /**
     * WICHTIG: Sicherer Zugriff auf Config-Daten
     * Verhindert TypeError wenn actualConfigData noch nicht geladen ist
     * HINWEIS: currentSalesChannelId kann auch null sein (globale Settings)
     */
    safeConfigData() {
      if (!this.actualConfigData) {
        return {};
      }
      // WICHTIG: currentSalesChannelId kann null sein - das ist OK für globale Settings
      const salesChannelId = this.currentSalesChannelId;
      const channelData = this.actualConfigData[salesChannelId];

      // Wenn kein Channel-spezifischer Wert, versuche null (global)
      if (!channelData && salesChannelId !== null) {
        return this.actualConfigData[null] || {};
      }

      return channelData || {};
    },

    /**
     * Prüft ob Config-Daten geladen sind
     * HINWEIS: currentSalesChannelId kann auch null sein (globale Settings)
     */
    isConfigLoaded() {
      if (!this.actualConfigData) {
        return false;
      }
      // currentSalesChannelId kann null sein - das ist OK
      const salesChannelId = this.currentSalesChannelId;
      const hasChannelData = Boolean(this.actualConfigData[salesChannelId]);
      const hasGlobalData = Boolean(this.actualConfigData[null]);

      return hasChannelData || hasGlobalData;
    },

    licenseStatusClass() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return "";
      const status =
        this.safeConfigData["HeroBlocks.config.licenseStatus"] ||
        this.safeConfigData["licenseStatus"];
      return status === "active"
        ? "is--license-active"
        : status === "expired"
        ? "is--license-expired"
        : "";
    },

    /**
     * WICHTIG: Prüft ob wir in DEV-Umgebung sind
     * DEV-only Features (Test-E-Mail-Button) werden nur in DEV angezeigt
     */
    isDevelopmentMode() {
      // Shopware Context hat keinen direkten APP_ENV Access
      // Wir prüfen stattdessen: window.location.hostname === 'localhost' ODER debug=true Parameter
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const hasDebugParam = window.location.href.includes("debug=true");

      return isLocalhost || hasDebugParam;
    },

    /**
     * WICHTIG: Prüft ob License abgelaufen ist
     * Wenn expired → Update Check Button deaktivieren
     */
    isLicenseExpired() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return false;
      const status =
        this.safeConfigData["HeroBlocks.config.licenseStatus"] ||
        this.safeConfigData["licenseStatus"];
      return status === "expired";
    },

    /**
     * Gibt das Lizenz-Ablaufdatum zurück
     */
    licenseExpiresAt() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return null;
      return (
        this.safeConfigData["HeroBlocks.config.licenseExpiresAt"] ||
        this.safeConfigData["licenseExpiresAt"] ||
        null
      );
    },

    /**
     * Berechnet verbleibende Tage bis Lizenzablauf
     */
    licenseDaysRemaining() {
      if (!this.licenseExpiresAt) return null;
      try {
        const expiresDate = new Date(this.licenseExpiresAt);
        const now = new Date();
        const diffTime = expiresDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      } catch (e) {
        return null;
      }
    },

    /**
     * Release Notes aus Update Check Response
     * Wird angezeigt wenn License expired ist
     */
    releaseNotes() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return null;
      return this.safeConfigData["HeroBlocks.config.updateChangelog"] || null;
    },

    /**
     * Prüft ob Block aktiv ist (nicht disabled)
     */
    hasActiveBlocks() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return false;
      return (
        this.safeConfigData["HeroBlocks.config.enableHeroBlockSlider"] ===
          true ||
        this.safeConfigData["HeroBlocks.config.enableHeroTwoColumns"] ===
          true ||
        this.safeConfigData["HeroBlocks.config.enableMegaMenu"] === true
      );
    },

    /**
     * Prüft ob inaktive Blocks vorhanden sind (Coming Soon - disabled)
     */
    hasInactiveBlocks() {
      if (!this.isHeroBlocksConfig()) return false;
      // HeroVideoExtended, HeroInstagramFeed, ShoppingExperience sind immer disabled
      return true;
    },

    /**
     * Prüft ob Mega Menu aktiviert ist
     * WICHTIG: Für Collapsible Card "Header Mega Menu Settings" (nur wenn aktiv)
     */
    isMegaMenuEnabled() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return false;
      return (
        this.safeConfigData["HeroBlocks.config.enableMegaMenu"] === true ||
        this.safeConfigData["enableMegaMenu"] === true
      );
    },

    /**
     * Prüft ob Instagram Feed aktiviert ist
     * WICHTIG: Für Collapsible Card "Instagram Feed Settings" (nur wenn aktiv)
     */
    isInstagramFeedEnabled() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return false;
      return (
        this.safeConfigData["HeroBlocks.config.enableHeroInstagramFeed"] ===
          true || this.safeConfigData["enableHeroInstagramFeed"] === true
      );
    },

    /**
     * Prüft ob FAQ Block aktiviert ist
     * WICHTIG: Für Collapsible Card "FAQ Block Settings" (nur wenn aktiv)
     */
    isFaqBlockEnabled() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return false;
      return (
        this.safeConfigData["HeroBlocks.config.enableFaqBlock"] === true ||
        this.safeConfigData["enableFaqBlock"] === true
      );
    },

    /**
     * Prüft ob Update verfügbar ist
     */
    updateAvailable() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return false;
      return (
        this.safeConfigData["HeroBlocks.config.updateAvailable"] === true ||
        this.safeConfigData["updateAvailable"] === true
      );
    },

    /**
     * Gibt downloadUrl zurück (falls vorhanden)
     */
    updateDownloadUrl() {
      if (!this.isHeroBlocksConfig() || !this.isConfigLoaded) return null;
      return (
        this.safeConfigData["HeroBlocks.config.updateDownloadUrl"] ||
        this.safeConfigData["updateDownloadUrl"] ||
        null
      );
    },

    /**
     * Gibt alle Feature-Cards als Array zurück für v-for Rendering
     * Jede Card hat: key, title, descriptionKey, icon, isComingSoon, isInDevelopment, hasSettings, settingsCardIndex
     * Icons: Shopware Meteor Icon Kit (regular-* und solid-*)
     *
     * config.xml Card-Indizes:
     * - Index 0: Block-Einstellungen (hidden - contains toggles)
     * - Index 1: Header + Mega Menu Einstellungen
     * - Index 2: FAQ Block Einstellungen
     * - Index 3: Timeline Block Einstellungen
     * - Index 4: Update-Informationen
     * - Index 5: Lizenz-Informationen
     * - Index 6: Instagram Feed Einstellungen
     * - Index 7: Produktdetail Einstellungen
     */
    featureCards() {
      return [
        {
          key: "enableHeroBlockSlider",
          title: "Hero Slider",
          descriptionKey: "heroSliderShort",
          icon: "regular-image",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: false,
          settingsCardIndex: null,
        },
        {
          key: "enableHeroTwoColumns",
          title: "Two Columns",
          descriptionKey: "heroTwoColumnsShort",
          icon: "regular-line-column",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: false,
          settingsCardIndex: null,
        },
        {
          key: "enableMegaMenu",
          title: "Mega Menu",
          descriptionKey: "megaMenuShort",
          icon: "regular-bars",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: true,
          settingsCardIndex: 1, // Card 1: Header + Mega Menu Einstellungen
        },
        {
          key: "enableCategorySlider",
          title: "Category Slider",
          descriptionKey: "categorySliderShort",
          icon: "regular-layer-group",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: false,
          settingsCardIndex: null,
        },
        {
          key: "enableFaqBlock",
          title: "FAQ Block",
          descriptionKey: "faqBlockShort",
          icon: "regular-question-circle",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: true,
          settingsCardIndex: 2, // Card 2: FAQ Block Einstellungen
        },
        {
          key: "enableHeroImageOverlay",
          title: "Image Overlay",
          descriptionKey: "imageOverlayShort",
          icon: "regular-image",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: false,
          settingsCardIndex: null,
        },
        {
          key: "enableHeroBookingForm",
          title: "Booking Form",
          descriptionKey: "bookingFormShort",
          icon: "regular-calendar",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: false,
          settingsCardIndex: null,
        },
        {
          key: "enableHeroTimeline",
          title: "Timeline",
          descriptionKey: "timelineShort",
          icon: "regular-clock",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: true,
          settingsCardIndex: 3, // Card 3: Timeline Block Einstellungen
        },
        {
          key: "enableHeroVideoExtended",
          title: "Video Extended",
          descriptionKey: "heroVideoExtendedShort",
          icon: "regular-video",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: false,
          settingsCardIndex: null,
        },
        {
          key: "enableHeroInstagramFeed",
          title: "Instagram Feed",
          descriptionKey: "heroInstagramFeedShort",
          icon: "regular-camera",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: true,
          settingsCardIndex: 6, // Card 6: Instagram Feed Einstellungen
        },
        {
          key: "enableShoppingExperience",
          title: "Product Detail",
          descriptionKey: "shoppingExperienceShort",
          icon: "regular-products",
          isComingSoon: false,
          isInDevelopment: false,
          hasSettings: true,
          settingsCardIndex: 7, // Card 7: Produktdetail Einstellungen
        },
      ];
    },

    /**
     * Gibt die aktiven Settings für eine Feature-Card zurück (für Modal)
     */
    activeModalSettings() {
      if (!this.activeModalCard) return null;
      return this.getSettingsForCard(this.activeModalCard);
    },
  },

  watch: {
    /**
     * Watch auf Config-Änderungen - Startet automatische Feature-Validierung
     */
    actualConfigData: {
      handler(newConfig, oldConfig) {
        if (!this.isHeroBlocksConfig()) return;

        // Prüfe auf Feature-Aktivierungen
        this.checkFeatureActivations(newConfig, oldConfig);
      },
      deep: true,
      immediate: false,
    },
  },

  // WICHTIG: Kein Auto-Check mehr hier - wird von sw-extension-config Override übernommen (Silent Check)
  // mounted() entfernt - Silent Check wird von sw-extension-config Override gemacht
  // created() entfernt - Language Switcher wird immer angezeigt (kein Toggle mehr)

  methods: {
    collapseItem() {
      // Toggle collapse state for license card
      // This is handled by sw-collapse component
    },

    isHeroBlocksConfig() {
      // Nur in Extension Config-Seite anzeigen, nicht im CMS
      if (this.domain !== "HeroBlocks.config") {
        return false;
      }

      // Prüfe Route-Name oder Path - Mehrere Möglichkeiten für Robustheit
      try {
        const route = this.$route || this.$router?.currentRoute?.value;
        if (route) {
          const routeName = route.name || route.meta?.name;
          const routePath = route.path || route.fullPath;

          // Prüfe auch window.location für Fallback
          const hash = window.location.hash || "";
          const pathname = window.location.pathname || "";

          const isExtensionConfig =
            routeName === "sw.extension.config" ||
            routePath?.includes("/sw/extension/config") ||
            routePath?.includes("extension/config") ||
            hash.includes("/sw/extension/config") ||
            hash.includes("#/sw/extension/config") ||
            pathname.includes("/sw/extension/config");

          return isExtensionConfig;
        }
      } catch (e) {
        // Fallback: Prüfe nur Hash
        return (
          window.location.hash?.includes("/sw/extension/config") ||
          window.location.hash?.includes("extension/config")
        );
      }

      return false;
    },

    async checkHeroBlocksLicense() {
      console.log(
        "[HeroBlocks] 🔵 BUTTON CLICKED - checkHeroBlocksLicense() called"
      );

      // WICHTIG: Keine API-Anfrage wenn Lizenz bereits abgelaufen ist
      if (this.isLicenseExpired) {
        console.log("[HeroBlocks] ⚠️ License already expired - skipping check");
        this.createNotificationError({
          title: this.$tc(
            "sw-settings-license-check.button.licenseExpiredTitle"
          ),
          message: this.$tc(
            "sw-settings-license-check.button.licenseExpiredMessage"
          ),
        });
        return;
      }

      this.isLicenseChecking = true;
      console.log("[HeroBlocks] 🔄 isLicenseChecking = true");

      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          throw new Error("HTTP Client nicht verfügbar");
        }

        // DEBUG: Hole Webhook-URL Debug-Info VOR dem eigentlichen Check
        let debugInfo = null;
        try {
          const debugResponse = await httpClient.get(
            "/_action/hero-blocks/debug-webhook",
            {
              headers: this.systemConfigApiService.getBasicHeaders(),
            }
          );
          if (debugResponse.data?.success && debugResponse.data?.debug) {
            debugInfo = debugResponse.data.debug;
            console.log("[HeroBlocks] 🔍 Webhook Debug Info:", debugInfo);
          }
        } catch (debugErr) {
          console.warn("[HeroBlocks] ⚠️ Could not fetch debug info:", debugErr);
        }

        // Webhook URL wird vom Backend aus Environment Variable gelesen
        // Kein Eingabefeld mehr - URL wird Server-seitig aus $_ENV gelesen

        console.log(
          "[HeroBlocks] 🚀 Starting MANUAL license check with forceRefresh = true..."
        );
        const startTime = Date.now();

        // Rufe API auf - verwendet Webhook (forceRefresh = true für manuelle Checks)
        let response;
        try {
          console.log(
            "[HeroBlocks] 📡 Calling API POST /_action/hero-blocks/check-license with body:",
            { forceRefresh: true }
          );

          response = await httpClient.post(
            "/_action/hero-blocks/check-license",
            { forceRefresh: true }, // <- WICHTIG: Force-Refresh für manuellen Button-Click!
            {
              headers: this.systemConfigApiService.getBasicHeaders(),
            }
          );

          const duration = Date.now() - startTime;
          console.log(
            `[HeroBlocks] ✅ MANUAL CHECK - API call completed in ${duration}ms`,
            response.data
          );
        } catch (httpError) {
          const duration = Date.now() - startTime;
          debugError("❌ License check HTTP error:", {
            error: httpError,
            message: httpError.message,
            response: httpError.response?.data,
            status: httpError.response?.status,
            durationMs: duration,
          });

          // HTTP Error (z.B. Timeout, Network Error)
          throw new Error(
            httpError.response?.data?.errors?.[0]?.detail ||
              httpError.message ||
              "Network error during license check"
          );
        }

        // Shopware's HTTP Client gibt bereits geparste JSON Response zurück
        // response.data ist bereits ein Objekt, kein JSON-String
        if (!response || !response.data) {
          debugError("❌ Empty response from license check API", response);
          throw new Error("Empty response from license check API");
        }

        debugLog("📦 Response data:", response.data);

        // Prüfe ob Response-Format korrekt ist
        if (response.data.success === true && response.data.data) {
          const result = response.data.data;

          debugLog("✅ License check successful:", {
            valid: result.valid,
            expiresAt: result.expiresAt,
            daysRemaining: result.daysRemaining,
            debug: response.data.debug,
            webhookDebug: debugInfo,
          });

          // Force reload Config Data - lösche Cache für currentSalesChannelId
          if (
            this.actualConfigData &&
            this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
          ) {
            delete this.actualConfigData[this.currentSalesChannelId];
          }

          // Laden Daten neu
          await this.loadCurrentSalesChannelConfig();
          await this.$nextTick();

          // Unterschiedliche Notifications für valid/invalid
          // WICHTIG: Notification nur wenn manuell geklickt (nicht bei Silent Check)
          // Silent Check wird von sw-extension-config Override gemacht
          if (result.valid === true) {
            this.createNotificationSuccess({
              title: this.$tc("sw-settings-license-check.success.title"),
              message: this.$tc(
                "sw-settings-license-check.success.validMessage"
              ),
            });

            // Prüfe ob Notification nötig (nur wenn weniger als 2 Monate bis Ablauf)
            if (result.expiresAt) {
              try {
                const expiresDate = new Date(result.expiresAt);
                const now = new Date();
                const twoMonthsFromNow = new Date();
                twoMonthsFromNow.setMonth(now.getMonth() + 2);
                const daysRemaining = Math.ceil(
                  (expiresDate - now) / (1000 * 60 * 60 * 24)
                );

                // Zeige Warnung nur wenn weniger als 60 Tage (2 Monate) und nicht bereits abgelaufen
                if (
                  expiresDate <= twoMonthsFromNow &&
                  daysRemaining > 0 &&
                  daysRemaining <= 60
                ) {
                  this.createNotificationWarning({
                    title: this.$tc(
                      "sw-settings-license-check.warning.expiryTitle"
                    ),
                    message: this.$tc(
                      "sw-settings-license-check.warning.expiryMessage",
                      { days: daysRemaining }
                    ),
                    autoClose: false,
                  });
                }
              } catch (e) {
                debugWarn("Failed to check expiry warning:", e);
              }
            }
          } else {
            this.createNotificationError({
              title: this.$tc("sw-settings-license-check.error.checkTitle"),
              message: this.$tc(
                "sw-settings-license-check.success.invalidMessage"
              ),
            });
          }

          // Nach 1 Sekunde nochmal laden um sicherzustellen
          // WICHTIG: requestIdleCallback für bessere Performance (verhindert setTimeout Violations)
          if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(
              () => {
                if (
                  this.actualConfigData &&
                  this.actualConfigData.hasOwnProperty(
                    this.currentSalesChannelId
                  )
                ) {
                  delete this.actualConfigData[this.currentSalesChannelId];
                  this.loadCurrentSalesChannelConfig();
                }
              },
              { timeout: 1000 }
            );
          } else {
            // Fallback: setTimeout mit minimalem Delay
            setTimeout(() => {
              if (
                this.actualConfigData &&
                this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
              ) {
                delete this.actualConfigData[this.currentSalesChannelId];
                this.loadCurrentSalesChannelConfig();
              }
            }, 500);
          }
        } else {
          debugError(
            "❌ License check failed - invalid response format:",
            response.data
          );
          const errorMessage =
            response.data.errors?.[0]?.detail || "Unknown error";

          // Zeige erweiterte Debug-Info in Console
          debugError("Error Details:", {
            response: response.data,
            errors: response.data.errors,
            debug: response.data.debug,
          });

          throw new Error(errorMessage);
        }
      } catch (error) {
        debugError("❌ License check error (final catch):", {
          error: error,
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
        });

        // Zeige User-freundliche Fehlermeldung
        let errorMessage = this.$tc(
          "sw-settings-license-check.error.checkMessage"
        );
        if (error.response?.data?.errors?.[0]?.detail) {
          errorMessage = error.response.data.errors[0].detail;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.createNotificationError({
          title: this.$tc("sw-settings-license-check.error.checkTitle"),
          message: errorMessage,
        });

        // DEBUG: Zeige auch erweiterte Info in Console für Entwickler
        if (error.response?.data?.debug) {
          debugWarn("🐛 Debug Info:", error.response.data.debug);
        }
      } finally {
        this.isLicenseChecking = false;
        // Starte Cooldown nach License Check (10 Sekunden)
        this.startLicenseCheckCooldown();
      }
    },

    /**
     * Prüft ob ein Block aktiv ist (nicht disabled)
     */
    isActiveBlock(blockName) {
      if (!this.isHeroBlocksConfig()) return false;
      // Aktive Blocks: enableHeroBlockSlider, enableHeroTwoColumns, enableMegaMenu, enableCategorySlider
      const activeBlocks = [
        "HeroBlocks.config.enableHeroBlockSlider",
        "HeroBlocks.config.enableHeroTwoColumns",
        "HeroBlocks.config.enableMegaMenu",
        "HeroBlocks.config.enableCategorySlider",
      ];
      return activeBlocks.includes(blockName);
    },

    /**
     * Prüft ob ein spezifischer Block aktiviert ist (aus Config)
     * Verwendet für reaktive Feature-Cards
     * @param {string} configKey - Der Config-Key ohne Prefix (z.B. "enableHeroBlockSlider")
     * @returns {boolean} - true wenn Block aktiviert ist
     */
    isBlockEnabled(configKey) {
      if (!this.isHeroBlocksConfig()) {
        return false;
      }

      // WICHTIG: Wenn Config noch nicht geladen ist, verwende Default-Werte
      // (Hero Slider und Hero Two Columns haben defaultValue: true in config.xml)
      if (!this.isConfigLoaded) {
        // Default-Werte für Blöcke (aus config.xml)
        const defaultEnabledBlocks = [
          "enableHeroBlockSlider",
          "enableHeroTwoColumns",
          "enableMegaMenu",
        ];
        return defaultEnabledBlocks.includes(configKey);
      }

      // Prüfe beide Varianten: mit und ohne Prefix
      const fullKey = `HeroBlocks.config.${configKey}`;
      const fullValue = this.safeConfigData[fullKey];
      const shortValue = this.safeConfigData[configKey];

      // WICHTIG: Shopware Config kann auch String "true" sein oder undefined
      // Bei undefined → Wert wurde nie gesetzt, nutze Default (für enableHeroBlockSlider etc: true)
      if (fullValue === undefined && shortValue === undefined) {
        // Diese Blöcke sind standardmäßig aktiviert (defaultValue: true in config.xml)
        const defaultEnabledBlocks = [
          "enableHeroBlockSlider",
          "enableHeroTwoColumns",
          "enableMegaMenu",
        ];
        return defaultEnabledBlocks.includes(configKey);
      }

      // Expliziter Wert vorhanden
      return (
        fullValue === true ||
        fullValue === "true" ||
        shortValue === true ||
        shortValue === "true"
      );
    },

    /**
     * Toggle Block Status (Aktiviert/Deaktiviert einen Block)
     * Wird aufgerufen wenn User auf Feature-Card klickt
     * @param {string} configKey - Der Config-Key ohne Prefix (z.B. "enableHeroBlockSlider")
     */
    async toggleBlock(configKey) {
      if (!this.isHeroBlocksConfig()) return;

      const fullKey = `HeroBlocks.config.${configKey}`;
      const config = this.actualConfigData?.[this.currentSalesChannelId] || {};
      const currentValue = config[fullKey] === true;

      // Toggle Wert
      const newValue = !currentValue;

      console.log(`[HeroBlocks] 🔄 Toggle Block: ${configKey} → ${newValue}`);

      // Setze neuen Wert (Vue 3 reaktiv)
      if (!this.actualConfigData[this.currentSalesChannelId]) {
        this.actualConfigData[this.currentSalesChannelId] = {};
      }
      this.actualConfigData[this.currentSalesChannelId][fullKey] = newValue;

      // Zeige Notification
      if (newValue) {
        this.createNotificationSuccess({
          title: this.$tc("sw-settings-license-check.blockToggle.enabledTitle"),
          message: this.$tc(
            "sw-settings-license-check.blockToggle.enabledMessage",
            { block: configKey }
          ),
          duration: 3000,
        });
      } else {
        this.createNotificationInfo({
          title: this.$tc(
            "sw-settings-license-check.blockToggle.disabledTitle"
          ),
          message: this.$tc(
            "sw-settings-license-check.blockToggle.disabledMessage",
            { block: configKey }
          ),
          duration: 3000,
        });
      }

      // WICHTIG: Trigger Speichern nicht automatisch - User muss explizit speichern
      // Markiere Config als geändert (wird vom Parent-Component gehandhabt)
    },

    /**
     * Gibt die CSS-Klasse für eine Feature-Card zurück
     * Basierend auf: isEnabled, isComingSoon, isInDevelopment
     */
    getFeatureCardClass(card) {
      if (card.isInDevelopment) {
        return "hero-blocks-feature-card--development";
      }
      if (card.isComingSoon) {
        return "hero-blocks-feature-card--inactive";
      }
      // Prüfe ob Block aktiviert ist
      return this.isBlockEnabled(card.key)
        ? "hero-blocks-feature-card--active"
        : "hero-blocks-feature-card--inactive";
    },

    /**
     * Gibt das Badge-Label für eine Feature-Card zurück
     */
    getFeatureCardBadge(card) {
      if (card.isInDevelopment) {
        return this.$tc(
          "sw-settings-license-check.featureStatus.inDevelopment"
        );
      }
      if (card.isComingSoon) {
        return this.$tc("sw-settings-license-check.featureStatus.comingSoon");
      }
      return this.isBlockEnabled(card.key)
        ? this.$tc("sw-settings-license-check.featureStatus.active")
        : this.$tc("sw-settings-license-check.featureStatus.inactive");
    },

    /**
     * Gibt die Badge-CSS-Klasse für eine Feature-Card zurück
     */
    getFeatureCardBadgeClass(card) {
      if (card.isInDevelopment) {
        return "hero-blocks-feature-card__badge--development";
      }
      if (card.isComingSoon) {
        return "hero-blocks-feature-card__badge--inactive";
      }
      return this.isBlockEnabled(card.key)
        ? "hero-blocks-feature-card__badge--active"
        : "hero-blocks-feature-card__badge--inactive";
    },

    /**
     * Prüft ob eine Feature-Card klickbar ist
     * Coming Soon und In Development sind nicht klickbar
     */
    isFeatureCardClickable(card) {
      return !card.isComingSoon && !card.isInDevelopment;
    },

    /**
     * Handler für Feature-Card Click
     * Toggled den Block wenn klickbar
     */
    onFeatureCardClick(card) {
      if (!this.isFeatureCardClickable(card)) {
        // Zeige Info-Notification für Coming Soon/In Development
        if (card.isComingSoon) {
          this.createNotificationInfo({
            title: this.$tc(
              "sw-settings-license-check.blockToggle.comingSoonTitle"
            ),
            message: this.$tc(
              "sw-settings-license-check.blockToggle.comingSoonMessage",
              { block: card.title }
            ),
            duration: 3000,
          });
        } else if (card.isInDevelopment) {
          this.createNotificationInfo({
            title: this.$tc(
              "sw-settings-license-check.blockToggle.inDevelopmentTitle"
            ),
            message: this.$tc(
              "sw-settings-license-check.blockToggle.inDevelopmentMessage",
              { block: card.title }
            ),
            duration: 3000,
          });
        }
        return;
      }
      this.toggleBlock(card.key);
    },

    /**
     * Öffnet das Settings-Modal für eine Feature-Card
     * @param {Object} card - Die Feature-Card
     * @param {Event} event - Das Click-Event (zum Stoppen der Propagation)
     */
    openBlockSettingsModal(card, event) {
      if (event) {
        event.stopPropagation();
      }

      if (!card.hasSettings) {
        this.createNotificationInfo({
          title: this.$tc("sw-settings-license-check.modal.noSettingsTitle"),
          message: this.$tc(
            "sw-settings-license-check.modal.noSettingsMessage",
            { block: card.title }
          ),
          duration: 3000,
        });
        return;
      }

      this.activeModalCard = card;
      this.showBlockSettingsModal = true;

      console.log(
        `[HeroBlocks] 🔧 Opening settings modal for: ${card.title}`,
        card
      );
    },

    /**
     * Schließt das Block-Settings-Modal
     */
    closeBlockSettingsModal() {
      this.showBlockSettingsModal = false;
      this.activeModalCard = null;
    },

    /**
     * Öffnet das License-Modal
     * Wird aufgerufen wenn auf License Badge geklickt wird
     */
    openLicenseModal() {
      this.showLicenseModal = true;
      console.log("[HeroBlocks] 🔑 Opening license modal");
    },

    /**
     * Schließt das License-Modal
     */
    closeLicenseModal() {
      this.showLicenseModal = false;
    },

    /**
     * Formatiert das Lizenz-Ablaufdatum für Anzeige
     */
    formatLicenseDate(dateString) {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString(this.$i18n?.locale || "de-DE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (e) {
        return dateString;
      }
    },

    /**
     * Startet den License Check Cooldown (10 Sekunden)
     */
    startLicenseCheckCooldown() {
      this.isLicenseCheckCooldown = true;
      this.licenseCheckCooldownSeconds = 10;

      // Clear existing timer
      if (this.licenseCheckCooldownTimer) {
        clearInterval(this.licenseCheckCooldownTimer);
      }

      this.licenseCheckCooldownTimer = setInterval(() => {
        this.licenseCheckCooldownSeconds--;
        if (this.licenseCheckCooldownSeconds <= 0) {
          this.isLicenseCheckCooldown = false;
          clearInterval(this.licenseCheckCooldownTimer);
          this.licenseCheckCooldownTimer = null;
        }
      }, 1000);
    },

    /**
     * Gibt die Settings-Elemente für eine bestimmte Card zurück
     * Basierend auf config.xml Card-Index
     */
    getSettingsForCard(card) {
      if (!card || !card.hasSettings || card.settingsCardIndex === null) {
        return [];
      }

      // Hole die config-Card basierend auf dem Index
      const configCard = this.config?.[card.settingsCardIndex];
      if (!configCard || !configCard.elements) {
        return [];
      }

      return configCard.elements;
    },

    /**
     * Prüft ob eine Feature-Card Settings hat
     */
    cardHasSettings(card) {
      return card && card.hasSettings === true;
    },

    /**
     * GitHub API Version-Check (direkter API-Aufruf)
     * Fallback/Alternative zum n8n Webhook
     */
    async checkGitHubVersion() {
      try {
        console.log("[HeroBlocks] 🚀 Starting GitHub API version check...");
        const startTime = Date.now();

        const response = await fetch(
          "https://api.github.com/repos/chooomedia/hero-blocks/releases/latest",
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Shopware-HeroBlocks-Plugin/1.0.0",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const release = await response.json();
        const duration = Date.now() - startTime;

        console.log(
          `[HeroBlocks] ✅ GitHub API check completed in ${duration}ms`,
          release
        );

        // Extrahiere Version und Download-URL
        const latestVersion = release.tag_name
          ? release.tag_name.replace(/^v/, "")
          : null;
        const downloadUrl =
          release.assets && release.assets.length > 0
            ? release.assets.find(
                (a) => a.name.endsWith(".zip") && a.name.includes("hero-blocks")
              )?.browser_download_url || null
            : null;

        return {
          success: true,
          latestVersion,
          downloadUrl,
          releaseNotes: release.body || null,
          publishedAt: release.published_at || null,
          htmlUrl: release.html_url || null,
        };
      } catch (error) {
        console.error(
          "[HeroBlocks] ❌ GitHub API version check failed:",
          error
        );
        return {
          success: false,
          error: error.message,
        };
      }
    },

    // Update Check - analog zu License Check
    async checkHeroBlocksUpdates() {
      this.isUpdateChecking = true;

      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          throw new Error("HTTP Client nicht verfügbar");
        }

        debugLog("🚀 Starting update check...");
        const startTime = Date.now();

        // Rufe Update Check API auf
        let response;
        try {
          debugLog("📡 Calling update check API...");
          response = await httpClient.get("/_action/hero-blocks/update-check", {
            headers: this.systemConfigApiService.getBasicHeaders(),
          });

          const duration = Date.now() - startTime;
          debugLog(`✅ API call completed in ${duration}ms`, response.data);
        } catch (httpError) {
          const duration = Date.now() - startTime;
          debugError("❌ Update check HTTP error:", {
            error: httpError,
            message: httpError.message,
            response: httpError.response?.data,
            status: httpError.response?.status,
            durationMs: duration,
          });

          throw new Error(
            httpError.response?.data?.errors?.[0]?.detail ||
              httpError.response?.data?.error ||
              httpError.message ||
              "Network error during update check"
          );
        }

        if (!response || !response.data) {
          debugError("❌ Empty response from update check API", response);
          throw new Error("Empty response from update check API");
        }

        debugLog("📦 Response data:", response.data);

        // Prüfe ob Response-Format korrekt ist
        if (response.data.success === true && response.data.data) {
          const result = response.data.data;

          debugLog("✅ Update check successful:", {
            available: result.available,
            currentVersion: result.currentVersion,
            latestVersion: result.latestVersion,
            downloadUrl: result.downloadUrl,
            changelog: result.changelog,
            licenseExpired: result.licenseExpired,
          });

          // WICHTIG: Zeige Warnung wenn License expired
          if (result.licenseExpired === true) {
            this.createNotificationError({
              title: this.$tc(
                "sw-settings-license-check.update.licenseExpired"
              ),
              message:
                result.licenseExpiredMessage ||
                this.$tc(
                  "sw-settings-license-check.update.licenseExpiredMessage"
                ),
              autoClose: false,
            });

            // Reload Config Data um Status zu aktualisieren
            if (
              this.actualConfigData &&
              this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
            ) {
              delete this.actualConfigData[this.currentSalesChannelId];
            }
            await this.loadCurrentSalesChannelConfig();
            return;
          }

          // Force reload Config Data - lösche Cache für currentSalesChannelId
          if (
            this.actualConfigData &&
            this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
          ) {
            delete this.actualConfigData[this.currentSalesChannelId];
          }

          // Laden Daten neu
          await this.loadCurrentSalesChannelConfig();
          await this.$nextTick();

          // Unterschiedliche Notifications für available/not available
          if (result.available === true) {
            this.createNotificationSuccess({
              title: this.$tc(
                "sw-settings-license-check.update.updateAvailable"
              ),
              message: this.$tc(
                "sw-settings-license-check.update.updateAvailableMessage",
                {
                  currentVersion: result.currentVersion,
                  latestVersion: result.latestVersion,
                }
              ),
              autoClose: false,
            });

            // Zeige Changelog als Info (falls vorhanden)
            if (result.changelog) {
              this.createNotificationInfo({
                title: this.$tc("sw-settings-license-check.update.changelog"),
                message:
                  result.changelog.substring(0, 200) +
                  (result.changelog.length > 200 ? "..." : ""),
                autoClose: true,
                duration: 10000,
              });
            }
          } else {
            this.createNotificationInfo({
              title: this.$tc(
                "sw-settings-license-check.update.noUpdateAvailable"
              ),
              message: this.$tc(
                "sw-settings-license-check.update.noUpdateAvailableMessage",
                {
                  currentVersion: result.currentVersion || result.latestVersion,
                }
              ),
            });
          }

          // Nach 1 Sekunde nochmal laden um sicherzustellen
          // WICHTIG: requestIdleCallback für bessere Performance (verhindert setTimeout Violations)
          if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(
              () => {
                if (
                  this.actualConfigData &&
                  this.actualConfigData.hasOwnProperty(
                    this.currentSalesChannelId
                  )
                ) {
                  delete this.actualConfigData[this.currentSalesChannelId];
                  this.loadCurrentSalesChannelConfig();
                }
              },
              { timeout: 1000 }
            );
          } else {
            // Fallback: setTimeout mit minimalem Delay
            setTimeout(() => {
              if (
                this.actualConfigData &&
                this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
              ) {
                delete this.actualConfigData[this.currentSalesChannelId];
                this.loadCurrentSalesChannelConfig();
              }
            }, 500);
          }
        } else {
          debugError(
            "❌ Update check failed - invalid response format:",
            response.data
          );
          const errorMessage =
            response.data.errors?.[0]?.detail ||
            response.data.error ||
            "Unknown error";

          debugError("Error Details:", {
            response: response.data,
            errors: response.data.errors,
          });

          throw new Error(errorMessage);
        }
      } catch (error) {
        debugError("❌ Update check error (final catch):", {
          error: error,
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
        });

        // Zeige User-freundliche Fehlermeldung
        let errorMessage = this.$tc(
          "sw-settings-license-check.update.checkFailed"
        );
        if (error.response?.data?.errors?.[0]?.detail) {
          errorMessage = error.response.data.errors[0].detail;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.createNotificationError({
          title: this.$tc("sw-settings-license-check.update.checkFailed"),
          message: errorMessage,
        });
      } finally {
        this.isUpdateChecking = false;
      }
    },

    // Download Update - analog zu Update Check
    async downloadHeroBlocksUpdate() {
      this.isUpdateDownloading = true;

      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          throw new Error("HTTP Client nicht verfügbar");
        }

        debugLog("🚀 Starting update download...");
        const startTime = Date.now();

        // Rufe Update Download API auf
        let response;
        try {
          debugLog("📡 Calling update download API...");
          response = await httpClient.post(
            "/_action/hero-blocks/update-download",
            {},
            {
              headers: this.systemConfigApiService.getBasicHeaders(),
            }
          );

          const duration = Date.now() - startTime;
          debugLog(`✅ API call completed in ${duration}ms`, response.data);
        } catch (httpError) {
          const duration = Date.now() - startTime;
          debugError("❌ Update download HTTP error:", {
            error: httpError,
            message: httpError.message,
            response: httpError.response?.data,
            status: httpError.response?.status,
            durationMs: duration,
          });

          // User-freundliche Fehlermeldung
          let errorMessage = "Network error during update download";
          if (httpError.response?.data?.error) {
            errorMessage = httpError.response.data.error;
          } else if (httpError.response?.data?.errors?.[0]?.detail) {
            errorMessage = httpError.response.data.errors[0].detail;
          } else if (httpError.message) {
            errorMessage = httpError.message;
          }

          throw new Error(errorMessage);
        }

        if (!response || !response.data) {
          debugError("❌ Empty response from update download API", response);
          throw new Error("Empty response from update download API");
        }

        debugLog("📦 Response data:", response.data);

        // Prüfe ob Response-Format korrekt ist
        if (response.data.success === true) {
          debugLog("✅ Update download successful");

          // Zeige Success Notification
          this.createNotificationSuccess({
            title: this.$tc("sw-settings-license-check.update.downloadSuccess"),
            message: this.$tc(
              "sw-settings-license-check.update.downloadSuccessMessage"
            ),
            autoClose: false,
          });

          // WICHTIG: Reload Config Data um Status zu aktualisieren
          if (
            this.actualConfigData &&
            this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
          ) {
            delete this.actualConfigData[this.currentSalesChannelId];
          }

          // Laden Daten neu
          await this.loadCurrentSalesChannelConfig();
          await this.$nextTick();

          // Nach 1 Sekunde nochmal laden um sicherzustellen
          // WICHTIG: requestIdleCallback für bessere Performance (verhindert setTimeout Violations)
          if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(
              () => {
                if (
                  this.actualConfigData &&
                  this.actualConfigData.hasOwnProperty(
                    this.currentSalesChannelId
                  )
                ) {
                  delete this.actualConfigData[this.currentSalesChannelId];
                  this.loadCurrentSalesChannelConfig();
                }
              },
              { timeout: 1000 }
            );
          } else {
            // Fallback: setTimeout mit minimalem Delay
            setTimeout(() => {
              if (
                this.actualConfigData &&
                this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
              ) {
                delete this.actualConfigData[this.currentSalesChannelId];
                this.loadCurrentSalesChannelConfig();
              }
            }, 500);
          }
        } else {
          debugError(
            "❌ Update download failed - invalid response format:",
            response.data
          );
          const errorMessage =
            response.data.errors?.[0]?.detail ||
            response.data.error ||
            "Unknown error";

          throw new Error(errorMessage);
        }
      } catch (error) {
        debugError("❌ Update download error (final catch):", {
          error: error,
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
        });

        // Zeige User-freundliche Fehlermeldung
        let errorMessage = this.$tc(
          "sw-settings-license-check.update.downloadFailed"
        );
        if (error.response?.data?.errors?.[0]?.detail) {
          errorMessage = error.response.data.errors[0].detail;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.createNotificationError({
          title: this.$tc("sw-settings-license-check.update.downloadFailed"),
          message: errorMessage,
        });
      } finally {
        this.isUpdateDownloading = false;
      }
    },

    /**
     * TEST: Sendet Test-E-Mail für License-Expiry-Reminder (DEV ONLY)
     *
     * WICHTIG: Diese Methode ist ISOLIERT von der produktiven License-Logik!
     * - Funktioniert unabhängig von License-Status
     * - Ändert KEINE Config-Werte
     * - Nur E-Mail-Preview (kein Storefront-Effekt)
     */
    async sendTestExpiryEmail() {
      // =====================================================================
      // SICHERHEIT: Keine License-Validierung! Nur E-Mail-Test.
      // =====================================================================

      this.isEmailTestSending = true;

      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          throw new Error("HTTP Client not available");
        }

        debugLog(
          "📧 DEV Test: Sending isolated test email (no config changes)..."
        );
        const startTime = Date.now();

        const response = await httpClient.post(
          "/_action/hero-blocks/test-expiry-email",
          {},
          {
            headers: this.systemConfigApiService.getBasicHeaders(),
          }
        );

        const duration = Date.now() - startTime;
        debugLog(
          `✅ Test email sent in ${duration}ms (isolated mode)`,
          response.data
        );

        if (response.data?.success) {
          this.createNotificationSuccess({
            title: "🧪 DEV Test Email Sent",
            message: response.data.message || `Test email sent successfully`,
          });
        } else {
          throw new Error(
            response.data?.errors?.[0]?.detail || "Email send failed"
          );
        }
      } catch (error) {
        debugError("❌ Failed to send test email:", error);

        this.createNotificationError({
          title: "Email Test Failed",
          message:
            error.response?.data?.errors?.[0]?.detail ||
            error.message ||
            "Could not send test email",
        });
      } finally {
        this.isEmailTestSending = false;
      }
    },

    /**
     * Validiert Instagram API Credentials
     * WICHTIG: Ähnlich wie checkHeroBlocksLicense, aber für Instagram Token
     */
    async checkHeroBlocksInstagramToken() {
      // WICHTIG: Keine API-Anfrage wenn Lizenz abgelaufen ist
      if (this.isLicenseExpired) {
        this.createNotificationError({
          title: this.$tc(
            "sw-settings-license-check.instagram.validationFailed"
          ),
          message: this.$tc(
            "sw-settings-license-check.instagram.licenseExpiredMessage"
          ),
        });
        return;
      }

      this.isInstagramTokenChecking = true;

      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          throw new Error("HTTP Client nicht verfügbar");
        }

        debugLog("🚀 Starting Instagram token validation...");
        const startTime = Date.now();

        let response;
        try {
          debugLog("📡 Calling Instagram token validation API...");
          response = await httpClient.post(
            "/_action/hero-blocks/check-instagram-token",
            {},
            {
              headers: this.systemConfigApiService.getBasicHeaders(),
            }
          );

          const duration = Date.now() - startTime;
          debugLog(`✅ API call completed in ${duration}ms`, response.data);
        } catch (httpError) {
          const duration = Date.now() - startTime;
          debugError("❌ Instagram token validation HTTP error:", {
            error: httpError,
            message: httpError.message,
            response: httpError.response?.data,
            status: httpError.response?.status,
            durationMs: duration,
          });

          throw new Error(
            httpError.response?.data?.errors?.[0]?.detail ||
              httpError.message ||
              "Network error during Instagram token validation"
          );
        }

        if (!response || !response.data) {
          debugError(
            "❌ Empty response from Instagram token validation API",
            response
          );
          throw new Error("Empty response from Instagram token validation API");
        }

        debugLog("📦 Response data:", response.data);

        if (response.data.success === true && response.data.data) {
          const result = response.data.data;

          debugLog("✅ Instagram token validation successful:", {
            valid: result.valid,
            message: result.message,
            details: result.details,
          });

          // Force reload Config Data
          if (
            this.actualConfigData &&
            this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
          ) {
            delete this.actualConfigData[this.currentSalesChannelId];
          }

          await this.loadCurrentSalesChannelConfig();
          await this.$nextTick();

          if (result.valid === true) {
            this.createNotificationSuccess({
              title: this.$tc(
                "sw-settings-license-check.instagram.validationSuccess"
              ),
              message:
                result.message ||
                this.$tc(
                  "sw-settings-license-check.instagram.validationSuccessMessage"
                ),
            });
          } else {
            this.createNotificationError({
              title: this.$tc(
                "sw-settings-license-check.instagram.validationFailed"
              ),
              message:
                result.message ||
                this.$tc(
                  "sw-settings-license-check.instagram.validationFailedMessage"
                ),
            });
          }
        } else {
          debugError(
            "❌ Instagram token validation failed with unexpected response:",
            response.data
          );
          throw new Error(
            response.data.message ||
              "Unexpected response from Instagram token validation API"
          );
        }
      } catch (error) {
        debugError("❌ Final Instagram token validation error:", error);
        this.createNotificationError({
          title: this.$tc(
            "sw-settings-license-check.instagram.validationFailed"
          ),
          message: error.message,
        });
      } finally {
        this.isInstagramTokenChecking = false;
      }
    },

    /**
     * Prüft auf Feature-Aktivierungen und startet Validierung
     */
    checkFeatureActivations(newConfig, oldConfig) {
      if (!this.isHeroBlocksConfig()) return;

      const currentConfig = newConfig?.[this.currentSalesChannelId] || {};
      const previousConfig =
        oldConfig?.[this.currentSalesChannelId] || this.previousConfig || {};

      // Feature-Mapping: Config-Key → Feature-Name → Validierungsfunktion
      // HINWEIS: Language Switcher wird immer angezeigt (kein Toggle mehr)
      const featureMappings = {
        "HeroBlocks.config.enableMegaMenu": {
          name: "Mega Menu",
          validator: this.validateMegaMenu.bind(this),
        },
        "HeroBlocks.config.enableHeroInstagramFeed": {
          name: "Instagram Feed",
          validator: this.validateInstagramFeed.bind(this),
        },
        "HeroBlocks.config.enableCategorySlider": {
          name: "Category Slider",
          validator: this.validateCategorySlider.bind(this),
        },
      };

      // Prüfe jede Feature-Mapping
      Object.keys(featureMappings).forEach((configKey) => {
        const oldValue = previousConfig[configKey];
        const newValue = currentConfig[configKey];

        // Feature wurde aktiviert (von false/undefined zu true)
        if (
          (oldValue === false || oldValue === undefined || oldValue === null) &&
          newValue === true
        ) {
          const feature = featureMappings[configKey];
          debugLog(`✅ Feature aktiviert: ${feature.name}`);

          // Starte Validierung
          this.validateFeature(feature.name, feature.validator, configKey);
        }
      });

      // Speichere aktuelle Config als previous für nächsten Check
      this.previousConfig = { ...currentConfig };
    },

    /**
     * Schritt-für-Schritt Feature-Validierung
     */
    async validateFeature(featureName, validator, configKey) {
      if (this.featureValidation.isRunning) {
        debugWarn(
          `⚠️ Validierung bereits läuft für: ${this.featureValidation.currentFeature}`
        );
        return;
      }

      this.featureValidation.isRunning = true;
      this.featureValidation.currentFeature = featureName;
      this.featureValidation.currentStep = null;
      this.featureValidation.steps = [];
      this.featureValidation.results = {};
      this.featureValidation.debugInfo = {};

      try {
        // Zeige Start-Notification
        this.createNotificationInfo({
          title: `Validierung: ${featureName}`,
          message: `Starte Schritt-für-Schritt-Validierung für ${featureName}...`,
          duration: 3000,
        });

        // Führe Validierung aus
        const result = await validator(configKey);

        // Zeige Ergebnis
        if (result.success) {
          this.createNotificationSuccess({
            title: `✅ ${featureName} aktiviert`,
            message:
              result.message ||
              `Alle Validierungsschritte erfolgreich abgeschlossen.`,
            duration: 5000,
          });
        } else {
          this.createNotificationWarning({
            title: `⚠️ ${featureName} - Validierung mit Warnungen`,
            message:
              result.message ||
              `Einige Validierungsschritte haben Warnungen ergeben.`,
            duration: 7000,
          });
        }

        // Debug-Informationen speichern
        this.featureValidation.debugInfo = {
          feature: featureName,
          configKey,
          timestamp: new Date().toISOString(),
          result,
          steps: this.featureValidation.steps,
        };

        // Debug-Info in Console (nur Development)
        if (DEBUG) {
          console.group(`🔍 Feature-Validierung: ${featureName}`);
          console.log("Config Key:", configKey);
          console.log("Ergebnis:", result);
          console.log("Schritte:", this.featureValidation.steps);
          console.log("Debug Info:", this.featureValidation.debugInfo);
          console.groupEnd();
        }
      } catch (error) {
        debugError(`❌ Validierungsfehler für ${featureName}:`, error);
        this.createNotificationError({
          title: `❌ ${featureName} - Validierungsfehler`,
          message: error.message || "Ein unerwarteter Fehler ist aufgetreten.",
          duration: 10000,
        });
      } finally {
        this.featureValidation.isRunning = false;
        this.featureValidation.currentFeature = null;
        this.featureValidation.currentStep = null;
      }
    },

    // HINWEIS: validateLanguageSwitcher() Methode entfernt - Language Switcher wird immer angezeigt

    /**
     * Validierung für Mega Menu
     */
    async validateMegaMenu(configKey) {
      // TODO: Implementiere Mega Menu Validierung
      return {
        success: true,
        message: "Mega Menu Validierung noch nicht implementiert.",
      };
    },

    /**
     * Validierung für Instagram Feed
     */
    async validateInstagramFeed(configKey) {
      // TODO: Implementiere Instagram Feed Validierung
      return {
        success: true,
        message: "Instagram Feed Validierung noch nicht implementiert.",
      };
    },

    /**
     * Validierung für Category Slider
     */
    async validateCategorySlider(configKey) {
      // TODO: Implementiere Category Slider Validierung
      return {
        success: true,
        message: "Category Slider Validierung noch nicht implementiert.",
      };
    },

    /**
     * Prüft ob Frontend-Template existiert
     */
    async checkFrontendTemplate(templateName) {
      try {
        // Prüfe via API oder direkt im Frontend
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          return false;
        }

        const response = await httpClient.get(
          `/_action/hero-blocks/check-template/${templateName}`,
          {
            headers: this.systemConfigApiService.getBasicHeaders(),
          }
        );

        return response.data?.exists === true;
      } catch (error) {
        debugWarn(`⚠️ Template-Check fehlgeschlagen:`, error);
        return false;
      }
    },

    /**
     * Prüft Frontend-Rendering
     */
    async checkFrontendRendering(componentName) {
      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          return {
            success: false,
            message: "HTTP Client nicht verfügbar",
          };
        }

        const response = await httpClient.get(
          `/_action/hero-blocks/check-frontend/${componentName}`,
          {
            headers: this.systemConfigApiService.getBasicHeaders(),
          }
        );

        return {
          success: response.data?.rendered === true,
          message:
            response.data?.message ||
            "Frontend-Rendering-Prüfung abgeschlossen",
        };
      } catch (error) {
        debugWarn(`⚠️ Frontend-Rendering-Check fehlgeschlagen:`, error);
        return {
          success: false,
          message: `Frontend-Rendering-Check fehlgeschlagen: ${error.message}`,
        };
      }
    },

    /**
     * Prüft JavaScript-Plugin
     */
    async checkJavaScriptPlugin(pluginName) {
      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          return {
            success: false,
            message: "HTTP Client nicht verfügbar",
          };
        }

        const response = await httpClient.get(
          `/_action/hero-blocks/check-plugin/${pluginName}`,
          {
            headers: this.systemConfigApiService.getBasicHeaders(),
          }
        );

        return {
          success: response.data?.registered === true,
          message:
            response.data?.message || "JavaScript-Plugin-Prüfung abgeschlossen",
        };
      } catch (error) {
        debugWarn(`⚠️ JavaScript-Plugin-Check fehlgeschlagen:`, error);
        return {
          success: false,
          message: `JavaScript-Plugin-Check fehlgeschlagen: ${error.message}`,
        };
      }
    },

    // HINWEIS: Language Switcher Methoden entfernt - wird immer angezeigt (kein Toggle mehr)
  },
});
