# Hero Slider - Admin Settings Test Checklist

## 📋 Systematischer Test-Plan

**Ziel:** Alle Admin-Settings step-by-step testen und verifizieren, dass sie im Frontend korrekt übernommen werden.

**Test-URL (Admin):** http://localhost/admin#/sw/cms/detail/695477e02ef643e5a016b83ed4cdf63a  
**Test-URL (Frontend):** http://localhost/

---

## ✅ TEST 1: Content Vertical Alignment

### Admin-Schritte:
1. Admin öffnen → CMS → Seite bearbeiten
2. Hero Slider Element auswählen
3. Tab "Settings" → "Layout" → "Content Vertical Align"
4. **Test A:** Auf "Top" stellen → Speichern
5. **Test B:** Auf "Bottom" stellen → Speichern
6. **Test C:** Auf "Center" stellen → Speichern (Default)

### Frontend-Erwartung:
- **Top:** Content (Headline/Text/Buttons) oben im Slider (z.B. 20% vom oberen Rand)
- **Bottom:** Content unten im Slider (z.B. 80% vom oberen Rand)
- **Center:** Content mittig im Slider (50% vertikal)

### CSS-Prüfung:
```scss
.hero-slide-content--vertical-top { align-items: flex-start; }
.hero-slide-content--vertical-center { align-items: center; }
.hero-slide-content--vertical-bottom { align-items: flex-end; }
```

**Status:** ⬜ TODO

---

## ✅ TEST 2: Content Horizontal Alignment

### Admin-Schritte:
1. Tab "Settings" → "Layout" → "Content Horizontal Align"
2. **Test A:** Auf "Left" stellen → Speichern
3. **Test B:** Auf "Right" stellen → Speichern
4. **Test C:** Auf "Center" stellen → Speichern (Default)

### Frontend-Erwartung:
- **Left:** Content linksbündig (text-align: left)
- **Right:** Content rechtsbündig (text-align: right)
- **Center:** Content zentriert (text-align: center)

### CSS-Prüfung:
```scss
.hero-slide-content--horizontal-left { justify-content: flex-start; text-align: left; }
.hero-slide-content--horizontal-center { justify-content: center; text-align: center; }
.hero-slide-content--horizontal-right { justify-content: flex-end; text-align: right; }
```

**Status:** ⬜ TODO

---

## ✅ TEST 3: Navigation Arrows Position

### Admin-Schritte:
1. Tab "Settings" → "Navigation" → "Navigation Arrows"
2. **Test A:** "Inside" → Speichern (Arrows innerhalb des Sliders)
3. **Test B:** "Outside" → Speichern (Arrows außerhalb des Sliders, -3rem)
4. **Test C:** "None" → Speichern (Keine Arrows)

### Frontend-Erwartung:
- **Inside:** Prev/Next Buttons bei `left: 2rem` und `right: 2rem`
- **Outside:** Prev/Next Buttons bei `left: -3rem` und `right: -3rem` (außerhalb Container)
- **None:** Keine Prev/Next Buttons sichtbar

### CSS-Prüfung:
```scss
.is-nav-prev-inside { left: 2rem; }
.is-nav-prev-outside { left: -3rem; }
.hero-slider-controls-wrapper.has-nav-none { display: none; }
```

**Status:** ⬜ TODO

---

## ✅ TEST 4: Navigation Dots Position

### Admin-Schritte:
1. Tab "Settings" → "Navigation" → "Navigation Dots"
2. **Test A:** "Bottom" → Speichern (Default, Dots unten)
3. **Test B:** "Top" → Speichern (Dots oben)
4. **Test C:** "None" → Speichern (Keine Dots)

### Frontend-Erwartung:
- **Bottom:** Dots am unteren Rand (bottom: 2rem)
- **Top:** Dots am oberen Rand (top: 2rem)
- **None:** Keine Dots sichtbar

### CSS-Prüfung:
```scss
.has-dots-bottom .tns-nav { bottom: 2rem; top: auto; }
.has-dots-top .tns-nav { top: 2rem; bottom: auto; }
.has-dots-none .tns-nav { display: none; }
```

**Status:** ⬜ TODO

---

## ✅ TEST 5: Auto-Slide & Timing

### Admin-Schritte:
1. Tab "Settings" → "Slider Options" → "Auto Slide"
2. **Test A:** Auto-Slide auf "Ja" (aktiviert) + Timing 3000ms → Speichern
3. **Test B:** Auto-Slide auf "Nein" (deaktiviert) → Speichern

### Frontend-Erwartung:
- **Aktiviert:** Slider wechselt automatisch alle 3 Sekunden
- **Deaktiviert:** Slider wechselt NUR bei manuellem Klick (Prev/Next/Dots)

