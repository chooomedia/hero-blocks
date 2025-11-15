# Test Webhook CURLs für Hero Blocks n8n Workflow

## 📋 Übersicht

Dieses Dokument enthält Test-CURLs für den Hero Blocks Unified Webhook Workflow.

**Webhook Base URL**: `https://n8n.chooomedia.com/webhook/license/hero-blocks`

## 🔧 Test-Szenarien

### 1. License Check (Standard)

**Test: Gültige License prüfen**

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=license&plugin=hero-blocks&version=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -v
```

**Erwartete Response:**
```json
{
  "valid": true,
  "expiresAt": "2028-11-30T23:59:59+00:00",
  "daysRemaining": 775
}
```

---

### 2. Update Check (Standard)

**Test: Update-Check für aktuelle Version**

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -v
```

**Erwartete Response (wenn kein Update verfügbar):**
```json
{
  "available": false,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.0",
  "downloadUrl": null,
  "changelog": null
}
```

**Erwartete Response (wenn Update verfügbar):**
```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip",
  "changelog": "## Changelog\n\n- Bug fixes\n- New features"
}
```

---

### 3. Update Check (mit neuerer Version)

**Test: Update-Check mit veralteter Version**

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -v
```

**Erwartete Response (wenn v1.0.1 verfügbar):**
```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.1",
  "downloadUrl": "https://github.com/chooomedia/hero-blocks/releases/download/v1.0.1/hero-blocks-1.0.1.zip",
  "changelog": "..."
}
```

---

### 4. Error Handling Test

**Test: Update-Check ohne GitHub Release (404 Simulation)**

```bash
# Dieser Test prüft das Error-Handling, wenn kein Release gefunden wird
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -v
```

**Erwartete Response (bei Fehler):**
```json
{
  "available": false,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.0",
  "downloadUrl": null,
  "changelog": null
}
```

---

## 🧪 Test-Skript (Bash)

**Vollständiges Test-Skript für alle Szenarien:**

```bash
#!/bin/bash

# Farben für Output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

WEBHOOK_URL="https://n8n.chooomedia.com/webhook/license/hero-blocks"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)

echo -e "${YELLOW}=== Hero Blocks Webhook Tests ===${NC}\n"

# Test 1: License Check
echo -e "${GREEN}Test 1: License Check${NC}"
curl -X POST "${WEBHOOK_URL}?checkType=license&plugin=hero-blocks&version=1.0.0&shopwareVersion=6.7.0&timestamp=${TIMESTAMP}" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "❌ JSON Parse Error"
echo -e "\n"

# Test 2: Update Check (aktuell)
echo -e "${GREEN}Test 2: Update Check (aktuell)${NC}"
curl -X POST "${WEBHOOK_URL}?checkType=update&plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=${TIMESTAMP}" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "❌ JSON Parse Error"
echo -e "\n"

# Test 3: Update Check (veraltet)
echo -e "${GREEN}Test 3: Update Check (veraltet)${NC}"
curl -X POST "${WEBHOOK_URL}?checkType=update&plugin=hero-blocks&currentVersion=0.9.0&shopwareVersion=6.7.0&timestamp=${TIMESTAMP}" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "❌ JSON Parse Error"
echo -e "\n"

echo -e "${YELLOW}=== Tests abgeschlossen ===${NC}"
```

---

## 📝 Testdaten

### Query-Parameter

| Parameter | Beschreibung | Beispiel | Erforderlich |
|-----------|--------------|----------|--------------|
| `checkType` | Art des Checks | `license` oder `update` | ✅ Ja |
| `plugin` | Plugin-Name | `hero-blocks` | ✅ Ja |
| `version` | Plugin-Version (für License) | `1.0.0` | Optional |
| `currentVersion` | Aktuelle Version (für Update) | `1.0.0` | ✅ Ja (Update) |
| `shopwareVersion` | Shopware-Version | `6.7.0` | Optional |
| `timestamp` | ISO 8601 Timestamp | `2025-11-15T16:51:21+00:00` | Optional |

### Headers

| Header | Wert | Beschreibung |
|--------|------|--------------|
| `Content-Type` | `application/json` | JSON Content Type |
| `User-Agent` | `Shopware-HeroBlocks-Plugin/1.0.0` | Plugin User Agent |

---

## 🔍 Debugging

### Verbose Output

Füge `-v` Flag hinzu für detaillierte HTTP-Informationen:

```bash
curl -v -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0"
```

### JSON Formatting

Verwende `jq` für formatierte JSON-Ausgabe:

```bash
curl -X POST "..." | jq '.'
```

### HTTP Status Code

Prüfe HTTP Status Code:

```bash
curl -X POST "..." -w "\nHTTP Status: %{http_code}\n" -s
```

---

## ✅ Checkliste

- [ ] License Check funktioniert
- [ ] Update Check funktioniert (aktuell)
- [ ] Update Check funktioniert (veraltet)
- [ ] Error Handling funktioniert (kein Release)
- [ ] Slack-Notifications werden gesendet
- [ ] JSON Response ist valide
- [ ] HTTP Status Codes sind korrekt (200 OK)

---

## 🚨 Troubleshooting

### Problem: 404 Not Found

**Ursache**: Webhook-Pfad ist falsch oder Workflow ist nicht aktiviert

**Lösung**:
1. Prüfe Webhook-Pfad in n8n: `/webhook/license/hero-blocks`
2. Aktiviere Workflow in n8n
3. Prüfe n8n Execution Logs

### Problem: 500 Internal Server Error

**Ursache**: Workflow-Fehler (z.B. GitHub API Fehler)

**Lösung**:
1. Prüfe n8n Execution Logs
2. Prüfe GitHub Credentials
3. Prüfe GitHub Repository existiert

### Problem: JSON Parse Error

**Ursache**: Response ist kein valides JSON

**Lösung**:
1. Prüfe n8n Workflow Response Node
2. Prüfe Error-Handling im Workflow
3. Prüfe n8n Execution Logs

---

## 📚 Weitere Informationen

- **n8n Workflow**: `hero-blocks-unified.json`
- **GitHub Repository**: https://github.com/chooomedia/hero-blocks
- **n8n Instance**: https://n8n.chooomedia.com

