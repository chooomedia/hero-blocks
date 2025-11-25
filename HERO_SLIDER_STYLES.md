# Hero Slider Styles - Dokumentation

## ✅ Aktueller Stand (2025-11-25)

### Wo liegen die Styles?

**WICHTIG:** Die Styles werden vom **Child-Theme HorexShopTheme** geladen, NICHT vom Plugin!

#### 1. **Child-Theme (HorexShopTheme)** - AKTIV ✅
```
/custom/plugins/HorexShopTheme/src/Resources/app/storefront/src/scss/
├── base.scss                                    → Haupteinstieg (wird von Shopware geladen)
├── hero-slider.scss                             → Wrapper (importiert Komponenten)
└── components-hero-blocks/
    ├── _hero-slider.scss                        → ✅ HAUPT-STYLES (aktualisiert 2025-11-25)
    └── _hero-slider-helpers.scss                → CSS-Variablen für Admin-Settings
```

**Import-Flow:**
```
base.scss 
  → hero-slider.scss 
    → _hero-slider.scss (ALLE Styles hier!)
    → _hero-slider-helpers.scss (CSS-Variablen)
```

#### 2. **Plugin (HeroBlocks)** - ✅ GELÖSCHT
```
/custom/plugins/HeroBlocks/src/Resources/app/storefront/src/scss/components/
└── (leer - hero-slider.scss wurde gelöscht)
```

**Warum wurde die Plugin-Version gelöscht?**
- Das Plugin hat **KEIN theme.json** → Styles werden NICHT geladen
- Import in `main.js` war vorhanden, aber `main.js` wird nicht verwendet
- Datei war nur verwirrend und wurde **sauber entfernt** (2025-11-25)

---

## 🔧 Wichtigste Fixes (2025-11-25)

### ❌ Gelöst: display: none Bug
**Problem:** Alle Slides außer dem ersten waren unsichtbar

**Ursache:**
```scss
// ❌ ALTE VERSION (Child-Theme veraltet):
&-item-container:not(:first-child) .hero-slider-item {
    display: none; // ← Versteckte ALLE Slides permanent!
}
```

**Lösung:**
```scss
// ✅ NEUE VERSION (vom Plugin übernommen):
// ⚠️ WICHTIG: KEIN display: none Workaround!
// Tiny Slider steuert Sichtbarkeit selbst mit .tns-slide-active
// Keine manuellen Versteckungsregeln nötig!
```

### ✅ Was funktioniert jetzt?
- ✅ Alle Slides werden korrekt angezeigt
- ✅ Tiny Slider steuert Sichtbarkeit selbst
- ✅ Navigation (Prev/Next) funktioniert
- ✅ Nav-Dots funktionieren (Mobile & Desktop)
- ✅ Content (Headline, Text, Buttons) korrekt gestyled
- ✅ Button-Farben aus Admin-Settings korrekt angewendet
- ✅ Helper Classes für CSS-Variablen integriert

---

## 🛠️ Migration History

### Schritt 1: Plugin-Styles erstellt (Migrationsversuch)
- Plugin `hero-slider.scss` mit allen Fixes erstellt
- Plugin `base.scss` erstellt
- **Problem:** Plugin hat kein `theme.json` → Styles werden NICHT geladen

### Schritt 2: Child-Theme aktualisiert (Final)
- Child-Theme `_hero-slider.scss` mit Plugin-Version **überschrieben**
- Plugin `base.scss` **gelöscht** (nicht benötigt)
- Theme neu kompiliert
- **Ergebnis:** ✅ Alle Styles funktionieren perfekt!

---

## 📦 Enthaltene Features

### Basis-Funktionalität
- ✅ Tiny Slider Integration (Shopware Standard)
- ✅ Display Modes: Cover, Contain, Standard
- ✅ Height Control (min-height, max-height via Admin)
- ✅ Full-Width Layout Support

