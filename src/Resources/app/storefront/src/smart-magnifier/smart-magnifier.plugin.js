/**
 * Smart Magnifier Plugin - Living Zoom Lens
 *
 * Basiert auf: https://medium.com/@ignatovich.dm/creating-magnifying-glass-effects-in-html-css-and-javascript-7d42083bdf0e
 *
 * Technik: Dupliziertes, vergrößertes Bild innerhalb der Lupe.
 * Die Position des inneren Bildes wird basierend auf Cursor-Position angepasst.
 *
 * Verwendet Shopware Core Helpers:
 * - ViewportDetection: Viewport-basierte Aktivierung (nur Desktop)
 * - DeviceDetection: Touch-Gerät Erkennung
 * - Debouncer: Optimierte Event-Verarbeitung
 * - DomAccess: Sichere DOM-Manipulation
 *
 * Zustände:
 * - idle: Klein (5rem), folgt Cursor überall
 * - approaching: In der Nähe eines Produktbildes (5-7rem atmend, "aufgeregt")
 * - zooming: Über Produktbild, zeigt gezoomten Inhalt
 * - smartZoom: Nach 1.5s Stillstand, +30% größer, mehr Zoom
 *
 * @package HeroBlocks
 * @author Matt Interfaces
 */

import Plugin from "src/plugin-system/plugin.class";
import ViewportDetection from "src/helper/viewport-detection.helper";
import DeviceDetection from "src/helper/device-detection.helper";
import Debouncer from "src/helper/debouncer.helper";
import DomAccess from "src/helper/dom-access.helper";
import Iterator from "src/helper/iterator.helper";

export default class SmartMagnifierPlugin extends Plugin {
  static options = {
    // Größen in rem
    idleSize: 5,
    approachSizeMin: 5,
    approachSizeMax: 7,
    zoomSize: 7,
    smartZoomMultiplier: 1.3,

    // Zoom-Faktoren
    zoomFactor: 2.5,
    smartZoomAdditional: 1,

    // Timing
    smartZoomDelay: 1500,
    approachDistance: 150,
    stillnessThreshold: 5,

    // Animation
    springStiffness: 0.15,
    springDamping: 0.85,

    // Selektoren
    productImageSelector:
      ".product-detail-media img, .gallery-slider-image, .gallery-slider-item img, .product-image-wrapper img, [data-smart-magnifier-target]",

    // Farben
    primaryColor: "#FF5432",
  };

  init() {
    // Shopware Core: Touch-Gerät Erkennung - Lupe deaktivieren auf Touch
    if (DeviceDetection.isTouchDevice()) {
      console.info("[SmartMagnifier] Disabled on touch device");
      return;
    }

    // Shopware Core: Viewport-basierte Aktivierung (nur Desktop)
    if (!this._isDesktop()) {
      console.info("[SmartMagnifier] Disabled on mobile/tablet viewport");
      return;
    }

    // State
    this._state = "idle";

    // Positionen
    this._mouseX = 0;
    this._mouseY = 0;
    this._lensX = 0;
    this._lensY = 0;
    this._velX = 0;
    this._velY = 0;

    // Größen
    this._currentSize = this.options.idleSize;
    this._currentZoom = this.options.zoomFactor;

    // Tracking
    this._activeImage = null;
    this._nearestImage = null;
    this._distanceToImage = Infinity;
    this._smartZoomTimer = null;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._animationFrame = null;

    // Image cache
    this._imageCache = new Map();

    // DOM erstellen
    this._createLens();
    this._cacheProductImages();
    this._bindEvents();
    this._startAnimation();

    console.log("[SmartMagnifier] 🔍 Initialized");
  }

  _isDesktop() {
    return (
      ViewportDetection.isLG() ||
      ViewportDetection.isXL() ||
      ViewportDetection.isXXL()
    );
  }

