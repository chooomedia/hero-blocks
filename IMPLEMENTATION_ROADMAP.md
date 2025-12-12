# Hero Blocks - Implementierungs-Roadmap

## Übersicht

Dieser Ladeplan dokumentiert den Status, die Priorität und die Skeleton Loader-Integration für alle Hero Blocks Custom CMS Blocks.

---

## ✅ Implementierte Blocks (Release Ready)

### 1. Hero Block Slider

- **Status**: ✅ LIVE
- **Config Key**: `enableHeroBlockSlider`
- **Admin Index**: 0 (Block Settings)
- **Skeleton Loader**: ❌ TODO
- **Features**:
  - Multi-Slide Support mit Swiper.js
  - Navigation (Arrows, Dots)
  - Auto-Slide mit konfigurierbarer Geschwindigkeit
  - Responsive Design
  - Per-Slide Konfiguration (Headline, Text, Buttons, Logo)
- **Priorität**: 🔥 HIGH - Benötigt Skeleton Loader für bessere UX

### 2. Hero Two Columns (Image & Text)

- **Status**: ✅ LIVE
- **Config Key**: `enableHeroTwoColumns`
- **Admin Index**: 0 (Block Settings)
- **Skeleton Loader**: ❌ TODO
- **Features**:
  - Flexible 2-Column Layout mit Bootstrap Grid
  - Text/Image Links/Rechts Toggle
  - Background Images mit Parallax (Coming Soon)
  - Responsive Order Classes
- **Priorität**: 🔥 HIGH - Benötigt Skeleton Loader für LCP-Optimierung

### 3. Hero Mega Menu

- **Status**: ✅ LIVE
- **Config Key**: `enableMegaMenu`
- **Admin Index**: 1 (Header + Mega Menu Settings)
- **Settings Modal**: ✅ Verfügbar
- **Skeleton Loader**: ✅ NICHT BENÖTIGT (kein Lazy Loading)
- **Features**:
  - Full-Width Dropdown Navigation
  - Product-Showcase Support
  - Instagram Feed Integration
  - Responsive Mobile Offcanvas
  - Color Customization (Link Colors, Dropdown Background)
- **Priorität**: ⚡ COMPLETE

---

## 🚀 Beta Blocks (Testing Phase)

### 4. Hero Kategorie-Slider Block

- **Status**: 🟡 BETA
- **Config Key**: `enableCategorySlider`
- **Admin Index**: 0 (Block Settings)
- **Skeleton Loader**: ❌ TODO
- **Features**:
  - Kategorie-Carousel mit Swiper
  - Thumbnail-Navigation
  - Responsive Grid
- **Priorität**: 🔶 MEDIUM - Implementierung testen, Skeleton Loader hinzufügen

### 5. Hero FAQ Block

- **Status**: 🟡 BETA
- **Config Key**: `enableFaqBlock`
- **Admin Index**: 2 (FAQ Block Settings)
- **Settings Modal**: ✅ Verfügbar
- **Skeleton Loader**: ✅ NICHT BENÖTIGT (statischer Content)
- **Features**:
  - Accordion Functionality (Bootstrap Collapse)
  - Schema.org FAQPage Rich Snippets
  - Color Theme (Dark/Light)
  - Accordion Behavior (Single/Multiple)
  - Open First Item Toggle
- **Priorität**: 🔶 MEDIUM - Settings Modal UI verbessern

### 6. Hero Timeline Block

- **Status**: 🟡 BETA
- **Config Key**: `enableHeroTimeline`
- **Admin Index**: 3 (Timeline Block Settings)
- **Settings Modal**: ✅ Verfügbar
- **Skeleton Loader**: ❌ TODO
- **Features**:
  - Horizontal/Vertical Orientation
  - Year Navigation
  - Autoplay Support
  - Image Slider per Entry
- **Priorität**: 🔶 MEDIUM - Implementierung testen, Skeleton Loader hinzufügen

---

## 🛠️ Development Blocks (In Arbeit)

### 7. Hero Instagram Feed Block

- **Status**: 🟡 DEVELOPMENT
- **Config Key**: `enableHeroInstagramFeed`
- **Admin Index**: 7 (Instagram Feed Settings)
- **Settings Modal**: ✅ Verfügbar (mit Setup Guide)
- **Skeleton Loader**: ❌ TODO (CRITICAL für API-Anfragen)
- **Features**:
  - Instagram Basic Display API Integration
  - Token Check via n8n Webhook
  - Grid Layout (2/3/4 Columns)
  - Modal Lightbox
  - Auto-Refresh Token Handling
- **Priorität**: 🔥 HIGH - Skeleton Loader CRITICAL während API-Anfrage

### 8. Hero Video Extended Block

- **Status**: 🟡 DEVELOPMENT
- **Config Key**: `enableHeroVideoExtended`
- **Admin Index**: 0 (Block Settings)
- **Skeleton Loader**: ❌ TODO (CRITICAL für Video Loading)
- **Features**:
  - Video Background Support
  - Overlay Content (Headline, Text, Buttons)
  - Autoplay/Loop Controls
  - Responsive Video Handling