### Content & Styling
- ✅ Background Images (cover/contain/standard)
- ✅ Overlay (Darkening Layer)
- ✅ Content Overlay (Headline, Text, Buttons, Logo)
- ✅ Content Animation (translateY + opacity)
- ✅ Vertical Alignment (top, center, bottom)
- ✅ Horizontal Alignment (left, center, right)

### Navigation
- ✅ Prev/Next Buttons (mit Hover-Effekten)
- ✅ Nav-Dots (Mobile & Desktop)
- ✅ Outside Mode für Navigation

### Buttons
- ✅ Primary Button (Rot: #c20017)
- ✅ Secondary Button (Weiß mit Border)
- ✅ Hover-Effekte (translateY + box-shadow)
- ✅ CSS-Variablen für Admin-Settings

### Responsiveness
- ✅ Mobile First Approach
- ✅ Tablet Breakpoint (768px)
- ✅ Desktop Breakpoint (992px)
- ✅ Mobile Optimizations

### Accessibility
- ✅ Reduced Motion Support
- ✅ Keyboard Navigation
- ✅ Focus States
- ✅ ARIA Labels

### Print
- ✅ Print-optimierte Darstellung

---

## 🔄 Wartung & Updates

### Wenn Änderungen nötig sind:

1. **Änderungen im Child-Theme machen:**
   ```
   /custom/plugins/HorexShopTheme/src/Resources/app/storefront/src/scss/components-hero-blocks/_hero-slider.scss
   ```

2. **Theme neu kompilieren:**
   ```bash
   docker exec horex-shopware php bin/console theme:compile
   docker exec horex-shopware php bin/console cache:clear
   ```

3. **Testen:**
   - Browser Hard Refresh (Strg+Shift+R)
   - Navigation testen (Prev/Next)
   - Content-Animation prüfen
   - Admin-Settings testen

### ⚠️ NICHT VERGESSEN:
- Plugin `hero-slider.scss` ist NUR Referenz!
- Änderungen IMMER im Child-Theme `_hero-slider.scss` machen!
- Nach Änderungen IMMER Theme neu kompilieren!

---

## 🎨 CSS-Variablen für Admin-Settings

Die folgenden CSS-Variablen können über Admin-Settings gesetzt werden:

```scss
// Height Control
--hero-slider-min-height: 80vh;
--hero-slider-max-height: none;

// Colors
--hero-headline-color: #fff;
--hero-text-color: #fff;
--hero-button1-bg-color: #c20017;
--hero-button1-text-color: #fff;
--hero-button2-bg-color: var(--bs-body-bg, #fff);
--hero-button2-text-color: var(--bs-body-color, #2b3136);

// Font Sizes
--hero-headline-font-size: inherit;
--hero-text-font-size: inherit;

// Header
--header-height: 50px;

// Bootstrap
--bs-body-bg: #fff;
--bs-body-color: #2b3136;
--bs-border-color: #dee2e6;
--bs-primary: #798490;
--bs-gutter-x: 1.5rem;
```

---

## 🐛 Bekannte Issues (GELÖST)

### ❌ display: none Bug
- **Status:** ✅ GELÖST (2025-11-25)
- **Lösung:** Alle manuellen display-Regeln entfernt, Tiny Slider steuert selbst

### ❌ Nav-Dots nur auf Mobile
- **Status:** ✅ GELÖST
- **Lösung:** Nav-Dots jetzt auch auf Desktop sichtbar

### ❌ Helper Classes nicht geladen
- **Status:** ✅ GELÖST
- **Lösung:** Helper Classes in `_hero-slider.scss` integriert

---

## 📞 Support

Bei Fragen oder Problemen:
1. Diese Dokumentation prüfen
2. Child-Theme `_hero-slider.scss` checken
3. Plugin `hero-slider.scss` als Referenz nutzen
4. Theme neu kompilieren + Cache clear

**Entwickler:** HeroBlocks Team  
**Letzte Aktualisierung:** 2025-11-25  
**Version:** 2.0 (display: none Bug gefixed)

