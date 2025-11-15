# ✅ Hero Blocks n8n Workflow - Optimierung abgeschlossen

## 📋 Zusammenfassung

Der n8n Workflow wurde erfolgreich optimiert und verwendet jetzt den **offiziellen GitHub Node** gemäß n8n Best Practices.

---

## 🔧 Durchgeführte Änderungen

### 1. GitHub Node Konfiguration

**Vorher:**
- ❌ HTTP Request Node mit manueller URL-Konstruktion
- ❌ Manuelle Header-Konfiguration
- ❌ Manuelles Error-Handling

**Nachher:**
- ✅ **GitHub Node** (n8n Built-in)
- ✅ Resource: `release`
- ✅ Operation: `getMany` (für latest Release)
- ✅ Repository: `chooomedia/hero-blocks`
- ✅ Limit: `1` (nur neuestes Release)
- ✅ Error-Handling: `continueOnFail: true` + `onError: "continueErrorOutput"`

### 2. Code Node Anpassungen

**Code (Process GitHub Response):**
- ✅ Array-Handling: `releases[0]` für neuestes Release
- ✅ Error-Handling: Prüfung auf leeres Array
- ✅ Fallback-Logik für verschiedene Datenstrukturen
- ✅ Kommentare aktualisiert (GitHub Node statt HTTP Request)

### 3. Connections aktualisiert

- ✅ Node-Name geändert: `Get a release` → `GitHub (Get Latest Release)`
- ✅ Alle Connections aktualisiert
- ✅ Error-Output Connection hinzugefügt

---

## 📁 Erstellte Dateien

### 1. `TEST-WEBHOOK-CURLS.md`
- ✅ Vollständige Test-Dokumentation
- ✅ Alle Test-Szenarien dokumentiert
- ✅ Query-Parameter erklärt
- ✅ Troubleshooting-Guide

### 2. `test-webhook.sh`
- ✅ Ausführbares Test-Skript
- ✅ Testet alle Webhook-Endpunkte
- ✅ Farbige Output-Formatierung
- ✅ JSON-Formatierung mit jq
- ✅ HTTP Status Code Prüfung

---

## 🧪 Test-CURLs

### License Check

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=license&plugin=hero-blocks&version=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0"
```

**Erwartete Response:**
```json
{
  "valid": true,
  "expiresAt": "2028-11-30T23:59:59+00:00",
  "daysRemaining": 775
}
```

### Update Check

```bash
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0"
```

**Erwartete Response (kein Update):**
```json
{
  "available": false,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.0",
  "downloadUrl": null,
  "changelog": null
}
```

**Erwartete Response (Update verfügbar):**
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

## 🚀 Test-Skript ausführen

```bash
# Test-Skript ausführen
./test-webhook.sh

# Oder manuell testen
curl -X POST "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&plugin=hero-blocks&currentVersion=1.0.0" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" | jq '.'
```

---

## ✅ GitHub Node Konfiguration

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

**Wichtig:**
- ✅ GitHub Credentials erforderlich (OAuth oder Personal Access Token)
- ✅ Höhere Rate Limits mit Credentials (5000 statt 60 Requests/Stunde)
- ✅ Besseres Error-Handling

---

## 📊 Workflow-Struktur

```
Webhook
  → Code (Determine Check Type)
  → IF Check Type = License?
    ├─ License Branch:
    │   Set (Compute License)
    │   → Code (Format Slack - License)
    │   → IF License Valid?
    │     ├─ Respond (License Valid) → Slack
    │     └─ Respond (License Invalid) → Slack
    │
    └─ Update Branch:
        GitHub (Get Latest Release) ← ✅ NEU!
        → Code (Process GitHub Response)
        → Code (Compare Versions)
        → Code (Format Slack - Update)
        → IF Update Available?
          ├─ Respond (Update Available) → Slack
          └─ Respond (No Update) → Slack
```

---

## 🎯 Vorteile der GitHub Node Lösung

✅ **Native n8n Integration**
- Offizieller n8n GitHub Node
- Automatisches Error-Handling
- Type-Safety durch n8n Node

✅ **Bessere Rate Limits**
- Mit Credentials: 5000 Requests/Stunde
- Ohne Credentials: 60 Requests/Stunde

✅ **Wartbarer Code**
- Keine manuelle URL-Konstruktion
- Automatische API-Versionierung
- Bessere Fehlerbehandlung

✅ **Best Practices**
- Gemäß n8n Dokumentation
- Saubere Node-Struktur
- Klare Error-Handling

---

## 📝 Nächste Schritte

1. **In n8n importieren:**
   - Workflow in n8n importieren
   - GitHub Credentials konfigurieren (falls noch nicht vorhanden)
   - Workflow aktivieren

2. **Testen:**
   - Test-Skript ausführen: `./test-webhook.sh`
   - License-Check testen
   - Update-Check testen
   - Slack-Notifications prüfen

3. **GitHub Release erstellen:**
   - v1.0.1 Release erstellen
   - ZIP-Asset hochladen
   - Als "Latest" markieren

---

## 🔍 Troubleshooting

### Problem: GitHub Node gibt Fehler

**Lösung:**
1. Prüfe GitHub Credentials in n8n
2. Prüfe Repository existiert: https://github.com/chooomedia/hero-blocks
3. Prüfe n8n Execution Logs

### Problem: Kein Release gefunden

**Lösung:**
1. Prüfe GitHub Releases: https://github.com/chooomedia/hero-blocks/releases
2. Erstelle erstes Release falls nötig
3. Markiere Release als "Latest"

### Problem: Slack-Notifications funktionieren nicht

**Lösung:**
1. Prüfe Slack Credentials in n8n
2. Prüfe Channel-ID
3. Prüfe Code Node Output (slackMessage)

---

## 📚 Dokumentation

- **n8n Workflow**: `src/Resources/n8n-workflows/hero-blocks-unified.json`
- **Test-Dokumentation**: `TEST-WEBHOOK-CURLS.md`
- **Test-Skript**: `test-webhook.sh`
- **GitHub Repository**: https://github.com/chooomedia/hero-blocks
- **n8n Instance**: https://n8n.chooomedia.com

---

## ✅ Checkliste

- [x] GitHub Node konfiguriert
- [x] Code Node angepasst (Array-Handling)
- [x] Connections aktualisiert
- [x] Error-Handling implementiert
- [x] Test-CURLs erstellt
- [x] Test-Skript erstellt
- [x] Dokumentation erstellt
- [ ] Workflow in n8n importiert
- [ ] GitHub Credentials konfiguriert
- [ ] Tests durchgeführt
- [ ] Slack-Notifications getestet

---

**Status**: ✅ **Optimierung abgeschlossen - Bereit für Tests!**

