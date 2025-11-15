# 🔍 Vollständiger Test-Guide: License & Update Check

## 🎯 Übersicht

Dieser Guide beschreibt **Schritt-für-Schritt** die vollständigen Tests für:

- ✅ **License Check**: Webhook-Integration mit n8n (gemäß n8n Best Practices)
- ✅ **Update Check**: Webhook-Integration mit n8n (gemäß n8n Best Practices)
- ✅ **Admin UI**: Shopware Admin Settings (`/admin#/sw/extension/config/HeroBlocks`)
- ✅ **Frontend**: Storefront (User-Frontend)

### ⚙️ Workflow-Konfiguration (n8n Best Practices)

**Webhook Path**: `:checkType/hero-blocks` (Doppelpunkt-Notation für dynamische Parameter)
**HTTP Method**: `GET`
**Query-Parameter**: Werden automatisch von Shopware übergeben und explizit im Code-Node weitergegeben
**Path-Parameter**: Werden in `params.checkType` zurückgegeben (n8n Standard)

## 📋 Voraussetzungen

1. **n8n Workflow aktiviert**:

   - Workflow: "Hero Blocks - Unified (License & Update Check)"
   - Status: **Active** (Toggle oben rechts im n8n Editor)
   - Production URLs verfügbar

2. **Environment Variables gesetzt** (in `.env` oder Docker):

   ```bash
   # WICHTIG: {checkType} wird automatisch durch 'license' oder 'update' ersetzt
   HERO_BLOCKS_WEBHOOK_URL=https://n8n.chooomedia.com/webhook/{checkType}/hero-blocks
   ```

3. **Shopware Plugin installiert und aktiv**:
   ```bash
   docker exec horex-shopware php bin/console plugin:refresh
   docker exec horex-shopware php bin/console plugin:install HeroBlocks
   docker exec horex-shopware php bin/console plugin:activate HeroBlocks
   ```

## 🧪 Test-Szenarien (Step-by-Step)

### STEP 1: n8n Webhook direkt testen (curl)

#### Test 1.1: License Check Webhook

```bash
curl -X GET "https://n8n.chooomedia.com/webhook/license/hero-blocks?plugin=hero-blocks&version=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -H "Accept: application/json"
```

**Erwartete Response:**

```json
{
  "valid": true,
  "expiresAt": "2027-12-31T00:00:00+00:00",
  "daysRemaining": 730
}
```

#### Test 1.2: Update Check Webhook

```bash
curl -X GET "https://n8n.chooomedia.com/webhook/update/hero-blocks?plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -H "Accept: application/json"
```

**Erwartete Response (Update verfügbar):**

```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.1.0",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.1.0/hero-blocks-1.1.0.zip",
  "changelog": "## What's Changed\n- New features..."
}
```

**Erwartete Response (Kein Update):**

```json
{
  "available": false,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.0"
}
```

### STEP 2: Shopware API Endpoints testen

#### Test 2.1: License Check API

```bash
# Im Docker Container
docker exec horex-shopware curl -X POST "http://localhost/api/_action/hero-blocks/check-license" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Erwartete Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "expiresAt": "2027-12-31T00:00:00.000Z",
    "daysRemaining": 730
  },
  "debug": {
    "durationMs": 245.5,
    "timestamp": "2025-11-15T08:00:00+00:00"
  }
}
```

#### Test 2.2: Update Check API

```bash
# Im Docker Container
docker exec horex-shopware curl -X GET "http://localhost/api/_action/hero-blocks/update-check" \
  -H "Content-Type: application/json"
```

**Erwartete Response:**

```json
{
  "success": true,
  "data": {
    "available": true,
    "currentVersion": "1.0.0",
    "latestVersion": "1.1.0",
    "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.1.0/hero-blocks-1.1.0.zip",
    "changelog": "## What's Changed..."
  }
}
```

#### Test 2.3: Debug Webhook Config

```bash
# Im Docker Container
docker exec horex-shopware curl -X GET "http://localhost/api/_action/hero-blocks/debug-webhook" \
  -H "Content-Type: application/json"
```

**Erwartete Response:**

```json
{
  "success": true,
  "debug": {
    "webhookUrl": "https://n8n.chooomedia.com/webhook/license/hero-blocks",
    "webhookUrlFound": true,
    "environment": {
      "HERO_BLOCKS_WEBHOOK_URL ($_ENV)": "https://n8n.chooomedia.com/webhook/{checkType}/hero-blocks"
    }
  }
}
```

### STEP 3: Admin UI Integration testen

#### Test 3.1: Admin Seite öffnen

