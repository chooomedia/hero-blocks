/**
 * Hero Two Columns Parallax Plugin
 * 
 * Implementiert Scroll-Animationen für den Hero Two Columns Block:
 * - Parallax-Effekt für Background-Bilder (left/right)
 * - Element-Animationen (left/right Slots)
 * 
 * Gemäß Shopware 6 Best Practices für Storefront JavaScript Plugins
 */

import Plugin from 'src/plugin-system/plugin.class';
import DomAccess from 'src/helper/dom-access.helper';
import ViewportDetection from 'src/helper/viewport-detection.helper';

export default class HeroTwoColumnsParallaxPlugin extends Plugin {
    
    static options = {
        // Parallax Settings
        parallaxIntensity: 0.3, // Intensität des Parallax-Effekts (0-1)
        parallaxAngle: 33, // Standard Winkel für Parallax (deg)
        
        // Element Animation Settings
        elementAnimationOffset: 100, // Offset von oben (px) bevor Animation startet
        elementAnimationDuration: 800, // Animation Dauer (ms)
        
        // Selectors
        backgroundSelector: '.hero-two-columns-background',
        backgroundLeftSelector: '.hero-two-columns-background--left',
        backgroundRightSelector: '.hero-two-columns-background--right',
        elementWrapperSelector: '.hero-two-columns-element-wrapper',
        imageContainerSelector: '.cms-image-container',
        
        // Data Attributes
        dataParallaxBackground: 'data-parallax-background',
        dataScrollAnimate: 'data-scroll-animate',
        dataScrollAnimationAngle: 'data-scroll-animation-angle',
        dataScrollAnimationEnabled: 'data-scroll-animation-enabled',
        dataTranslateX: 'data-translate-x',
        dataTranslateY: 'data-translate-y',
        dataImageContainerCss: 'data-image-container-css',
        dataCustomCss: 'data-custom-css',
    };
    
    init() {
        // Get Block Element
        this.block = this.el;
        
        // Get Background Elements
        this.backgroundLeft = DomAccess.querySelector(
            this.block, 
            this.options.backgroundLeftSelector, 
            false
        );
        this.backgroundRight = DomAccess.querySelector(
            this.block, 
            this.options.backgroundRightSelector, 
            false
        );
        
        // Get Element Wrappers (left/right Slots)
        this.elementWrappers = DomAccess.querySelectorAll(
            this.block,
            this.options.elementWrapperSelector,
            false
        );
        
        // Check if Parallax is Enabled
        this.parallaxEnabled = this._isParallaxEnabled();
        
        // Check if Element Animations are Enabled
        this.elementAnimationsEnabled = this._hasElementAnimations();
        
        // Bind Event Handlers
        this._onScroll = this._onScroll.bind(this);
        this._onResize = this._onResize.bind(this);
        
        // Initialize
        if (this.parallaxEnabled || this.elementAnimationsEnabled) {
            this._registerEvents();
            // Initial scroll check (in case block is already visible)
            this._onScroll();
        }
        
        // WICHTIG: Custom CSS auf Element-Wrapper und Image-Container anwenden
        this._applyCustomCss();
    }
    
    /**
     * Apply Custom CSS from data attributes
     * - data-custom-css: CSS für den Element-Wrapper (nur Desktop)
     * - data-image-container-css: CSS für den .cms-image-container (nur Desktop)
     * 
     * WICHTIG: Diese Methode wird sowohl bei init() als auch bei resize() aufgerufen
     */
    _applyCustomCss() {
        if (!this.elementWrappers || this.elementWrappers.length === 0) {
            return;
        }
        
        // Prüfe ob Desktop (nicht Mobile/Tablet)
        const isMobile = this._isMobileViewport();
        
        for (const wrapper of this.elementWrappers) {
            // Custom CSS für Element-Wrapper (nur Desktop)
            if (!isMobile) {
                const customCss = wrapper.getAttribute(this.options.dataCustomCss);
                if (customCss) {
                    this._applyCssString(wrapper, customCss);
                }
            }
            
            // Custom CSS für Image-Container (nur Desktop)
            // WICHTIG: data-image-container-css wird auf den .cms-image-container angewendet
            const imageContainerCss = wrapper.getAttribute(this.options.dataImageContainerCss);
            if (imageContainerCss) {
                // Suche nach allen möglichen Image-Container Selektoren
                const imageContainers = wrapper.querySelectorAll(
                    '.cms-image-container, .cms-element-image .cms-image-container'
                );
                
                if (imageContainers.length > 0) {
                    for (const imageContainer of imageContainers) {
                        if (!isMobile) {
                            this._applyCssString(imageContainer, imageContainerCss);
                            // Markiere als CSS-angewendet für Debugging
                            imageContainer.setAttribute('data-custom-css-applied', 'true');
                        }
                    }
                } else {
                    // Fallback: Suche nach dem ersten Image-Container im Wrapper
                    const imageContainer = wrapper.querySelector(this.options.imageContainerSelector);
                    if (imageContainer && !isMobile) {
                        this._applyCssString(imageContainer, imageContainerCss);
                        imageContainer.setAttribute('data-custom-css-applied', 'true');
                    }
                }
            }
        }
    }
    