  /**
   * Erstellt das Lupen-Element
   * Struktur wie im Medium-Artikel:
   * <div class="magnifier">
   *   <img class="magnifier__image" /> <!-- Dupliziertes, vergrößertes Bild -->
   * </div>
   */
  _createLens() {
    // Container
    this._lens = document.createElement("div");
    this._lens.className = "hb-magnifier";
    this._lens.setAttribute("aria-hidden", "true");

    // Inneres Bild (wird dupliziert und vergrößert)
    this._lensImage = document.createElement("img");
    this._lensImage.className = "hb-magnifier__image";
    this._lensImage.setAttribute("aria-hidden", "true");
    this._lensImage.draggable = false;
    this._lens.appendChild(this._lensImage);

    // Zoom-Level Anzeige
    this._zoomLabel = document.createElement("span");
    this._zoomLabel.className = "hb-magnifier__zoom";
    this._zoomLabel.textContent = `${this.options.zoomFactor}×`;
    this._lens.appendChild(this._zoomLabel);

    // Styles injizieren
    this._injectStyles();

    // An Body anhängen
    document.body.appendChild(this._lens);
  }

  /**
   * CSS Styles - komplett eigenständig, keine Shopware-Overrides
   */
  _injectStyles() {
    if (document.getElementById("hb-magnifier-styles")) return;

    const css = document.createElement("style");
    css.id = "hb-magnifier-styles";
    css.textContent = `
      /* === Cursor ausblenden wenn aktiv === */
      body.hb-magnifier-active,
      body.hb-magnifier-active * {
        cursor: none !important;
      }

      /* === Hauptelement: Die Lupe === */
      .hb-magnifier {
        position: fixed;
        top: 0;
        left: 0;
        width: ${this.options.idleSize}rem;
        height: ${this.options.idleSize}rem;
        border-radius: 50%;
        overflow: hidden;
        pointer-events: none;
        z-index: 999999;
        
        /* Border & Schatten */
        border: 2px solid rgba(150, 150, 150, 0.3);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        
        /* Hintergrund für Idle-State */
        background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 60%, transparent 100%);
        backdrop-filter: blur(1px);
        
        /* Performance */
        will-change: transform, width, height;
        transform: translate(-50%, -50%);
        
        /* Transitions */
        transition: 
          width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
          height 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
          border-color 0.2s ease,
          box-shadow 0.25s ease;
        
        /* Initial versteckt */
        opacity: 0;
      }
      
      .hb-magnifier.is-visible {
        opacity: 1;
      }

      /* === Inneres Bild (vergrößert) === */
      .hb-magnifier__image {
        position: absolute;
        top: 0;
        left: 0;
        /* Größe wird per JS gesetzt */
        max-width: none;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      
      .hb-magnifier.is-zooming .hb-magnifier__image {
        opacity: 1;
      }

      /* === Zoom-Level Anzeige === */
      .hb-magnifier__zoom {
        position: absolute;
        bottom: -1.6rem;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.2rem 0.5rem;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 0.65rem;
        font-weight: 600;
        font-family: system-ui, -apple-system, sans-serif;
        border-radius: 3px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .hb-magnifier.is-zooming .hb-magnifier__zoom {
        opacity: 1;
      }
      
      .hb-magnifier.is-smart .hb-magnifier__zoom {
        background: linear-gradient(135deg, ${this.options.primaryColor} 0%, #ff7b5a 100%);
      }

      /* === State: Approaching (in der Nähe) === */
      .hb-magnifier.is-approaching {
        border-color: ${this.options.primaryColor};
        box-shadow: 
          0 0 30px rgba(255, 84, 50, 0.25),
          0 4px 20px rgba(0, 0, 0, 0.15);
        animation: hb-magnifier-breathe 2s ease-in-out infinite;
      }

      /* === State: Zooming (über Bild) === */
      .hb-magnifier.is-zooming {
        border-color: ${this.options.primaryColor};
        background: transparent;
        backdrop-filter: none;
        box-shadow: 
          0 0 40px rgba(255, 84, 50, 0.3),
          0 8px 30px rgba(0, 0, 0, 0.2);
      }

      /* === State: Smart Zoom (nach Stillstand) === */
      .hb-magnifier.is-smart {
        border-width: 3px;
        border-color: ${this.options.primaryColor};
        box-shadow: 
          0 0 60px rgba(255, 84, 50, 0.4),
          0 0 0 4px rgba(255, 84, 50, 0.1),
          0 12px 40px rgba(0, 0, 0, 0.25);
        animation: hb-magnifier-pulse 1.5s ease-in-out infinite;
      }

      /* === Animationen === */
      @keyframes hb-magnifier-breathe {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.08); }
      }
      
      @keyframes hb-magnifier-pulse {
        0%, 100% { 
          transform: translate(-50%, -50%) scale(1);
          box-shadow: 0 0 60px rgba(255, 84, 50, 0.4), 0 0 0 4px rgba(255, 84, 50, 0.1);
        }
        50% { 
          transform: translate(-50%, -50%) scale(1.03);
          box-shadow: 0 0 80px rgba(255, 84, 50, 0.5), 0 0 0 8px rgba(255, 84, 50, 0.15);
        }
      }

      /* === Reduced Motion === */
      @media (prefers-reduced-motion: reduce) {
        .hb-magnifier,
        .hb-magnifier.is-approaching,
        .hb-magnifier.is-smart {
          animation: none !important;
          transition: none !important;
        }
      }

      /* === Mobile: Ausblenden === */
      @media (max-width: 991px) {
        .hb-magnifier { display: none !important; }
        body.hb-magnifier-active * { cursor: auto !important; }
      }
    `;
    document.head.appendChild(css);
  }

