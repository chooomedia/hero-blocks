# Hero Blocks Plugin

CMS Blocks Plugin für Shopware 6.7+ mit Hero Slider, Two Columns, Mega Menu und automatischem Update-System.

## 📦 Features

- ✅ **Hero Block Slider** - Multi-Slide Hero Slider mit Navigation
- ✅ **Hero Two Columns** - Image & Text Layout mit Parallax
- ✅ **Hero Mega Menu** - Mega Menu Navigation Block
- ✅ **License Check System** - n8n-basierte Lizenzprüfung
- ✅ **Update Check System** - Automatische Updates via GitHub Releases mit dynamischer Release-ID
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

### Update-System

**Automatischer Update-Check**:
- Plugin prüft automatisch auf neue Versionen via n8n Workflow
- Updates werden im Shopware Admin angezeigt
- Download und Installation direkt aus dem Admin möglich
- **Dynamische Release-ID**: Release-ID wird automatisch aus GitHub extrahiert (nicht hardcoded)

**Manueller Update-Check**:
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

## 🧪 Testing

### Automatisiertes Test-Skript

```bash
./test-webhook.sh
```

### Manuelle Tests

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

**Erwartete Response (Update verfügbar):**
```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip",
  "changelog": "...",
  "releaseId": 12345678,
  "releaseUrl": "https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1"
}
```

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

### Slack Credentials prüfen

1. Öffne den **Send Slack Message (Update)** Node
2. Prüfe ob Slack Credentials konfiguriert sind
3. Falls nicht: Füge Slack OAuth2 Credentials hinzu

### Workflow aktivieren

1. Klicke auf **Active** Toggle (oben rechts)
2. Workflow ist jetzt aktiv und empfängt Webhook-Requests

## 🔄 Dynamische Release-ID

Der n8n Workflow extrahiert **dynamisch** die Release-ID aus GitHub Releases:

- ✅ **Keine Hardcoding**: Release-ID wird automatisch aus GitHub API extrahiert
- ✅ **Automatische Aktualisierung**: Neues Release wird automatisch erkannt
- ✅ **Shopware Integration**: Release-ID für Update-Tracking

**GitHub Node Konfiguration:**
```json
{
  "resource": "release",
  "operation": "getMany",
  "owner": "chooomedia",
  "repository": "hero-blocks",
  "returnAll": false,
  "limit": 1
}
```

**Response enthält:**
- `releaseId`: Numerische GitHub Release-ID (z.B. `12345678`)
- `releaseUrl`: Link zur GitHub Release-Seite
- `latestVersion`: Version ohne `v` Prefix
- `downloadUrl`: Download-URL für ZIP-Asset

## 📁 Struktur

```
src/Resources/
├── app/administration/src/          # Admin Module
│   └── module/sw-cms/
│       ├── blocks/                 # CMS Block Registrierung
│       └── elements/               # CMS Element Konfiguration
├── views/storefront/               # Storefront Templates
│   ├── block/                      # Block Templates
│   └── element/                    # Element Templates
├── n8n-workflows/                  # n8n Workflow Definitionen
│   └── hero-blocks-unified.json    # Unified License & Update Check
└── config/                         # Plugin Konfiguration
```

## 🛠️ Entwicklung

### Build Commands

```bash
# Admin Assets bauen
docker exec horex-shopware php bin/console bundle:dump
docker exec -e PROJECT_ROOT=/var/www/html \
           -e ADMIN_ROOT=/var/www/html/vendor/shopware/administration \
           -e SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1 \
           -e VITE_MODE=production \
           -w /var/www/html/vendor/shopware/administration/Resources/app/administration \
           horex-shopware npm run build
docker exec horex-shopware php bin/console assets:install
docker exec horex-shopware php bin/console cache:clear
```

### JSON Validierung

```bash
python3 -m json.tool src/Resources/n8n-workflows/hero-blocks-unified.json > /dev/null && echo "✅ JSON ist valide" || echo "❌ JSON-Fehler"
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

### Problem: HTTP Status 500

**Ursachen:**
- Workflow-Fehler
- GitHub API Fehler
- n8n Credentials fehlen

**Lösung:**
1. Prüfe n8n Execution Logs
2. Prüfe GitHub Credentials
3. Prüfe GitHub Repository existiert

## 📚 Dokumentation

- **Best Practices**: Siehe `.cursor/rules/n8n-github-releases.mdc`
- **Release Script**: `create-release-zip.sh`
- **Test Script**: `test-webhook.sh`
- **n8n Workflow**: `src/Resources/n8n-workflows/hero-blocks-unified.json`

## 🔗 Links

- **Repository**: https://github.com/chooomedia/hero-blocks
- **Releases**: https://github.com/chooomedia/hero-blocks/releases
- **n8n Workflow**: https://n8n.chooomedia.com
- **GitHub Actions**: https://github.com/chooomedia/hero-blocks/actions

## 📝 License

Proprietary - HOREX Motorcycles
