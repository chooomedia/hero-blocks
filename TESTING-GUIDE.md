# 🧪 Testing Guide - Hero Blocks n8n Workflow mit Release-ID

## 📋 Schritt-für-Schritt Anleitung

### Schritt 1: Workflow Validierung

#### 1.1 JSON Validierung

```bash
cd /Users/chooom/dev/horex/HorexShopTheme/dockware/shopware/custom/plugins/HeroBlocks
python3 -m json.tool src/Resources/n8n-workflows/hero-blocks-unified.json > /dev/null && echo "✅ JSON ist valide" || echo "❌ JSON-Fehler"
```

**Erwartetes Ergebnis:** `✅ JSON ist valide`

---

### Schritt 2: Workflow in n8n importieren

#### 2.1 Workflow importieren

1. Öffne n8n: https://n8n.chooomedia.com
2. Gehe zu **Workflows** → **Import from File**
3. Wähle: `src/Resources/n8n-workflows/hero-blocks-unified.json`
4. Klicke auf **Import**

#### 2.2 GitHub Credentials konfigurieren

1. Öffne den **GitHub (Get Latest Release)** Node
2. Klicke auf **Credential** → **Create New**
3. Wähle **GitHub API** als Credential Type
4. Füge deinen **Personal Access Token** hinzu
5. Klicke auf **Save**

**Wichtig:** GitHub Credentials sind erforderlich für:
- ✅ Höhere Rate Limits (5000 statt 60 Requests/Stunde)
- ✅ Besseres Error-Handling
- ✅ Zugriff auf private Repositories (falls nötig)

#### 2.3 Slack Credentials prüfen

1. Öffne den **Send Slack Message (Update)** Node
2. Prüfe ob Slack Credentials konfiguriert sind
3. Falls nicht: Füge Slack OAuth2 Credentials hinzu

#### 2.4 Workflow aktivieren

1. Klicke auf **Active** Toggle (oben rechts)
2. Workflow ist jetzt aktiv und empfängt Webhook-Requests

---

### Schritt 3: Manuelle Tests

#### 3.1 License Check Test

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=license&plugin=hero-blocks&version=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -v | jq '.'
```

**Erwartete Response:**
```json
{
  "valid": true,
  "expiresAt": "2028-11-30T23:59:59+00:00",
  "daysRemaining": 775
}
```

**Prüfungen:**
- ✅ HTTP Status: `200 OK`
- ✅ `valid`: `true`
- ✅ `expiresAt`: Datum in Zukunft
- ✅ `daysRemaining`: Positive Zahl

---

#### 3.2 Update Check Test (mit Release-ID Validierung)

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -v | jq '.'
```

**Erwartete Response (wenn Update verfügbar):**
```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip",
  "changelog": "...",
  "releaseId": 12345678,              // ✅ Dynamische Release-ID
  "releaseUrl": "https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1"
}
```

**Erwartete Response (wenn kein Update verfügbar):**
```json
{
  "available": false,
  "currentVersion": "1.0.1",
  "latestVersion": "1.0.1",
  "downloadUrl": null,
  "changelog": null,
  "releaseId": 12345678,              // ✅ Release-ID trotzdem vorhanden
  "releaseUrl": "https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1"
}
```

**Prüfungen:**
- ✅ HTTP Status: `200 OK`
- ✅ `releaseId`: Numerische ID (z.B. `12345678`) oder `null`
- ✅ `releaseUrl`: GitHub Release-URL oder `null`
- ✅ `latestVersion`: Version-String (z.B. `1.0.1`)
- ✅ `downloadUrl`: Download-URL oder `null`

---

#### 3.3 Release-ID Validierung

```bash
# Extrahiere Release-ID aus Response
RELEASE_ID=$(curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0" \
  -H "Content-Type: application/json" \
  -s | jq -r '.releaseId')

echo "Release-ID: $RELEASE_ID"

# Prüfe ob Release-ID numerisch ist
if [[ "$RELEASE_ID" =~ ^[0-9]+$ ]]; then
  echo "✅ Release-ID ist numerisch: $RELEASE_ID"
else
  echo "❌ Release-ID ist nicht numerisch: $RELEASE_ID"
fi
```