  /**
   * Produktbilder cachen für schnellen Zugriff
   * Verwendet Shopware Core Iterator für sichere Iteration
   */
  _cacheProductImages() {
    // Shopware Core: DomAccess für sichere Selektion
    try {
      const images = DomAccess.querySelectorAll(
        document,
        this.options.productImageSelector,
        false // optional, nicht werfen wenn nicht gefunden
      );

      // Shopware Core: Iterator für sichere Iteration
      Iterator.iterate(images, (img) => {
        const highRes = this._getHighResUrl(img);
        this._imageCache.set(img, { highRes, preloaded: false });

        // Vorladen
        const preload = new Image();
        preload.onload = () => {
          const cached = this._imageCache.get(img);
          if (cached) {
            cached.preloaded = true;
            cached.naturalWidth = preload.naturalWidth;
            cached.naturalHeight = preload.naturalHeight;
          }
        };
        preload.src = highRes;
      });
    } catch (e) {
      // Keine Produktbilder gefunden - normal für Nicht-Produktseiten
      console.info("[SmartMagnifier] No product images found on this page");
    }
  }

  /**
   * High-Res URL aus srcset oder src
   */
  _getHighResUrl(img) {
    // srcset parsen
    if (img.srcset) {
      const sources = img.srcset.split(",").map((s) => {
        const [url, desc] = s.trim().split(/\s+/);
        let size = 1;
        if (desc?.endsWith("w")) size = parseInt(desc);
        else if (desc?.endsWith("x")) size = parseFloat(desc) * 1000;
        return { url, size };
      });
      sources.sort((a, b) => b.size - a.size);
      if (sources[0]) return sources[0].url;
    }
    return img.currentSrc || img.src;
  }

  /**
   * Events binden
   * Verwendet Shopware Core Debouncer für optimierte Event-Verarbeitung
   */
  _bindEvents() {
    // Shopware Core: Debouncer für optimierte Mausbewegung (Performance)
    this._debouncedProximityCheck = Debouncer.debounce(
      this._checkProximity.bind(this),
      16 // ~60fps
    );

    // Globale Maus-Events
    document.addEventListener("mousemove", this._onMouseMove.bind(this), {
      passive: true,
    });
    document.addEventListener("mouseenter", this._onDocEnter.bind(this));
    document.addEventListener("mouseleave", this._onDocLeave.bind(this));

    // Bild-Events - Shopware Core Iterator
    try {
      const images = DomAccess.querySelectorAll(
        document,
        this.options.productImageSelector,
        false
      );
      Iterator.iterate(images, (img) => {
        img.addEventListener("mouseenter", this._onImgEnter.bind(this));
        img.addEventListener("mouseleave", this._onImgLeave.bind(this));
      });
    } catch (e) {
      // Keine Bilder
    }

    // MutationObserver für dynamische Bilder
    this._observer = new MutationObserver((mutations) => {
      Iterator.iterate(mutations, (m) => {
        Iterator.iterate(m.addedNodes, (node) => {
          if (node.nodeType === 1 && node.querySelectorAll) {
            const imgs = node.querySelectorAll(
              this.options.productImageSelector
            );
            Iterator.iterate(imgs, (img) => {
              img.addEventListener("mouseenter", this._onImgEnter.bind(this));
              img.addEventListener("mouseleave", this._onImgLeave.bind(this));
              this._cacheImage(img);
            });
          }
        });
      });
    });
    this._observer.observe(document.body, { childList: true, subtree: true });
  }

