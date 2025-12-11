# HOREX Product Detail Element - Setup Anleitung

## Überblick

Das neue **HOREX Product Detail Element** (`cms-element-horex-product-detail`) wurde mit **Shopware Best Practices** und **Bootstrap 5** erstellt und bietet ein professionelles Layout für Produktdetailseiten.

## Features

✅ **Responsive Layout** (Mobile-First Design)

- Links: Buy Button + Quantity Selector
- Rechts: Preis + Properties + Farb-Auswahl

✅ **Motorrad-spezifische Features**

- Anzeige von Motorrad-Properties (Leistung, Drehmoment, Zylinder)
- Automatische Erkennung: Motorräder zeigen nur Quantity=1
- Styling mit Oswald (Labels) + Lato (Werte)

✅ **Custom Button Styling**

- `btn-accent` Klasse für Custom Brand-Farbe
- Hover-Effekte und Accessibility-Focus

✅ **Bootstrap 5 Best Practices**

- CSS Grid/Flexbox für responsive Layouts
- CSS Custom Properties (CSS Variables)
- Accessibility (ARIA labels, semantic HTML)
- Performance (lazy loading, optimized images)

## Installation & Konfiguration

### Schritt 1: Theme Build

Der Build wurde bereits durchgeführt:

```bash
./scripts/update-horex-theme.sh storefront
```

### Schritt 2: Custom Fields für Motorrad-Properties (OPTIONAL)

Wenn die Motorrad-Properties noch nicht als Product Fields definiert sind, müssen diese im Shopware Admin erstellt werden:

1. **Admin** → **Settings** → **Custom Fields**
2. Neue Custom Field Group erstellen: `motorrad_properties`
3. Custom Fields hinzufügen:
   - `leistung` (String/Select)
   - `drehmoment` (String/Select)
   - `zylinder` (String/Select)
   - `product_color` (Select für Farben)

Oder verwende die bestehenden **Product Properties** (empfohlen):

1. **Admin** → **Catalog** → **Properties**
2. Property Groups erstellen:
   - Leistung (Power)
   - Drehmoment (Torque)
   - Zylinder (Cylinders)
3. Options hinzufügen und zu Produkten zuordnen

### Schritt 3: CMS Block im Admin nutzen

Das neue Element ist jetzt im CMS Editor verfügbar:

1. **Admin** → **Content** → **Shopping Experiences**
2. Deine Custom Erlebniswelt öffnen (019b05cc67e770b79ae9d832802893ee)
3. Block hinzufügen → **HOREX Product Detail Element** auswählen
4. Block konfigurieren

## HTML/Template Struktur

Das Template verwendet semantisches HTML mit Best Practices:

```html
<div class="cms-element-horex-product-detail">
  <!-- LEFT COLUMN: Buy Button + Quantity -->
  <div class="col-12 col-lg-6">
    <!-- Product Header -->
    <!-- Motorcycle Properties (optional) -->
    <!-- Buy Button + Quantity Selector -->
  </div>

  <!-- RIGHT COLUMN: Price + Colors -->
  <div class="col-12 col-lg-6">
    <!-- Price Section -->
    <!-- Product Colors Selection -->
    <!-- Additional Info (EAN, Product Number) -->
  </div>
</div>
```

## CSS-Klassen & Custom Styling

### Verfügbare CSS-Klassen

```scss
// Main container
.cms-element-horex-product-detail

// Sections
.product-detail-header
.product-properties-section
.product-detail-buy-section
.product-detail-price-section
.product-detail-options-section

// Specific elements
.product-detail-title
.property-label (Oswald font, uppercase)
.property-value (Lato font, 16px, secondary color)
.product-detail-price (secondary color, 16px, right-aligned)
.btn-accent (custom button)
```

### Bootstrap 5 CSS Variables

```css
/* Primary colors */
--bs-primary: #0d6efd;
--bs-secondary: #6c757d;
--bs-dark: #212529;
--bs-light: #f8f9fa;

/* Responsive breakpoints */
--bs-breakpoint-sm: 576px;
--bs-breakpoint-md: 768px;
--bs-breakpoint-lg: 992px;
--bs-breakpoint-xl: 1200px;
```

