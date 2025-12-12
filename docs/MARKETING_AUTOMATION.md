# 🎯 Hero Blocks Marketing & Landing Page Automation

## Übersicht

Dieses Dokument beschreibt das Konzept für:

1. **MCP/Agent für Divi Landing Pages** - Automatisierte Generierung von WordPress Divi Landing Pages
2. **Shopware Marketplace Submission** - Anforderungen für Plugin-Verkauf
3. **Social Media & Content Marketing** - Automatisierte Marketing-Strategie

---

## 1. MCP/Agent für Divi Landing Pages

### Konzept

Ein KI-Agent, der auf Basis von offiziellen Divi Dokumentationen und Best Practices automatisch moderne, SEO-optimierte Landing Pages für Hero Blocks generiert.

### Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP/Agent Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Divi Docs    │    │ Git Repos    │    │ Brand Assets     │  │
│  │ (Context)    │───▶│ (Templates)  │───▶│ (Matt Interfaces)│  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         │                   │                     │              │
│         ▼                   ▼                     ▼              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   AI Agent (Claude/Gemini)              │    │
│  │  - Divi Documentation Knowledge                         │    │
│  │  - Landing Page Best Practices                          │    │
│  │  - SEO Optimization (RankMath)                          │    │
│  │  - Conversion Optimization                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Generated Outputs                          │    │
│  │  - Divi JSON Layout (importable)                        │    │
│  │  - Global Divi Settings                                 │    │
│  │  - SEO Metadata (RankMath compatible)                   │    │
│  │  - Content Blocks                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Divi Documentation Context

**Offizielle Divi Dokumentation:**

- https://www.elegantthemes.com/documentation/divi/
- https://www.elegantthemes.com/documentation/divi/visual-builder/
- https://www.elegantthemes.com/documentation/divi/modules/

**Key Divi Features für Landing Pages:**

1. **Visual Builder** - Drag & Drop Page Builder
2. **Theme Builder** - Custom Header/Footer/Layouts
3. **Global Presets** - Wiederverwendbare Stile
4. **Dynamic Content** - ACF/Custom Fields Integration
5. **Scroll Effects** - Parallax, Sticky, Transform

### Prompt Template für Landing Page Generation

```
# Hero Blocks Landing Page Generator

## Context
Du bist ein Experte für Divi Theme Builder und Landing Page Optimierung.
Erstelle eine moderne, conversion-optimierte Landing Page für Hero Blocks.

## Brand Guidelines (Matt Interfaces)
- Primary Color: #FF5432 (Orange)
- Secondary Color: #1a1a2e (Dark Blue)
- Font: Inter (Headlines), Open Sans (Body)
- Logo: Matt Interfaces Logo SVG
- Website: https://matt-interfaces.ch

## Hero Blocks Features to Showcase
1. Hero Block Slider - Multi-slide hero with animations
2. Smart Magnifier - Intelligent zoom lens
3. FAQ Block - Schema.org Rich Snippets
4. Timeline Block - Year navigation
5. Booking Form - Lead generation
6. Category Slider - Product showcase
7. Instagram Feed - Social integration
8. Video Extended - Autoplay with controls
9. Two Columns - Parallax effects
10. Mega Menu - Advanced navigation

## SEO Requirements (RankMath)
- Focus Keyword: "Shopware CMS Blocks"
- Secondary Keywords: "Shopware 6 Plugin", "Shopping Experiences", "Custom Blocks"
- Meta Title: Max 60 chars
- Meta Description: 150-160 chars
- Schema Type: SoftwareApplication

## Output Format
Generate a Divi JSON layout that includes:
1. Hero Section with video/animation
2. Feature Showcase with icons
3. Block Demos (interactive previews)
4. Pricing Table
5. Testimonials
6. FAQ Section (Schema.org)
7. CTA Section
8. Footer with trust badges

## URL Parameters Support
- ?utm_source=
- ?utm_medium=
- ?utm_campaign=
- ?block= (highlight specific block)
- ?demo= (show demo mode)
```

### Divi JSON Structure Example

```json
{
  "title": "Hero Blocks Landing Page",
  "settings": {
    "global_colors": {
      "gcid-primary": "#FF5432",
      "gcid-secondary": "#1a1a2e",
      "gcid-text": "#333333"
    },
    "global_fonts": {
      "heading": {
        "font_family": "Inter",
        "font_weight": "700"
      },
      "body": {
        "font_family": "Open Sans",
        "font_weight": "400"
      }
    }
  },
  "sections": [
    {
      "type": "hero",
      "background_video": true,
      "content": {
        "headline": "Hero Blocks für Shopware",
        "subheadline": "Professionelle CMS-Blöcke für mehr Conversion",
        "cta": {
          "text": "Jetzt testen",
          "url": "https://matt-interfaces.ch/hero-blocks/demo"
        }
      }
    }
  ]
}
```

---

## 2. Shopware Marketplace Submission

### Requirements für Schweizer Einzelfirma

**1. Unternehmensregistrierung:**

- ✅ Schweizer Einzelfirma (Einzelunternehmen) ist akzeptiert
- ✅ UID-Nummer erforderlich (falls vorhanden)
- ✅ Geschäftsadresse in der Schweiz

**2. Plugin-Qualität:**

- ✅ Zweisprachige Beschreibungen (DE/EN)
- ✅ Kurzbeschreibung: 150-185 Zeichen
- ✅ Langbeschreibung: min. 200 Zeichen
- ✅ Screenshots (Storefront + Admin)
- ✅ Konfigurationsanleitung

**3. Technische Anforderungen:**

