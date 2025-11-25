# Hero Blocks - Storefront Architektur Dokumentation

## 📋 Übersicht: Welche Komponenten brauchen JavaScript Plugins?

### ✅ **Komponenten MIT eigenem JavaScript Plugin:**

| Komponente | Plugin Datei | Grund | Selector |
|------------|-------------|-------|----------|
| **Hero Two Columns Parallax** | `hero-two-columns-parallax/hero-two-columns-parallax.plugin.js` | Scroll-basierte Parallax-Animationen für Background-Bilder + Element-Animationen | `[data-hero-two-columns-parallax]` |
| **Hero Video Extended** | `hero-video-extended/hero-video-extended.plugin.js` | Intersection Observer für Play/Pause Control (Performance-Optimierung) | `[data-hero-video-extended]` |
| **Hero Mega Menu** | `hero-mega-menu/hero-mega-menu.js` | Legacy-Code mit eigenem Event-System (DOMContentLoaded) | `[data-hero-mega-menu="true"]` |

### ⛔ **Komponenten OHNE eigenes Plugin (nutzen Shopware's base-slider):**

| Komponente | Template Datei | CSS Datei | Grund |
|------------|---------------|-----------|-------|
| **Hero Slider** (Element) | `element/cms-element-hero-slider.html.twig` | `hero-slider.scss` | Nutzt `data-base-slider="true"` → Shopware's base-slider Plugin |
| **Hero Category Slider** (Element) | `element/cms-element-hero-category-slider.html.twig` | `hero-category-slider.scss` | Nutzt `data-base-slider="true"` → Shopware's base-slider Plugin |
| **Hero Instagram Feed** (Element) | `element/cms-element-hero-instagram-feed.html.twig` | `hero-instagram-feed.scss` | Nutzt `data-base-slider="true"` im Slider-Modus → Shopware's base-slider Plugin |

## 🏗️ Block vs. Element Architektur

### Was ist der Unterschied?

**BLOCK** = Container/Wrapper für ELEMENTS (z.B. `hero-block-slider`)
- Definiert Layout (full-width, boxed, sizing)
- Enthält Slots für Elements
- Template: `block/cms-block-{name}.html.twig`

**ELEMENT** = Eigentlicher Content (z.B. `hero-slider`)
- Definiert Darstellung und Funktionalität
- Wird in Block-Slots eingebunden
- Template: `element/cms-element-{name}.html.twig`
- **CSS-Klassen basieren auf ELEMENT-Namen, nicht Block-Namen!**

### Beispiel: Hero Block Slider

```
BLOCK: hero-block-slider
├── Template: block/cms-block-hero-block-slider.html.twig
├── Slot: 'heroSlider'
└── ELEMENT: hero-slider
    ├── Template: element/cms-element-hero-slider.html.twig
    ├── CSS: scss/components/hero-slider.scss
    ├── CSS-Klasse: .hero-slider
    └── Plugin: KEINS (nutzt base-slider)
```

## 📁 Dateistruktur

```
src/Resources/app/storefront/src/
├── hero-mega-menu/
│   └── hero-mega-menu.js ← Legacy Plugin (Auto-Init)
├── hero-two-columns-parallax/
│   └── hero-two-columns-parallax.plugin.js ← Parallax Plugin
├── hero-video-extended/
│   └── hero-video-extended.plugin.js ← Video Plugin
├── main.js ← Haupteinstiegspunkt (registriert Plugins + SCSS)
└── scss/components/
    ├── hero-slider.scss ← hero-slider ELEMENT
    ├── hero-category-slider.scss ← hero-category-slider ELEMENT
    ├── hero-two-columns-parallax.scss ← hero-two-columns BLOCK
    ├── hero-mega-menu.scss ← hero-mega-menu BLOCK
    ├── hero-instagram-feed.scss ← hero-instagram-feed ELEMENT
    ├── hero-video-extended.scss ← hero-video-extended BLOCK
    └── hero-shopping-experience.scss ← hero-shopping-experience BLOCK
```

## 🔄 Shopware's base-slider System

### Warum nutzen wir base-slider?

Shopware bietet ein voll funktionales Slider-System (TinySlider Wrapper):
- ✅ Navigation (Arrows inside/outside)
- ✅ Dots (Pagination)
- ✅ Autoplay mit Pause on Hover
- ✅ Touch/Swipe Support
- ✅ Responsive Breakpoints
- ✅ Accessibility (ARIA Labels)
- ✅ Loop/Rewind Modi

