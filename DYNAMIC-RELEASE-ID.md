# 🔄 Dynamische Release-ID für Shopware Update-Check

## 📋 Übersicht

Der n8n Workflow extrahiert **dynamisch** die Release-ID aus GitHub Releases für den Shopware Update-Check. Die Release-ID wird **nicht hardcoded**, sondern automatisch aus dem neuesten Release ermittelt.

---

## 🎯 Best Practices Implementierung

### 1. GitHub Node Konfiguration

**Operation: `getMany`** (nicht `get` mit spezifischer ID)

```json
{
  "resource": "release",
  "operation": "getMany",
  "owner": "chooomedia",
  "repository": "hero-blocks",
  "returnAll": false,
  "limit": 1,
  "options": {
    "perPage": 1
  }
}
```

**Warum `getMany` statt `get`?**
- ✅ **Dynamisch**: Holt immer das neueste Release (sortiert nach `published_at DESC`)
- ✅ **Keine Hardcoding**: Keine Release-ID muss manuell eingegeben werden
- ✅ **Automatisch**: GitHub sortiert Releases automatisch (neueste zuerst)
- ✅ **Robust**: Funktioniert auch wenn neue Releases erstellt werden

---

## 🔧 Code Node: Release-ID Extraktion

### Dynamische Extraktion

```javascript
// 3. Extrahiere Latest Release (erstes Element des Arrays)
// WICHTIG: GitHub Node gibt Releases sortiert zurück (neueste zuerst)
const githubResponse = releases[0];

// 7. Extrahiere Release-ID (dynamisch für Shopware Update-Check)
// WICHTIG: Release-ID wird für Shopware Update-Tracking benötigt
// GitHub API gibt Release-ID als numerischen Wert zurück (z.B. 12345678)
const releaseId = githubResponse.id || null;
const releaseUrl = githubResponse.html_url || null;
```

### Response-Daten

Der Code Node gibt folgende Daten zurück:

```json
{
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip",
  "changelog": "...",
  "currentVersion": "1.0.0",
  "githubTag": "v1.0.1",
  "githubReleaseId": 12345678,        // ✅ Dynamische Release-ID
  "githubReleaseUrl": "https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1",
  "githubPublishedAt": "2025-11-15T10:00:00Z",
  "hasError": false
}
```

---

## 📤 Shopware Update-Check Response

### Update Verfügbar

```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip",
  "changelog": "## Changelog\n\n- Bug fixes\n- New features",
  "releaseId": 12345678,              // ✅ Dynamische Release-ID
  "releaseUrl": "https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1"
}
```

### Kein Update Verfügbar

```json
{
  "available": false,
  "currentVersion": "1.0.1",
  "latestVersion": "1.0.1",
  "downloadUrl": null,
  "changelog": null,
  "releaseId": null,
  "releaseUrl": null
}
```

---

## 🔄 Workflow-Ablauf

```
1. Webhook empfängt Update-Check Request
   ↓
2. GitHub Node: getMany (limit: 1)
   → Holt neuestes Release (dynamisch sortiert)
   ↓
3. Code Node: Process GitHub Response
   → Extrahiert Release-ID aus releases[0].id
   → Extrahiert Release-URL aus releases[0].html_url
   → Extrahiert Version, Download-URL, Changelog
   ↓
4. Code Node: Compare Versions
   → Vergleicht currentVersion mit latestVersion
   ↓
5. Respond Node: Update Available / No Update
   → Gibt releaseId und releaseUrl zurück
```

---

## ✅ Vorteile der Dynamischen Lösung

### 1. Keine Hardcoding
- ❌ **Nicht**: Release-ID manuell in Workflow eintragen
- ✅ **Sondern**: Release-ID wird automatisch aus GitHub API extrahiert

### 2. Automatische Aktualisierung
- ✅ Neues Release wird automatisch erkannt
- ✅ Keine manuelle Workflow-Anpassung nötig
- ✅ Immer neuestes Release wird verwendet

### 3. Robustheit
- ✅ Funktioniert auch wenn Releases gelöscht werden
- ✅ Funktioniert auch wenn Release-Reihenfolge ändert
- ✅ Error-Handling für fehlende Releases

