# Per-Slide Styling Implementation Plan

## 🎯 Ziel
Pro Slide individuelle Color/Font-Size Settings ermöglichen (statt nur global).

## 📋 Was wurde entfernt
- **Settings Tab → Content Styling Section** (global):
  - Headline Color/Font Size
  - Text Color/Font Size
  - Button 1 Background/Text Color
  - Button 2 Background/Text Color

## ✅ Was hinzugefügt werden soll
**Content Tab → Pro Slide** (in jedem Slide-Tab):
  - Headline Color
  - Headline Font Size
  - Text Color
  - Text Font Size
  - Button 1 Background Color
  - Button 1 Text Color
  - Button 2 Background Color
  - Button 2 Text Color

---

## 🔧 Implementation

### 1. Admin: Config erweitern (sw-cms-el-config-hero-slider.html.twig)

**Location:** Innerhalb jedes Slide-Tabs (nach Button 2 New Tab Checkbox)

**Neue Section:** "Slide Styling" (Collapsible)

**Fields:**
```twig
{# Slide Styling - Collapsible #}
<sw-collapse :expand-on-loading="false">
    <template #header="{ expanded }">
        <div class="sw-cms-el-config-hero-slider__collapse-header">
            <h3>{{ $tc('sw-cms.elements.heroSlider.config.slideStyl

ing.title') }}</h3>
            <mt-icon :name="expanded ? 'regular-chevron-up-xs' : 'regular-chevron-down-xs'" size="16" />
        </div>
    </template>
    <template #content>
        {# Headline Styling #}
        <div class="sw-cms-el-config-hero-slider__styling-group">
            <h5>{{ $tc('sw-cms.elements.heroSlider.config.slideStyl

ing.headline.title') }}</h5>
            <mt-colorpicker
                :label="$tc('sw-cms.elements.heroSlider.config.slideStyling.headline.color')"
                :model-value="sliderItem.config?.headlineColor?.value || ''"
                @update:model-value="onSlideColorChange(index, 'headlineColor', $event)"
            />
            <mt-text-field
                :label="$tc('sw-cms.elements.heroSlider.config.slideStyling.headline.fontSize')"
                v-model="sliderItem.config.headlineFontSize.value"
                @update:model-value="emitUpdateEl"
            />
        </div>
        
        {# Text Styling #}
        <div class="sw-cms-el-config-hero-slider__styling-group">
            <h5>{{ $tc('sw-cms.elements.heroSlider.config.slideStyling.text.title') }}</h5>
            <mt-colorpicker
                :label="$tc('sw-cms.elements.heroSlider.config.slideStyling.text.color')"
                :model-value="sliderItem.config?.textColor?.value || ''"
                @update:model-value="onSlideColorChange(index, 'textColor', $event)"
            />
            <mt-text-field
                :label="$tc('sw-cms.elements.heroSlider.config.slideStyling.text.fontSize')"
                v-model="sliderItem.config.textFontSize.value"
                @update:model-value="emitUpdateEl"
            />
        </div>
        
        {# Button 1 Styling #}
        <div class="sw-cms-el-config-hero-slider__styling-group">
            <h5>{{ $tc('sw-cms.elements.heroSlider.config.slideStyling.button1.title') }}</h5>
            <mt-colorpicker
                :label="$tc('sw-cms.elements.heroSlider.config.slideStyling.button1.backgroundColor')"
                :model-value="sliderItem.config?.button1BackgroundColor?.value || ''"
                @update:model-value="onSlideColorChange(index, 'button1BackgroundColor', $event)"
            />
            <mt-colorpicker
                :label="$tc('sw-cms.elements.heroSlider.config.slideStyling.button1.textColor')"
                :model-value="sliderItem.config?.button1TextColor?.value || ''"
                @update:model-value="onSlideColorChange(index, 'button1TextColor', $event)"
            />
        </div>
        
        {# Button 2 Styling #}
        <div class="sw-cms-el-config-hero-slider__styling-group">
            <h5>{{ $tc('sw-cms.elements.heroSlider.config.slideStyling.button2.title') }}</h5>
            <mt-colorpicker
                :label="$tc('sw-cms.elements.heroSlider.config.slideStyling.button2.backgroundColor')"
                :model-value="sliderItem.config?.button2BackgroundColor?.value || ''"
                @update:model-value="onSlideColorChange(index, 'button2BackgroundColor', $event)"
            />
            <mt-colorpicker
                :label="$tc('sw-cms.elements.heroSlider.config.slideStyling.button2.textColor')"
                :model-value="sliderItem.config?.button2TextColor?.value || ''"
                @update:model-value="onSlideColorChange(index, 'button2TextColor', $event)"
            />
        </div>
    </template>
</sw-collapse>
```

---

### 2. Admin: JavaScript Methods (sw-cms-el-config-hero-slider.js)

**Neue Method:**
```javascript
onSlideColorChange(slideIndex, configKey, value) {
    if (!this.element.config.sliderItems.value[slideIndex].config) {
        this.$set(this.element.config.sliderItems.value[slideIndex], 'config', {});
    }
    
    if (!this.element.config.sliderItems.value[slideIndex].config[configKey]) {
        this.$set(this.element.config.sliderItems.value[slideIndex].config, configKey, {
            source: 'static',
            value: ''
        });
    }
    
    this.element.config.sliderItems.value[slideIndex].config[configKey].value = value;
    this.emitUpdateEl();
}
```

