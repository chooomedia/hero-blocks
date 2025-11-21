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
- Hero Blocks GitHub: https://github.com/chooomedia/hero-blocks
- n8n Node Documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/
- Slack Block Kit: https://api.slack.com/block-kit
- Slack Interactive Components: https://api.slack.com/interactivity/handling

## Slack Integration - Advanced Features

### 🤖 Anti-Spam Features

#### 1. Interactive Delete Button

**Feature**: Jede wichtige Slack-Nachricht enthält einen "🗑️ Löschen" Button, den Nutzer direkt in Slack klicken können.

**Technische Umsetzung**:
- **Slack Blocks API** mit `actions` Block und `button` Element
- **Action ID**: `delete_message`
- **Style**: `danger` (rote Farbe für Delete-Aktion)
- **Interactive Webhook**: `/webhook/slack-interactive` empfängt Button-Clicks
- **Sofortige Bestätigung**: Ephemeral Response an User ("✅ Nachricht wird gelöscht...")
- **Delete Operation**: Slack Node mit `chat.delete` Operation löscht Original-Message

**Delete-Handling** (gemäß n8n Best Practices):
- **Error-Handling**: Delete Node hat `continueOnFail: true` für robuste Fehlerbehandlung
- **Error Handler Node**: Prüft ob Delete erfolgreich war, loggt Fehler
- **Mögliche Fehler**: Message bereits gelöscht, keine Berechtigung, ungültiger Timestamp
- **Best Practices**: Saubere Trennung zwischen Acknowledgment und Delete-Operation

**Workflow-Struktur**:
```
Webhook (Slack Interactive) 
  → Code (Process Interactive Action)
    → Respond (Slack Acknowledgment) [parallel]
    → IF Action = Delete?
      → Delete Slack Message
        → Code (Delete Error Handler)
```

#### 2. Ephemeral Messages für Routine-Updates

**Feature**: Routine-Nachrichten ("No Update") werden als **Ephemeral Messages** gesendet - nur sichtbar für den User, der die Aktion ausgelöst hat.

**Vorteil**: Verhindert Channel-Spam, da Routine-Updates nicht im öffentlichen Channel erscheinen.

**Technische Umsetzung**:
- **Condition**: Nur wenn `slackBlocks === null` (Plain Text Messages)
- **Slack Node**: `ephemeral.enabled = true` für Plain Text Messages
- **Blocks Messages**: Wird als normale Channel-Messages gesendet (mit Delete-Button)

### 👍 Vote/Reaction Buttons

**Feature**: Interaktive "👍 Nützlich" Buttons für Feedback-Sammlung.

**Technische Umsetzung**:
- **Button Style**: `primary` (blaue Farbe)
- **Action ID**: `vote_useful`
- **Response**: Ephemeral Message "👍 Danke für dein Feedback!"
- **Erweiterbar**: Kann für weitere Voting-Optionen erweitert werden (👎, ⭐, etc.)

**Workflow-Integration**:
- **Button Clicks** werden vom Interactive Webhook empfangen
- **Vote Actions** geben Ephemeral Response zurück (keine Delete-Operation)
- **Zukünftige Erweiterungen**:
  - **Emoji Reactions**: Automatisches Hinzufügen von Emoji-Reactions via Slack Reactions API
  - **Vote Tracking**: Speicherung von Votes in Datenbank/Storage für Statistiken
  - **Multiple Votes**: Mehrere Vote-Buttons für verschiedene Kategorien

### ⏰ Auto-Delete Feature (Optional)

**Feature**: Automatisches Löschen von Slack-Messages nach X Minuten (z.B. nach 24 Stunden für Routine-Updates).

**Technische Umsetzung** (n8n Best Practices):

**Option 1: Schedule Trigger + Delay Node** (empfohlen für n8n)
```
Schedule Trigger (täglich um 2:00 Uhr)
  → Code (Find Old Messages - aus Storage oder Database)
  → IF Messages gefunden?
    → Loop Over Items
      → Delete Slack Message
        → Code (Delete Error Handler)
```

**Option 2: Slack Retention Policies** (einfachste Lösung)
- **Slack Workspace Settings**: Message Retention Policy aktivieren
- **Automatisch**: Slack löscht alle Messages nach X Tagen automatisch
- **Vorteil**: Keine n8n Workflow-Logik nötig, Slack verwaltet das automatisch
- **Empfohlen**: Für Routine-Updates am saubersten!

**Option 3: Message Storage + Cron Job**
```
1. Beim Senden: Store Message Timestamp + Channel ID + Message TS (in Database/Storage)
2. Schedule Trigger (täglich)
   → Code (Filter Messages > 24h)
   → Delete Slack Message
```

**Best Practice**: **Slack Retention Policies** verwenden - am einfachsten und saubersten!

### 🧵 Threading Support (Optional)

**Feature**: Antworten auf Slack-Messages als Thread (bessere Organisation).

**Technische Umsetzung**:
- **Slack Node Parameter**: `thread_ts` (Thread Timestamp)
- **Use Case**: Follow-up Messages zu einem Update-Check als Thread posten
- **Vorteil**: Channel bleibt übersichtlich, Diskussionen sind organisiert

**Beispiel**:
```javascript
// In Slack Node:
{
  channel: channelId,
  text: "Update wurde installiert!",
  thread_ts: originalMessageTs  // Erstellt Thread-Reply
}
```

### 📊 Rich Context Blocks

**Feature**: Footer-Blocks mit Metadaten für bessere Nachvollziehbarkeit.

**Enthaltene Informationen**:
- ⏰ Timestamp (lokalisiert: `de-DE`)
- 🔧 Plugin-Name
- 📦 Versions-Information (`current → latest`)
- 🔖 Repository-Links
- 📅 Release-Datum (falls verfügbar)

