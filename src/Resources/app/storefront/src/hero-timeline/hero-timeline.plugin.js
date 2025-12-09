/**
 * Hero Timeline Plugin
 * Basierend auf: https://www.horex.com/planet-horex/chronik/
 * 
 * Features:
 * - Jahres-Navigation mit Smooth-Transitions
 * - INITIAL: Kein Item geöffnet - erst bei Klick auf Jahr-Button
 * - Aktiver Badge Update + Vertikale Linie Animation
 * - Bilder-Slider pro Item
 */

import Plugin from 'src/plugin-system/plugin.class';

export default class HeroTimelinePlugin extends Plugin {
    static options = {
        itemSelector: '[data-timeline-item]',
        yearBtnSelector: '.hero-timeline__year-btn',
        activeBadgeSelector: '[data-timeline-active-badge]',
        verticalLineSelector: '[data-timeline-vertical-line]',
        contentAreaSelector: '[data-timeline-content-area]',
        slideSelector: '.hero-timeline__slide',
        dotSelector: '.hero-timeline__dot',
        prevSelector: '.hero-timeline__nav--prev',
        nextSelector: '.hero-timeline__nav--next',
        activeClass: 'is--active',
        visibleClass: 'is--visible',
        animatingInClass: 'is--animating-in',
        animationDuration: 400,
        verticalLineHeight: 60, // px
    };

    init() {
        this.items = Array.from(this.el.querySelectorAll(this.options.itemSelector));
        this.yearBtns = Array.from(this.el.querySelectorAll(this.options.yearBtnSelector));
        this.activeBadge = this.el.querySelector(this.options.activeBadgeSelector);
        this.verticalLine = this.el.querySelector(this.options.verticalLineSelector);
        this.contentArea = this.el.querySelector(this.options.contentAreaSelector);
        this.activeIndex = -1; // Wird nach _initFirstItem auf 0 gesetzt
        this.isAnimating = false;
        this.sliders = new Map();

        this._registerEvents();
        this._initSliders();
        this._initFirstItem(); // WICHTIG: Erstes Item initial aktivieren
    }

    /**
     * Erstes Item (1894) initial aktivieren beim Page Load
     */
    _initFirstItem() {
        if (this.items.length > 0) {
            // Erstes Item direkt aktivieren (ohne Animation)
            this._activateItem(0);
        }
    }

    _registerEvents() {
        // Year Button Clicks
        this.yearBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.timelineIndex, 10);
                if (!isNaN(index)) {
                    this._activateItem(index);
                }
            });
        });
    }

    _initSliders() {
        this.items.forEach((item, itemIndex) => {
            const slides = Array.from(item.querySelectorAll(this.options.slideSelector));
            const dots = Array.from(item.querySelectorAll(this.options.dotSelector));
            const prevBtn = item.querySelector(this.options.prevSelector);
            const nextBtn = item.querySelector(this.options.nextSelector);

            if (slides.length === 0) {
                return;
            }

            // Slider-State initialisieren
            const sliderState = {
                slides,
                dots,
                currentSlide: 0,
            };
            this.sliders.set(itemIndex, sliderState);

            // Ersten Slide aktivieren
            slides.forEach((slide, i) => {
                slide.classList.toggle(this.options.activeClass, i === 0);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle(this.options.activeClass, i === 0);
            });

            // Navigation Events
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._prevSlide(itemIndex);
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._nextSlide(itemIndex);
                });
            }

            // Dot Events
            dots.forEach((dot, dotIndex) => {
                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._goToSlide(itemIndex, dotIndex);
                });
            });
        });
    }

    _activateItem(index) {
        if (index === this.activeIndex || this.isAnimating) {
            return;
        }

        if (index < 0 || index >= this.items.length) {
            return;
        }

        this.isAnimating = true;

        const nextItem = this.items[index];
        const nextBtn = this.yearBtns[index];
        const year = nextBtn?.dataset.year || '----';

        // Wenn vorher ein Item aktiv war, ausblenden
        if (this.activeIndex >= 0) {
            const currentItem = this.items[this.activeIndex];
            const currentBtn = this.yearBtns[this.activeIndex];

            // Aktuelles Item ausblenden
            currentItem.classList.remove(this.options.activeClass);
            currentItem.style.display = 'none';
            currentBtn?.classList.remove(this.options.activeClass);
        }

        // Content Area sichtbar machen (falls noch versteckt)
        if (this.contentArea) {
            this.contentArea.style.display = '';
            this.contentArea.classList.add(this.options.visibleClass);
        }

        // Badge sichtbar machen und Jahr aktualisieren
        if (this.activeBadge) {
            this.activeBadge.textContent = year;
            this.activeBadge.style.opacity = '1';
            this.activeBadge.classList.add(this.options.visibleClass);
        }

        // Vertikale Linie animieren
        if (this.verticalLine) {
            this.verticalLine.style.height = `${this.options.verticalLineHeight}px`;
        }

        // Neues Item anzeigen
        setTimeout(() => {
            nextItem.style.display = '';
            nextItem.classList.add(this.options.activeClass, this.options.animatingInClass);
            nextBtn?.classList.add(this.options.activeClass);

            this.activeIndex = index;

            setTimeout(() => {
                nextItem.classList.remove(this.options.animatingInClass);
                this.isAnimating = false;
            }, this.options.animationDuration);

        }, this.activeIndex >= 0 ? 200 : 0); // Delay nur wenn vorher Item aktiv war
    }

    _prevSlide(itemIndex) {
        const state = this.sliders.get(itemIndex);
        if (!state || state.slides.length <= 1) return;

        const newIndex = state.currentSlide === 0 
            ? state.slides.length - 1 
            : state.currentSlide - 1;
        
        this._goToSlide(itemIndex, newIndex);
    }

    _nextSlide(itemIndex) {
        const state = this.sliders.get(itemIndex);
        if (!state || state.slides.length <= 1) return;

        const newIndex = state.currentSlide === state.slides.length - 1 
            ? 0 
            : state.currentSlide + 1;
        
        this._goToSlide(itemIndex, newIndex);
    }

    _goToSlide(itemIndex, slideIndex) {
        const state = this.sliders.get(itemIndex);
        if (!state || slideIndex === state.currentSlide) return;

        // Update slides
        state.slides.forEach((slide, i) => {
            slide.classList.toggle(this.options.activeClass, i === slideIndex);
        });

        // Update dots
        state.dots.forEach((dot, i) => {
            dot.classList.toggle(this.options.activeClass, i === slideIndex);
        });

        state.currentSlide = slideIndex;
    }
}
