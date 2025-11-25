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
        
        // Data Attributes
        dataParallaxBackground: 'data-parallax-background',
        dataScrollAnimate: 'data-scroll-animate',
        dataScrollAnimationAngle: 'data-scroll-animation-angle',
        dataScrollAnimationEnabled: 'data-scroll-animation-enabled',
        dataTranslateX: 'data-translate-x',
        dataTranslateY: 'data-translate-y',
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
        
        // Initialize
        if (this.parallaxEnabled || this.elementAnimationsEnabled) {
            this._registerEvents();
            // Initial scroll check (in case block is already visible)
            this._onScroll();
        }
    }
    
    /**
     * Register Scroll Event
     */
    _registerEvents() {
        // WICHTIG: Throttle scroll event für Performance
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this._onScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Initial call
        this._onScroll();
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

