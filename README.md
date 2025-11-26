# Hero Blocks Plugin

CMS Blocks Plugin für Shopware 6.7+ mit Hero Slider, Two Columns, Mega Menu und automatischem Update-System.

## 📦 Features

- ✅ **Hero Block Slider** - Multi-Slide Hero Slider mit Navigation
- ✅ **Hero Two Columns** - Image & Text Layout mit Parallax
- ✅ **Hero Mega Menu** - Mega Menu Navigation Block
- ✅ **Hero Category Slider** - Category Slider mit Bildern
- ✅ **Hero Instagram Feed** - Instagram Feed Integration
- ✅ **Hero Video Extended** - Video Block mit Intersection Observer
- ✅ **Hero FAQ** - FAQ Block mit Akkordeon
- ✅ **License Check System** - n8n-basierte Lizenzprüfung
- ✅ **Update Check System** - Automatische Updates via GitHub Releases
- ✅ **Admin UI** - Vollständige Block-Konfiguration im Shopware Admin

## 🚀 Installation

```bash
# Plugin aktivieren
docker exec horex-shopware php bin/console plugin:refresh
docker exec horex-shopware php bin/console plugin:install --activate HeroBlocks
docker exec horex-shopware php bin/console cache:clear
```

## 📋 Verwendung

### CMS Blocks im Admin

1. Gehe zu **Erlebniswelten**: `http://localhost/admin#/sw/cms/detail/[ID]`
2. Suche nach **"Hero Blocks"** in der Sidebar:
   - **Hero Block Slider** (Kategorie: Image)
   - **Hero Two Columns** (Kategorie: Text-Image)
   - **Hero Mega Menu** (Kategorie: Sidebar)
   - **Hero Category Slider** (Kategorie: Image)
   - **Hero Instagram Feed** (Kategorie: Image)
   - **Hero Video Extended** (Kategorie: Video)
   - **Hero FAQ** (Kategorie: Text)

## 🛠️ Entwicklung

### Build-Prozess

Das Plugin nutzt ein optimiertes Build-Script für Administration und Storefront:

```bash
# Vollständiger Build (Admin + Storefront)
./build.sh

# Nur Administration (schneller für Admin-Entwicklung)
./build.sh --admin-only

# Nur Storefront (Theme-Compile)
./build.sh --storefront-only

# Force Rebuild (bei Twig-Änderungen!)
./build.sh --force
```

#### Wichtige Erkenntnisse zum Build

**Problem: Vite erkennt Twig-Template-Änderungen nicht**
- Twig-Templates werden zur Build-Zeit in JavaScript kompiliert
- Änderungen erzeugen **keinen neuen Asset-Hash**
- **Lösung**: `--force` Flag verwenden oder Cache vor Build löschen

**Browser-Cache Problem:**
Nach Build werden alte Assets geladen:
1. **F12** drücken (DevTools öffnen)
2. **Rechtsklick** auf Reload-Button
3. **"Leeren und harter Reload"** auswählen

### Manuelle Build-Commands

```bash
# Admin Assets bauen
docker exec horex-shopware php bin/console bundle:dump
docker exec -e PROJECT_ROOT=/var/www/html \
           -e ADMIN_ROOT=/var/www/html/vendor/shopware/administration \
           -e SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1 \
           -e VITE_MODE=production \
           -w /var/www/html/vendor/shopware/administration/Resources/app/administration \
           horex-shopware npm run build
docker exec horex-shopware php bin/console assets:install --force
docker exec horex-shopware php bin/console cache:clear

# Storefront (Theme) bauen
docker exec horex-shopware php bin/console theme:compile
docker exec horex-shopware php bin/console cache:clear
```

### Architektur

#### JavaScript Plugins

**Komponenten MIT eigenem Plugin:**
- **Hero Two Columns Parallax** - Scroll-basierte Parallax-Animationen
- **Hero Video Extended** - Intersection Observer für Play/Pause
- **Hero Mega Menu** - Legacy-Code mit eigenem Event-System
- **Hero FAQ** - Akkordeon-Funktionalität

