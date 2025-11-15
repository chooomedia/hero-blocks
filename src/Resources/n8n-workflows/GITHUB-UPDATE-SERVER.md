# GitHub + n8n Update Server - Best Practices

Diese Dokumentation beschreibt eine intelligente Lösung für automatische Plugin-Updates via GitHub Releases und n8n Workflow.

## Architektur

```
Shopware Plugin (HeroBlocks)
    ↓ (API Call)
n8n Workflow (Unified: License & Update Check)
    ↓ (GitHub API Call)
GitHub Releases API
    ↓ (Release Info zurück)
n8n Workflow (verarbeitet & berechnet Update-Status)
    ↓ (JSON Response)
Shopware Plugin (zeigt Update-Info im Admin)
```

## Workflow-Struktur

### 1. n8n Webhook (Unified Workflow)

**Path**: `/webhook/{checkType}/hero-blocks`

- `/webhook/license/hero-blocks` → License Check
- `/webhook/update/hero-blocks` → Update Check

**Request Format**:

```json
GET /webhook/update/hero-blocks?plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=2024-11-15T07:30:00+00:00
```

**Response Format (Update Check)**:

```json
{
  "available": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.1.0",
  "downloadUrl": "https://github.com/your-org/hero-blocks/releases/download/1.1.0/hero-blocks-1.1.0.zip",
  "changelog": "## 1.1.0\n- New feature: Hero Two Columns Block\n- Bug fixes\n- Performance improvements"
}
```

### 2. GitHub Releases Integration

**Best Practices**:

1. **Semantic Versioning**: `MAJOR.MINOR.PATCH` (z.B. `1.1.0`)
2. **Release Assets**: `.zip` Datei mit Plugin-Dateien
3. **Release Notes**: Markdown-formatierte Changelog
4. **Tag Format**: `v{version}` (z.B. `v1.1.0`)

**GitHub Release Asset Struktur**:

```
hero-blocks-1.1.0.zip
├── HeroBlocks/
│   ├── src/
│   ├── composer.json
│   └── ...
```

### 3. n8n Workflow Implementation

**Node-Struktur**:

1. **Webhook Node**: Empfängt Update-Check Request
2. **Code Node (Determine Check Type)**: Extrahiert `checkType` aus URL
3. **IF Node (Check Type = Update?)**: Routet zu Update-Branch
4. **GitHub Node (Get Latest Release)**: Ruft neuestes GitHub Release auf (MODERN!)
   - Operation: `getLatestRelease`
   - Owner: `your-org`
   - Repository: `hero-blocks`
   - Credentials: GitHub API (OAuth2 oder Personal Access Token)
5. **Code Node (Process GitHub Response)**: Verarbeitet GitHub Node Response
   - Extrahiert `tag_name` (z.B. `v1.1.0` → `1.1.0`)
   - Findet `.zip` Asset
   - Extrahiert Release Notes (Body)
   - Vergleicht Versionen
6. **Code Node (Compare Versions)**: Berechnet `updateAvailable`
7. **IF Node (Update Available?)**: Routet zu Response
8. **Respond Node**: Gibt JSON Response zurück

## GitHub API Integration

### 1. GitHub Credentials (Modern Approach) ⭐

**n8n GitHub Node Credentials** (Empfohlen):

**Option A: Personal Access Token** (Einfach):

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Scope: `public_repo` (für öffentliche Repos) oder `repo` (für private Repos)
3. Token kopieren
4. In n8n: Credentials → "GitHub API" → Personal Access Token einfügen

**Option B: OAuth2** (Für Enterprise/Organisationen):

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Authorization callback URL: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
3. Client ID und Client Secret in n8n Credentials einfügen

**n8n Credentials**:

- Name: `GitHub API`
- Type: `GitHub API`
- Authentication: Personal Access Token ODER OAuth2

### 2. GitHub Node (Modern Approach) ⭐

**n8n GitHub Node** (Empfohlen):

- **Operation**: `getLatestRelease`
- **Owner**: `your-org`
- **Repository**: `hero-blocks`
- **Credentials**: GitHub API (OAuth2 oder Personal Access Token)

**Vorteile**:

- ✅ Native Integration (keine manuellen API-Calls)
- ✅ Automatische Authentifizierung
- ✅ Besseres Error Handling
- ✅ Type-Safe Response

**Alternative: GitHub Releases API** (HTTP Request):

```http
GET https://api.github.com/repos/{owner}/{repo}/releases/latest
Authorization: token {GITHUB_TOKEN}
Accept: application/vnd.github.v3+json
```

**Response**:

