# Webhook Testing Guide

## 🎯 Übersicht

Dieses Dokument beschreibt die Schritt-für-Schritt-Tests für die Hero Blocks Webhook-Integration:
- **License Check**: `/license/hero-blocks`
- **Update Check**: `/update/hero-blocks`

## 📋 Voraussetzungen

1. **n8n Workflow aktiviert**: Workflow muss in n8n aktiviert sein (Toggle oben rechts im Editor)
2. **Environment Variables gesetzt**:
   ```bash
   HERO_BLOCKS_WEBHOOK_URL=https://n8n.chooomedia.com/webhook/license/hero-blocks
   HERO_BLOCKS_UPDATE_WEBHOOK_URL=https://n8n.chooomedia.com/webhook/update/hero-blocks
   ```
3. **Shopware Plugin installiert und aktiv**: `bin/console plugin:install --activate HeroBlocks`

## ⚠️ Häufige Probleme & Lösungen

### Problem: Executions nicht sichtbar in n8n UI

**Symptom:** License/Update Check funktioniert, aber Executions sind nicht in n8n UI sichtbar.

**Ursache:** n8n unterscheidet zwischen Test-Executions (sichtbar im Canvas) und Production-Executions (nur in Execution List).

**Lösung:**
1. **Execution List öffnen** (nicht Workflow-Detail):
   - Links in n8n UI: "Executions" Tab (im Hauptmenü)
   - Oder: Workflow öffnen → "Executions" Tab (unten im Workflow-Detail)
   - **WICHTIG**: Production-Executions erscheinen NICHT im Canvas (nur Test-Executions!)
2. **Filter prüfen**:
   - Status: "All" (nicht nur "Error" oder "Success")
   - Mode: "Production" (nicht nur "Test")
   - Time Range: "Last 24 hours" / "Last week"
   - Workflow: "Hero Blocks - Unified (License & Update Check)" (falls Filter vorhanden)
3. **Verifizierung**:
   - Workflow muss "Active" sein (Toggle oben rechts)
   - Webhook muss "Production URL" verwenden (nicht "Test URL")
   - **Tipp**: Wenn Executions fehlen, prüfe ob der Workflow wirklich aktiv ist
4. **Alternative Prüfung**:
   - Prüfe n8n Logs: Workflow → "Executions" Tab → Klicke auf eine Execution → "View Execution"
   - Oder: Prüfe Shopware Logs: `var/log/prod.log` für License Check Logs

### Problem: Browser Console Errors (nicht kritisch)

**Symptom:** Console zeigt Errors wie:
- `Unchecked runtime.lastError: The message port closed before a response was received.`
- `favicon-32x32.png 404 (Not Found)`

**Ursache:**
- `runtime.lastError`: Chrome Extension Error (ignorierbar, hat keinen Einfluss auf Shopware)
- `favicon-32x32.png`: Fehlendes Favicon (Shopware Core-Issue, ignoriert Shopware intern)

**Lösung:** Diese Errors können ignoriert werden, sie beeinträchtigen die Funktionalität nicht.

## 🧪 Test-Szenarien

### STEP 1: n8n Workflow aktivieren

1. Öffne n8n: https://n8n.chooomedia.com
2. Navigiere zum Workflow: "Hero Blocks - Unified (License & Update Check)"
3. **WICHTIG**: Aktiviere den Workflow (Toggle oben rechts: "Inactive" → "Active")
4. Verifiziere, dass der Status "Active" ist

### STEP 2: n8n Webhook direkt testen (curl)

#### Test 2.1: License Check Webhook

```bash
curl -X GET "https://n8n.chooomedia.com/webhook/license/hero-blocks?plugin=hero-blocks&version=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -H "Accept: application/json"
```

**Erwartete Response (gültige Lizenz):**
```json
{
  "valid": true,
  "expiresAt": "2027-12-31T00:00:00+00:00",
  "daysRemaining": 730
}
```

**Erwartete Response (abgelaufene Lizenz):**
```json
{
  "valid": false,
  "expiresAt": "2027-12-31T00:00:00+00:00",
  "daysRemaining": -100
}
```

#### Test 2.2: Update Check Webhook

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

### STEP 3: Shopware API Endpoints testen

#### Test 3.1: Debug Webhook Config

```bash
# Im Docker Container ausführen
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
      "HERO_BLOCKS_WEBHOOK_URL ($_ENV)": "https://n8n.chooomedia.com/webhook/license/hero-blocks",
      "HERO_BLOCKS_UPDATE_WEBHOOK_URL ($_ENV)": "https://n8n.chooomedia.com/webhook/update/hero-blocks"
    }
  }
}
```

