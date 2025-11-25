/**
 * Hero Mega Menu - Interactive Behavior
 * 
 * Best Practices für Hover/Click:
 * - Desktop: Hover öffnet Dropdown, Click navigiert direkt
 * - Mobile: Erster Click öffnet Dropdown, zweiter Click navigiert
 * - Keyboard: Enter/Space togglet, Escape schließt
 * - Accessibility: ARIA-Attribute werden aktualisiert
 */

class HeroMegaMenuPlugin {
    constructor(element) {
        this.element = element;
        this.nav = element.querySelector('.hero-mega-menu-nav');
        this.navItems = element.querySelectorAll('.hero-mega-menu-nav__item--has-children');
        this.hoverDelay = 150; // ms - Hover-Intent Delay
        this.hoverTimeout = null;
        this.isMobile = window.innerWidth <= 991;
        this.openItems = new Set();

        this.init();
    }

    init() {
        console.log('[HeroMegaMenu] Initialisiere Mega Menu Plugin');
        
        // Event Listeners für jedes Nav-Item
        this.navItems.forEach(item => {
            this.initNavItem(item);
        });

        // Window Resize Handler
        window.addEventListener('resize', this.handleResize.bind(this));

        // Close on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Close on Escape key
        document.addEventListener('keydown', this.handleEscapeKey.bind(this));
    }