**Komponenten OHNE Plugin (nutzen Shopware's base-slider):**
- **Hero Slider** - Standard Slider mit Navigation
- **Hero Category Slider** - Category Slider
- **Hero Instagram Feed** - Instagram Feed Slider

#### Styles & Theme-Integration

**WICHTIG:** Die Styles werden vom **Child-Theme HorexShopTheme** geladen, NICHT vom Plugin!

```
/custom/plugins/HorexShopTheme/src/Resources/app/storefront/src/scss/
├── base.scss                           → Haupteinstieg
├── hero-slider.scss                    → Wrapper (importiert Komponenten)
└── components-hero-blocks/
    ├── _hero-slider.scss               → Hero Slider Styles
    └── _hero-slider-helpers.scss       → CSS-Variablen für Admin-Settings
```

**Grund:** Plugin hat kein `theme.json` → Styles werden nicht geladen

### Per-Slide Styling

Das Plugin unterstützt individuelle Farb-Settings pro Slide:

**Admin UI (pro Slide):**
- Headline Color
- Text Color
- Button 1 Background Color
- Button 2 Background Color

**Config-Struktur:**
```javascript
element.config.sliderItems.value = [
  {
    media: {...},
    headline: "Text1",
    headlineColor: '#ff0000',      // Per-Slide
    textColor: '#00ff00',          // Per-Slide
    button1BgColor: '#0000ff',     // Per-Slide
    button2BgColor: '#ffff00'      // Per-Slide
  }
]
```

### Testing Workflow

**Step-by-step Testing:**
1. Frontend → Admin Settings → Browser Console → Cache Clear → Hard Refresh
2. Dockware-Umgebung: `docker exec horex-shopware php bin/console ...`
3. Build-Reihenfolge: 1) bundle:dump, 2) npm run build, 3) assets:install, 4) cache:clear
4. Browser-Test: Strg+Shift+R für Hard Refresh

## 🔄 Update-System

### Automatischer Update-Check

- Plugin prüft automatisch auf neue Versionen via n8n Workflow
- Updates werden im Shopware Admin angezeigt
- Download und Installation direkt aus dem Admin möglich
- **Dynamische Release-ID**: Release-ID wird automatisch aus GitHub extrahiert

### Manueller Update-Check

- Settings → Extensions → Hero Blocks → Config
- Klicke auf "Check for updates"

## 🔄 Releases erstellen

### Schnellstart

```bash
# 1. ZIP erstellen
cd /Users/chooom/dev/horex/HorexShopTheme/dockware/shopware/custom/plugins/HeroBlocks
./create-release-zip.sh

# 2. GitHub Release erstellen
# Öffne: https://github.com/chooomedia/hero-blocks/releases/new
# - Tag: v1.0.0 (muss mit v beginnen!)
# - Upload: hero-blocks-1.0.0.zip
# - "Set as the latest release" aktivieren
# - Publish release
```

### Wichtige Regeln

**Tag-Format**: `v1.0.0` ✅ (muss mit `v` beginnen!)
**Asset-Name**: `hero-blocks-1.0.0.zip` ✅ (ohne `v` im Dateinamen!)

### GitHub Actions Workflow

Der Workflow wird automatisch bei Tag-Push ausgelöst:
- Erstellt automatisch GitHub Release
- Generiert Release Notes
- Lädt ZIP-Asset hoch
- Markiert Release als "Latest"

## 🔧 n8n Workflow Setup

### Workflow importieren

1. Öffne n8n: https://n8n.chooomedia.com
2. Gehe zu **Workflows** → **Import from File**
3. Wähle: `src/Resources/n8n-workflows/hero-blocks-unified.json`
4. Klicke auf **Import**

### GitHub Credentials konfigurieren

1. Öffne den **GitHub (Get Latest Release)** Node
2. Klicke auf **Credential** → **Create New**
3. Wähle **GitHub API** als Credential Type
4. Füge deinen **Personal Access Token** hinzu
5. Klicke auf **Save**

