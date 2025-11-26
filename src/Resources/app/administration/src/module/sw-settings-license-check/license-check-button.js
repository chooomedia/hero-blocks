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
    };
  },

  computed: {
    licenseStatusClass() {
      if (!this.isHeroBlocksConfig()) return "";
      const status =
        this.actualConfigData?.[this.currentSalesChannelId]?.[
          "HeroBlocks.config.licenseStatus"
        ] ||
        this.actualConfigData?.[this.currentSalesChannelId]?.["licenseStatus"];
      return status === "active"
        ? "is--license-active"
        : status === "expired"
        ? "is--license-expired"
        : "";
    },

    /**
     * WICHTIG: Prüft ob License abgelaufen ist
     * Wenn expired → Update Check Button deaktivieren
     */
    isLicenseExpired() {
      if (!this.isHeroBlocksConfig()) return false;
      const status =
        this.actualConfigData?.[this.currentSalesChannelId]?.[
          "HeroBlocks.config.licenseStatus"
        ] ||
        this.actualConfigData?.[this.currentSalesChannelId]?.["licenseStatus"];
      return status === "expired";
    },

    /**
     * Release Notes aus Update Check Response
     * Wird angezeigt wenn License expired ist
     */
    releaseNotes() {
      if (!this.isHeroBlocksConfig()) return null;
      const changelog =
        this.actualConfigData?.[this.currentSalesChannelId]?.[
          "HeroBlocks.config.updateChangelog"
        ];
      return changelog || null;
    },

    /**
     * Prüft ob Block aktiv ist (nicht disabled)
     */
    hasActiveBlocks() {
      if (!this.isHeroBlocksConfig()) return false;
      const config = this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.enableHeroBlockSlider"] === true ||
        config["HeroBlocks.config.enableHeroTwoColumns"] === true ||
        config["HeroBlocks.config.enableMegaMenu"] === true
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
      if (!this.isHeroBlocksConfig()) return false;
      const config = this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.enableMegaMenu"] === true ||
        config["enableMegaMenu"] === true
      );
    },

    /**
     * Prüft ob Instagram Feed aktiviert ist
     * WICHTIG: Für Collapsible Card "Instagram Feed Settings" (nur wenn aktiv)
     */
    isInstagramFeedEnabled() {
      if (!this.isHeroBlocksConfig()) return false;
      const config = this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.enableHeroInstagramFeed"] === true ||
        config["enableHeroInstagramFeed"] === true
      );
    },

    /**
     * Prüft ob FAQ Block aktiviert ist
     * WICHTIG: Für Collapsible Card "FAQ Block Settings" (nur wenn aktiv)
     */
    isFaqBlockEnabled() {
      if (!this.isHeroBlocksConfig()) return false;
      const config = this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.enableFaqBlock"] === true ||
        config["enableFaqBlock"] === true
      );
    },

    /**
     * Prüft ob Update verfügbar ist
     */
    updateAvailable() {
      if (!this.isHeroBlocksConfig()) return false;
      const config = this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.updateAvailable"] === true ||
        config["updateAvailable"] === true
      );
    },

    /**
     * Gibt downloadUrl zurück (falls vorhanden)
     */
    updateDownloadUrl() {
      if (!this.isHeroBlocksConfig()) return null;
      const config = this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.updateDownloadUrl"] ||
        config["updateDownloadUrl"] ||
        null
      );
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
      // WICHTIG: Keine API-Anfrage wenn Lizenz bereits abgelaufen ist
      if (this.isLicenseExpired) {
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
            debugLog("🔍 Webhook Debug Info:", debugInfo);
          }
        } catch (debugErr) {
          debugWarn("⚠️ Could not fetch debug info:", debugErr);
        }

        // Webhook URL wird vom Backend aus Environment Variable gelesen
        // Kein Eingabefeld mehr - URL wird Server-seitig aus $_ENV gelesen

        debugLog("🚀 Starting license check...");
        const startTime = Date.now();

        // Rufe API auf - verwendet Webhook wenn URL gesetzt, sonst Fallback
        let response;
        try {
          debugLog("📡 Calling license check API...");
          response = await httpClient.post(
            "/_action/hero-blocks/check-license",
            {},
            {
              headers: this.systemConfigApiService.getBasicHeaders(),
            }
          );

          const duration = Date.now() - startTime;
          debugLog(`✅ API call completed in ${duration}ms`, response.data);
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
     */
    async sendTestExpiryEmail() {
      this.isEmailTestSending = true;

      try {
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          throw new Error("HTTP Client not available");
        }

        debugLog("📧 Sending test expiry email...");
        const startTime = Date.now();

        const response = await httpClient.post(
          "/_action/hero-blocks/test-expiry-email",
          {},
          {
            headers: this.systemConfigApiService.getBasicHeaders(),
          }
        );

        const duration = Date.now() - startTime;
        debugLog(`✅ Test email sent in ${duration}ms`, response.data);

        if (response.data?.success) {
          this.createNotificationSuccess({
            title: "Test Email Sent",
            message: `Test expiry reminder email sent to: ${response.data.data.recipient}`,
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
          message: error.response?.data?.errors?.[0]?.detail || error.message || "Could not send test email",
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