- ✅ Shopware 6.7+ Kompatibilität
- ✅ Korrekte `composer.json` Struktur
- ✅ Keine Sicherheitslücken
- ✅ Performance-optimiert

### Checkliste für Hero Blocks

```markdown
## Pre-Submission Checklist

### Plugin Metadata

- [ ] composer.json korrekt (version, label, description)
- [ ] Lizenz angegeben (proprietary)
- [ ] Autor-Informationen vollständig

### Dokumentation

- [ ] README.md (DE + EN)
- [ ] Konfigurationsanleitung
- [ ] Changelog
- [ ] Screenshots (min. 5)

### Code Quality

- [ ] Keine PHP Errors/Warnings
- [ ] Admin Assets gebaut (Vite)
- [ ] Storefront Assets kompiliert
- [ ] License Check funktioniert
- [ ] Update Check funktioniert

### Testing

- [ ] Neue Shopware 6.7 Installation getestet
- [ ] Alle Blocks funktionieren
- [ ] Mobile Responsive
- [ ] Performance (Lighthouse > 85)
```

---

## 3. Social Media & Content Marketing

### Automatisierte Content-Strategie

**Kanäle:**

1. **LinkedIn** - B2B Shopware Community
2. **Twitter/X** - Developer Updates
3. **Instagram** - Visual Showcases
4. **YouTube** - Tutorial Videos

### Content Calendar Template

| Woche | Montag              | Mittwoch          | Freitag            |
| ----- | ------------------- | ----------------- | ------------------ |
| 1     | Feature Highlight   | Tutorial Video    | Customer Story     |
| 2     | Update Announcement | Behind the Scenes | Weekend Tip        |
| 3     | Block Showcase      | Integration Guide | Community Shoutout |
| 4     | Monthly Recap       | Expert Interview  | Next Month Preview |

### n8n Workflow für Social Media

```
Workflow: Hero Blocks Social Media Automation

Triggers:
1. New GitHub Release → LinkedIn Post + Twitter
2. New Tutorial Video → All Platforms
3. Weekly Schedule → Content Calendar Post

Nodes:
- GitHub Trigger → Format Message → LinkedIn API
- YouTube Trigger → Extract Thumbnail → Instagram API
- Schedule Trigger → Content Library → Multi-Platform Post
```

---

## 4. Implementierungsplan

### Phase 1: Plugin Readiness (1 Woche)

- [x] Plugin-Struktur optimieren
- [x] CLI-Tool erstellen
- [x] n8n Workflow erweitern
- [ ] Finale Tests durchführen
- [ ] Screenshots erstellen

### Phase 2: Marketplace Submission (1 Woche)

- [ ] Shopware Account für Store erstellen
- [ ] Plugin-Beschreibungen schreiben (DE/EN)
- [ ] Screenshots hochladen
- [ ] Plugin einreichen
- [ ] Review-Prozess durchlaufen

### Phase 3: Landing Page (1 Woche)

- [ ] Divi Template erstellen
- [ ] SEO-Optimierung (RankMath)
- [ ] Demo-System einrichten
- [ ] Tracking implementieren
- [ ] A/B Tests vorbereiten

### Phase 4: Marketing Launch (Ongoing)

- [ ] Social Media Accounts einrichten
- [ ] Content Calendar erstellen
- [ ] n8n Workflows aktivieren
- [ ] Erste Posts veröffentlichen
- [ ] Performance messen

---

## 5. Gemini KI Prompt für Landing Page

Hier ist der vollständige Prompt für Gemini zur Erstellung der Divi Landing Page:

```
Du bist ein Experte für:
1. WordPress Divi Theme Builder
2. Landing Page Conversion Optimization
3. SEO (RankMath)
4. Shopware E-Commerce

Aufgabe: Erstelle eine vollständige, importierbare Divi JSON-Datei für eine
Landing Page, die das Shopware Plugin "Hero Blocks" von Matt Interfaces bewirbt.

Zielgruppe (ICP):
- Shopware Shop-Betreiber (B2B)
- E-Commerce Manager
- Webentwickler/Agenturen
- Deutsch + Englisch sprechend

Keywords (SEO):
- Focus: "Shopware CMS Blocks"
- Secondary: "Shopware 6 Plugin", "Erlebniswelten", "Custom Blocks", "Shopping Experiences"
- Long-tail: "Shopware Hero Slider Plugin", "Shopware FAQ Block", "Shopware Mega Menu"

Brand Guidelines:
- Farbe: #FF5432 (Matt Interfaces Orange)
- Dunkel: #1a1a2e
- Font: Inter (Headlines), Open Sans (Body)
- Ton: Professionell, modern, technisch versiert

Struktur:
1. Hero Section (Video Background + CTA)
2. Problem Statement (Warum Standard-Blocks nicht reichen)
3. Feature Grid (10 Blocks mit Icons)
4. Demo Section (Interactive Previews)
5. Testimonials (Zitate von Kunden)
6. Pricing Table (Single License, Agency License)
7. FAQ (Schema.org Markup)
8. Final CTA (Jetzt kaufen)

Technische Anforderungen:
- Divi 4.20+ kompatibel
- Mobile-First Responsive
- Lazy Loading für Bilder
- GPDR-konform
- < 3s Ladezeit

Output: Vollständige Divi JSON Layout-Datei
```

---

## Kontakt

**Matt Interfaces**

- Website: https://matt-interfaces.ch
- E-Mail: info@matt-interfaces.ch
- GitHub: https://github.com/chooomedia

---

_Dokumentation erstellt am: 11. Dezember 2025_