### Wie funktioniert base-slider?

**1. HTML Attribute setzen:**
```twig
<div class="base-slider" 
     data-base-slider="true"
     data-base-slider-options='{{ sliderOptions|json_encode }}'>
    
    <div data-base-slider-container="true">
        <!-- Slider Items -->
    </div>
</div>
```

**2. Shopware registriert automatisch:**
```javascript
// Shopware Core macht automatisch:
window.PluginManager.register('BaseSlider', BaseSliderPlugin, '[data-base-slider]');
```

**3. Konfiguration via JSON:**
```javascript
{
    "slider": {
        "controls": true,  // Arrows an/aus
        "nav": true,       // Dots an/aus
        "autoplay": true,  // Auto-Slide
        "speed": 300,      // Animation Speed
        // ... weitere Optionen
    }
}
```

## 🎯 Wann eigenes Plugin erstellen?

### ✅ Eigenes Plugin WENN:
- Custom Scroll-Animationen (Parallax)
- Intersection Observer für Performance
- Custom Event-Handling (außerhalb Standard-Slider)
- DOM-Manipulationen basierend auf User-Interaktion

### ⛔ KEIN eigenes Plugin WENN:
- Standard Slider-Funktionalität ausreicht
- Nur CSS-Styling nötig
- Nur Configuration Changes (via base-slider-options)

## 🧪 Testing Checklist

### 1. Hero Slider (Element)
- [ ] Navigate to CMS Page mit Hero Block Slider
- [ ] **Admin:** Navigation Arrows (none/inside/outside)
- [ ] **Admin:** Navigation Dots (none/bottom)
- [ ] **Admin:** Auto Slide + Timeout
- [ ] **Admin:** Min/Max Height Settings
- [ ] **Storefront:** Slider funktioniert (base-slider)
- [ ] **Storefront:** Responsive (Mobile/Tablet/Desktop)

### 2. Hero Category Slider (Element)
- [ ] Navigate to CMS Page mit Hero Category Slider Block
- [ ] **Admin:** Multi-Select Categories
- [ ] **Admin:** Image Count (1/2/3/4)
- [ ] **Admin:** Navigation Settings
- [ ] **Storefront:** Category Titel wird angezeigt
- [ ] **Storefront:** Title Overlay im Bild
- [ ] **Storefront:** Hover-Effekte

### 3. Hero Two Columns Parallax (Block)
- [ ] Navigate to CMS Page mit Hero Two Columns Block
- [ ] **Storefront:** Background Images laden
- [ ] **Storefront:** Parallax-Effekt beim Scrollen
- [ ] **Storefront:** Pattern Overlay sichtbar
- [ ] **Console:** "[HeroBlocks] Plugin 'HeroTwoColumnsParallax' registered"

### 4. Browser DevTools
- [ ] **Console:** Keine Errors
- [ ] **Console:** "[HeroBlocks] ✅ All plugins registered successfully"
- [ ] **Network:** Alle SCSS Dateien geladen (200 OK)
- [ ] **Elements:** `data-base-slider="true"` bei Sliders vorhanden

## 🚨 Häufige Fehler

### ❌ **Fehler: "Plugin nicht registriert"**
**Ursache:** PluginManager nicht verfügbar
**Lösung:** Safety Check in main.js prüft ob PluginManager existiert

### ❌ **Fehler: "Slider funktioniert nicht"**
**Ursache:** `data-base-slider="true"` fehlt im Template
**Lösung:** Attribute im Element-Template prüfen

### ❌ **Fehler: "CSS-Klasse nicht gefunden"**
**Ursache:** Verwechslung von Block-Name und Element-Name
**Lösung:** CSS-Klassen basieren auf ELEMENT-Namen!

### ❌ **Fehler: "SCSS wird nicht kompiliert"**
**Ursache:** Import fehlt in main.js
**Lösung:** Alle SCSS Dateien müssen in main.js importiert werden

## 📚 Weitere Ressourcen

- [Shopware 6 Storefront JavaScript Docs](https://developer.shopware.com/docs/guides/plugins/plugins/storefront/add-custom-javascript)
- [Shopware 6 CMS Extensions](https://developer.shopware.com/docs/guides/plugins/plugins/content/cms)
- [TinySlider Docs](https://github.com/ganlanyuan/tiny-slider)