1. **Öffne Browser**: http://localhost/admin#/sw/extension/config/HeroBlocks
2. **Login**: admin / shopware
3. **Erwartetes Verhalten**:
   - ✅ Seite lädt ohne Fehler
   - ✅ "Block Settings" Card sichtbar
   - ✅ "Update Information" Card sichtbar (Collapsible, initial geschlossen)
   - ✅ "License Information" Card sichtbar (Collapsible, initial geschlossen)
   - ✅ Beschreibung mit Features-Liste sichtbar

#### Test 3.2: License Check (Manuell)

1. **Öffne "License Information" Card** (klicke auf Header)
2. **Klicke auf "Check License" Button**
3. **Erwartetes Verhalten**:
   - ✅ Button zeigt Loading-Animation (`sw-loader`)
   - ✅ Button-Text ändert sich zu "Checking..."
   - ✅ Browser Console zeigt:
     ```
     🚀 Starting license check...
     📡 Calling license check API...
     ✅ API call completed in XXXms
     ✅ License check successful: { valid: true, expiresAt: "...", daysRemaining: 729 }
     ```
   - ✅ Success Notification: "License check successful - License is valid."
   - ✅ System Config wird aktualisiert:
     - `HeroBlocks.config.licenseStatus` = `active`
     - `HeroBlocks.config.licenseExpiresAt` = `2027-11-15T07:34:24+00:00`
   - ✅ License Status Chip im Header zeigt "License Active" (grün)
   - ✅ License Status Field zeigt "Active" (grüner Hintergrund)
   - ✅ Expires At Field zeigt korrektes Datum (lokalisiert)

#### Test 3.3: Silent License Check (Automatisch)

1. **Lade Admin Seite neu** (F5 oder Reload)
2. **Erwartetes Verhalten**:
   - ✅ License Chip im Header zeigt Status automatisch (ohne Notification)
   - ✅ Browser Console zeigt:
     ```
     🔇 Starting silent license check...
     ✅ Silent license check completed in XXXms
     ```
   - ✅ **KEINE** Notification (Silent Check)
   - ✅ Status wird korrekt angezeigt

#### Test 3.4: License Expiry Warning

1. **Simuliere Ablauf in 60 Tagen** (n8n Workflow anpassen oder direkt testen)
2. **Klicke auf "Check License" Button**
3. **Erwartetes Verhalten**:
   - ✅ Success Notification: "License check successful"
   - ✅ Warning Notification: "License expires soon - Your license will expire in X days. Please renew your license to continue using Hero Blocks."
   - ✅ Warning Notification bleibt offen (`autoClose: false`)

#### Test 3.5: Update Check (Manuell)

1. **Öffne "Update Information" Card** (klicke auf Header)
2. **Klicke auf "Check for updates" Button**
3. **Erwartetes Verhalten**:
   - ✅ Button zeigt Loading-Animation (`sw-loader`)
   - ✅ Button-Text ändert sich zu "Checking..."
   - ✅ Browser Console zeigt:
     ```
     🚀 Starting update check...
     📡 Calling update check API...
     ✅ API call completed in XXXms
     ✅ Update check successful: { available: true, latestVersion: "1.1.0", ... }
     ```
   - ✅ **Wenn Update verfügbar**:
     - Success Notification: "A plugin update is available - A new version (1.1.0) is available. Current version: 1.0.0"
     - Info Notification (Changelog): "Changelog - [Erste 200 Zeichen des Changelogs]..."
     - System Config wird aktualisiert:
       - `HeroBlocks.config.updateAvailable` = `true`
       - `HeroBlocks.config.latestVersion` = `1.1.0`
       - `HeroBlocks.config.updateDownloadUrl` = `[GitHub Release URL]`
       - `HeroBlocks.config.updateChangelog` = `[Changelog Text]`
     - Update Status Chip im Header zeigt "Update available" (blau)
     - "Update available" Field zeigt `true`
     - "Latest version" Field zeigt `1.1.0`
     - "Update download URL" Field zeigt GitHub URL
   - ✅ **Wenn KEIN Update verfügbar**:
     - Info Notification: "You are already using the latest version - You are already using the latest version (1.0.0)"
     - System Config wird aktualisiert:
       - `HeroBlocks.config.updateAvailable` = `false`
       - `HeroBlocks.config.latestVersion` = `1.0.0`

#### Test 3.6: Update Check Response Handling

**Best Practices Shopware UI/UX Update Handling:**