```json
{
  "tag_name": "v1.1.0",
  "name": "1.1.0",
  "body": "## 1.1.0\n- New feature: Hero Two Columns Block\n- Bug fixes",
  "assets": [
    {
      "name": "hero-blocks-1.1.0.zip",
      "browser_download_url": "https://github.com/your-org/hero-blocks/releases/download/1.1.0/hero-blocks-1.1.0.zip",
      "size": 123456,
      "content_type": "application/zip"
    }
  ],
  "published_at": "2024-11-15T07:30:00Z"
}
```

**Alle Releases** (Alternative):

```http
GET https://api.github.com/repos/{owner}/{repo}/releases
```

## n8n Workflow Code Nodes

### GitHub Node: Get Latest Release

**Node Configuration**:

- **Type**: `n8n-nodes-base.github`
- **Operation**: `getLatestRelease`
- **Owner**: `{{ $env.GITHUB_OWNER || 'chooomedia' }}` (Standard: `chooomedia`, überschreibbar via Environment Variable)
- **Repository**: `{{ $env.GITHUB_REPO || 'hero-blocks' }}` (Standard: `hero-blocks`, überschreibbar via Environment Variable)
- **Credentials**: `GitHub API` (Personal Access Token oder OAuth2)

**Standard-Repository**: `chooomedia/hero-blocks` (GitHub Repository: https://github.com/chooomedia/hero-blocks)

**Response Format** (automatisch von GitHub Node):

```json
{
  "tag_name": "v1.1.0",
  "name": "1.1.0",
  "body": "## 1.1.0\n- New feature: Hero Two Columns Block\n- Bug fixes",
  "assets": [
    {
      "name": "hero-blocks-1.1.0.zip",
      "browser_download_url": "https://github.com/your-org/hero-blocks/releases/download/1.1.0/hero-blocks-1.1.0.zip",
      "size": 123456,
      "content_type": "application/zip"
    }
  ],
  "published_at": "2024-11-15T07:30:00Z"
}
```

### Code Node: Process GitHub Response

```javascript
// WICHTIG: Verarbeite GitHub Releases API Response
// Best Practices: Robust, sauber, eindeutige Logik

// 1. Lese GitHub API Response
const githubResponse = $input.item.json;
const currentVersion = $input.item.json.query?.currentVersion || "1.0.0";

// 2. Extrahiere Latest Version aus GitHub Tag
// GitHub Tag Format: "v1.1.0" → "1.1.0"
let latestVersion = null;
if (githubResponse.tag_name) {
  latestVersion = githubResponse.tag_name.replace(/^v/, ""); // Remove "v" prefix
}

// 3. Finde .zip Asset für Download URL
let downloadUrl = null;
if (githubResponse.assets && Array.isArray(githubResponse.assets)) {
  const zipAsset = githubResponse.assets.find(
    (asset) => asset.name && asset.name.endsWith(".zip")
  );
  if (zipAsset && zipAsset.browser_download_url) {
    downloadUrl = zipAsset.browser_download_url;
  }
}

// 4. Extrahiere Changelog aus Release Body
const changelog =
  githubResponse.body || githubResponse.body_text || "No changelog available";

// 5. Version-Vergleich (Semantic Versioning)
function compareVersions(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

// 6. Prüfe ob Update verfügbar ist
const updateAvailable =
  latestVersion && compareVersions(currentVersion, latestVersion) < 0;

return {
  json: {
    ...$input.item.json,
    latestVersion: latestVersion || currentVersion,
    downloadUrl: downloadUrl || null,
    changelog: changelog,
    updateAvailable: updateAvailable,
    currentVersion: currentVersion,
    githubTag: githubResponse.tag_name || null,
    githubPublishedAt: githubResponse.published_at || null,
  },
};
```

## Environment Variables

**Shopware `.env`**:

```bash
# License Check Webhook (n8n)
HERO_BLOCKS_WEBHOOK_URL=https://n8n.chooomedia.com/webhook/license/hero-blocks

# Update Check Webhook (n8n) - Optional, verwendet unified Workflow
HERO_BLOCKS_UPDATE_WEBHOOK_URL=https://n8n.chooomedia.com/webhook/update/hero-blocks
```

**n8n Environment Variables** (Optional - für Custom Repository):

```bash
# GitHub Repo Info (für dynamische Konfiguration - überschreibt Default)
# Default: GITHUB_OWNER=chooomedia, GITHUB_REPO=hero-blocks
GITHUB_OWNER=chooomedia
GITHUB_REPO=hero-blocks

# WICHTIG: GitHub Token wird in n8n Credentials gespeichert (NICHT in Environment Variables!)
# → Sicherer und Best Practice
```

**Standard-Repository**:

- **Owner**: `chooomedia` (GitHub Repository)
- **Repository**: `hero-blocks`
- **Full URL**: `https://github.com/chooomedia/hero-blocks`

**Falls anderes Repository gewünscht**:

- Setze `GITHUB_OWNER` und `GITHUB_REPO` in n8n Environment Variables
- Oder ändere direkt im Workflow Node (nicht empfohlen - weniger flexibel)

## Update-Installation Workflow

### 1. Admin UI zeigt Update-Info

Wenn `updateAvailable: true`:

- Status: "Update verfügbar"
- Latest Version: `1.1.0`
- Download URL: `https://github.com/.../hero-blocks-1.1.0.zip`
- Changelog: Formatted Markdown

### 2. User klickt "Update installieren"

**Option A: Manueller Download**:

1. User lädt `.zip` von GitHub Releases
2. User extrahiert Plugin-Dateien
3. User kopiert in `custom/plugins/HeroBlocks/`
4. User führt `bin/console plugin:refresh` aus
5. User aktiviert Plugin

**Option B: Automatischer Download (Future)**:

1. Shopware lädt `.zip` von GitHub
2. Shopware extrahiert Plugin-Dateien
3. Shopware führt `plugin:refresh` aus
4. Shopware aktiviert Plugin

## Best Practices

### Version Management

1. **Semantic Versioning**: `MAJOR.MINOR.PATCH`

   - `MAJOR`: Breaking Changes
   - `MINOR`: Neue Features (Backwards Compatible)
   - `PATCH`: Bug Fixes

2. **Git Tags**: Immer mit `v` Prefix (z.B. `v1.1.0`)

3. **Release Notes**: Markdown-formatierte Changelog
   - Features
   - Bug Fixes
   - Breaking Changes

### Security

1. **GitHub Token**: Nie in Code, nur in n8n Credentials
2. **HTTPS**: Immer HTTPS für Webhooks
3. **Token Permissions**: Minimal erforderliche Permissions (`public_repo` oder `repo`)

### Performance

1. **Caching**: GitHub API Responses können gecacht werden (5 Minuten)
2. **Rate Limiting**: GitHub API hat Rate Limits (5000 requests/hour für authenticated requests)
3. **Error Handling**: Robustes Error Handling für GitHub API Failures

## Testing

### Test Workflow

1. **Create Test Release**:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```
2. **Create GitHub Release**:

   - GitHub → Releases → Draft a new release
   - Tag: `v1.1.0`
   - Title: `1.1.0`
   - Description: Changelog (Markdown)
   - Attach: `hero-blocks-1.1.0.zip`

3. **Test n8n Webhook**:

   ```bash
   curl "https://n8n.chooomedia.com/webhook/update/hero-blocks?plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" \
     -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
     -H "Accept: application/json"
   ```

4. **Expected Response**:
   ```json
   {
     "available": true,
     "currentVersion": "1.0.0",
     "latestVersion": "1.1.0",
     "downloadUrl": "https://github.com/.../hero-blocks-1.1.0.zip",
     "changelog": "## 1.1.0\n..."
   }
   ```

## Troubleshooting

### GitHub API Errors

1. **401 Unauthorized**: Token fehlt oder ungültig
2. **404 Not Found**: Repo nicht gefunden oder kein Zugriff
3. **403 Forbidden**: Token hat keine Berechtigung

### n8n Workflow Errors

1. **Webhook nicht aktiviert**: Workflow muss aktiviert sein für Production URLs
2. **GitHub API Timeout**: Rate Limit erreicht oder Netzwerk-Problem
3. **Version Parse Error**: Tag-Format nicht erkannt (sollte `v{version}` sein)

### Shopware Plugin Errors

1. **Webhook URL nicht gefunden**: Environment Variable nicht gesetzt
2. **Update nicht angezeigt**: `updateAvailable` ist `false` oder Version-Vergleich fehlgeschlagen
3. **Download URL fehlt**: `.zip` Asset nicht in GitHub Release gefunden (Prüfe GitHub Release Assets)

## Workflow Modernisierung

### Warum GitHub Node statt HTTP Request?

**Vorteile GitHub Node**:

- ✅ Native Integration (Best Practice)
- ✅ Automatische Authentifizierung
- ✅ Type-Safe Response Format
- ✅ Besseres Error Handling
- ✅ Einfache Konfiguration (Owner/Repository statt vollständige URL)
- ✅ Aktualisiert gemäß n8n Updates (keine manuellen API-Änderungen)

**Migration von HTTP Request**:

1. HTTP Request Node entfernen
2. GitHub Node hinzufügen (Operation: `getLatestRelease`)
3. GitHub API Credentials konfigurieren
4. Owner und Repository eintragen
5. Code Node (Process Response) bleibt unverändert (Response-Format ist identisch)
