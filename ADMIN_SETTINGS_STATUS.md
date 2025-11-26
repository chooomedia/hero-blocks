# Hero Slider - Admin Settings Status

## ✅ FUNKTIONIERENDE Features (getestet 2025-11-25)

### Slider Content
- ✅ **Headline**: Global & Per-Slide einstellbar
- ✅ **Text**: Global & Per-Slide einstellbar
- ✅ **Button 1 Text/URL/NewTab**: Global & Per-Slide
- ✅ **Button 2 Text/URL/NewTab**: Global & Per-Slide

### Navigation
- ✅ **Navigation Arrows**: inside/outside/none
- ✅ **Navigation Dots**: top/bottom/none
- ✅ **Auto-Slide**: An/Aus + Timing (5000ms default)
- ✅ **Speed**: Transition-Geschwindigkeit

### Layout & Display
- ✅ **Display Mode**: cover/contain/standard
- ✅ **Min Height**: z.B. "80vh"
- ✅ **Max Height**: z.B. "100vh"
- ✅ **Full Height**: 100vh minus Header

### Content Alignment
- ✅ **Content Vertical Align**: top/center/bottom - **FUNKTIONIERT** ✓
- ✅ **Content Horizontal Align**: left/center/right - **FUNKTIONIERT** ✓

### Content Styling (GLOBAL)
- ✅ **Headline Color**: CSS color value
- ✅ **Headline Font Size**: CSS font-size value
- ✅ **Text Color**: CSS color value
- ✅ **Text Font Size**: CSS font-size value
- ✅ **Button 1 Background Color**: CSS color
- ✅ **Button 1 Text Color**: CSS color
- ✅ **Button 2 Background Color**: CSS color
- ✅ **Button 2 Text Color**: CSS color

### Media
- ✅ **Slide Images**: Multiple images uploadable
- ✅ **Logo Image (Global)**: Uploadable

---

## 🐛 BEKANNTE BUGS

### 1. Logo Animation fehlt beim Slide-Wechsel
**Status:** 🔴 BUG  
**Beschreibung:** Wenn ein Logo-Bild im "Content" Tab definiert wird (Logo/Image Before), fehlt die Fade-In Animation beim Slide-Wechsel.  
**Ursache:** Logo-Element hat keine `.hero-slide-content-inner` Animation  
**Fix:** CSS Animation für `.hero-slide-logo` hinzufügen

### 2. Logo Vorauswahl wird nicht angezeigt
**Status:** 🔴 BUG  
**Beschreibung:** Nach Seitenwechsel wird das ausgewählte Logo-Bild nicht als Vorauswahl angezeigt - das Feld bleibt leer.  
**HTML:** `<div class="sw-media-upload-v2__preview is--fallback">` statt korrekter Vorschau  
**Ursache:** `slideLogoMedia` State wird nicht korrekt aus `logoImageId` geladen  
**Fix:** JavaScript - Logo-Media Entity beim Component-Init laden

---

## 🚧 FEHLENDE Features (User-Anforderungen)

### 1. Dot-Navigation Farbe anpassbar
**Status:** ⚠️ FEHLT  
**Beschreibung:** Admin soll Farbe der Nav-Dots anpassen können (aktuell: fest rgba(255,255,255,0.3))  
**Lösung:** Neue Admin-Setting: `dotsColor` + CSS Custom Property

### 2. Prev/Next Buttons nur bei Hover sichtbar
**Status:** ⚠️ FEHLT  
**Beschreibung:** Prev/Next Buttons sollen initial versteckt sein, nur bei Hover über Slider sichtbar  
**Lösung:** CSS `.hero-slider:hover .hero-slider-controls-prev/next { opacity: 1 }`  
**Wichtig:** Bootstrap-konform, kein Inline-Style!

### 3. Button/Text Colors PER SLIDE
**Status:** ⚠️ TEILWEISE (nur global vorhanden)  
**Beschreibung:** Button & Text Colors sollen pro Slide einstellbar sein, nicht nur global  
**Aktuell:** Colors nur in Tab "Settings" → "Content Styling"  
**Gewünscht:** Colors bei jedem Slide in Tab "Content"  
**Aufwand:** GROSS - erfordert:
  - Config-Struktur Änderung (sliderItems erweitern)
  - Template-Änderung (per-slide Colors auslesen)
  - Admin-Component Änderung (UI pro Slide)

---

## 📋 TEST-PLAN

### Phase 1: Basis-Funktionalität (✅ DONE)
1. ✅ Frontend lädt korrekt
2. ✅ Slider initialisiert
3. ✅ Navigation funktioniert
4. ✅ Content wird angezeigt

### Phase 2: Admin-Settings → Frontend (TODO)
1. ⏳ Content Vertical Align ändern → Frontend checken
2. ⏳ Content Horizontal Align ändern → Frontend checken
3. ⏳ Button Colors (global) ändern → Frontend checken
4. ⏳ Logo Image hochladen → Frontend checken
5. ⏳ Navigation Position ändern → Frontend checken

### Phase 3: Bug-Fixes (TODO)
1. ⏳ Logo Animation fixen
2. ⏳ Logo Vorauswahl fixen

### Phase 4: Neue Features (TODO)
1. ⏳ Dot-Navigation Farbe
2. ⏳ Prev/Next Hover-Only
3. ⏳ (Optional) Button/Text Colors per-slide

---

## 🎯 PRIORITY

### HIGH (Jetzt)
1. 🔴 Logo Animation Bug
2. 🔴 Prev/Next Hover-Only
3. 🟡 Dot-Navigation Farbe

### MEDIUM (Später)
4. 🟡 Logo Vorauswahl Bug
5. 🟢 Button/Text Colors per-slide (GROSS!)

---

## 📝 Notizen

- Alle Features müssen Bootstrap-konform sein
- Kein Inline-Style für neue Features
- Bestehende Funktionalität darf NICHT kaputt gehen
- Step-by-step testen: Admin → Speichern → Frontend prüfen

