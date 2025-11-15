# 🚀 Release v1.0.1 - Vorbereitung

## ✅ Vorbereitung abgeschlossen

### Git Status

- ✅ Version in `composer.json` auf `1.0.1` aktualisiert
- ✅ Alle Änderungen committed
- ✅ Git Tag `v1.0.1` erstellt
- ✅ Release-ZIP erstellt: `hero-blocks-1.0.1.zip` (144K)

### Änderungen in v1.0.1

- ✅ n8n Workflow optimiert (HTTP Request URL korrigiert)
- ✅ Slack Integration hinzugefügt (strukturierte Nachrichten)
- ✅ Error-Handling verbessert (neverError, continueOnFail)
- ✅ Dokumentation konsolidiert (Best Practices in Rules)
- ✅ README.md aktualisiert
- ✅ Redundante .md Dateien entfernt

## 📋 Nächste Schritte für GitHub Release

### 1. Git Push

```bash
cd /Users/chooom/dev/horex/HorexShopTheme/dockware/shopware/custom/plugins/HeroBlocks

# Push Commits
git push origin main

# Push Tag
git push origin v1.0.1
```

### 2. GitHub Release erstellen

1. **Öffne**: https://github.com/chooomedia/hero-blocks/releases/new

2. **Fülle aus**:
   - **Tag version**: `v1.0.1` (⚠️ **MUSS mit `v` beginnen!**)
   - **Release title**: `Release v1.0.1`
   - **Description**:
     ```markdown
     ## Hero Blocks v1.0.1
     
     ### 🎉 Update Release
     
     **Verbesserungen:**
     - ✅ n8n Workflow optimiert (GitHub API URL korrigiert)
     - ✅ Slack Integration hinzugefügt
     - ✅ Error-Handling verbessert
     - ✅ Dokumentation konsolidiert
     
     **Technische Details:**
     - HTTP Request Node: Korrekte GitHub API URL
     - Slack Notifications: Strukturierte Fehlermeldungen
     - Error Workflow: Robustes Error-Handling
     - Best Practices: In Rules dokumentiert
     
     **Installation:**
     1. Download `hero-blocks-1.0.1.zip`
     2. Shopware Admin → Settings → Extensions → Upload Plugin
     3. Install and activate plugin
     ```

3. **Upload ZIP-Asset**:
   - Ziehe `hero-blocks-1.0.1.zip` in das Upload-Feld
   - ⚠️ **WICHTIG**: Dateiname ist `hero-blocks-1.0.1.zip` (ohne `v`!)

4. **Release veröffentlichen**:
   - ✅ **"Set as the latest release"** aktivieren
   - Klicke auf **"Publish release"**

### 3. Release verifizieren

**Nach dem Release**:

1. **Prüfe Release-URL**: https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1
2. **Teste Download-URL**: https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip
3. **Teste n8n Workflow**:
   ```bash
   curl "https://n8n.chooomedia.com/webhook/hero-blocks?checkType=update&currentVersion=1.0.0&plugin=hero-blocks&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)"
   ```
4. **Prüfe Slack-Notifications**: Channel `horex` sollte Update-Benachrichtigung erhalten

## ✅ Checkliste

- [x] Version in `composer.json` auf `1.0.1` gesetzt
- [x] Alle Änderungen committed
- [x] Git Tag `v1.0.1` erstellt
- [x] Release-ZIP erstellt: `hero-blocks-1.0.1.zip`
- [ ] Git Push (Commits + Tag)
- [ ] GitHub Release erstellt
- [ ] Release als "Latest" markiert
- [ ] Release veröffentlicht
- [ ] Update-Check getestet
- [ ] Slack-Notifications geprüft

## 🎯 Wichtige Regeln

- ✅ **Tag-Format**: `v1.0.1` (muss mit `v` beginnen!)
- ✅ **Asset-Name**: `hero-blocks-1.0.1.zip` (ohne `v` im Dateinamen!)
- ✅ **Release als "Latest" markieren**: Für `/releases/latest` Endpoint

## 📝 Git Commands

```bash
# Push Commits
git push origin main

# Push Tag
git push origin v1.0.1

# Falls Tag bereits existiert (lokal)
git push origin v1.0.1 --force
```

