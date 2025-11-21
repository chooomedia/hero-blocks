# n8n Workflow Optimization Plan - Hero Blocks Unified

## 📋 Aktuelle Analyse

### Workflow-Struktur
- **Webhook**: `/webhook/license/hero-blocks` (unified endpoint)
- **Check Types**: `license`, `update`
- **Nodes**: ~20 Nodes (Webhook, Code, IF, Set, GitHub, Slack, etc.)

### Code Nodes (können optimiert werden)
1. **Code (Determine Check Type)** - Kann durch Expressions + IF Node ersetzt werden
2. **Code (Format Slack Message - Update)** - Erweitern mit mehr Blocks
3. **Code (Format Slack Message - License)** - Erweitern mit mehr Blocks
4. **Code (Process GitHub Response)** - Behalten (komplexe Logik)
5. **Code (Compare Versions)** - Behalten (komplexe Logik)
6. **Code (Process Interactive Action)** - Behalten (Slack Payload Parsing)

## 🎯 Optimierungsziele

### 1. Slack Blocks erweitern (CRM-ähnlich)
- ✅ Mehr Sections mit Rich Text
- ✅ Mehr Context Blocks für Metadaten
- ✅ Erweiterte Actions mit mehr Buttons
- ✅ Status-Indikatoren
- ✅ Timestamps und Versionen
- ✅ Links zu Repository, Releases, etc.

### 2. Expressions statt Code Nodes
- ✅ Einfache Berechnungen → Expressions
- ✅ Timestamp-Formatierung → Expressions
- ✅ String-Operationen → Expressions
- ❌ Komplexe Logik → Code Nodes (behalten)

### 3. Alle Szenarien abdecken
- ✅ Update verfügbar
- ✅ Update nicht verfügbar
- ✅ License valid
- ✅ License invalid
- ✅ Error (GitHub API, etc.)

## 📝 Optimierungs-Schritte

### Schritt 1: Code Nodes erweitern
- [x] Update-Check Blocks erweitern
- [x] License-Check Blocks erweitern
- [ ] Error-Handling Blocks erweitern

### Schritt 2: Expressions einführen
- [ ] Timestamp-Formatierung → Expressions
- [ ] Einfache Berechnungen → Expressions
- [ ] String-Operationen → Expressions

### Schritt 3: Testing
- [ ] curl Tests für alle Endpunkte
- [ ] Shopware Admin Settings Tests
- [ ] Slack Blocks Rendering Tests

### Schritt 4: Dokumentation
- [ ] Workflow-Dokumentation
- [ ] API-Dokumentation
- [ ] Test-Dokumentation

## 🔧 Technische Details

### Slack Block Kit Elemente
- **Header**: Titel mit Emoji
- **Section**: Text + Fields (2-Spalten)
- **Divider**: Visuelle Trennung
- **Context**: Footer mit Metadaten
- **Actions**: Buttons (Primary, Danger, etc.)

### n8n Expressions
- `$json.field` - Datenzugriff
- `$now` - Aktueller Timestamp
- `DateTime.fromISO()` - Datum-Parsing
- `Math.max()`, `Math.ceil()` - Berechnungen

### Best Practices
- ✅ Expressions für einfache Operationen
- ✅ Code Nodes für komplexe Logik
- ✅ IF Nodes für Routing
- ✅ Set Nodes für Daten-Transformation
- ✅ Error-Handling in allen Pfaden

## 📊 Test-Strategie

### curl Tests
```bash
# License Check
curl "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=license&currentVersion=1.0.0"

# Update Check
curl "https://n8n.chooomedia.com/webhook/license/hero-blocks?checkType=update&currentVersion=1.0.0"
```

### Shopware Admin Tests
- Plugin Settings → Update Check
- Plugin Settings → License Check
- Slack Notifications prüfen

## ✅ Definition of Done

- [ ] Alle Slack Blocks erweitert (CRM-ähnlich)
- [ ] Alle Szenarien abgedeckt
- [ ] Expressions wo möglich verwendet
- [ ] Error-Handling robust
- [ ] Tests erfolgreich
- [ ] Dokumentation vollständig
- [ ] Keine Duplikate/Inkonsistenzen
- [ ] Workflow validiert

