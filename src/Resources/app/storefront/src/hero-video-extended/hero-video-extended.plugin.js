/**
 * Hero Video Extended Plugin
 *
 * Erweiterte Video-Steuerung für Hero Video Extended Block:
 * - Video Play/Pause beim Scrollen (wenn sichtbar: play, wenn nicht sichtbar: pause)
 * - Video stoppt wo es war und setzt fort wenn wieder sichtbar
 * - Overlay Scroll Animation (von außen nach innen) - BEI JEDEM SCROLL
 * - Performance-Optimierung via Intersection Observer
 *
 * WICHTIG: Animation wird bei JEDEM Eintritt in den Viewport ausgelöst!
 */

import Plugin from "src/plugin-system/plugin.class";
import DomAccess from "src/helper/dom-access.helper";

export default class HeroVideoExtendedPlugin extends Plugin {
  static options = {
    pauseOnScroll: true,
    playOnVisible: true,
    visibilityThreshold: 0.15,
    videoSelector: "video",
    overlaySelector: "[data-overlay-animate]",
    animatedClass: "is-animated",
  };

  init() {
    this._debug = window.location.hostname === 'localhost';
    
    if (this._debug) {
      console.log("[HeroVideoExtended] Plugin initializing");
    }

    this.block = this.el;

    this.video = DomAccess.querySelector(
      this.block,
      this.options.videoSelector,
      false
    );

    this.overlay = DomAccess.querySelector(
      this.block,
      this.options.overlaySelector,
      false
    );

    this._readDataAttributes();

    if (this._debug) {
      console.log("[HeroVideoExtended] Video:", this.video);
      console.log("[HeroVideoExtended] Overlay:", this.overlay);
      console.log("[HeroVideoExtended] Scroll Animation Enabled:", this._scrollAnimationEnabled);
    }

    this._isVisible = false;

    // Setup Intersection Observer für Animation UND Video
    this._setupIntersectionObserver();

    // Ensure video autoplays
    if (this.video) {
      this._ensureAutoplay();
    }
  }

  /**
   * Read data attributes from block element
   */
  _readDataAttributes() {
    const pauseOnScroll = this.block.dataset.pauseOnScroll;
    if (pauseOnScroll === 'true') {
      this.options.pauseOnScroll = true;
    } else if (pauseOnScroll === 'false') {
      this.options.pauseOnScroll = false;
    }
    
    const autoplay = this.block.dataset.autoplay;
    this._autoplayEnabled = autoplay !== 'false';
    
    // Scroll Animation aktivieren wenn Overlay vorhanden
    const enableScrollAnimation = this.block.dataset.enableScrollAnimation;
    const overlayHasAnimateAttr = this.overlay && this.overlay.hasAttribute('data-overlay-animate');
    
    this._scrollAnimationEnabled = 
      enableScrollAnimation === 'true' || 
      enableScrollAnimation === true ||
      overlayHasAnimateAttr;
  }

  /**
   * Setup Intersection Observer
   * WICHTIG: Animation wird bei JEDEM Eintritt/Austritt ausgelöst!
   */
  _setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: this.options.visibilityThreshold,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const isNowVisible = entry.isIntersecting;
        
        if (this._debug) {
          console.log("[HeroVideoExtended] Intersection:", isNowVisible, "wasVisible:", this._isVisible);
        }
        
        // Element wird sichtbar
        if (isNowVisible && !this._isVisible) {
          this._isVisible = true;
          
          // Overlay Animation starten
          if (this.overlay && this._scrollAnimationEnabled) {
            this._animateOverlayIn();
          }
          
          // Video abspielen
          if (this.video && this.options.playOnVisible && this._autoplayEnabled) {
            this._playVideo();
          }
        } 
        // Element verlässt Viewport
        else if (!isNowVisible && this._isVisible) {
          this._isVisible = false;
          
          // Overlay Animation zurücksetzen (für nächsten Scroll)
          if (this.overlay && this._scrollAnimationEnabled) {
            this._animateOverlayOut();
          }
          
          // Video pausieren
          if (this.video && this.options.pauseOnScroll) {
            this._pauseVideo();
          }
        }
      });
    }, options);

    this.observer.observe(this.block);

    if (this._debug) {
      console.log("[HeroVideoExtended] Intersection Observer setup complete");
    }
  }

  /**
   * Animate Overlay IN (von außen nach innen)
   */
  _animateOverlayIn() {
    if (!this.overlay) return;
    
    if (this._debug) {
      console.log("[HeroVideoExtended] Animating overlay IN");
    }
    
    // Kleine Verzögerung für besseren visuellen Effekt
    requestAnimationFrame(() => {
      this.overlay.classList.add(this.options.animatedClass);
    });
  }

  /**
   * Animate Overlay OUT (zurücksetzen für nächsten Scroll)
   */
  _animateOverlayOut() {
    if (!this.overlay) return;
    
    if (this._debug) {
      console.log("[HeroVideoExtended] Animating overlay OUT");
    }
    
    this.overlay.classList.remove(this.options.animatedClass);
  }

  /**
   * Ensure Autoplay (Browser-Kompatibilität)
   */
  _ensureAutoplay() {
    // WICHTIG: Autoplay erfordert muted attribute in den meisten Browsern
    if (this.video.hasAttribute("autoplay") && this._autoplayEnabled) {
      this.video.muted = true;

      // Play promise für bessere Error-Handling
      const playPromise = this.video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (this._debug) {
              console.log("[HeroVideoExtended] Video autoplay started");
            }
          })
          .catch((error) => {
            if (this._debug) {
              console.warn("[HeroVideoExtended] Autoplay failed:", error);
            }
            // Fallback: User muss Video manuell starten
          });
      }
    }
  }

  /**
   * Play Video
   * WICHTIG: Video setzt dort fort, wo es pausiert wurde
   */
  _playVideo() {
    if (this.video && this.video.paused) {
      const playPromise = this.video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (this._debug) {
              console.log("[HeroVideoExtended] Video playing at", this.video.currentTime);
            }
          })
          .catch((error) => {
            if (this._debug) {
              console.warn("[HeroVideoExtended] Play failed:", error);
            }
          });
      }
    }
  }

  /**
   * Pause Video
   * WICHTIG: Video bleibt an der aktuellen Position stehen
   */
  _pauseVideo() {
    if (this.video && !this.video.paused) {
      this.video.pause();
      if (this._debug) {
        console.log("[HeroVideoExtended] Video paused at", this.video.currentTime);
      }
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
