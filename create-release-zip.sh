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

# WICHTIG: Shopware erwartet, dass ZIP direkt Plugin-Verzeichnis enthält (HeroBlocks/)
# git archive erstellt ZIP mit Repository-Namen als Root - muss umbenannt werden
# Repository-Name: hero-blocks, Plugin-Name: HeroBlocks

# Option 1: Mit git archive (nur versionierte Dateien - EMPFOHLEN)
if [ -d ".git" ]; then
    echo "✅ Verwende git archive (nur versionierte Dateien)"
    
    # Erstelle temporäre ZIP mit git archive
    TEMP_ZIP="temp-${ZIP_NAME}"
    git archive --format=zip --output="$TEMP_ZIP" HEAD
    
    # WICHTIG: Erstelle neue ZIP mit korrekter Struktur (HeroBlocks/ als Root)
    # Extrahiere temporäre ZIP in temporäres Verzeichnis
    TEMP_DIR=$(mktemp -d)
    unzip -q "$TEMP_ZIP" -d "$TEMP_DIR"
    
    # Erstelle neue ZIP mit HeroBlocks/ als Root-Verzeichnis
    cd "$TEMP_DIR"
    
    # WICHTIG: Finde das Plugin-Verzeichnis (kann hero-blocks oder HeroBlocks sein)
    # Shopware erwartet HeroBlocks/ als Root
    if [ -d "HeroBlocks" ]; then
        PLUGIN_DIR="HeroBlocks"
    elif [ -d "hero-blocks" ]; then
        # Umbenennen von hero-blocks zu HeroBlocks
        mv hero-blocks HeroBlocks
        PLUGIN_DIR="HeroBlocks"
        echo "📦 Plugin-Verzeichnis umbenannt: hero-blocks → HeroBlocks"
    else
        # Fallback: Verwende erstes Verzeichnis und benenne es um
        FIRST_DIR=$(ls -d */ | head -n 1 | sed 's/\///')
        if [ -n "$FIRST_DIR" ] && [ "$FIRST_DIR" != "HeroBlocks" ]; then
            mv "$FIRST_DIR" HeroBlocks
            PLUGIN_DIR="HeroBlocks"
            echo "📦 Plugin-Verzeichnis umbenannt: ${FIRST_DIR} → HeroBlocks"
        else
            PLUGIN_DIR="HeroBlocks"
        fi
    fi
    
    echo "📦 Plugin-Verzeichnis: ${PLUGIN_DIR}"
    
    # Erstelle ZIP mit Plugin-Verzeichnis als Root
    zip -r "$ZIP_NAME" "$PLUGIN_DIR" -q
    
    # Zurück zum ursprünglichen Verzeichnis
    cd - > /dev/null
    
    # Aufräumen
    rm -rf "$TEMP_DIR" "$TEMP_ZIP"
    
    echo "✅ ZIP mit korrekter Struktur erstellt (${PLUGIN_DIR}/ als Root)"
else
    echo "⚠️  Kein Git-Repository gefunden, verwende zip-Befehl"
    
    # Option 2: Manuell mit zip (alle Dateien außer .gitignore)
    # WICHTIG: Erstelle ZIP mit HeroBlocks/ als Root
    # Aktuelles Verzeichnis ist bereits HeroBlocks/
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
        -x "*.zip" \
        -q
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
echo "📂 ZIP-Struktur:"
unzip -l "$ZIP_NAME" | head -n 10

if unzip -l "$ZIP_NAME" | grep -q "HeroBlocks/composer.json\|hero-blocks/composer.json"; then
    echo "✅ composer.json gefunden"
else
    echo "❌ WARNUNG: composer.json nicht in ZIP gefunden!"
    echo "   Erwartet: HeroBlocks/composer.json oder hero-blocks/composer.json"
fi

if unzip -l "$ZIP_NAME" | grep -q "HeroBlocks/src/HeroBlocks.php\|hero-blocks/src/HeroBlocks.php"; then
    echo "✅ src/HeroBlocks.php gefunden"
else
    echo "❌ WARNUNG: src/HeroBlocks.php nicht in ZIP gefunden!"
    echo "   Erwartet: HeroBlocks/src/HeroBlocks.php oder hero-blocks/src/HeroBlocks.php"
fi

# WICHTIG: Prüfe ob ZIP-Struktur korrekt ist (Plugin-Verzeichnis als Root)
FIRST_ENTRY=$(unzip -l "$ZIP_NAME" | awk 'NR==4 {print $4}' | cut -d'/' -f1)
if [ "$FIRST_ENTRY" = "HeroBlocks" ] || [ "$FIRST_ENTRY" = "hero-blocks" ]; then
    echo "✅ ZIP-Struktur korrekt: ${FIRST_ENTRY}/ als Root-Verzeichnis"
else
    echo "⚠️  WARNUNG: ZIP-Struktur könnte falsch sein!"
    echo "   Erwartet: HeroBlocks/ oder hero-blocks/ als Root"
    echo "   Gefunden: ${FIRST_ENTRY}/"
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

