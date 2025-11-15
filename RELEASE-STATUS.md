# ✅ Release v1.0.1 - Status

## 🎯 Schritt 1: Git Push - ✅ ERLEDIGT

- ✅ Commits gepusht: `main → origin/main`
- ✅ Tag gepusht: `v1.0.1 → origin/v1.0.1`
- ✅ Release-ZIP erstellt: `hero-blocks-1.0.1.zip` (141K)

## 🤖 Schritt 2: GitHub Actions (Automatisch)

**Status**: GitHub Actions Workflow ist konfiguriert!

**Workflow**: `.github/workflows/release.yml`
- **Trigger**: Wird automatisch ausgelöst, wenn Tag `v*` gepusht wird
- **Aktion**: Erstellt automatisch GitHub Release mit ZIP-Asset

**Prüfe GitHub Actions**:
1. Öffne: https://github.com/chooomedia/hero-blocks/actions
2. Suche nach: "Create Release" Workflow
3. Prüfe Status: Sollte "running" oder "completed" sein

**Falls Workflow läuft**:
- ⏳ Warte auf Completion (ca. 1-2 Minuten)
- ✅ Release wird automatisch erstellt
- ✅ ZIP wird automatisch hochgeladen
- ✅ Release wird als "Latest" markiert

**Falls Workflow fehlschlägt oder nicht startet**:
- Siehe "Schritt 3: Manuelles Release" unten

## 📋 Schritt 3: Manuelles Release (Falls nötig)

**Nur ausführen, wenn GitHub Actions nicht funktioniert!**

### 3.1 Release-Seite öffnen

**Öffne im Browser**:
```
https://github.com/chooomedia/hero-blocks/releases/new
```

### 3.2 Release-Informationen

**Tag**: `v1.0.1` (bereits vorhanden!)

**Release title**: `Release v1.0.1`

**Description**:
```markdown
## Hero Blocks v1.0.1

### 🎉 Update Release

**Verbesserungen:**
- ✅ n8n Workflow optimiert (GitHub API URL korrigiert)
- ✅ Slack Integration hinzugefügt
- ✅ Error-Handling verbessert
- ✅ Dokumentation konsolidiert

**Installation:**
1. Download `hero-blocks-1.0.1.zip`
2. Shopware Admin → Settings → Extensions → Upload Plugin
3. Install and activate plugin
```

**Upload ZIP**: `hero-blocks-1.0.1.zip` (lokal: `/Users/chooom/dev/horex/HorexShopTheme/dockware/shopware/custom/plugins/HeroBlocks/hero-blocks-1.0.1.zip`)

**"Set as the latest release"**: ✅ Aktivieren

**Publish release**: Klicken

## ✅ Schritt 4: Release verifizieren

### 4.1 Release-URL prüfen

**Öffne**:
```
https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1
```

**Erwartet**:
- ✅ Tag: `v1.0.1`
- ✅ Assets: `hero-blocks-1.0.1.zip`
- ✅ Download-Button vorhanden

### 4.2 n8n Workflow testen

```bash
curl "https://n8n.chooomedia.com/webhook/hero-blocks?checkType=update&currentVersion=1.0.0&plugin=hero-blocks&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"
```

**Erwartete Response**:
```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip"
}
```

### 4.3 Shopware Admin testen

1. Shopware Admin → Settings → Extensions → Hero Blocks → Config
2. "Check for updates" klicken
3. Update sollte erkannt werden

## 🎉 Fertig!

Nach erfolgreichem Release:
- ✅ Plugin ist im Shopware Update-System verfügbar
- ✅ Automatische Updates funktionieren
- ✅ n8n Workflow erkennt neue Version
- ✅ Slack-Notifications funktionieren