  _cacheImage(img) {
    if (this._imageCache.has(img)) return;
    const highRes = this._getHighResUrl(img);
    this._imageCache.set(img, { highRes, preloaded: false });
    const preload = new Image();
    preload.onload = () => {
      const c = this._imageCache.get(img);
      if (c) {
        c.preloaded = true;
        c.naturalWidth = preload.naturalWidth;
        c.naturalHeight = preload.naturalHeight;
      }
    };
    preload.src = highRes;
  }

  /**
   * Mausbewegung
   */
  _onMouseMove(e) {
    this._mouseX = e.clientX;
    this._mouseY = e.clientY;

    // Proximity prüfen
    this._checkProximity();

    // Stillstand prüfen
    this._checkStillness();
  }

  _onDocEnter() {
    document.body.classList.add("hb-magnifier-active");
    this._lens.classList.add("is-visible");
  }

  _onDocLeave() {
    document.body.classList.remove("hb-magnifier-active");
    this._lens.classList.remove("is-visible");
    this._setState("idle");
  }

  _onImgEnter(e) {
    this._activeImage = e.target;
    this._setState("zooming");

    // Bild in Lupe laden
    const cached = this._imageCache.get(e.target);
    if (cached) {
      this._lensImage.src = cached.highRes;
    }
  }

  _onImgLeave() {
    this._activeImage = null;
    this._clearSmartZoom();
    this._checkProximity();
  }

