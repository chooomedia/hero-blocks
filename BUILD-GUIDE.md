# HeroBlocks Build Guide

## 🚀 Optimiertes Build-Script

Das `build.sh` Script wurde basierend auf Debugging-Erkenntnissen vom 26.11.2025 optimiert.

---

## 📋 Wichtige Erkenntnisse

### Problem: Vite erkennt Twig-Template-Änderungen nicht

**Symptom:**
- Twig-Templates (`.html.twig`) werden geändert
- `npm run build` läuft durch
- **ABER:** Asset-Hash bleibt gleich (`index-ABC123.js`)
- Browser lädt alte Assets

**Ursache:**
- Vite's Hot Module Replacement (HMR) trackt nur JavaScript/TypeScript/CSS
- Twig-Templates werden **zur Build-Zeit** in JavaScript kompiliert
- Änderungen an Twig erzeugen **keinen neuen Hash**

**Lösung:**
1. **Pre-Build Cache Clear:** Cache VOR Build löschen
2. **Force Rebuild:** Build-Artefakte löschen mit `--force`
3. **Post-Build Cache Clear:** Cache NACH Build löschen
4. **Browser-Cache:** IMMER leeren nach Admin-Build

---

## 🔧 Script-Usage

### Vollständiger Build (empfohlen)
```bash
./build.sh
```
Baut Admin + Storefront, löscht Cache vor/nach Build.

### Nur Administration
```bash
./build.sh --admin-only
```
Baut nur Admin-Assets (schneller für Admin-Entwicklung).

### Nur Storefront
```bash
./build.sh --storefront-only
```
Baut nur Storefront-Assets (Theme-Compile).

### Force Rebuild
```bash
./build.sh --force
```
Löscht Build-Artefakte VOR Build (bei Twig-Änderungen!).

### Kombiniert
```bash
./build.sh --admin-only --force
```
Force Rebuild + nur Admin.

---

## 🔄 Build-Pipeline (Admin)

Das Script führt folgende Schritte aus:

### 1. Pre-Build Cache Clear
```bash
rm -rf var/cache/*
```
**Warum:** Stale Cache kann alte Manifests cachen.

### 2. Force Rebuild (optional mit `--force`)
```bash
rm -rf public/bundles/heroblocks/administration/assets/*
rm -rf public/bundles/heroblocks/administration/.vite/*
```
**Warum:** Löscht alte Build-Artefakte für frischen Build.

### 3. Bundle Dump
```bash
php bin/console bundle:dump
```
**Warum:** Shopware muss wissen welche Bundles existieren.

### 4. Feature Dump
```bash
php bin/console feature:dump
```
**Warum:** Feature-Flags für Frontend verfügbar machen.

### 5. Vite Build (Extensions Only)
```bash
export SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1
./bin/build-administration.sh
```
**Warum:** 
- Baut NUR Plugin-Extensions (schneller)
- Nicht den gesamten Shopware Core Admin

### 6. Assets Install (--force)
```bash
php bin/console assets:install --force
```
**Warum:** 
- Kopiert Assets in `public/bundles/`
- `--force` überschreibt vorhandene Dateien

### 7. Verify Manifest
```bash
cat .vite/manifest.json | grep 'hero-category-slider/config'
```
**Warum:** Verifiziert dass neuer Hash generiert wurde.

### 8. Post-Build Cache Clear
```bash
php bin/console cache:clear
rm -rf var/cache/prod_* var/cache/dev_*
```
**Warum:** Alte Caches entfernen für sauberen Start.

---

## 🌐 Browser-Cache Problem

### Symptom
Nach Build werden im Browser **alte Assets** geladen:
```
❌ Browser lädt: index-ABC123.js (alt)
✅ Server hat:  index-XYZ789.js (neu)
```

### Ursache
Browser cached Admin-Assets **EXTREM aggressiv**:
- Service Workers
- HTTP Cache Headers
- Browser Disk Cache
- Memory Cache

### Lösung 1: Hard Refresh (EMPFOHLEN)
1. **F12** drücken (DevTools öffnen)
2. **Rechtsklick** auf Reload-Button (oben links)
3. **"Leeren und harter Reload"** auswählen

### Lösung 2: Clear Storage
1. **F12** drücken
2. Tab **"Application"** öffnen
3. Links: **"Clear storage"**
4. Button: **"Clear site data"**
5. Seite neu laden

### Lösung 3: Inkognito-Fenster
Neues Inkognito-Fenster öffnen für sauberen Test.

---

## 🧪 Debugging: Asset-Hash prüfen

### Server-seitig (SOLLTE neu sein)
```bash
docker exec horex-shopware bash -c \
  "cd /var/www/html/public/bundles/heroblocks/administration && \
   cat .vite/manifest.json | grep -B1 -A3 'hero-category-slider/config'"
```

**Erwartetes Ergebnis:**
```json
{
  "src/module/.../config/index.js": {
    "file": "assets/index-XYZ789.js",  ← NEUER Hash
    "name": "hero-category-slider-config"
  }
}
```

### Browser-seitig (wird geladen?)
1. Browser: **F12** → **Network** Tab
2. Filter: `hero-category-slider`
3. Admin neu laden
4. Prüfen: Welcher Hash wird geladen?

**Problem:** Hash im Browser ≠ Hash im Manifest
**Lösung:** Browser-Cache leeren (siehe oben)

---

## 📝 Checkliste nach Build

- [ ] Script erfolgreich durchgelaufen?
- [ ] `✅ Administration Assets built successfully` gesehen?
- [ ] Browser-Cache geleert? (F12 → Hard Refresh)
- [ ] Admin neu geladen? (Strg+Shift+R)
- [ ] Console-Errors geprüft? (F12 → Console)
- [ ] Neuer Hash im Network-Tab? (F12 → Network)
- [ ] Settings im Modal funktionieren?

---

## 🛠️ Wenn Build fehlschlägt

### 1. Docker Container prüfen
```bash
docker ps | grep horex-shopware
```

### 2. Logs prüfen
```bash
docker logs horex-shopware --tail 50
```

### 3. Manuell in Container
```bash
docker exec -it horex-shopware bash
cd /var/www/html
```

### 4. Cache komplett löschen
```bash
docker exec horex-shopware bash -c \
  "cd /var/www/html && rm -rf var/cache/* && php bin/console cache:clear"
```

### 5. Node Modules neu installieren
```bash
docker exec horex-shopware bash -c \
  "cd /var/www/html/vendor/shopware/administration/Resources/app/administration && \
   rm -rf node_modules && npm install"
```

---

## 📚 Weitere Ressourcen

- [Shopware 6 Build Process](https://developer.shopware.com/docs/guides/plugins/plugins/administration/build-process)
- [Vite Documentation](https://vitejs.dev/guide/build.html)
- [Shopware Asset Handling](https://developer.shopware.com/docs/guides/plugins/plugins/administration/add-custom-assets)

---

## 🆘 Support

Bei Problemen:
1. Logs prüfen (siehe oben)
2. Browser Console prüfen (F12)
3. Manifest-Hash verifizieren
4. Mit `--force` rebuilden
5. Browser-Cache komplett leeren

---

**Letzte Aktualisierung:** 26.11.2025  
**Version:** 1.0 (Optimiert)