### JavaScript-Prüfung:
```javascript
// Tiny Slider Config
autoplay: true,
autoplayTimeout: 3000,
```

**Status:** ⬜ TODO

---

## ✅ TEST 6: Display Mode (cover/contain/standard)

### Admin-Schritte:
1. Tab "Settings" → "Display Mode"
2. **Test A:** "Cover" → Speichern (Bild füllt gesamten Slider, cropped)
3. **Test B:** "Contain" → Speichern (Bild vollständig sichtbar, letterbox)
4. **Test C:** "Standard" → Speichern (Default Shopware Verhalten)

### Frontend-Erwartung:
- **Cover:** `object-fit: cover` (Bild gefüllt, evtl. beschnitten)
- **Contain:** `object-fit: contain` (Bild vollständig, evtl. Rand)
- **Standard:** Keine object-fit Änderung

### CSS-Prüfung:
```scss
.hero-slider-image-wrapper--cover img { object-fit: cover; }
.hero-slider-image-wrapper--contain img { object-fit: contain; }
```

**Status:** ⬜ TODO

---

## ✅ TEST 7: Min/Max Height

### Admin-Schritte:
1. Tab "Settings" → "Layout" → "Min Height"
2. **Test A:** Min Height "60vh" → Speichern
3. **Test B:** Min Height "100vh" → Speichern (Full-Height)
4. Tab "Settings" → "Layout" → "Max Height"
5. **Test C:** Max Height "80vh" → Speichern

### Frontend-Erwartung:
- **60vh:** Slider mindestens 60% Viewport-Höhe
- **100vh:** Slider volle Viewport-Höhe (minus Header)
- **80vh Max:** Slider maximal 80% Viewport-Höhe

### CSS-Prüfung:
```scss
.hero-slider.has-height-control {
    min-height: var(--hero-slider-min-height, 80vh);
    max-height: var(--hero-slider-max-height, none);
}
```

**Status:** ⬜ TODO

---

## ✅ TEST 8: Button Colors (Global)

### Admin-Schritte:
1. Tab "Settings" → "Content Styling" → "Button 1"
2. **Test A:** Button 1 Background Color "#ff0000" (Rot) → Speichern
3. **Test B:** Button 1 Text Color "#ffffff" (Weiß) → Speichern
4. **Test C:** Button 2 Background Color "#ffffff" (Weiß) → Speichern
5. **Test D:** Button 2 Text Color "#000000" (Schwarz) → Speichern

### Frontend-Erwartung:
- **Button 1:** Roter Hintergrund, weißer Text
- **Button 2:** Weißer Hintergrund, schwarzer Text

### CSS-Prüfung:
```css
.hero-slide-button-1 {
    background-color: var(--hero-button1-bg, #c8102e);
    color: var(--hero-button1-color, #fff);
}
.hero-slide-button-2 {
    background-color: var(--hero-button2-bg, #fff);
    color: var(--hero-button2-color, #000);
}
```

**Status:** ⬜ TODO

---

## ✅ TEST 9: Text Colors (Global)

### Admin-Schritte:
1. Tab "Settings" → "Content Styling" → "Headline"
2. **Test A:** Headline Color "#ffffff" (Weiß) → Speichern
3. **Test B:** Headline Font Size "4rem" → Speichern
4. **Test C:** Text Color "#ffffff" (Weiß) → Speichern
5. **Test D:** Text Font Size "1.5rem" → Speichern

### Frontend-Erwartung:
- **Headline:** Weiß, 4rem Größe
- **Text:** Weiß, 1.5rem Größe

### CSS-Prüfung:
```css
.hero-slide-headline {
    color: var(--hero-headline-color, #fff);
    font-size: var(--hero-headline-size, 4rem);
}
.hero-slide-text {
    color: var(--hero-text-color, #fff);
    font-size: var(--hero-text-size, 1.125rem);
}
```

**Status:** ⬜ TODO

---

## ✅ TEST 10: Logo Image (Global)

### Admin-Schritte:
1. Tab "Content" → "Logo/Image Before"
2. **Test A:** Logo-Bild hochladen (z.B. Horex Logo) → Speichern
3. **Test B:** Logo-Bild entfernen → Speichern

### Frontend-Erwartung:
- **Mit Logo:** Logo erscheint ÜBER Headline, zentriert, max-width 300px (Desktop)
- **Ohne Logo:** Kein Logo sichtbar, Headline beginnt sofort

### HTML-Prüfung:
```html
<div class="hero-slide-logo">
    <img class="hero-slide-logo-img" src="..." alt="">
</div>
```

**Status:** ⬜ TODO

---

## ✅ TEST 11: Logo Animation (NEW)

