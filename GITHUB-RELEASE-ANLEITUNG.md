# 🚀 GitHub Release v1.0.1 - Schritt-für-Schritt Anleitung

## ✅ Schritt 1: Git Push - ERLEDIGT

- ✅ Commits gepusht: `main → origin/main`
- ✅ Tag gepusht: `v1.0.1 → origin/v1.0.1`
- ✅ Release-ZIP erstellt: `hero-blocks-1.0.1.zip` (141K)

## 📋 Schritt 2: GitHub Release erstellen

### 2.1 Release-Seite öffnen

**Öffne im Browser**:
```
https://github.com/chooomedia/hero-blocks/releases/new
```

**ODER**:
1. Gehe zu: https://github.com/chooomedia/hero-blocks
2. Klicke auf **"Releases"** (rechts in der Sidebar)
3. Klicke auf **"Create a new release"** oder **"Draft a new release"**

### 2.2 Tag auswählen

**Wichtig**: Der Tag `v1.0.1` wurde bereits gepusht!

- ✅ Wähle **"Choose a tag"** → `v1.0.1`
- ✅ ODER: **"Create new tag: v1.0.1 on publish"** (falls Tag noch nicht existiert)

### 2.3 Release-Informationen ausfüllen

**Release title**:
```
Release v1.0.1
```

**Description** (Changelog - Markdown):
```markdown
## Hero Blocks v1.0.1

### 🎉 Update Release

**Verbesserungen:**
- ✅ n8n Workflow optimiert (GitHub API URL korrigiert)
- ✅ Slack Integration hinzugefügt (strukturierte Fehlermeldungen)
- ✅ Error-Handling verbessert (neverError, continueOnFail)
- ✅ Dokumentation konsolidiert (Best Practices in Rules)
- ✅ README.md aktualisiert

**Technische Details:**
- HTTP Request Node: Korrekte GitHub API URL (`api.github.com`)
- Slack Notifications: Strukturierte Nachrichten mit Links
- Error Workflow: Robustes Error-Handling mit Fallbacks
- Best Practices: In `.cursor/rules/n8n-github-releases.mdc` dokumentiert

**Installation:**
1. Download `hero-blocks-1.0.1.zip`
2. Shopware Admin → Settings → Extensions → Upload Plugin
3. Install and activate plugin

**Update von v1.0.0:**
- Automatischer Update-Check erkennt neue Version
- Download und Installation direkt aus Shopware Admin möglich
```

### 2.4 ZIP-Asset hochladen

**Wichtig**: Die ZIP-Datei liegt lokal bereit!

1. **Lokaler Pfad**: `/Users/chooom/dev/horex/HorexShopTheme/dockware/shopware/custom/plugins/HeroBlocks/hero-blocks-1.0.1.zip`
2. **Im GitHub Release**:
   - Klicke auf **"Attach binaries by dropping them here or selecting them"**
   - Ziehe `hero-blocks-1.0.1.zip` in das Upload-Feld
   - ⚠️ **WICHTIG**: Dateiname sollte `hero-blocks-1.0.1.zip` sein (ohne `v`!)

### 2.5 Release-Typ wählen

- ✅ **"Set as the latest release"** aktivieren (WICHTIG für `/releases/latest` Endpoint!)
- ⚠️ **"Set as a pre-release"** NICHT aktivieren (nur für Beta/Alpha)

### 2.6 Release veröffentlichen

Klicke auf **"Publish release"**

## ✅ Schritt 3: Release verifizieren

### 3.1 Release-URL prüfen

**Öffne**:
```
https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1
```

**Erwartete Struktur**:
- ✅ Tag: `v1.0.1`
- ✅ Title: `Release v1.0.1`
- ✅ Description: Changelog sichtbar
- ✅ Assets: `hero-blocks-1.0.1.zip` (Download-Button vorhanden)

### 3.2 Download-URL testen

**Erwartete URL**:
```
https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip
```

**Test**: Öffne URL im Browser → ZIP sollte heruntergeladen werden

### 3.3 n8n Workflow testen

**Test-Webhook aufrufen**:
```bash
curl "https://n8n.chooomedia.com/webhook/hero-blocks?checkType=update&currentVersion=1.0.0&plugin=hero-blocks&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"
```

**Erwartete Response**:
```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip",
  "changelog": "## Hero Blocks v1.0.1\n\n..."
}
```

### 3.4 Shopware Admin Update-Check testen

1. **Öffne Shopware Admin**: http://localhost/admin
2. **Gehe zu**: Settings → Extensions → Hero Blocks → Config
3. **Klicke auf**: "Check for updates"
4. **Prüfe**:
   - ✅ Update wird erkannt (wenn `currentVersion < 1.0.1`)
   - ✅ "Update available" wird angezeigt
   - ✅ Download-Button wird angezeigt
   - ✅ Changelog wird angezeigt

### 3.5 Slack-Notifications prüfen

- **Channel**: `horex` (C04347838EP)
- **Erwartete Nachricht**: "✅ Hero Blocks Update verfügbar" mit Download-Link

## ✅ Checkliste

- [x] Git Commits gepusht
- [x] Git Tag `v1.0.1` gepusht
- [x] Release-ZIP erstellt: `hero-blocks-1.0.1.zip`
- [ ] GitHub Release erstellt
- [ ] Tag `v1.0.1` ausgewählt
- [ ] Changelog eingetragen
- [ ] ZIP-Asset hochgeladen: `hero-blocks-1.0.1.zip`
- [ ] Release als "Latest" markiert
- [ ] Release veröffentlicht
- [ ] Release-URL geprüft
- [ ] Download-URL getestet
- [ ] n8n Workflow getestet
- [ ] Shopware Admin Update-Check getestet
- [ ] Slack-Notifications geprüft

## 🎯 Wichtige Regeln

### ✅ Tag-Format (KORREKT):
- `v1.0.1` ✅ (muss mit `v` beginnen!)

### ✅ Asset-Name (KORREKT):
- `hero-blocks-1.0.1.zip` ✅ (ohne `v` im Dateinamen!)

### ✅ Release als "Latest" markieren:
- **WICHTIG**: Für `/releases/latest` Endpoint muss Release als "Latest" markiert sein!

## 🚨 Troubleshooting

### Problem: Release wird nicht erkannt

**Lösung**:
1. Prüfe Tag-Format: Muss `v1.0.1` sein (mit `v`)
2. Prüfe ob Release "Latest" markiert ist
3. Prüfe n8n Workflow Logs
4. Teste Webhook manuell mit curl

### Problem: Download-URL funktioniert nicht

**Lösung**:
1. Prüfe ob Asset hochgeladen ist
2. Prüfe Asset-Name: `hero-blocks-1.0.1.zip`
3. Prüfe Download-URL: `/releases/download/v1.0.1/hero-blocks-1.0.1.zip`
4. Teste URL direkt im Browser

## 🎉 Fertig!

Nach diesen Schritten:
- ✅ GitHub Release ist erstellt
- ✅ n8n Workflow kann Release abrufen
- ✅ Shopware Admin kann Update erkennen
- ✅ Download funktioniert
- ✅ Installation funktioniert
- ✅ Plugin ist im Shopware Update-System verfügbar!