**Wichtig:** GitHub Credentials sind erforderlich für:
- ✅ Höhere Rate Limits (5000 statt 60 Requests/Stunde)
- ✅ Besseres Error-Handling
- ✅ Zugriff auf private Repositories (falls nötig)

### Slack Integration (Optional)

**Anti-Spam Features:**
- Interactive Delete Button für jede wichtige Nachricht
- Ephemeral Messages für Routine-Updates
- Vote/Reaction Buttons für Feedback
- Rich Context Blocks mit Metadaten

**Erforderliche OAuth Scopes:**
- `chat:write` - Nachrichten senden
- `chat:write.public` - In öffentlichen Channels posten
- `channels:read` - Channel-Informationen lesen

**Interactive Components aktivieren:**
1. Slack App → **Features** → **Interactivity & Shortcuts**
2. **Enable Interactivity**: ✅ Aktivieren
3. **Request URL**: `https://your-n8n-instance.com/webhook/slack-interactive-hero-blocks`
4. **Save Changes**

## 🧪 Testing

### Automatisiertes Test-Skript

```bash
./test-webhook.sh
```

### License Check Testing

#### Frontend: Dismissible Notice

**Test-Setup:**
```bash
# Lizenz-Status auf 'expired' setzen
docker exec horex-shopware bash -c "cd /var/www/html && php bin/console system:config:set HeroBlocks.config.licenseStatus expired && php bin/console cache:clear"
```

**Test-Ablauf:**
1. Öffne Frontend: `http://localhost/de/`
2. Erwarte: License-Hinweis fixed unten rechts
3. Klicke X-Button → Notice verschwindet (Fade-Out)
4. LocalStorage prüfen: `localStorage.getItem("hero-blocks-notice-dismissed-Premium Features-expired")`
5. Seite neu laden → Notice wird NICHT angezeigt (24h TTL)

**LocalStorage Reset:**
```javascript
// Browser Console
Object.keys(localStorage)
  .filter((key) => key.startsWith("hero-blocks-notice-dismissed-"))
  .forEach((key) => localStorage.removeItem(key));
```

#### Admin: Silent Check mit Cache

**Test-Ablauf:**
1. Öffne Admin Config: `http://localhost/admin#/sw/extension/config/HeroBlocks`
2. Browser Console prüfen (F12):
   - Erste Öffnung: `cached: false` (Webhook wird aufgerufen)
   - Zweite Öffnung: `cached: true` (aus Cache, < 100ms)
3. Klicke "Lizenz prüfen" Button → Force-Refresh (immer Webhook-Call)

**Cache-Alter prüfen:**
```bash
docker exec horex-shopware bash -c "cd /var/www/html && php bin/console system:config:get HeroBlocks.config.lastLicenseCheck"
```

#### Performance-Test

**Kein Webhook-Call bei Storefront-Requests:**
```bash
# Terminal 1: Live-Log überwachen
docker exec horex-shopware tail -f /var/www/html/var/log/dev.log | grep -i "license check"

# Terminal 2: Storefront-Seiten öffnen (mehrere)
# Erwarte: KEINE "License check: Calling webhook" Messages
```

### Manuelle API-Tests

**License Check:**
```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=license&plugin=hero-blocks&version=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" | jq '.'
```

**Update Check:**
```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" | jq '.'
```

### CMS Blocks Testing

**Hero Slider:**
- Navigation Arrows (none/inside/outside)
- Navigation Dots (none/bottom/top)
- Auto-Slide + Timing
- Per-Slide Colors
- Responsive Design

**Hero Two Columns Parallax:**
- Background Images laden
- Parallax-Effekt beim Scrollen
- Pattern Overlay sichtbar
- Console: "[HeroBlocks] Plugin 'HeroTwoColumnsParallax' registered"

**Hero FAQ:**
- Akkordeon öffnen/schließen
- Smooth Transitions
- Mobile/Desktop Layout

### Debugging Commands

**Live-Log überwachen:**
```bash
docker exec horex-shopware tail -f /var/www/html/var/log/dev.log | grep -iE "license|hero.*blocks"
```

