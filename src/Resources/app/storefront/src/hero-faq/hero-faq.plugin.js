import Plugin from "src/plugin-system/plugin.class";
import DomAccess from "src/helper/dom-access.helper";

/**
 * Hero FAQ Plugin
 * 
 * Accordion-Funktionalität für FAQ Block mit:
 * - Single/Multiple Accordion Behavior
 * - Icon-Animation (180deg Rotation)
 * - Smooth max-height Animation
 * - ARIA-Attributes für Accessibility
 */
export default class HeroFaqPlugin extends Plugin {
  static options = {
    toggleSelector: ".hero-faq-toggle",
    itemSelector: ".hero-faq-item",
    answerSelector: ".hero-faq-answer",
    accordionBehavior: "single", // 'single' oder 'multiple'
    openFirstItem: true,
  };

  init() {
    console.log("[HeroFaqPlugin] Initializing...");

    // Options aus data-hero-faq-options überschreiben
    try {
      const dataOptions = this.el.dataset.heroFaqOptions;
      if (dataOptions) {
        const parsedOptions = JSON.parse(dataOptions);
        this.options = { ...this.options, ...parsedOptions };
      }
    } catch (e) {
      console.error("[HeroFaqPlugin] Error parsing options:", e);
    }

    this._registerEvents();

    console.log("[HeroFaqPlugin] Initialized with options:", this.options);
  }

  _registerEvents() {
    const toggles = DomAccess.querySelectorAll(
      this.el,
      this.options.toggleSelector,
      false
    );

    if (!toggles || toggles.length === 0) {
      console.warn("[HeroFaqPlugin] No FAQ toggles found");
      return;
    }

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", this._onToggleClick.bind(this));
    });
  }

  _onToggleClick(event) {
    event.preventDefault();
    
    const toggle = event.currentTarget;
    const item = toggle.closest(this.options.itemSelector);
    const targetId = toggle.getAttribute("data-faq-target");
    
    if (!targetId) {
      console.error("[HeroFaqPlugin] No data-faq-target attribute found");
      return;
    }

    const target = DomAccess.querySelector(this.el, targetId, false);
    
    if (!target) {
      console.error("[HeroFaqPlugin] Target not found:", targetId);
      return;
    }

    const isOpen = item.classList.contains("is--open");

    // Bei 'single' Behavior: Alle anderen schließen
    if (this.options.accordionBehavior === "single" && !isOpen) {
      this._closeAll();
    }

    // Toggle aktuelles Item
    if (isOpen) {
      this._collapse(item, toggle, target);
    } else {
      this._expand(item, toggle, target);
    }
  }

  _expand(item, toggle, target) {
    // Item als geöffnet markieren
    item.classList.add("is--open");
    
    // ARIA-Attribute setzen
    toggle.setAttribute("aria-expanded", "true");
    
    // Hidden-Attribut entfernen
    target.removeAttribute("hidden");
    
    // Smooth animation mit max-height
    // Kurz warten damit Browser reflow triggert
    setTimeout(() => {
      const contentHeight = target.scrollHeight;
      target.style.maxHeight = contentHeight + "px";
      target.style.opacity = "1";
    }, 10);

    console.log("[HeroFaqPlugin] Expanded item");
  }

  _collapse(item, toggle, target) {
    // Item als geschlossen markieren
    item.classList.remove("is--open");
    
    // ARIA-Attribute setzen
    toggle.setAttribute("aria-expanded", "false");
    
    // Max-height zurücksetzen
    target.style.maxHeight = "0";
    target.style.opacity = "0";
    
    // Hidden-Attribut nach Animation setzen
    setTimeout(() => {
      target.setAttribute("hidden", "");
    }, 400); // Match CSS transition duration

    console.log("[HeroFaqPlugin] Collapsed item");
  }

  _closeAll() {
    const items = DomAccess.querySelectorAll(
      this.el,
      this.options.itemSelector,
      false
    );

    if (!items) return;

    items.forEach((item) => {
      const toggle = DomAccess.querySelector(
        item,
        this.options.toggleSelector,
        false
      );
      const answer = DomAccess.querySelector(
        item,
        this.options.answerSelector,
        false
      );

      if (toggle && answer && item.classList.contains("is--open")) {
        this._collapse(item, toggle, answer);
      }
    });
  }
}