    initNavItem(item) {
        const link = item.querySelector('.hero-mega-menu-nav__link');
        const dropdown = item.querySelector('.hero-mega-menu-nav__dropdown');

        if (!link || !dropdown) return;

        // Desktop: Hover Events
        if (!this.isMobile) {
            // Hover auf Item
            item.addEventListener('mouseenter', (e) => {
                this.handleMouseEnter(item, link, dropdown);
            });

            item.addEventListener('mouseleave', (e) => {
                this.handleMouseLeave(item, link, dropdown);
            });

            // Click auf Link - direktes Navigieren (wenn href vorhanden)
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                // Nur wenn href existiert und nicht leer ist
                if (href && href !== '' && href !== '#') {
                    // Navigieren lassen (kein preventDefault)
                    console.log('[HeroMegaMenu] Desktop: Navigiere zu', href);
                } else {
                    // Kein href - preventDefault und toggle Dropdown
                    e.preventDefault();
                    this.toggleDropdown(item, link, dropdown);
                }
            });
        } else {
            // Mobile: Click Events
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                const isOpen = item.classList.contains('is--open');

                // Wenn Dropdown geschlossen ist - öffnen und preventDefault
                if (!isOpen) {
                    e.preventDefault();
                    this.openDropdown(item, link, dropdown);
                    console.log('[HeroMegaMenu] Mobile: Dropdown geöffnet');
                } else {
                    // Dropdown ist offen
                    // Wenn href vorhanden - navigieren lassen
                    // Wenn kein href - dropdown bleibt offen
                    if (!href || href === '' || href === '#') {
                        e.preventDefault();
                    } else {
                        console.log('[HeroMegaMenu] Mobile: Navigiere zu', href);
                    }
                }
            });
        }

        // Keyboard Navigation (beide Modi)
        link.addEventListener('keydown', (e) => {
            this.handleKeyDown(e, item, link, dropdown);
        });

        // Focus Management
        link.addEventListener('focus', () => {
            if (!this.isMobile) {
                this.openDropdown(item, link, dropdown);
            }
        });
    }

    handleMouseEnter(item, link, dropdown) {
        // Clear any existing timeout
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        // Hover-Intent: Kleine Verzögerung vor dem Öffnen
        this.hoverTimeout = setTimeout(() => {
            this.openDropdown(item, link, dropdown);
        }, this.hoverDelay);
    }

    handleMouseLeave(item, link, dropdown) {
        // Clear hover timeout
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        // Verzögerung vor dem Schließen (damit User zum Dropdown navigieren kann)
        this.hoverTimeout = setTimeout(() => {
            this.closeDropdown(item, link, dropdown);
        }, this.hoverDelay);
    }

    handleKeyDown(e, item, link, dropdown) {
        const isOpen = item.classList.contains('is--open');

        switch (e.key) {
            case 'Enter':
            case ' ': // Space
                // Wenn aria-haspopup="true" - toggle Dropdown
                if (link.getAttribute('aria-haspopup') === 'true') {
                    e.preventDefault();
                    this.toggleDropdown(item, link, dropdown);
                }
                // Sonst: Normales Enter-Verhalten (Link folgen)
                break;

            case 'Escape':
                if (isOpen) {
                    e.preventDefault();
                    this.closeDropdown(item, link, dropdown);
                    link.focus(); // Focus zurück zum Link
                }
                break;

            case 'ArrowDown':
                if (!isOpen && link.getAttribute('aria-haspopup') === 'true') {
                    e.preventDefault();
                    this.openDropdown(item, link, dropdown);
                    // Focus auf erstes Element im Dropdown
                    this.focusFirstDropdownLink(dropdown);
                }
                break;

            case 'ArrowUp':
                if (isOpen) {
                    e.preventDefault();
                    this.closeDropdown(item, link, dropdown);
                }
                break;
        }
    }

    openDropdown(item, link, dropdown) {
        // Close all other dropdowns
        this.closeAllDropdowns();

        // Open this dropdown
        item.classList.add('is--open');
        link.setAttribute('aria-expanded', 'true');
        dropdown.setAttribute('aria-hidden', 'false');
        this.openItems.add(item);

        console.log('[HeroMegaMenu] Dropdown geöffnet:', link.textContent.trim());
    }

    closeDropdown(item, link, dropdown) {
        item.classList.remove('is--open');
        link.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
        this.openItems.delete(item);

        console.log('[HeroMegaMenu] Dropdown geschlossen:', link.textContent.trim());
    }

    toggleDropdown(item, link, dropdown) {
        const isOpen = item.classList.contains('is--open');
        if (isOpen) {
            this.closeDropdown(item, link, dropdown);
        } else {
            this.openDropdown(item, link, dropdown);
        }
    }

    closeAllDropdowns() {
        this.navItems.forEach(item => {
            const link = item.querySelector('.hero-mega-menu-nav__link');
            const dropdown = item.querySelector('.hero-mega-menu-nav__dropdown');
            if (link && dropdown) {
                this.closeDropdown(item, link, dropdown);
            }
        });
        this.openItems.clear();
    }

    handleOutsideClick(e) {
        // Wenn Click außerhalb des Mega Menus - alle Dropdowns schließen
        if (!this.element.contains(e.target)) {
            this.closeAllDropdowns();
        }
    }

    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            this.closeAllDropdowns();
        }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 991;

        // Wenn Mode gewechselt hat - alle Dropdowns schließen und neu initialisieren
        if (wasMobile !== this.isMobile) {
            console.log('[HeroMegaMenu] Modus gewechselt:', this.isMobile ? 'Mobile' : 'Desktop');
            this.closeAllDropdowns();
            // Event Listeners würden normalerweise neu gesetzt, 
            // aber CSS übernimmt das Verhalten größtenteils
        }
    }

    focusFirstDropdownLink(dropdown) {
        const firstLink = dropdown.querySelector('a[href]');
        if (firstLink) {
            firstLink.focus();
        }
    }

    destroy() {
        // Cleanup
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }
        this.closeAllDropdowns();
    }
}

// ============================================================================
// Auto-Initialisierung
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[HeroMegaMenu] DOM Content Loaded');
    
    const megaMenuElements = document.querySelectorAll('[data-hero-mega-menu="true"]');
    console.log('[HeroMegaMenu] Gefundene Mega Menus:', megaMenuElements.length);

    megaMenuElements.forEach(element => {
        new HeroMegaMenuPlugin(element);
    });
});

// Export für mögliche externe Verwendung
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroMegaMenuPlugin;
}

// Global für direkten Zugriff
window.HeroMegaMenuPlugin = HeroMegaMenuPlugin;