### 4. Shopware Integration
- ✅ Release-ID für Update-Tracking
- ✅ Release-URL für direkten Link
- ✅ Download-URL für Plugin-Installation

---

## 🧪 Test-Beispiele

### Test 1: Update-Check mit aktueller Version

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.1" \
  -H "Content-Type: application/json"
```

**Erwartete Response:**
```json
{
  "available": false,
  "currentVersion": "1.0.1",
  "latestVersion": "1.0.1",
  "releaseId": 12345678,
  "releaseUrl": "https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1"
}
```

### Test 2: Update-Check mit veralteter Version

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0" \
  -H "Content-Type: application/json"
```

**Erwartete Response:**
```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip",
  "releaseId": 12345678,
  "releaseUrl": "https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1"
}
```

---

## 📊 GitHub API Response Struktur

### Release Object (GitHub API)

```json
{
  "id": 12345678,                    // ✅ Release-ID (numerisch)
  "tag_name": "v1.0.1",              // Release Tag
  "name": "Release v1.0.1",          // Release Name
  "body": "## Changelog\n\n...",     // Changelog
  "published_at": "2025-11-15T10:00:00Z",
  "html_url": "https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1",
  "assets": [
    {
      "id": 98765432,
      "name": "hero-blocks-1.0.1.zip",
      "browser_download_url": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip"
    }
  ]
}
```

---

## 🔍 Verwendung in Shopware

### Shopware Plugin Update-Check

Die Release-ID kann in Shopware für folgende Zwecke verwendet werden:

1. **Update-Tracking**
   - Speichere Release-ID nach erfolgreichem Update
   - Prüfe ob Release-ID sich geändert hat

2. **Update-Benachrichtigungen**
   - Zeige Release-URL in Admin-UI
   - Link zu GitHub Release-Seite

3. **Update-Historie**
   - Speichere Release-ID in Update-Log
   - Nachvollziehbarkeit von Updates

### Beispiel: Shopware PHP Code

```php
// In LicenseCheckService.php oder UpdateCheckService.php

$response = $this->httpClient->get('https://n8n.chooomedia.com/webhook/license/hero-blocks', [
    'query' => [
        'checkType' => 'update',
        'plugin' => 'hero-blocks',
        'currentVersion' => $this->getCurrentVersion(),
    ],
]);

$data = json_decode($response->getBody()->getContents(), true);

if ($data['available'] === true) {
    // Update verfügbar
    $releaseId = $data['releaseId'];        // ✅ Dynamische Release-ID
    $releaseUrl = $data['releaseUrl'];      // ✅ Release-URL
    $downloadUrl = $data['downloadUrl'];    // ✅ Download-URL
    
    // Speichere Release-ID für Tracking
    $this->config->set('heroBlocks.lastCheckedReleaseId', $releaseId);
}
```

---

## 🚨 Error-Handling

### Kein Release gefunden

```json
{
  "available": false,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.0",
  "downloadUrl": null,
  "changelog": null,
  "releaseId": null,
  "releaseUrl": null
}
```

**Ursachen:**
- Keine Releases im Repository
- GitHub API Rate Limit erreicht
- Repository existiert nicht

**Lösung:**
1. Prüfe GitHub Releases: https://github.com/chooomedia/hero-blocks/releases
2. Erstelle erstes Release falls nötig
3. Prüfe n8n Execution Logs

---

## 📝 Checkliste

- [x] GitHub Node verwendet `getMany` (nicht `get`)
- [x] Release-ID wird dynamisch extrahiert (nicht hardcoded)
- [x] Release-ID wird in Response zurückgegeben
- [x] Error-Handling für fehlende Releases
- [x] Release-URL wird ebenfalls zurückgegeben
- [x] Dokumentation erstellt
- [ ] Shopware Integration getestet
- [ ] Update-Check in Shopware Admin-UI getestet

---

## 🔗 Weitere Informationen

- **n8n Workflow**: `src/Resources/n8n-workflows/hero-blocks-unified.json`
- **GitHub Repository**: https://github.com/chooomedia/hero-blocks
- **GitHub Releases**: https://github.com/chooomedia/hero-blocks/releases
- **n8n Instance**: https://n8n.chooomedia.com

---

**Status**: ✅ **Dynamische Release-ID Implementierung abgeschlossen!**