    /**
     * Apply CSS string to element
     * Parses "property: value; property2: value2;" format
     */
    _applyCssString(element, cssString) {
        if (!element || !cssString) {
            return;
        }
        
        // Parse CSS string
        const declarations = cssString.split(';').filter(d => d.trim());
        
        for (const declaration of declarations) {
            const [property, value] = declaration.split(':').map(s => s.trim());
            if (property && value) {
                // Convert kebab-case to camelCase for style property
                const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                element.style[camelProperty] = value;
            }
        }
    }
    
    /**
     * Check if current viewport is mobile
     */
    _isMobileViewport() {
        // Viewport Detection: md breakpoint = 768px
        return window.innerWidth < 768;
    }
    
    /**
     * Register Scroll and Resize Events
     */
    _registerEvents() {
        // WICHTIG: Throttle scroll event für Performance
        let scrollTicking = false;
        
        window.addEventListener('scroll', () => {
            if (!scrollTicking) {
                window.requestAnimationFrame(() => {
                    this._onScroll();
                    scrollTicking = false;
                });
                scrollTicking = true;
            }
        });
        
        // WICHTIG: Resize Event für responsive CSS-Anwendung
        let resizeTicking = false;
        
        window.addEventListener('resize', () => {
            if (!resizeTicking) {
                window.requestAnimationFrame(() => {
                    this._onResize();
                    resizeTicking = false;
                });
                resizeTicking = true;
            }
        });
        
        // Initial call
        this._onScroll();
    }
    
    /**
     * Handle Resize Event
     * Aktualisiert Custom CSS basierend auf Viewport-Größe
     */
    _onResize() {
        // Re-apply Custom CSS (entfernt/setzt CSS basierend auf Viewport)
        this._resetCustomCss();
        this._applyCustomCss();
    }
    
    /**
     * Reset Custom CSS (für Viewport-Wechsel)
     */
    _resetCustomCss() {
        if (!this.elementWrappers || this.elementWrappers.length === 0) {
            return;
        }
        
        for (const wrapper of this.elementWrappers) {
            // Reset Image Container CSS
            const imageContainer = wrapper.querySelector(this.options.imageContainerSelector);
            if (imageContainer) {
                // Entferne nur die dynamisch gesetzten Styles
                const imageContainerCss = wrapper.getAttribute(this.options.dataImageContainerCss);
                if (imageContainerCss) {
                    this._removeCssProperties(imageContainer, imageContainerCss);
                }
            }
            
            // Reset Wrapper CSS
            const customCss = wrapper.getAttribute(this.options.dataCustomCss);
            if (customCss) {
                this._removeCssProperties(wrapper, customCss);
            }
        }
    }
    
    /**
     * Remove CSS properties from element
     */
    _removeCssProperties(element, cssString) {
        if (!element || !cssString) {
            return;
        }
        
        const declarations = cssString.split(';').filter(d => d.trim());
        
        for (const declaration of declarations) {
            const [property] = declaration.split(':').map(s => s.trim());
            if (property) {
                const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                element.style[camelProperty] = '';
            }
        }
    }
    
    /**
     * Handle Scroll Event
     */
    _onScroll() {
        // Update Parallax Backgrounds
        if (this.parallaxEnabled) {
            this._updateParallax();
        }
        
        // Update Element Animations
        if (this.elementAnimationsEnabled) {
            this._updateElementAnimations();
        }
    }
    