**Reset License Status:**
```bash
docker exec horex-shopware bash -c "cd /var/www/html && php bin/console system:config:set HeroBlocks.config.licenseStatus active && php bin/console cache:clear"
```

**Scheduled Task manuell ausführen:**
```bash
docker exec horex-shopware bash -c "cd /var/www/html && php bin/console scheduled-task:run hero_blocks.license_expiry_reminder"
```

## 📁 Struktur

```
src/Resources/
├── app/administration/src/          # Admin Module
│   └── module/sw-cms/
│       ├── blocks/                 # CMS Block Registrierung
│       └── elements/               # CMS Element Konfiguration
├── app/storefront/src/             # Storefront JavaScript & SCSS
│   ├── hero-mega-menu/             # Mega Menu Plugin
│   ├── hero-two-columns-parallax/  # Parallax Plugin
│   ├── hero-video-extended/        # Video Plugin
│   ├── hero-faq/                   # FAQ Plugin
│   └── scss/components/            # SCSS Komponenten
├── views/storefront/               # Storefront Templates
│   ├── block/                      # Block Templates
│   └── element/                    # Element Templates
├── n8n-workflows/                  # n8n Workflow Definitionen
│   └── hero-blocks-unified.json    # Unified License & Update Check
└── config/                         # Plugin Konfiguration
```

## 🚨 Troubleshooting

### Problem: Release-ID ist `null`

**Ursachen:**
- Kein Release im GitHub Repository
- GitHub API Rate Limit erreicht
- GitHub Credentials fehlen oder sind falsch

**Lösung:**
1. Prüfe GitHub Releases: https://github.com/chooomedia/hero-blocks/releases
2. Erstelle Release falls nötig
3. Prüfe GitHub Credentials in n8n
4. Prüfe n8n Execution Logs

### Problem: Build schlägt fehl

**Ursachen:**
- Docker Container läuft nicht
- Node Modules fehlen
- Cache-Probleme

**Lösung:**
```bash
# 1. Docker Container prüfen
docker ps | grep horex-shopware

# 2. Cache komplett löschen
docker exec horex-shopware bash -c \
  "cd /var/www/html && rm -rf var/cache/* && php bin/console cache:clear"

# 3. Node Modules neu installieren
docker exec horex-shopware bash -c \
  "cd /var/www/html/vendor/shopware/administration/Resources/app/administration && \
   rm -rf node_modules && npm install"
```

### Problem: Styles werden nicht geladen

**Ursache:** Styles liegen im Child-Theme, nicht im Plugin

**Lösung:**
```bash
# Theme neu kompilieren
docker exec horex-shopware php bin/console theme:compile
docker exec horex-shopware php bin/console cache:clear
```

### Problem: JavaScript Plugin nicht registriert

**Ursache:** PluginManager nicht verfügbar

**Lösung:** Safety Check in `main.js` prüft automatisch:
```javascript
if (window.PluginManager) {
    // Plugin registrieren
}
```

## 📚 Best Practices

### Entwicklung
- Immer `--force` verwenden bei Twig-Änderungen
- Browser-Cache nach jedem Build leeren
- Theme neu kompilieren nach SCSS-Änderungen
- Console-Logs für Debugging nutzen

### Testing
- Step-by-step: Frontend → Admin → Console → Cache → Hard Refresh
- Dockware-Befehle: `docker exec horex-shopware php bin/console ...`
- Browser DevTools: F12 → Console → Network → Elements

### Releases
- Tag-Format: `v1.0.0` (mit `v` Prefix!)
- Asset-Name: `hero-blocks-1.0.0.zip` (ohne `v`)
- Semantic Versioning: `MAJOR.MINOR.PATCH`
- Changelog dokumentieren

## 🔗 Links

- **Repository**: https://github.com/chooomedia/hero-blocks
- **Releases**: https://github.com/chooomedia/hero-blocks/releases
- **n8n Workflow**: https://n8n.chooomedia.com
- **GitHub Actions**: https://github.com/chooomedia/hero-blocks/actions
- **Shopware Docs**: https://developer.shopware.com

## 📝 License

Proprietary - HOREX Motorcycles