### Admin-Schritte:
1. Logo-Bild hochladen (wie Test 10)
2. Frontend öffnen
3. **Slide 1 beobachten:** Logo sollte mit Fade-In erscheinen
4. **Prev/Next klicken:** Logo beim Slide-Wechsel sollte neu fade-in

### Frontend-Erwartung:
- **Initial:** Logo fade-in mit 0.9s delay (wie Content)
- **Slide-Wechsel:** Logo fade-out → fade-in Animation

### CSS-Prüfung:
```scss
.hero-slide-logo {
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.9s ease-in-out 0.3s, transform 0.9s ease-in-out 0.3s;
    
    .tns-slide-active & {
        opacity: 1;
        transform: translateY(0);
    }
}
```

**Status:** ✅ COMPLETED (2025-11-25)

---

## ✅ TEST 12: Prev/Next Hover-Only (NEW)

### Admin-Schritte:
1. Frontend öffnen
2. **Initial State:** Prev/Next Buttons sollten NICHT sichtbar sein
3. **Maus über Slider bewegen:** Prev/Next Buttons sollten einblenden (opacity: 0 → 1)
4. **Maus weg:** Prev/Next Buttons sollten ausblenden (opacity: 1 → 0)

### Frontend-Erwartung:
- **Kein Hover:** Buttons versteckt (opacity: 0)
- **Hover über Slider:** Buttons sichtbar (opacity: 1, smooth fade-in 0.3s)

### CSS-Prüfung:
```scss
.hero-slider-controls-prev,
.hero-slider-controls-next {
    opacity: 0;
    transition: opacity 0.3s ease;
}

.hero-slider:hover {
    .hero-slider-controls-prev,
    .hero-slider-controls-next {
        opacity: 1;
    }
}
```

**Status:** ✅ COMPLETED (2025-11-25)

---

## 📊 TEST-ZUSAMMENFASSUNG

### Abgeschlossen:
- ✅ TEST 11: Logo Animation (NEW Feature)
- ✅ TEST 12: Prev/Next Hover-Only (NEW Feature)

### Ausstehend (User-Test erforderlich):
- ⬜ TEST 1: Content Vertical Alignment
- ⬜ TEST 2: Content Horizontal Alignment
- ⬜ TEST 3: Navigation Arrows Position
- ⬜ TEST 4: Navigation Dots Position
- ⬜ TEST 5: Auto-Slide & Timing
- ⬜ TEST 6: Display Mode
- ⬜ TEST 7: Min/Max Height
- ⬜ TEST 8: Button Colors
- ⬜ TEST 9: Text Colors
- ⬜ TEST 10: Logo Image

### Bekannte Bugs (Nicht kritisch):
- ⚠️ Logo Vorauswahl wird nach Reload nicht angezeigt (Admin-UX, kein Frontend-Bug)

---

## 🎯 NÄCHSTE SCHRITTE

1. **User-Test:** Alle 12 Tests systematisch im Admin/Frontend durchgehen
2. **Screenshots:** Bei jedem Test Screenshot machen (Admin-Setting + Frontend-Result)
3. **Bug-Report:** Falls ein Setting NICHT übernommen wird, spezifisch melden:
   - Welches Setting?
   - Was wurde eingestellt?
   - Was wurde erwartet?
   - Was ist tatsächlich passiert?
   - Screenshot beifügen

---

## 📝 TEST-PROTOKOLL (Zum Ausfüllen)

**Tester:** _____________  
**Datum:** _____________  
**Browser:** _____________ (z.B. Chrome 120, Firefox 121)

### Test-Ergebnisse:
| Test | Status | Notizen |
|------|--------|---------|
| 1. Vertical Align | ⬜ OK / ⬜ FEHLER | |
| 2. Horizontal Align | ⬜ OK / ⬜ FEHLER | |
| 3. Nav Arrows | ⬜ OK / ⬜ FEHLER | |
| 4. Nav Dots | ⬜ OK / ⬜ FEHLER | |
| 5. Auto-Slide | ⬜ OK / ⬜ FEHLER | |
| 6. Display Mode | ⬜ OK / ⬜ FEHLER | |
| 7. Min/Max Height | ⬜ OK / ⬜ FEHLER | |
| 8. Button Colors | ⬜ OK / ⬜ FEHLER | |
| 9. Text Colors | ⬜ OK / ⬜ FEHLER | |
| 10. Logo Image | ⬜ OK / ⬜ FEHLER | |
| 11. Logo Animation | ✅ OK / ⬜ FEHLER | Completed 2025-11-25 |
| 12. Prev/Next Hover | ✅ OK / ⬜ FEHLER | Completed 2025-11-25 |

**Gesamt-Status:** ⬜ PASS / ⬜ FAIL

**Kritische Fehler:** (Liste alle Fehler die sofort gefixt werden müssen)

**Optionale Verbesserungen:** (Liste Nice-to-have Features)

