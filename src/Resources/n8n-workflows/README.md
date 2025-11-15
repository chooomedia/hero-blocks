# Hero Blocks - n8n Workflows

**GitHub Repository für Updates**: `chooomedia/hero-blocks` (Standard)

Diese Workflows ermöglichen die Integration von Hero Blocks mit n8n für automatische License-Checks und Update-Checks.

## Workflows

### 1. Unified Workflow (Empfohlen) ⭐
- **Datei**: `hero-blocks-unified.json`
- **Webhook Path**: `/webhook/license/hero-blocks` ODER `/webhook/update/hero-blocks`
- **HTTP Method**: GET
- **Funktion**: Kombinierter Workflow für License-Check UND Update-Check
- **Struktur**: 
  - Webhook → Code (Determine Check Type) → IF Check Type = License? → [License Branch ODER Update Branch]
  - **License Branch**: Set (Compute License) → IF License Valid? → Respond (Valid/Invalid)
  - **Update Branch**: Set (Update Info) → Code (Compare Versions) → IF Update Available? → Respond (Available/No Update)
- **Vorteile**: 
  - ✅ Nur ein Workflow für beide Funktionen
  - ✅ Automatische Route-Erkennung basierend auf Webhook-Path
  - ✅ Optimiert: Nur der benötigte Branch wird ausgeführt
  - ✅ Best Practices: Robust, sauber, getrennte Logik

### 2. License Check Workflow (Separater Workflow)
- **Datei**: `hero-blocks-license-check.json` (bestehend)
- **Webhook Path**: `/webhook/license/hero-blocks`
- **HTTP Method**: GET
- **Funktion**: Prüft Lizenz-Status und Gültigkeit
- **Struktur**: Webhook → Set (Compute license) → IF valid? → Respond (valid/invalid)

### 3. Update Check Workflow (Separater Workflow)
- **Datei**: `hero-blocks-update-check.json`
- **Webhook Path**: `/webhook/update/hero-blocks`
- **HTTP Method**: GET
- **Funktion**: Prüft auf verfügbare Plugin-Updates
- **Struktur**: Webhook → Code (Compute Update) → IF Update Available? → Respond (Update Available/No Update)
- **Harmoniert mit**: License-Check Workflow (gleiche Node-Struktur: Webhook → Compute → IF → Respond)
- **WICHTIG**: Ohne n8n funktioniert der Update-Check nicht automatisch - User muss Updates manuell installieren

## Installation

### 1. n8n Workflow importieren

1. Öffne n8n Interface
2. Klicke auf "Workflows" → "Import from File"
3. Wähle `hero-blocks-update-check.json`
4. Workflow wird importiert

### 2. Webhook konfigurieren

1. Öffne den Workflow "Hero Blocks - Update Check"
2. Klicke auf den "Webhook (Update Check)" Node
3. Kopiere die **Production Webhook URL**
4. Aktiviere den Workflow (Toggle oben rechts)

### 3. Shopware konfigurieren

#### Option 1: Environment Variable (empfohlen)
Füge in `.env` Datei hinzu:
```bash
HERO_BLOCKS_UPDATE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/update/hero-blocks
```

#### Option 2: System Config
1. Öffne Shopware Admin
2. Gehe zu Settings → System → Plugins → Hero Blocks
3. Füge Webhook URL in "Update-Informationen" → "Update-Webhook-URL (n8n)" ein

## Workflow-Anpassung

### Update-Informationen anpassen

Im "Code (Compute Update)" Node kannst du folgende Werte anpassen:

1. **latestVersion**: Neueste verfügbare Plugin-Version (z.B. `1.1.0`)
   ```javascript
   const latestVersion = '1.1.0'; // TODO: Hier neueste Version eintragen
   ```

2. **downloadUrl**: URL zum Download der neuesten Version (automatisch generiert)
   ```javascript
   downloadUrl: updateAvailable ? 'https://your-server.com/updates/hero-blocks-' + latestVersion + '.zip' : null
   ```

3. **changelog**: Changelog-Text für das Update
   ```javascript
   changelog: updateAvailable ? 'Neue Features: X, Y, Z. Bugfixes: A, B, C.' : null
   ```

**WICHTIG**: 
- Die `currentVersion` wird automatisch aus den Query-Parametern (`$json.query.currentVersion`) gelesen
- Die `available` Boolean wird automatisch berechnet (Semantic Versioning Vergleich)
- Harmoniert mit License-Check Workflow: Gleiche Struktur (Webhook → Code/Set → IF → Respond)

### Version-Vergleich (Automatisch)

Der "Code (Compute Update)" Node berechnet automatisch die `available` Boolean:

- **Semantic Versioning**: Unterstützt `MAJOR.MINOR.PATCH` Format
- **Vergleich**: `currentVersion < latestVersion` → `available: true`
- **Beispiel**: `1.0.0 < 1.1.0` → `available: true`
- **Beispiel**: `1.0.0 === 1.0.0` → `available: false`
- **Beispiel**: `1.1.0 > 1.0.0` → `available: false` (bereits neueste Version)

## Request/Response Format

### Shopware → n8n (GET Request mit Query-Parametern)