## Mobile Responsiveness

Das Element ist **mobile-first** optimiert:

- **Mobile** (<768px):

  - Stack layout (vertikal)
  - 100% Breite für Buttons
  - Price rechts ausgerichtet

- **Tablet** (768px-991px):

  - 2-spalten Layout beginnt
  - Flexbox für Buy + Quantity

- **Desktop** (≥992px):
  - Vollständiges 2-Spalten Layout
  - Hover-Effekte aktiviert
  - Optimale Spacing

## Shopware Best Practices - Implementiert

### 1. **Semantisches HTML**

- Richtige `<figure>` + `<figcaption>` für Bilder
- `<fieldset>` + `<legend>` für Form-Groups
- ARIA-Labels für Accessibility

### 2. **Responsive Images**

- `srcset` automatisch vom Core erzeugt
- Lazy Loading (`loading="lazy"`)
- Async decoding (`decoding="async"`)

### 3. **Performance**

- CSS-Kritikalität optimiert
- Images mit correkten Alt-Texten
- Minified CSS/JS

### 4. **Accessibility (a11y)**

- `aria-label` auf Buttons
- `role="toolbar"` für Action-Groups
- Keyboard Navigation unterstützt
- Screen-Reader friendly

### 5. **SEO**

- Schema.org microdata (`itemscope`, `itemtype`, `itemprop`)
- Korrekte Heading-Hierarchie
- Strukturierte Produktdaten

## Marketplace-kompatibilität

Das Element nutzt nur **Core Shopware** Funktionalität:

- `page.product` - Verfügbar auf der Produktdetailseite
- `product.properties` - Standard Shopware Properties
- `product.options` - Standard Shopware Optionen
- `sw_thumbnails` - Standard Shopware Macro

**Keine Abhängigkeiten** zu zusätzlichen Plugins!

## Anpassungen für Dein Theme

### Custom Colors ändern

In `theme.json`:

```json
{
  "config": {
    "sw-color-primary": "#ff6600",
    "sw-color-secondary": "#333333",
    "sw-color-accent": "#ff9900"
  }
}
```

### Custom Fonts laden

In `Resources/views/storefront/layout/meta.html.twig`:

```twig
<link rel="preload" href="..." as="font" type="font/woff2" crossorigin>
```

### Button-Styling anpassen

In `_horex-product-detail.scss`:

```scss
.btn-accent {
  // Custom styling
}
```

## Debugging & Troubleshooting

### Template wird nicht angezeigt

1. Cache leeren: `./scripts/update-horex-theme.sh storefront`
2. Browser Hard-Refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
3. Devtools prüfen → Network → CSS/JS Dateien kontrollieren

### Styling nicht korrekt

1. SCSS kompiliert? → Check: `public/theme/.../*.css`
2. CSS-Variablen geladen? → Devtools → Computed Styles prüfen
3. Bootstrap-Klassen konfligieren? → Inspect Element → überprüfe CSS-Reihenfolge

### Properties nicht angezeigt

1. Motorrad? → Check: Product Number beginnt mit "HM" oder Name enthält "Regina Evo"/"VR6 Raw"
2. Properties definiert? → Admin → Catalog → Properties prüfen
3. Properties zu Produkt zugeordnet? → Product → Properties Tab

## Links & Dokumentation

- **Shopware 6 Docs**: https://docs.shopware.com/
- **Bootstrap 5**: https://getbootstrap.com/docs/5.3/
- **Schema.org**: https://schema.org/Product

## Support

Falls Fragen oder Probleme auftreten:

1. Überprüfe die `browser console` für JavaScript-Fehler
2. Siehe `docker logs horex-shopware` für Server-Fehler
3. Kontaktiere HOREX Support mit Screenshot + Browser-Konsole-Output

---

**Version**: 1.0  
**Created**: 2025-12-10  
**HOREX Shop Theme**