    /**
     * Check if Parallax is Enabled
     */
    _isParallaxEnabled() {
        // Prüfe ob Background Elements vorhanden sind
        if (!this.backgroundLeft && !this.backgroundRight) {
            return false;
        }
        
        // Prüfe ob Parallax explizit disabled ist
        if (this.backgroundLeft) {
            const enabled = this.backgroundLeft.getAttribute(
                this.options.dataScrollAnimationEnabled
            );
            if (enabled === 'false') {
                return false;
            }
        }
        
        if (this.backgroundRight) {
            const enabled = this.backgroundRight.getAttribute(
                this.options.dataScrollAnimationEnabled
            );
            if (enabled === 'false') {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if Element Animations are Enabled
     */
    _hasElementAnimations() {
        if (!this.elementWrappers || this.elementWrappers.length === 0) {
            return false;
        }
        
        // Prüfe ob mindestens ein Element Animationen hat
        for (const wrapper of this.elementWrappers) {
            const animate = wrapper.getAttribute(this.options.dataScrollAnimate);
            if (animate === 'true') {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Update Parallax Background Positions
     */
    _updateParallax() {
        // Get Block Position
        const blockRect = this.block.getBoundingClientRect();
        const blockTop = blockRect.top;
        const blockHeight = blockRect.height;
        const viewportHeight = window.innerHeight;
        
        // Check if Block is Visible
        if (blockTop > viewportHeight || blockTop + blockHeight < 0) {
            return;
        }
        
        // Calculate Scroll Progress (0 = top of viewport, 1 = bottom of viewport)
        // WICHTIG: Verwende relative Position innerhalb des Viewports
        const scrollProgress = (viewportHeight - blockTop) / (viewportHeight + blockHeight);
        
        // Update Left Background
        if (this.backgroundLeft) {
            const angle = this._getParallaxAngle(this.backgroundLeft);
            const offsetY = this._calculateParallaxOffset(scrollProgress, angle);
            this.backgroundLeft.style.transform = `translateY(${offsetY}px) rotate(${angle}deg)`;
        }
        
        // Update Right Background
        if (this.backgroundRight) {
            const angle = this._getParallaxAngle(this.backgroundRight);
            // WICHTIG: Right Background bewegt sich in entgegengesetzte Richtung
            const offsetY = -this._calculateParallaxOffset(scrollProgress, angle);
            this.backgroundRight.style.transform = `translateY(${offsetY}px) rotate(${angle}deg)`;
        }
    }
    
    /**
     * Get Parallax Angle from Data Attribute
     */
    _getParallaxAngle(element) {
        const angle = element.getAttribute(this.options.dataScrollAnimationAngle);
        return angle ? parseFloat(angle) : this.options.parallaxAngle;
    }
    
    /**
     * Calculate Parallax Offset
     */
    _calculateParallaxOffset(scrollProgress, angle) {
        // WICHTIG: Offset basiert auf Scroll-Progress und Winkel
        // Größerer Winkel = größerer Offset
        const maxOffset = 100; // Max Offset in px
        const angleMultiplier = Math.abs(Math.sin(angle * Math.PI / 180));
        const offset = (scrollProgress - 0.5) * maxOffset * angleMultiplier * this.options.parallaxIntensity * 2;
        return offset;
    }
    
    /**
     * Update Element Animations
     */
    _updateElementAnimations() {
        if (!this.elementWrappers || this.elementWrappers.length === 0) {
            return;
        }
        
        // Get Viewport Height
        const viewportHeight = window.innerHeight;
        
        // Update Each Element Wrapper
        for (const wrapper of this.elementWrappers) {
            // Check if Animation is Enabled
            const animate = wrapper.getAttribute(this.options.dataScrollAnimate);
            if (animate !== 'true') {
                continue;
            }
            
            // Get Element Position
            const rect = wrapper.getBoundingClientRect();
            const elementTop = rect.top;
            const elementHeight = rect.height;
            
            // Check if Element is in Viewport (mit Offset)
            const inViewport = elementTop < (viewportHeight - this.options.elementAnimationOffset);
            
            // Add/Remove Animation Class
            if (inViewport && !wrapper.classList.contains('is--animated')) {
                this._animateElement(wrapper);
            }
        }
    }
    
    /**
     * Animate Element (Fade In + Translate)
     */
    _animateElement(wrapper) {
        // Get Translate Values from Data Attributes
        const translateX = wrapper.getAttribute(this.options.dataTranslateX) || '0';
        const translateY = wrapper.getAttribute(this.options.dataTranslateY) || '0';
        
        // Set Initial Transform (before animation)
        wrapper.style.opacity = '0';
        wrapper.style.transform = `translate(${translateX}px, ${translateY}px)`;
        wrapper.style.transition = `opacity ${this.options.elementAnimationDuration}ms ease-out, transform ${this.options.elementAnimationDuration}ms ease-out`;
        
        // Trigger Animation (after next frame)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                wrapper.style.opacity = '1';
                wrapper.style.transform = 'translate(0, 0)';
                wrapper.classList.add('is--animated');
            });
        });
    }
}