**Erwartetes Ergebnis:**
```
Release-ID: 12345678
✅ Release-ID ist numerisch: 12345678
```

---

### Schritt 4: Automatisiertes Test-Skript

#### 4.1 Test-Skript ausführen

```bash
cd /Users/chooom/dev/horex/HorexShopTheme/dockware/shopware/custom/plugins/HeroBlocks
./test-webhook.sh
```

**Erwartete Ausgabe:**
```
╔══════════════════════════════════════════════════════════════╗
║     Hero Blocks Webhook Test Suite                           ║
║     Testing n8n Workflow: hero-blocks-unified                ║
╚══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test: License Check (Gültig)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ HTTP Status: 200
✅ Expected field 'valid' found

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test: Update Check - Release-ID Validierung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ HTTP Status: 200

Release-ID Details:
  Release-ID: 12345678
  Release-URL: https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1
  Latest Version: 1.0.1
✅ Release-ID ist dynamisch extrahiert: 12345678
```

---

### Schritt 5: n8n Execution Logs prüfen

#### 5.1 Execution Logs öffnen

1. Gehe zu n8n: https://n8n.chooomedia.com
2. Öffne den **hero-blocks-unified** Workflow
3. Klicke auf **Executions** Tab
4. Wähle die letzte Execution aus

#### 5.2 GitHub Node prüfen

1. Öffne den **GitHub (Get Latest Release)** Node
2. Prüfe **Output**:
   - ✅ Array mit 1 Element (neuestes Release)
   - ✅ `id`: Numerische Release-ID
   - ✅ `tag_name`: Release Tag (z.B. `v1.0.1`)
   - ✅ `html_url`: Release-URL

#### 5.3 Code Node prüfen

1. Öffne den **Code (Process GitHub Response)** Node
2. Prüfe **Output**:
   - ✅ `githubReleaseId`: Numerische Release-ID
   - ✅ `githubReleaseUrl`: Release-URL
   - ✅ `latestVersion`: Version ohne `v` Prefix
   - ✅ `downloadUrl`: Download-URL

#### 5.4 Respond Node prüfen

1. Öffne den **Respond (Update Available)** oder **Respond (No Update)** Node
2. Prüfe **Output**:
   - ✅ `releaseId`: Numerische Release-ID oder `null`
   - ✅ `releaseUrl`: Release-URL oder `null`

---

### Schritt 6: Slack-Notifications prüfen

#### 6.1 Slack Channel prüfen

1. Öffne Slack: https://chooomedia.slack.com
2. Gehe zum Channel: `horex`
3. Prüfe ob Notifications angekommen sind

#### 6.2 Notification-Format prüfen

**Erwartete Notification (Update verfügbar):**
```
✅ Hero Blocks Update verfügbar

*Neue Version verfügbar:*
• Aktuelle Version: 1.0.0
• Neue Version: 1.0.1
• Download: [Download ZIP](https://github.com/...)
• Repository: [Release v1.0.1](https://github.com/...)
```

**Erwartete Notification (Kein Update):**
```
ℹ️ Hero Blocks - Kein Update verfügbar

*Plugin ist aktuell:*
• Version: 1.0.1
• Neueste Version: 1.0.1
• Status: Kein Update erforderlich
```

---

### Schritt 7: GitHub Release erstellen (für Tests)

#### 7.1 Release erstellen

1. Gehe zu: https://github.com/chooomedia/hero-blocks/releases
2. Klicke auf **Create a new release**
3. Wähle Tag: `v1.0.1` (oder erstelle neuen Tag)
4. Titel: `Release v1.0.1`
5. Beschreibung: Changelog
6. Upload: `hero-blocks-1.0.1.zip`
7. Klicke auf **Publish release**

#### 7.2 Release als "Latest" markieren