**Format**:
```
⏰ 15. Nov. 2024, 14:30 | 🔧 Hero Blocks Plugin | 📦 1.0.1 → 1.0.2 | <Repository|Link>
```

### 🎨 Block Kit Best Practices

**Verwendete Block-Typen** (Slack Block Kit):
1. **Header Blocks**: Für Titel (mit Emoji)
2. **Divider Blocks**: Visuelle Trennung zwischen Sections
3. **Section Blocks mit Fields**: Kompaktes 2-Spalten-Layout für Informationen
4. **Section Blocks mit Accessory**: Button neben Text (z.B. Download-Button)
5. **Action Blocks**: Button-Gruppen (Primary + Danger Styles)
6. **Context Blocks**: Footer-Metadaten (kleine Schrift, dezent)

**Button-Styles**:
- **Primary**: Wichtige Aktionen (Download, Release ansehen, Vote)
- **Danger**: Destruktive Aktionen (Delete)
- **Default**: Neutrale Aktionen (fallback)

**Best Practices**:
- ✅ Maximal 50 Blocks pro Message (Slack Limit)
- ✅ Fields für kompakte 2-Spalten-Layouts (kompakt, übersichtlich)
- ✅ Dividers für visuelle Strukturierung
- ✅ Context Blocks für Footer-Info (nicht zu überladen)
- ✅ Emojis für visuelle Trennung und bessere Lesbarkeit
- ✅ Code-Format (`` `code` ``) für Versionsnummern und Changelog
- ✅ Rich Formatting mit `mrkdwn` (Bold, Links, Code-Blocks)

**Referenzen**:
- **Slack Block Kit Builder**: https://app.slack.com/block-kit-builder
- **Slack Block Kit Reference**: https://api.slack.com/reference/block-kit/blocks
- **n8n Slack Node**: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/

### 🔧 Slack App Konfiguration

**Erforderliche OAuth Scopes** (gemäß [n8n Slack Credentials](https://docs.n8n.io/integrations/builtin/credentials/slack/)):
- `chat:write` - Nachrichten senden
- `chat:write.public` - In öffentlichen Channels posten
- `channels:read` - Channel-Informationen lesen
- `reactions:write` - Emoji-Reactions hinzufügen (optional, für Vote-Features)

**Interactive Components aktivieren**:
1. Slack App → **Features** → **Interactivity & Shortcuts**
2. **Enable Interactivity**: ✅ Aktivieren
3. **Request URL**: `https://your-n8n-instance.com/webhook/slack-interactive-hero-blocks`
4. **Save Changes**

**Webhook-Konfiguration**:
- **Webhook Path**: `slack-interactive` (relativ zu `/webhook/`)
- **Vollständiger Path**: `/webhook/slack-interactive-hero-blocks`
- **HTTP Method**: `POST` (Slack sendet POST-Requests)
- **Response Mode**: `responseNode` (für sofortige Acknowledgment)

### ⚙️ Slack Node Optionen (Alle verfügbaren Parameter)

**Message Options** (Send Slack Message Node):
- ✅ **Message Type**: `block` oder `text` (dynamisch basierend auf `slackBlocks`)
- ✅ **Text**: Plain Text Fallback (für Clients ohne Block-Support)
- ✅ **Blocks**: Slack Blocks API Format (wenn vorhanden)
- ✅ **Attachments**: Legacy Attachments (leer, da Blocks verwendet werden)

**Rich Formatting Options**:
- ✅ **unfurlLinks**: `true` - Links automatisch erweitern (Rich Previews)
- ✅ **unfurlMedia**: `true` - Medien (Bilder, Videos) automatisch erweitern
- ✅ **linkNames**: `true` - User-Namen als Links rendern (@username)
- ✅ **parse**: `"full"` - Vollständiges Parsing (Links, Channels, Users)
- ✅ **mrkdwn**: `true` - Markdown-Formatierung aktivieren

**Threading & Organization**:
- ✅ **threadTs**: `$json.threadTs || null` - Thread Timestamp (für Thread-Replies)
- ✅ **replyBroadcast**: `false` - Broadcast Reply (nur Thread-Teilnehmer)

**Ephemeral Messages**:
- ✅ **ephemeral.enabled**: Dynamisch (`!$json.slackBlocks || $json.slackBlocks === null`)
  - `true`: Für Plain Text Messages (Routine-Updates)
  - `false`: Für Blocks Messages (wichtige Updates)
- ✅ **ephemeral.user**: User-ID für Ephemeral Messages (christopher)

**Metadata**:
- ✅ **metadata**: `{}` - Message Metadata (für Analytics/Tracking)
  - Kann erweitert werden für: Event Type, Source, Timestamp, etc.

**Delete Options** (Delete Slack Message Node):
- ✅ **channelId**: Dynamisch aus Interactive Payload (`$json.channelId`)
- ✅ **timestamp**: Dynamisch aus Interactive Payload (`$json.messageTs`)
- ✅ **continueOnFail**: `true` - Error-Handling (Nachricht bereits gelöscht, etc.)
- ✅ **notesInFlow**: `true` - Notes in Flow für bessere Dokumentation

**Best Practices**:
- ✅ **Dynamische Message Type**: Block wenn Blocks vorhanden, sonst Text
- ✅ **Ephemeral Conditional**: Nur für Plain Text (verhindert Spam)
- ✅ **Rich Formatting**: Alle Optionen aktiviert für beste UX
- ✅ **Error Handling**: `continueOnFail` für robuste Delete-Operation
- ✅ **Threading Ready**: `threadTs` Parameter vorhanden (für zukünftige Features)

