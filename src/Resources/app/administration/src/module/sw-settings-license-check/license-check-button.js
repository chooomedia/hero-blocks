/**
 * Override für sw-system-config - Fügt License Check Button hinzu
 */
import overrideTemplate from "./sw-system-config-override.html.twig";
import "./sw-system-config-override.scss";

Shopware.Component.override("sw-system-config", {
  template: overrideTemplate,

  inject: ["systemConfigApiService"],

  mixins: [Shopware.Mixin.getByName("notification")],

  data() {
    return {
      isLicenseChecking: false,
      isUpdateChecking: false,
      isUpdateDownloading: false,
      isUpdateTesting: false, // WICHTIG: Test-Modus für Download (ohne Installation)
      isUpdateTestingFull: false, // WICHTIG: Test-Modus für kompletten Update-Prozess (Check → Download → Install)
      showChangelog: false, // WICHTIG: Changelog Collapsible State
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
      const config =
        this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.enableMegaMenu"] === true ||
        config["enableMegaMenu"] === true
      );
    },

    /**
     * Prüft ob Update verfügbar ist
     */
    updateAvailable() {
      if (!this.isHeroBlocksConfig()) return false;
      const config =
        this.actualConfigData?.[this.currentSalesChannelId] || {};
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
      const config =
        this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.updateDownloadUrl"] ||
        config["updateDownloadUrl"] ||
        null
      );
    },

    /**
     * Gibt aktuelle Plugin-Version zurück
     */
    currentVersion() {
      if (!this.isHeroBlocksConfig()) return null;
      const config =
        this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.currentVersion"] ||
        config["currentVersion"] ||
        "1.0.0"
      );
    },

    /**
     * Gibt neueste verfügbare Version zurück
     */
    latestVersion() {
      if (!this.isHeroBlocksConfig()) return null;
      const config =
        this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.latestVersion"] ||
        config["latestVersion"] ||
        this.currentVersion
      );
    },

    /**
     * Gibt letztes Check-Datum zurück
     */
    lastCheckedAt() {
      if (!this.isHeroBlocksConfig()) return null;
      const config =
        this.actualConfigData?.[this.currentSalesChannelId] || {};
      const checkedAt =
        config["HeroBlocks.config.updateCheckedAt"] ||
        config["updateCheckedAt"] ||
        null;
      if (!checkedAt) return null;
      try {
        return new Date(checkedAt).toLocaleString("de-DE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return null;
      }
    },

    /**
     * Gibt Changelog zurück (falls vorhanden)
     */
    changelog() {
      if (!this.isHeroBlocksConfig()) return null;
      const config =
        this.actualConfigData?.[this.currentSalesChannelId] || {};
      return (
        config["HeroBlocks.config.updateChangelog"] ||
        config["updateChangelog"] ||
        null
      );
    },

    /**
     * Konvertiert Markdown zu HTML (einfache Konvertierung)
     * WICHTIG: Nur für Changelog-Anzeige, nicht für User-Input
     */
    changelogHtml() {
      if (!this.changelog) return null;
      let html = String(this.changelog);

      // Markdown zu HTML (einfache Konvertierung)
      // Headers
      html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
      html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
      html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

      // Bold
      html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");

      // Italic
      html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");

      // Links
      html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      // Code blocks
      html = html.replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>');
      html = html.replace(/`([^`]+)`/gim, "<code>$1</code>");

      // Lists
      html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
      html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
      html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

      // Line breaks
      html = html.replace(/\n/gim, "<br>");

      return html;
    },
  },

  // WICHTIG: Kein Auto-Check mehr hier - wird von sw-extension-config Override übernommen (Silent Check)
  // mounted() entfernt - Silent Check wird von sw-extension-config Override gemacht

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
            console.log("🔍 Webhook Debug Info:", debugInfo);
          }
        } catch (debugError) {
          console.warn("⚠️ Could not fetch debug info:", debugError);
        }

        // Webhook URL wird vom Backend aus Environment Variable gelesen
        // Kein Eingabefeld mehr - URL wird Server-seitig aus $_ENV gelesen

        console.log("🚀 Starting license check...");
        const startTime = Date.now();

        // Rufe API auf - verwendet Webhook wenn URL gesetzt, sonst Fallback
        let response;
        try {
          console.log("📡 Calling license check API...");
          response = await httpClient.post(
            "/_action/hero-blocks/check-license",
            {},
            {
              headers: this.systemConfigApiService.getBasicHeaders(),
            }
          );

          const duration = Date.now() - startTime;
          console.log(`✅ API call completed in ${duration}ms`, response.data);
        } catch (httpError) {
          const duration = Date.now() - startTime;
          console.error("❌ License check HTTP error:", {
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
          console.error("❌ Empty response from license check API", response);
          throw new Error("Empty response from license check API");
        }

        console.log("📦 Response data:", response.data);

        // Prüfe ob Response-Format korrekt ist
        if (response.data.success === true && response.data.data) {
          const result = response.data.data;

          console.log("✅ License check successful:", {
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
                console.warn("Failed to check expiry warning:", e);
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
          setTimeout(async () => {
            if (
              this.actualConfigData &&
              this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
            ) {
              delete this.actualConfigData[this.currentSalesChannelId];
            }
            await this.loadCurrentSalesChannelConfig();
          }, 1000);
        } else {
          console.error(
            "❌ License check failed - invalid response format:",
            response.data
          );
          const errorMessage =
            response.data.errors?.[0]?.detail || "Unknown error";

          // Zeige erweiterte Debug-Info in Console
          console.error("Error Details:", {
            response: response.data,
            errors: response.data.errors,
            debug: response.data.debug,
          });

          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("❌ License check error (final catch):", {
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
          console.warn("🐛 Debug Info:", error.response.data.debug);
        }
      } finally {
        this.isLicenseChecking = false;
      }
    },

    /**
     * Prüft ob Feld ein Update-Info-Feld ist (sollte versteckt werden, da in Status-Info angezeigt)
     * WICHTIG: Verhindert Doppelung - diese Felder werden bereits in Status-Info-Box angezeigt
     */
    isUpdateInfoField(fieldName) {
      if (!this.isHeroBlocksConfig()) return false;
      // WICHTIG: Diese Felder werden bereits in Status-Info-Box angezeigt
      const updateInfoFields = [
        "HeroBlocks.config.updateAvailable",
        "HeroBlocks.config.latestVersion",
        "HeroBlocks.config.updateDownloadUrl",
        "updateAvailable",
        "latestVersion",
        "updateDownloadUrl",
      ];
      return updateInfoFields.includes(fieldName);
    },

    /**
     * Prüft ob ein Block aktiv ist (nicht disabled)
     */
    isActiveBlock(blockName) {
      if (!this.isHeroBlocksConfig()) return false;
      // Aktive Blocks: enableHeroBlockSlider, enableHeroTwoColumns, enableMegaMenu
      const activeBlocks = [
        "HeroBlocks.config.enableHeroBlockSlider",
        "HeroBlocks.config.enableHeroTwoColumns",
        "HeroBlocks.config.enableMegaMenu",
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

        console.log("🚀 Starting update check...");
        const startTime = Date.now();

        // Rufe Update Check API auf
        let response;
        try {
          console.log("📡 Calling update check API...");
          response = await httpClient.get(
            "/_action/hero-blocks/update-check",
            {
              headers: this.systemConfigApiService.getBasicHeaders(),
            }
          );

          const duration = Date.now() - startTime;
          console.log(`✅ API call completed in ${duration}ms`, response.data);
        } catch (httpError) {
          const duration = Date.now() - startTime;
          console.error("❌ Update check HTTP error:", {
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
          console.error("❌ Empty response from update check API", response);
          throw new Error("Empty response from update check API");
        }

        console.log("📦 Response data:", response.data);

        // Prüfe ob Response-Format korrekt ist
        if (response.data.success === true && response.data.data) {
          const result = response.data.data;

          console.log("✅ Update check successful:", {
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
              title: this.$tc("sw-settings-license-check.update.licenseExpired"),
              message: result.licenseExpiredMessage || this.$tc("sw-settings-license-check.update.licenseExpiredMessage"),
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
              title: this.$tc("sw-settings-license-check.update.updateAvailable"),
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
                message: result.changelog.substring(0, 200) + (result.changelog.length > 200 ? "..." : ""),
                autoClose: true,
                duration: 10000,
              });
            }
          } else {
            this.createNotificationInfo({
              title: this.$tc("sw-settings-license-check.update.noUpdateAvailable"),
              message: this.$tc(
                "sw-settings-license-check.update.noUpdateAvailableMessage",
                {
                  currentVersion: result.currentVersion || result.latestVersion,
                }
              ),
            });
          }

          // Nach 1 Sekunde nochmal laden um sicherzustellen
          setTimeout(async () => {
            if (
              this.actualConfigData &&
              this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
            ) {
              delete this.actualConfigData[this.currentSalesChannelId];
            }
            await this.loadCurrentSalesChannelConfig();
          }, 1000);
        } else {
          console.error(
            "❌ Update check failed - invalid response format:",
            response.data
          );
          const errorMessage =
            response.data.errors?.[0]?.detail ||
            response.data.error ||
            "Unknown error";

          console.error("Error Details:", {
            response: response.data,
            errors: response.data.errors,
          });

          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("❌ Update check error (final catch):", {
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

        console.log("🚀 Starting update download...");
        const startTime = Date.now();

        // Rufe Update Download API auf
        let response;
        try {
          console.log("📡 Calling update download API...");
          response = await httpClient.post(
            "/_action/hero-blocks/update-download",
            {},
            {
              headers: this.systemConfigApiService.getBasicHeaders(),
            }
          );

          const duration = Date.now() - startTime;
          console.log(`✅ API call completed in ${duration}ms`, response.data);
        } catch (httpError) {
          const duration = Date.now() - startTime;
          console.error("❌ Update download HTTP error:", {
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
              "Network error during update download"
          );
        }

        if (!response || !response.data) {
          console.error("❌ Empty response from update download API", response);
          throw new Error("Empty response from update download API");
        }

        console.log("📦 Response data:", response.data);

        // Prüfe ob Response-Format korrekt ist
        if (response.data.success === true) {
          console.log("✅ Update download successful");

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
          setTimeout(async () => {
            if (
              this.actualConfigData &&
              this.actualConfigData.hasOwnProperty(this.currentSalesChannelId)
            ) {
              delete this.actualConfigData[this.currentSalesChannelId];
            }
            await this.loadCurrentSalesChannelConfig();
          }, 1000);
        } else {
          console.error(
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
        console.error("❌ Update download error (final catch):", {
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
     * Test Download - Prüft ob Download-URL erreichbar ist (ohne Installation)
     * WICHTIG: Best Practice für Shopware Plugins - Test-Modus über Backend-Endpunkt
     */
    async testUpdateDownload() {
      this.isUpdateTesting = true;

      try {
        const downloadUrl = this.updateDownloadUrl;
        if (!downloadUrl) {
          throw new Error("Keine Download-URL verfügbar. Bitte zuerst auf Updates prüfen.");
        }

        console.log("🧪 Testing update download URL...", downloadUrl);

        // WICHTIG: Verwende Backend-Endpunkt für Test (vermeidet CORS-Probleme)
        const httpClient = this.systemConfigApiService.httpClient;
        if (!httpClient) {
          throw new Error("HTTP Client nicht verfügbar");
        }

        const startTime = Date.now();
        let response;
        try {
          // POST Request zu Backend-Endpunkt
          // WICHTIG: Route ohne /api Prefix (httpClient hat bereits baseURL = /api)
          response = await httpClient.post(
            "/_action/hero-blocks/test-download-url",
            {},
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const duration = Date.now() - startTime;
          console.log(`✅ Download URL test completed in ${duration}ms`, {
            status: response.status,
            data: response.data,
          });

          // Prüfe Response
          if (response.data && response.data.success === true) {
            const { status, contentLength, contentType } = response.data;

            this.createNotificationSuccess({
              title: this.$tc("sw-settings-license-check.update.testSuccess"),
              message: this.$tc(
                "sw-settings-license-check.update.testSuccessMessage",
                {
                  url: downloadUrl,
                  status: status,
                  size: contentLength,
                  type: contentType,
                }
              ),
              autoClose: false,
            });
          } else {
            throw new Error(
              response.data?.error || "Download-URL Test fehlgeschlagen"
            );
          }
        } catch (httpError) {
          const duration = Date.now() - startTime;
          console.error("❌ Download URL test failed:", {
            error: httpError,
            message: httpError.message,
            response: httpError.response?.data,
            status: httpError.response?.status,
            durationMs: duration,
          });

          const errorMessage =
            httpError.response?.data?.error ||
            httpError.response?.data?.errors?.[0]?.detail ||
            (httpError.response?.status
              ? `Download-URL nicht erreichbar (HTTP ${httpError.response.status})`
              : httpError.message || "Download-URL Test fehlgeschlagen");

          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("❌ Update download test error:", {
          error: error,
          message: error.message,
        });

        this.createNotificationError({
          title: this.$tc("sw-settings-license-check.update.testFailed"),
          message: error.message || this.$tc("sw-settings-license-check.update.testFailedMessage"),
        });
      } finally {
        this.isUpdateTesting = false;
      }
    },

    /**
     * Test Full Update Process - Kompletter Update-Prozess (Check → Download → Install)
     * WICHTIG: Best Practice für Shopware Plugins - Test-Modus für Entwickler
     */
    async testFullUpdateProcess() {
      this.isUpdateTestingFull = true;

      try {
        console.log("🧪 Testing full update process...");

        // Step 1: Update Check
        console.log("📡 Step 1: Update Check...");
        await this.checkHeroBlocksUpdates();
        await this.$nextTick();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Warte 1 Sekunde

        // Prüfe ob Update verfügbar ist
        if (!this.updateAvailable || !this.updateDownloadUrl) {
          this.createNotificationWarning({
            title: this.$tc("sw-settings-license-check.update.testFullProcessNoUpdate"),
            message: this.$tc(
              "sw-settings-license-check.update.testFullProcessNoUpdateMessage"
            ),
            autoClose: false,
          });
          return;
        }

        // Step 2: Test Download URL
        console.log("📡 Step 2: Test Download URL...");
        await this.testUpdateDownload();
        await this.$nextTick();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Warte 1 Sekunde

        // Step 3: Download & Install
        console.log("📡 Step 3: Download & Install...");
        try {
          await this.downloadHeroBlocksUpdate();
          
          // Success Notification nur wenn wirklich erfolgreich
          this.createNotificationSuccess({
            title: this.$tc("sw-settings-license-check.update.testFullProcessSuccess"),
            message: this.$tc(
              "sw-settings-license-check.update.testFullProcessSuccessMessage"
            ),
            autoClose: false,
          });
        } catch (downloadError) {
          // Error wird bereits von downloadHeroBlocksUpdate angezeigt
          throw downloadError; // Re-throw damit finally-Block korrekt ausgeführt wird
        }
      } catch (error) {
        console.error("❌ Full update process test error:", {
          error: error,
          message: error.message,
        });

        this.createNotificationError({
          title: this.$tc("sw-settings-license-check.update.testFullProcessFailed"),
          message:
            error.message ||
            this.$tc(
              "sw-settings-license-check.update.testFullProcessFailedMessage"
            ),
        });
      } finally {
        this.isUpdateTestingFull = false;
      }
    },
  },
});
