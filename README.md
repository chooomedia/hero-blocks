# Hero Blocks Plugin

CMS Blocks Plugin für Shopware 6.7+ mit Hero Slider, Two Columns, Mega Menu und automatischem Update-System.

## 📦 Features

- ✅ **Hero Block Slider** - Multi-Slide Hero Slider mit Navigation
- ✅ **Hero Two Columns** - Image & Text Layout mit Parallax
- ✅ **Hero Mega Menu** - Mega Menu Navigation Block
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

### Update-System

**Automatischer Update-Check**:
- Plugin prüft automatisch auf neue Versionen via n8n Workflow
- Updates werden im Shopware Admin angezeigt
- Download und Installation direkt aus dem Admin möglich

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

### Testing

```bash
# Update-Check testen
curl "https://n8n.chooomedia.com/webhook/hero-blocks?checkType=update&currentVersion=0.9.0&plugin=hero-blocks&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"
```

## 📚 Dokumentation

- **Best Practices**: Siehe `.cursor/rules/n8n-github-releases.mdc`
- **Release Script**: `create-release-zip.sh`
- **n8n Workflow**: `src/Resources/n8n-workflows/hero-blocks-unified.json`

## 🔗 Links

- **Repository**: https://github.com/chooomedia/hero-blocks
- **Releases**: https://github.com/chooomedia/hero-blocks/releases
- **n8n Workflow**: https://n8n.chooomedia.com

## 📝 License

Proprietary - HOREX Motorcycles