#### Test 3.2: License Check API

```bash
# Im Docker Container ausführen
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

#### Test 3.3: Update Check API

```bash
# Im Docker Container ausführen
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

### STEP 4: Admin UI Integration testen

1. **Öffne Admin UI**: http://localhost/admin#/sw/extension/config/HeroBlocks
2. **License Check**:
   - Klicke auf "Check License" Button (License Information Card)
   - Erwartetes Verhalten:
     - ✅ Success Notification: "License is valid"
     - ✅ License Chip im Header zeigt "Active" (grün)
     - ✅ Browser Console zeigt: `✅ License check successful`
3. **Silent License Check**:
   - Lade die Seite neu
   - Erwartetes Verhalten:
     - ✅ License Chip im Header zeigt Status automatisch (ohne Notification)
     - ✅ Browser Console zeigt: `🔇 Silent license check completed`
4. **Update Check**:
   - Klicke auf "Check for updates" Button (Update Information Card)
   - Erwartetes Verhalten:
     - ✅ Update Status wird aktualisiert
     - ✅ "Latest version" wird angezeigt
     - ✅ Browser Console zeigt: `✅ Update check completed`

### STEP 5: Browser Console Checks

Öffne Browser DevTools (F12) → Console Tab:

**Erwartete Logs (License Check):**
```
🚀 Starting license check...
📡 Calling license check API...
✅ API call completed in 245ms
✅ License check successful: { valid: true, expiresAt: "2027-12-31...", daysRemaining: 730 }
```

**Erwartete Logs (Update Check):**
```
🚀 Starting update check...
📡 Calling update check API...
✅ API call completed in 312ms
✅ Update check successful: { available: true, latestVersion: "1.1.0" }
```

**Erwartete Logs (Silent License Check beim Laden der Seite):**
```
🔇 Starting silent license check...
📡 Calling license check API...
✅ Silent license check completed in 198ms
```

## ❌ Fehlerbehandlung

### Error: Workflow not active (404)

**Problem:** n8n Workflow ist nicht aktiviert.

**Lösung:**
1. Öffne n8n: https://n8n.chooomedia.com
2. Aktiviere den Workflow (Toggle oben rechts)

### Error: Webhook URL not found

**Problem:** Environment Variable nicht gesetzt.

**Lösung:**
1. Prüfe `.env` Datei im Shopware Root:
   ```bash
   HERO_BLOCKS_WEBHOOK_URL=https://n8n.chooomedia.com/webhook/license/hero-blocks
   HERO_BLOCKS_UPDATE_WEBHOOK_URL=https://n8n.chooomedia.com/webhook/update/hero-blocks
   ```
2. Restarte Shopware Container:
   ```bash
   docker-compose restart horex-shopware
   ```

### Error: Timeout

**Problem:** n8n Workflow antwortet nicht (zu langsam).

**Lösung:**
1. Prüfe n8n Workflow Execution Logs
2. Prüfe GitHub API Rate Limits (für Update Check)
3. Prüfe Network Connectivity

## ✅ Checkliste

- [ ] n8n Workflow aktiviert
- [ ] Environment Variables gesetzt (`HERO_BLOCKS_WEBHOOK_URL`, `HERO_BLOCKS_UPDATE_WEBHOOK_URL`)
- [ ] n8n Webhook direkt testbar (curl)
- [ ] Shopware API Endpoints erreichbar
- [ ] Admin UI zeigt License Chip korrekt
- [ ] License Check funktioniert (manuell + silent)
- [ ] Update Check funktioniert
- [ ] Browser Console zeigt keine Fehler
- [ ] Notifications werden korrekt angezeigt

## 🔍 Debug-Endpoints

### Debug Webhook Config

```bash
GET /api/_action/hero-blocks/debug-webhook
```

Gibt aktuelle Webhook-Config zurück (Environment Variables, System Config, etc.)

## 📝 Notizen

- **License Check**: Verwendet `HERO_BLOCKS_WEBHOOK_URL` Environment Variable
- **Update Check**: Verwendet `HERO_BLOCKS_UPDATE_WEBHOOK_URL` Environment Variable
- **Silent Check**: Automatisch beim Laden der Admin Config-Seite (ohne Notification)
- **Manual Check**: Via Button-Klick (mit Notification)