1. **Update verfügbar**:

   - ✅ Success Notification (bleibt offen für Aufmerksamkeit)
   - ✅ Info Notification mit Changelog (kurze Preview, schließt automatisch nach 10s)
   - ✅ Status Chip im Card-Header (blau, "Update available")
   - ✅ Alle Update-Daten werden in System Config gespeichert
   - ✅ Download URL ist verfügbar (für manuelle Installation)

2. **Kein Update verfügbar**:

   - ✅ Info Notification (schließt automatisch)
   - ✅ System Config zeigt korrekte Versionsnummern
   - ✅ Kein Status Chip (nur wenn Update verfügbar)

3. **Fehler beim Update Check**:
   - ✅ Error Notification mit Fehlermeldung
   - ✅ Browser Console zeigt detaillierte Error-Logs
   - ✅ System Config bleibt unverändert

### STEP 4: Frontend (Storefront) testen

#### Test 4.1: Storefront Homepage

1. **Öffne Browser**: http://localhost
2. **Erwartetes Verhalten**:
   - ✅ Seite lädt ohne Fehler
   - ✅ Hero Slider funktioniert (falls vorhanden)
   - ✅ Hero Two Columns Block funktioniert (falls vorhanden)
   - ✅ Keine JavaScript-Errors in Console
   - ✅ Responsive Design funktioniert (Mobile/Tablet/Desktop)

#### Test 4.2: Hero Slider (falls vorhanden)

1. **Prüfe Hero Slider auf Homepage**
2. **Erwartetes Verhalten**:
   - ✅ Slider zeigt alle Slides korrekt
   - ✅ Navigation (Prev/Next Buttons) funktioniert
   - ✅ Dots Navigation funktioniert
   - ✅ Auto-Slide funktioniert (falls aktiviert)
   - ✅ Responsive: Mobile zeigt korrekt (Stacked oder angepasst)
   - ✅ Height-Einstellungen werden korrekt angewendet (`min-height`, `max-height`)

#### Test 4.3: Hero Two Columns Block (falls vorhanden)

1. **Prüfe Hero Two Columns Block**
2. **Erwartetes Verhalten**:
   - ✅ Desktop/Tablet: 2 Spalten nebeneinander (50/50)
   - ✅ Mobile: Elemente untereinander (Stacked)
   - ✅ Layout-Wechsel funktioniert (image-left / text-left)
   - ✅ Background-Bilder werden korrekt angezeigt
   - ✅ Parallax-Scrolling funktioniert (falls aktiviert)
   - ✅ Spacing zwischen Elementen korrekt (Bootstrap Gutter)

### STEP 5: Browser Console Checks

**Öffne Browser DevTools (F12) → Console Tab:**

#### Erwartete Logs (License Check - Manuell):

```
🚀 Starting license check...
📡 Calling license check API...
✅ API call completed in 146ms
📦 Response data: {success: true, data: {...}, debug: {...}}
✅ License check successful: {
  valid: true,
  expiresAt: "2027-11-15T07:34:24+00:00",
  daysRemaining: 729,
  debug: {...},
  webhookDebug: {...}
}
```

#### Erwartete Logs (License Check - Silent):

```
🔇 Starting silent license check...
✅ Silent license check completed in 198ms
```

#### Erwartete Logs (Update Check):

```
🚀 Starting update check...
📡 Calling update check API...
✅ API call completed in 312ms
📦 Response data: {success: true, data: {...}}
✅ Update check successful: {
  available: true,
  currentVersion: "1.0.0",
  latestVersion: "1.1.0",
  downloadUrl: "https://github.com/...",
  changelog: "## What's Changed..."
}
```

### STEP 6: System Config Verifizierung

#### Prüfe System Config Werte:

```bash
# Im Docker Container
docker exec horex-shopware php bin/console system:config:get HeroBlocks.config.licenseStatus
docker exec horex-shopware php bin/console system:config:get HeroBlocks.config.licenseExpiresAt
docker exec horex-shopware php bin/console system:config:get HeroBlocks.config.updateAvailable
docker exec horex-shopware php bin/console system:config:get HeroBlocks.config.latestVersion
docker exec horex-shopware php bin/console system:config:get HeroBlocks.config.updateDownloadUrl
```

**Erwartete Werte (nach License Check):**

- `licenseStatus`: `active`
- `licenseExpiresAt`: `2027-11-15T07:34:24+00:00`

**Erwartete Werte (nach Update Check - Update verfügbar):**

- `updateAvailable`: `true`
- `latestVersion`: `1.1.0`
- `updateDownloadUrl`: `https://github.com/chooomedia/hero-blocks/releases/download/v1.1.0/hero-blocks-1.1.0.zip`

