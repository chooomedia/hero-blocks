#!/bin/bash

# Hero Blocks - Release ZIP Creator
# Erstellt ZIP-Datei für GitHub Release

set -e

# Version aus composer.json lesen
VERSION=$(grep -o '"version": "[^"]*"' composer.json | cut -d'"' -f4)

if [ -z "$VERSION" ]; then
    echo "❌ Fehler: Version nicht in composer.json gefunden"
    exit 1
fi

ZIP_NAME="hero-blocks-${VERSION}.zip"

echo "📦 Erstelle Release ZIP: ${ZIP_NAME}"
echo "📋 Version: ${VERSION}"
echo ""

# Prüfe ob ZIP bereits existiert
if [ -f "$ZIP_NAME" ]; then
    echo "⚠️  Warnung: ${ZIP_NAME} existiert bereits"
    read -p "Überschreiben? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Abgebrochen"
        exit 1
    fi
    rm -f "$ZIP_NAME"
fi

# Erstelle ZIP-Datei
echo "📦 Erstelle ZIP-Datei..."

# Option 1: Mit git archive (nur versionierte Dateien - EMPFOHLEN)
if [ -d ".git" ]; then
    echo "✅ Verwende git archive (nur versionierte Dateien)"
    git archive --format=zip --output="$ZIP_NAME" HEAD
else
    echo "⚠️  Kein Git-Repository gefunden, verwende zip-Befehl"
    
    # Option 2: Manuell mit zip (alle Dateien außer .gitignore)
    zip -r "$ZIP_NAME" . \
        -x "*.git*" \
        -x "*node_modules*" \
        -x "*vendor*" \
        -x "*.DS_Store" \
        -x "*tests*" \
        -x "*.idea*" \
        -x "*.vscode*" \
        -x "*var*" \
        -x "*public*" \
        -x "*.cursor*" \
        -x "create-release-zip.sh" \
        -x "*.zip"
fi

# Prüfe ZIP-Datei
if [ ! -f "$ZIP_NAME" ]; then
    echo "❌ Fehler: ZIP-Datei wurde nicht erstellt"
    exit 1
fi

ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo ""
echo "✅ ZIP-Datei erstellt: ${ZIP_NAME}"
echo "📊 Größe: ${ZIP_SIZE}"
echo ""

# Prüfe ZIP-Inhalt
echo "📋 Prüfe ZIP-Inhalt..."
if unzip -l "$ZIP_NAME" | grep -q "composer.json"; then
    echo "✅ composer.json gefunden"
else
    echo "❌ WARNUNG: composer.json nicht in ZIP gefunden!"
fi

if unzip -l "$ZIP_NAME" | grep -q "src/HeroBlocks.php"; then
    echo "✅ src/HeroBlocks.php gefunden"
else
    echo "❌ WARNUNG: src/HeroBlocks.php nicht in ZIP gefunden!"
fi

echo ""
echo "🎉 Fertig! ZIP-Datei bereit für GitHub Release:"
echo "   ${ZIP_NAME}"
echo ""
echo "📋 Nächste Schritte:"
echo "   1. Gehe zu: https://github.com/chooomedia/hero-blocks/releases/new"
echo "   2. Tag: v${VERSION}"
echo "   3. Upload: ${ZIP_NAME}"
echo "   4. Publish release"
echo ""