- **Priorität**: 🔥 HIGH - Skeleton Loader CRITICAL während Video Loading

### 9. Hero Image Overlay Block

- **Status**: 🟡 DEVELOPMENT
- **Config Key**: `enableHeroImageOverlay`
- **Admin Index**: 0 (Block Settings)
- **Skeleton Loader**: ❌ TODO
- **Features**:
  - Full-Width Background Image
  - Angled Text Overlay Panel
  - Parallax Scroll Effect
  - Responsive Typography
- **Priorität**: 🔶 MEDIUM - Skeleton Loader für Image Loading

### 10. Hero Booking Form Block

- **Status**: 🟡 DEVELOPMENT
- **Config Key**: `enableHeroBookingForm`
- **Admin Index**: 9 (Booking Form Settings)
- **Settings Modal**: ✅ Verfügbar (mit Coming Soon Features)
- **Skeleton Loader**: ✅ NICHT BENÖTIGT (Form Block)
- **Features**:
  - Test Ride Request Form
  - Model Selection Dropdown
  - Contact Details (Name, Email, Phone)
  - Date/Time Picker
  - Email Submission via n8n
  - **Coming Soon**:
    - Google Calendar Integration
    - Webhook Support
    - Custom Email Templates
- **Priorität**: 🔶 MEDIUM - Settings Modal UI verbessern

---

## 🎯 Erweiterte Features (Plugin-Level)

### 11. Skeleton Loader System

- **Status**: ✅ LIVE (Component + Config)
- **Config Index**: 4 (Skeleton Loader & Performance)
- **Settings Modal**: ❌ TODO - UI-Verbesserung benötigt
- **Features**:
  - Unified Component (`skeleton-loader.html.twig`)
  - Three Types: 360° Gallery, Page, Inbox/Card
  - Admin-Configurable Logo, Size, Animations
  - SCSS Styles mit Dark Mode Support
- **Integration Status**:
  - ❌ Hero Block Slider
  - ❌ Hero Two Columns
  - ❌ Hero Kategorie-Slider
  - ❌ Hero Timeline
  - ❌ Hero Instagram Feed (CRITICAL!)
  - ❌ Hero Video Extended (CRITICAL!)
  - ❌ Hero Image Overlay
- **Priorität**: 🔥 HIGH - Alle CRITICAL Blocks priorisieren

### 12. Shopping Experience / Product Detail Extensions

- **Status**: ✅ LIVE
- **Config Key**: `enableShoppingExperience`
- **Admin Index**: 8 (Product Detail Settings)
- **Settings Modal**: ❌ TODO - UI-Verbesserung benötigt
- **Skeleton Loader**: ✅ IMPLEMENTIERT (360° Gallery Type)
- **Features**:
  - HOREX Configurator mit Varianten-Preisen
  - 360° Gallery Integration
  - Serienausstattung Display
  - Optimiertes Layout
  - Theme-agnostisch (funktioniert mit jedem Theme)
- **Priorität**: ⚡ COMPLETE

---

## 📋 Implementierungs-Checkliste

### Phase 1: Skeleton Loader Integration (PRIORITY)

- [ ] Hero Block Slider - Type: `page`
- [ ] Hero Two Columns - Type: `page`
- [ ] Hero Instagram Feed - Type: `page` (CRITICAL während API-Anfrage)
- [ ] Hero Video Extended - Type: `page` (CRITICAL während Video Loading)
- [ ] Hero Kategorie-Slider - Type: `page`
- [ ] Hero Timeline - Type: `page`
- [ ] Hero Image Overlay - Type: `page`

### Phase 2: Admin UI Improvements (PRIORITY)

- [x] Skeleton Loader Settings Modal - Full Width, One Setting per Line
- [ ] FAQ Block Settings Modal - Full Width, One Setting per Line
- [ ] Timeline Block Settings Modal - Full Width, One Setting per Line
- [ ] Instagram Feed Settings Modal - Full Width, One Setting per Line
- [ ] Booking Form Settings Modal - Full Width, One Setting per Line
- [ ] Product Detail Settings Modal - Full Width, One Setting per Line

### Phase 3: Beta → Live Promotion

- [ ] Hero Kategorie-Slider - Testing & Documentation
- [ ] Hero FAQ Block - Testing & Documentation
- [ ] Hero Timeline Block - Testing & Documentation

### Phase 4: Development → Beta Promotion

- [ ] Hero Instagram Feed - API Testing & Token Handling
- [ ] Hero Video Extended - Video Loading & Performance
- [ ] Hero Image Overlay - Parallax Testing
- [ ] Hero Booking Form - Form Submission & Email Testing

---

## 🎨 UI/UX Improvements (Admin)

### Settings Modal Design System

Alle Settings Modals sollten folgende Patterns verwenden:

