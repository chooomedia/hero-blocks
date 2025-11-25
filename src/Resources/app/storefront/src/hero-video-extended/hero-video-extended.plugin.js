/**
 * Hero Video Extended Plugin
 *
 * Erweiterte Video-Steuerung für Hero Video Extended Block:
 * - Video Play/Pause beim Scrollen
 * - Performance-Optimierung
 * - Browser-Kompatibilität
 *
 * Gemäß Shopware 6 Best Practices für Storefront JavaScript Plugins
 */

import Plugin from "src/plugin-system/plugin.class";
import DomAccess from "src/helper/dom-access.helper";

export default class HeroVideoExtendedPlugin extends Plugin {
  static options = {
    // Video Settings
    pauseOnScroll: false, // Video pausieren wenn außerhalb Viewport
    playOnVisible: true, // Video abspielen wenn im Viewport
    visibilityThreshold: 0.5, // 50% des Videos muss sichtbar sein

    // Selectors
    videoSelector: "video",
    videoContainerSelector: ".hero-video-extended__video-container",
  };

  init() {
    console.log("[HeroVideoExtended] Plugin initializing");

    // Get Block Element
    this.block = this.el;

    // Get Video Element
    this.video = DomAccess.querySelector(
      this.block,
      this.options.videoSelector,
      false
    );

    if (!this.video) {
      console.log("[HeroVideoExtended] No video element found");
      return;
    }

    console.log("[HeroVideoExtended] Video element found:", this.video);

    // Setup Intersection Observer für Performance
    if (this.options.playOnVisible || this.options.pauseOnScroll) {
      this._setupIntersectionObserver();
    }

    // Ensure video autoplays (wenn autoplay aktiviert)
    this._ensureAutoplay();
  }

  /**
   * Setup Intersection Observer
   * WICHTIG: Performance-optimiert - pausiert Video wenn außerhalb Viewport
   */
  _setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: this.options.visibilityThreshold,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Video ist sichtbar
          if (this.options.playOnVisible) {
            this._playVideo();
          }
        } else {
          // Video ist außerhalb Viewport
          if (this.options.pauseOnScroll) {
            this._pauseVideo();
          }
        }
      });
    }, options);

    this.observer.observe(this.block);

    console.log("[HeroVideoExtended] Intersection Observer setup complete");
  }

  /**
   * Ensure Autoplay (Browser-Kompatibilität)
   */
  _ensureAutoplay() {
    // WICHTIG: Autoplay erfordert muted attribute in den meisten Browsern
    if (this.video.hasAttribute("autoplay")) {
      this.video.muted = true;

      // Play promise für bessere Error-Handling
      const playPromise = this.video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[HeroVideoExtended] Video autoplay started");
          })
          .catch((error) => {
            console.warn("[HeroVideoExtended] Autoplay failed:", error);
            // Fallback: User muss Video manuell starten
          });
      }
    }
  }

  /**
   * Play Video
   */
  _playVideo() {
    if (this.video.paused) {
      const playPromise = this.video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[HeroVideoExtended] Video playing");
          })
          .catch((error) => {
            console.warn("[HeroVideoExtended] Play failed:", error);
          });
      }
    }
  }

  /**
   * Pause Video
   */
  _pauseVideo() {
    if (!this.video.paused) {
      this.video.pause();
      console.log("[HeroVideoExtended] Video paused");
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    super.destroy();
  }
}