```
GET /webhook/update/hero-blocks?plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=2025-11-15T07:30:00+00:00
```

**Query-Parameter**:
- `plugin`: `"hero-blocks"` (Plugin-Name)
- `currentVersion`: `"1.0.0"` (Aktuelle Plugin-Version)
- `shopwareVersion`: `"6.7.0"` (Shopware-Version)
- `timestamp`: `"2025-11-15T07:30:00+00:00"` (ISO 8601 Format)

### n8n → Shopware (Update verfügbar)

```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.1.0",
  "downloadUrl": "https://your-server.com/updates/hero-blocks-1.1.0.zip",
  "changelog": "Neue Features, Bugfixes, etc."
}
```

### n8n → Shopware (Kein Update)

```json
{
  "available": false,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.0"
}
```

**WICHTIG**: Das Response-Format harmonisiert mit dem License-Check Workflow:
- Beide verwenden `available` / `valid` Boolean-Flag
- Beide verwenden `currentVersion` / `latestVersion` für Versions-Vergleich
- Beide verwenden `IF` Node für Conditional Logic
- Beide verwenden `Respond` Node für JSON-Response

## Testing

### 1. Test Webhook URL (n8n Test Mode)

Im n8n Workflow:
1. Klicke auf "Webhook" Node
2. Klicke auf "Listen for Test Event"
3. Kopiere die **Test Webhook URL**
4. Teste mit curl:

```bash
curl "https://your-n8n-instance.com/webhook-test/update/hero-blocks?plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=2025-11-15T07:30:00+00:00"
```

**Erwartete Response**:
```json
{
  "available": false,
  "currentVersion": "1.0.0",
  "latestVersion": "1.0.0"
}
```

### 2. Production Webhook URL

Nach Aktivierung des Workflows:
1. Kopiere die **Production Webhook URL** (aus "Webhook" Node)
2. Konfiguriere in Shopware:
   - **Option 1**: Environment Variable (`.env`):
     ```bash
     HERO_BLOCKS_UPDATE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/update/hero-blocks
     ```
   - **Option 2**: System Config (Admin UI):
     - Settings → System → Plugins → Hero Blocks
     - "Update-Informationen" → "Update-Webhook-URL (n8n)"
3. Teste Update-Check im Shopware Admin:
   - API-Endpunkt: `GET /api/_action/hero-blocks/update-check`
   - Oder über Admin UI (falls implementiert)

## Troubleshooting

### Webhook antwortet nicht

1. Prüfe ob Workflow aktiviert ist
2. Prüfe Webhook URL (Test vs Production)
3. Prüfe n8n Logs für Fehler
4. Prüfe Shopware Logs: `var/log/dev.log`

### Falsche Version-Vergleich

1. Prüfe "Set (Update Info)" Node → `latestVersion`
2. Prüfe "Function (Compare Versions)" Node → Version-Vergleich-Logik
3. Teste mit verschiedenen Versionen

### Update-Informationen fehlen

1. Prüfe "Set (Update Info)" Node → alle Werte gesetzt?
2. Prüfe "Respond (Update Available)" Node → Response-Body korrekt?
3. Prüfe Shopware System Config → `HeroBlocks.config.updateAvailable`

## Best Practices

### 1. Versionierung
- Verwende Semantic Versioning (`MAJOR.MINOR.PATCH`)
- Dokumentiere Breaking Changes in Changelog
- Teste Updates vor Freigabe

### 2. Sicherheit
- Verwende HTTPS für Webhook URLs
- Implementiere IP-Whitelist in n8n (optional)
- Validiere Request-Daten in n8n Workflow

### 3. Monitoring
- Überwache n8n Workflow Executions
- Logge Update-Checks in Shopware
- Benachrichtige bei Update-Fehlern

## Erweiterte Konfiguration

### Database-Integration
Erweitere den Workflow um Database-Node:
- Speichere Update-Informationen in Datenbank
- Tracke Update-Checks pro Shopware-Instanz
- Analytics für Update-Adoption

### Notification-Integration
Erweitere den Workflow um Notification-Node:
- E-Mail-Benachrichtigung bei neuen Updates
- Slack/Discord-Integration
- SMS-Benachrichtigung (optional)

### Version-Management
Erweitere den Workflow um Version-Management:
- Automatische Version-Erhöhung
- Changelog-Generierung
- Download-URL-Generierung

## Ohne n8n (Update-Check deaktiviert)

**WICHTIG**: Ohne n8n Webhook URL funktioniert der Update-Check nicht automatisch.

### Verhalten ohne n8n:
- Update-Check gibt `available: false` zurück
- Keine automatischen Update-Benachrichtigungen
- User muss Updates manuell installieren: `bin/console plugin:update HeroBlocks`

### Konfiguration:
- **Ohne n8n**: Keine Konfiguration nötig - Plugin funktioniert normal
- **Mit n8n**: Webhook URL konfigurieren (siehe Installation)

## Support

Bei Fragen oder Problemen:
- Shopware Documentation: https://developer.shopware.com
- n8n Documentation: https://docs.n8n.io
- Hero Blocks GitHub: (Link hinzufügen)
- n8n Node Documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/