1. **Layout**:

   - Full Width Container
   - One Setting per Line (kein 2-Column Grid außer Desktop optional)
   - Saubere Gruppierung mit Section Titles
   - Consistent Spacing (12px Gap zwischen Settings)

2. **Input Fields**:

   - Bool-Felder: Switch mit Label rechts, in `.hero-blocks-switch-field` Wrapper
   - Text/Select: Standard Inputs mit Label oben
   - Number: Standard Number Input mit Range-Hint
   - Volle Breite für Long Text Fields (Email, Subject)

3. **Visual Hierarchy**:

   - Modal Header mit Icon + Title + Description
   - Section Dividers mit Icons
   - Collapsible Setup Guides (für komplexe Features)
   - Action Buttons in Footer oder separater Actions Section

4. **Responsive**:
   - Mobile: Single Column (Stack)
   - Tablet: Single Column (Stack)
   - Desktop: Optional 2-Column Grid für Short Fields

---

## 🚀 Nächste Schritte (Priorität)

### Immediate (This Sprint)

1. ✅ FontAwesome 6 Integration (für Social Icons im Header)
2. 🔄 Settings Modal UI Improvements:
   - Skeleton Loader Settings
   - FAQ Block Settings
   - Timeline Block Settings
   - Instagram Feed Settings
   - Booking Form Settings
   - Product Detail Settings
3. 🔄 Skeleton Loader Integration:
   - Hero Block Slider (HIGH)
   - Hero Two Columns (HIGH)
   - Hero Instagram Feed (CRITICAL)
   - Hero Video Extended (CRITICAL)

### Short Term (Next 2 Sprints)

1. Beta Testing & Promotion:
   - Hero Kategorie-Slider → LIVE
   - Hero FAQ Block → LIVE
   - Hero Timeline Block → LIVE
2. Development → Beta:
   - Hero Instagram Feed (API Testing)
   - Hero Video Extended (Video Loading)

### Long Term (Backlog)

1. Feature Enhancements:
   - Booking Form: Google Calendar Integration
   - Booking Form: Webhook Support
   - Booking Form: Custom Email Templates
   - Two Columns: Parallax Background Images
2. New Blocks:
   - Hero Testimonials Block
   - Hero Team Member Block
   - Hero Pricing Table Block

---

## 📚 Dokumentation

### Skeleton Loader Usage Pattern

```twig
{# In Block Template (z.B. cms-block-hero-block-slider.html.twig) #}
{% block block_hero_block_slider %}
    {# Skeleton Loader während Initialisierung #}
    <div class="cms-block-hero-block-slider" data-block-loading="true">
        {% sw_include '@HeroBlocks/storefront/component/skeleton-loader.html.twig' with {
            type: 'page',
            showProgress: true,
            showText: false,
            additionalClasses: 'hero-slider-skeleton'
        } %}

        {# Actual Content #}
        <div class="hero-slider-content" data-skeleton-hide="true">
            {# Swiper Slider #}
        </div>
    </div>
{% endblock %}
```

### Settings Modal UI Pattern

```twig
{# Modal Content - Full Width, One Setting per Line #}
<div class="hero-blocks-settings-modal__content">
    {# Switch Field mit Label #}
    <div class="hero-blocks-switch-field">
        <sw-inherit-wrapper>
            <template #content="props">
                <div class="hero-blocks-switch-field__inner">
                    <sw-form-field-renderer />
                    <div class="hero-blocks-switch-field__label">
                        <span class="hero-blocks-switch-field__label-text">{{ element.label }}</span>
                        <span class="hero-blocks-switch-field__label-hint">{{ element.helpText }}</span>
                    </div>
                </div>
            </template>
        </sw-inherit-wrapper>
    </div>

    {# Standard Input Fields #}
    <sw-inherit-wrapper>
        <template #content="props">
            <sw-form-field-renderer />
        </template>
    </sw-inherit-wrapper>
</div>
```

---

## ✅ Definition of Done (per Block)

Ein Block gilt als "Release Ready" wenn:

1. ✅ **Funktionalität**: Alle Features implementiert und getestet
2. ✅ **Admin UI**: Settings Modal mit optimierter UI (Full Width, One per Line)
3. ✅ **Skeleton Loader**: Integriert für alle Lazy-Loading-Bereiche
4. ✅ **Responsive**: Mobile, Tablet, Desktop getestet
5. ✅ **Accessibility**: WCAG 2.1 AA compliant
6. ✅ **Performance**: LCP < 2.5s, keine Layout Shifts
7. ✅ **Documentation**: README mit Usage Examples
8. ✅ **Browser Testing**: Chrome, Firefox, Safari, Edge
9. ✅ **System Config**: Alle Settings in config.xml dokumentiert
10. ✅ **Snippets**: DE/EN Translations vollständig

---

**Last Updated**: 2025-01-11
**Version**: 1.0.0
**Maintainer**: HOREX Development Team