1. Öffne das erstellte Release
2. Prüfe ob es als "Latest release" markiert ist
3. Falls nicht: Bearbeite Release und markiere als "Latest"

#### 7.3 Release-ID notieren

1. Öffne das Release
2. Die Release-ID ist in der URL sichtbar: `https://github.com/chooomedia/hero-blocks/releases/tag/v1.0.1`
3. Oder: Prüfe GitHub API: `https://api.github.com/repos/chooomedia/hero-blocks/releases/latest`
4. Notiere die `id` (z.B. `12345678`)

---

### Schritt 8: Shopware Integration Test

#### 8.1 Shopware Plugin Update-Check

```php
// In Shopware Plugin: LicenseCheckService.php oder UpdateCheckService.php

$response = $this->httpClient->get('https://n8n.chooomedia.com/webhook/license/hero-blocks', [
    'query' => [
        'checkType' => 'update',
        'plugin' => 'hero-blocks',
        'currentVersion' => $this->getCurrentVersion(),
    ],
]);

$data = json_decode($response->getBody()->getContents(), true);

if ($data['available'] === true) {
    $releaseId = $data['releaseId'];        // ✅ Dynamische Release-ID
    $releaseUrl = $data['releaseUrl'];       // ✅ Release-URL
    $downloadUrl = $data['downloadUrl'];     // ✅ Download-URL
    
    // Speichere Release-ID für Tracking
    $this->config->set('heroBlocks.lastCheckedReleaseId', $releaseId);
    
    // Zeige Update-Benachrichtigung in Admin-UI
    $this->showUpdateNotification($data);
}
```

---

## ✅ Checkliste

### Workflow Setup
- [ ] Workflow in n8n importiert
- [ ] GitHub Credentials konfiguriert
- [ ] Slack Credentials konfiguriert
- [ ] Workflow aktiviert

### Tests
- [ ] JSON Validierung erfolgreich
- [ ] License Check funktioniert
- [ ] Update Check funktioniert
- [ ] Release-ID wird extrahiert
- [ ] Release-URL wird extrahiert
- [ ] Test-Skript läuft ohne Fehler

### n8n Execution Logs
- [ ] GitHub Node gibt Array zurück
- [ ] Code Node extrahiert Release-ID korrekt
- [ ] Respond Node gibt Release-ID zurück
- [ ] Keine Fehler in Execution Logs

### Slack-Notifications
- [ ] Notifications werden gesendet
- [ ] Notification-Format ist korrekt
- [ ] Links funktionieren

### GitHub Release
- [ ] Release erstellt
- [ ] Release als "Latest" markiert
- [ ] ZIP-Asset hochgeladen
- [ ] Release-ID notiert

### Shopware Integration
- [ ] Update-Check funktioniert
- [ ] Release-ID wird gespeichert
- [ ] Update-Benachrichtigung wird angezeigt

---

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

### Problem: Release-ID ist nicht numerisch

**Ursachen:**
- GitHub API Response ist fehlerhaft
- Code Node extrahiert Release-ID falsch

**Lösung:**
1. Prüfe GitHub Node Output in n8n
2. Prüfe Code Node Output in n8n
3. Prüfe GitHub API direkt: `https://api.github.com/repos/chooomedia/hero-blocks/releases/latest`

### Problem: HTTP Status 500

**Ursachen:**
- Workflow-Fehler
- GitHub API Fehler
- n8n Credentials fehlen

**Lösung:**
1. Prüfe n8n Execution Logs
2. Prüfe GitHub Credentials
3. Prüfe GitHub Repository existiert

---

## 📚 Weitere Informationen

- **n8n Workflow**: `src/Resources/n8n-workflows/hero-blocks-unified.json`
- **Test-Skript**: `test-webhook.sh`
- **Dokumentation**: `DYNAMIC-RELEASE-ID.md`
- **GitHub Repository**: https://github.com/chooomedia/hero-blocks
- **n8n Instance**: https://n8n.chooomedia.com

---

**Status**: ✅ **Testing Guide erstellt - Bereit für Tests!**