## ✅ Checkliste (Definition of Done)

### License Check:

- [ ] n8n Webhook direkt testbar (curl)
- [ ] Shopware API Endpoint funktioniert
- [ ] Admin UI Button funktioniert
- [ ] Silent Check funktioniert (automatisch beim Laden)
- [ ] Response wird korrekt ausgewertet (`valid`, `expiresAt`, `daysRemaining`)
- [ ] System Config wird korrekt gespeichert
- [ ] Notifications werden korrekt angezeigt
- [ ] Status Chip zeigt korrekten Status
- [ ] Expiry Warning funktioniert (< 60 Tage)
- [ ] Browser Console zeigt keine Fehler

### Update Check:

- [ ] n8n Webhook direkt testbar (curl)
- [ ] Shopware API Endpoint funktioniert
- [ ] Admin UI Button funktioniert
- [ ] Response wird korrekt ausgewertet (`available`, `currentVersion`, `latestVersion`, `downloadUrl`, `changelog`)
- [ ] System Config wird korrekt gespeichert
- [ ] Notifications werden korrekt angezeigt (Success/Info/Error)
- [ ] Status Chip zeigt korrekten Status (nur wenn Update verfügbar)
- [ ] Changelog wird angezeigt (falls vorhanden)
- [ ] Browser Console zeigt keine Fehler

### Frontend:

- [ ] Storefront lädt ohne Fehler
- [ ] Hero Slider funktioniert (falls vorhanden)
- [ ] Hero Two Columns Block funktioniert (falls vorhanden)
- [ ] Responsive Design funktioniert
- [ ] Keine JavaScript-Errors in Console

## ❌ Fehlerbehandlung

### Error: Workflow not active (404)

**Problem:** n8n Workflow ist nicht aktiviert.

**Lösung:**

1. Öffne n8n: https://n8n.chooomedia.com
2. Aktiviere den Workflow (Toggle oben rechts)

### Error: Webhook URL not found

**Problem:** Environment Variable nicht gesetzt.

**Lösung:**

1. Prüfe `.env` Datei:

   ```bash

   ```

# WICHTIG: {checkType} wird automatisch durch 'license' oder 'update' ersetzt

HERO_BLOCKS_WEBHOOK_URL=https://n8n.chooomedia.com/webhook/{checkType}/hero-blocks

````
2. Restarte Shopware Container:
```bash
docker-compose restart horex-shopware
````

### Error: Timeout

**Problem:** n8n Workflow antwortet nicht.

**Lösung:**

1. Prüfe n8n Workflow Execution Logs
2. Prüfe GitHub API Rate Limits (für Update Check)
3. Prüfe Network Connectivity

### Error: Response not parsed correctly

**Problem:** n8n Response-Format wird nicht erkannt.

**Lösung:**

1. Prüfe n8n Workflow Response-Format
2. Prüfe `UpdateCheckService.php` Response-Parsing
3. Prüfe Browser Console Logs für detaillierte Response-Daten

## 📝 Best Practices Implementierung

### License Check:

- ✅ **Silent Check**: Automatisch beim Laden der Admin-Seite (ohne Notification)
- ✅ **Manual Check**: Via Button-Klick (mit Notification)
- ✅ **Status Chip**: Zeigt Status im Header (grün/rot)
- ✅ **Expiry Warning**: Nur wenn < 60 Tage bis Ablauf
- ✅ **System Config**: Speichert alle Daten für Persistenz

### Update Check:

- ✅ **Manual Check**: Via Button-Klick (mit Notification)
- ✅ **Status Chip**: Zeigt Status nur wenn Update verfügbar (blau)
- ✅ **Changelog Display**: Info-Notification mit Changelog-Preview (200 Zeichen)
- ✅ **Download URL**: Verfügbar für manuelle Installation
- ✅ **System Config**: Speichert alle Daten für Persistenz
- ✅ **Best Practices UI/UX**:
  - Success Notification bleibt offen (für Aufmerksamkeit)
  - Info Notification schließt automatisch (nach 10s)
  - Error Notification bleibt offen (für Fehlerbehandlung)

## 🔍 Debug-Tipps

1. **Browser Console**: Immer F12 → Console Tab öffnen für detaillierte Logs
2. **n8n Executions**: Prüfe Execution List (nicht Canvas!) für Production-Executions
3. **Shopware Logs**: `var/log/prod.log` oder `var/log/dev.log`
4. **System Config**: `bin/console system:config:get HeroBlocks.config.*`
5. **Network Tab**: Browser DevTools → Network Tab für API-Call-Details