  /**
   * Proximity zu Produktbildern prüfen
   * Verwendet Shopware Core Iterator
   */
  _checkProximity() {
    if (this._activeImage) return; // Bereits über Bild

    try {
      const images = DomAccess.querySelectorAll(
        document,
        this.options.productImageSelector,
        false
      );
      let minDist = Infinity;

      // Shopware Core Iterator
      Iterator.iterate(images, (img) => {
        const rect = img.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = this._mouseX - cx;
        const dy = this._mouseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) minDist = dist;
      });

      this._distanceToImage = minDist;

      if (minDist <= this.options.approachDistance) {
        this._setState("approaching");
      } else {
        this._setState("idle");
      }
    } catch (e) {
      this._setState("idle");
    }
  }

  /**
   * Stillstand für Smart-Zoom prüfen
   */
  _checkStillness() {
    if (this._state !== "zooming") {
      this._clearSmartZoom();
      return;
    }

    const dx = Math.abs(this._mouseX - this._lastMouseX);
    const dy = Math.abs(this._mouseY - this._lastMouseY);

    if (
      dx > this.options.stillnessThreshold ||
      dy > this.options.stillnessThreshold
    ) {
      this._lastMouseX = this._mouseX;
      this._lastMouseY = this._mouseY;
      this._clearSmartZoom();
      if (this._state === "smartZoom") this._setState("zooming");
    } else if (!this._smartZoomTimer && this._state === "zooming") {
      this._smartZoomTimer = setTimeout(
        () => this._activateSmartZoom(),
        this.options.smartZoomDelay
      );
    }
  }

  _activateSmartZoom() {
    if (this._state !== "zooming") return;
    this._setState("smartZoom");
    this._currentZoom =
      this.options.zoomFactor + this.options.smartZoomAdditional;
    this._zoomLabel.textContent = `${this._currentZoom}×`;
  }

  _clearSmartZoom() {
    if (this._smartZoomTimer) {
      clearTimeout(this._smartZoomTimer);
      this._smartZoomTimer = null;
    }
    this._currentZoom = this.options.zoomFactor;
    this._zoomLabel.textContent = `${this._currentZoom}×`;
  }

  /**
   * State setzen
   */
  _setState(state) {
    if (this._state === state) return;
    this._state = state;

    // Klassen entfernen
    this._lens.classList.remove("is-approaching", "is-zooming", "is-smart");

    // Größe & Klasse setzen
    switch (state) {
      case "idle":
        this._currentSize = this.options.idleSize;
        break;
      case "approaching":
        this._lens.classList.add("is-approaching");
        this._currentSize =
          (this.options.approachSizeMin + this.options.approachSizeMax) / 2;
        break;
      case "zooming":
        this._lens.classList.add("is-zooming");
        this._currentSize = this.options.zoomSize;
        this._currentZoom = this.options.zoomFactor;
        this._zoomLabel.textContent = `${this._currentZoom}×`;
        break;
      case "smartZoom":
        this._lens.classList.add("is-zooming", "is-smart");
        this._currentSize =
          this.options.zoomSize * this.options.smartZoomMultiplier;
        break;
    }

    // Größe anwenden
    this._lens.style.width = `${this._currentSize}rem`;
    this._lens.style.height = `${this._currentSize}rem`;
  }

  /**
   * Animation Loop - Spring Physics + Zoom Rendering
   */
  _startAnimation() {
    const animate = () => {
      // Spring-basiertes Following
      const dx = this._mouseX - this._lensX;
      const dy = this._mouseY - this._lensY;

      this._velX += dx * this.options.springStiffness;
      this._velY += dy * this.options.springStiffness;
      this._velX *= this.options.springDamping;
      this._velY *= this.options.springDamping;

      this._lensX += this._velX;
      this._lensY += this._velY;

      // Position anwenden (GPU-beschleunigt)
      this._lens.style.left = `${this._lensX}px`;
      this._lens.style.top = `${this._lensY}px`;

      // Zoom rendern wenn über Bild
      if (
        (this._state === "zooming" || this._state === "smartZoom") &&
        this._activeImage
      ) {
        this._renderZoom();
      }

      this._animationFrame = requestAnimationFrame(animate);
    };

    this._animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Zoom rendern - Kern der Magnifier-Technik
   * Das innere Bild wird vergrößert und basierend auf Cursor-Position positioniert
   */
  _renderZoom() {
    const img = this._activeImage;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const cached = this._imageCache.get(img);

    // Relative Position (0-1)
    const relX = (this._lensX - rect.left) / rect.width;
    const relY = (this._lensY - rect.top) / rect.height;

    // Clampen
    const clampX = Math.max(0, Math.min(1, relX));
    const clampY = Math.max(0, Math.min(1, relY));

    // Linsen-Größe in Pixel
    const lensPx = this._currentSize * 16; // rem zu px (annahme: 16px base)

    // Bild-Größe gezoomt
    const imgW = rect.width * this._currentZoom;
    const imgH = rect.height * this._currentZoom;

    // Bild-Position (zentriert auf Cursor-Position)
    const imgX = -(clampX * imgW) + lensPx / 2;
    const imgY = -(clampY * imgH) + lensPx / 2;

    // Anwenden
    this._lensImage.style.width = `${imgW}px`;
    this._lensImage.style.height = `${imgH}px`;
    this._lensImage.style.left = `${imgX}px`;
    this._lensImage.style.top = `${imgY}px`;
  }

  /**
   * Cleanup - Shopware Plugin Lifecycle
   */
  destroy() {
    // Animation stoppen
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }

    // Timer stoppen
    if (this._smartZoomTimer) {
      clearTimeout(this._smartZoomTimer);
      this._smartZoomTimer = null;
    }

    // Observer stoppen
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    // DOM aufräumen
    if (this._lens?.parentNode) {
      this._lens.parentNode.removeChild(this._lens);
      this._lens = null;
    }

    // Body-Klasse entfernen
    document.body.classList.remove("hb-magnifier-active");

    // Image-Cache leeren
    this._imageCache.clear();

    // Shopware Core: Super destroy aufrufen
    super.destroy();
  }
}