**Config-Struktur erweitern in `createdComponent()`:**
```javascript
// Ensure each sliderItem has styling config
this.element.config.sliderItems.value.forEach((item, index) => {
    if (!item.config) {
        this.$set(item, 'config', {});
    }
    
    const stylingConfigs = [
        'headlineColor', 'headlineFontSize',
        'textColor', 'textFontSize',
        'button1BackgroundColor', 'button1TextColor',
        'button2BackgroundColor', 'button2TextColor'
    ];
    
    stylingConfigs.forEach(key => {
        if (!item.config[key]) {
            this.$set(item.config, key, {
                source: 'static',
                value: ''
            });
        }
    });
});
```

---

### 3. Frontend Template: Per-Slide Styles rendern (cms-element-hero-slider.html.twig)

**Änderung:** Inline-Styles pro Slide basierend auf sliderItem.config

**Beispiel für Headline:**
```twig
{% set headlineColor = sliderItem.config.headlineColor.value|default('') %}
{% set headlineFontSize = sliderItem.config.headlineFontSize.value|default('') %}

<h2 class="hero-slide-headline"
    {% if headlineColor or headlineFontSize %}
        style="
            {% if headlineColor %}color: {{ headlineColor }};{% endif %}
            {% if headlineFontSize %}font-size: {{ headlineFontSize }};{% endif %}
        "
    {% endif %}
>
    {{ headline }}
</h2>
```

**Gleiche Logik für:**
- `.hero-slide-text` (textColor, textFontSize)
- `.hero-slide-button-1` (button1BackgroundColor, button1TextColor)
- `.hero-slide-button-2` (button2BackgroundColor, button2TextColor)

---

### 4. Translations (snippet/en-GB.json & de-DE.json)

**Neue Keys:**
```json
{
  "sw-cms": {
    "elements": {
      "heroSlider": {
        "config": {
          "slideStyling": {
            "title": "Slide Styling",
            "headline": {
              "title": "Headline",
              "color": "Headline Color",
              "fontSize": "Headline Font Size"
            },
            "text": {
              "title": "Text",
              "color": "Text Color",
              "fontSize": "Text Font Size"
            },
            "button1": {
              "title": "Button 1",
              "backgroundColor": "Background Color",
              "textColor": "Text Color"
            },
            "button2": {
              "title": "Button 2",
              "backgroundColor": "Background Color",
              "textColor": "Text Color"
            }
          }
        }
      }
    }
  }
}
```

---

## 🚨 Wichtige Hinweise

### Fallback-Strategie
Wenn ein Slide KEINE eigenen Colors definiert hat:
- **Fallback auf default CSS** (nicht auf globale Settings, da die entfernt wurden)
- CSS hat bereits Default-Werte: `color: #fff`, `background-color: #c8102e`, etc.

### Config-Struktur
```javascript
element.config.sliderItems.value = [
  {
    media: {...},
    headline: {value: "Text"},
    config: {
      headlineColor: {source: 'static', value: '#ffffff'},
      headlineFontSize: {source: 'static', value: '4rem'},
      textColor: {source: 'static', value: '#ffffff'},
      // ... etc
    }
  }
]
```

### Performance
- Inline-Styles sind OK für CMS (werden nur bei Page-Load gesetzt)
- Keine JavaScript-Manipulation nötig
- Kein Additional CSS-Loading

---

## ✅ Testing Checklist

1. **Admin:**
   - ✅ Slide-Tab öffnen → "Slide Styling" Section sichtbar
   - ✅ Headline Color ändern → Wert speichern
   - ✅ Button 1 Background Color ändern → Wert speichern
   - ✅ Slide wechseln → andere Colors möglich
   - ✅ Speichern & Frontend prüfen

2. **Frontend:**
   - ✅ Slide 1: Eigene Headline Color wird angezeigt
   - ✅ Slide 2: Andere Headline Color wird angezeigt
   - ✅ Fallback: Wenn kein Color gesetzt → Default CSS greift
   - ✅ Buttons: Per-Slide Colors werden korrekt angewendet

---

## 📦 Build-Reihenfolge

1. ✅ Template ändern (.html.twig)
2. ✅ JavaScript ändern (.js)
3. ✅ Translations hinzufügen (snippets)
4. ✅ `./bin/build-administration.sh`
5. ✅ `php bin/console cache:clear`
6. ✅ Admin Hard-Refresh (Strg+Shift+R)
7. ✅ Frontend testen

---

## 🐛 Logo-Probleme (Separate Tasks)

### Logo Preview Bug
- **Problem:** Kein Thumbnail nach Upload
- **Ursache:** `slideLogoMedia` State nicht korrekt geladen
- **Fix:** JavaScript - Media Entity beim Init laden

### Logo Delete-Button fehlt
- **Problem:** Logo kann nicht gelöscht werden
- **Fix:** Delete-Button neben Logo-Upload hinzufügen
- **Method:** `onRemoveSlideLogoMedia(index)`

---

**Status:** READY TO IMPLEMENT ✅

