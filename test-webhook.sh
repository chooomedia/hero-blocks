#!/bin/bash

# Hero Blocks Webhook Test-Skript
# Testet alle Webhook-Endpunkte für License und Update Checks

# Farben für Output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Webhook URL
WEBHOOK_URL="https://n8n.chooomedia.com/webhook/license/hero-blocks"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S+00:00)

# Funktion: Test ausführen
run_test() {
    local test_name=$1
    local check_type=$2
    local current_version=$3
    local expected_field=$4
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Test: ${test_name}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Build URL
    local url="${WEBHOOK_URL}?checkType=${check_type}&plugin=hero-blocks&currentVersion=${current_version}&shopwareVersion=6.7.0&timestamp=${TIMESTAMP}"
    
    # Execute curl
    local response=$(curl -X POST "${url}" \
        -H "Content-Type: application/json" \
        -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
        -w "\nHTTP_STATUS:%{http_code}" \
        -s)
    
    # Extract HTTP Status
    local http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    local json_response=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    # Check HTTP Status
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ HTTP Status: ${http_status}${NC}"
    else
        echo -e "${RED}❌ HTTP Status: ${http_status}${NC}"
    fi
    
    # Pretty print JSON
    if command -v jq &> /dev/null; then
        echo -e "\n${GREEN}Response JSON:${NC}"
        echo "$json_response" | jq '.' 2>/dev/null || echo "$json_response"
    else
        echo -e "\n${GREEN}Response:${NC}"
        echo "$json_response"
    fi
    
    # Check for expected field
    if [ -n "$expected_field" ]; then
        if echo "$json_response" | grep -q "\"${expected_field}\""; then
            echo -e "${GREEN}✅ Expected field '${expected_field}' found${NC}"
        else
            echo -e "${RED}❌ Expected field '${expected_field}' NOT found${NC}"
        fi
    fi
    
    # Check for Release-ID (if update check)
    if [ "$check_type" = "update" ]; then
        if echo "$json_response" | grep -q "\"releaseId\""; then
            release_id=$(echo "$json_response" | grep -o "\"releaseId\":[0-9]*" | cut -d: -f2)
            if [ -n "$release_id" ] && [ "$release_id" != "null" ]; then
                echo -e "${GREEN}✅ Release-ID gefunden: ${release_id}${NC}"
            else
                echo -e "${YELLOW}⚠️  Release-ID ist null (kein Release gefunden)${NC}"
            fi
        else
            echo -e "${RED}❌ Release-ID Feld fehlt${NC}"
        fi
    fi
    
    echo -e "\n"
}

# Header
echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Hero Blocks Webhook Test Suite                           ║"
echo "║     Testing n8n Workflow: hero-blocks-unified                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Test 1: License Check
run_test "License Check (Gültig)" "license" "1.0.0" "valid"

# Test 1.5: Update Check - Release-ID Validierung
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test: Update Check - Release-ID Validierung${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
url="${WEBHOOK_URL}?checkType=update&plugin=hero-blocks&currentVersion=1.0.0&shopwareVersion=6.7.0&timestamp=${TIMESTAMP}"
response=$(curl -X POST "${url}" \
    -H "Content-Type: application/json" \
    -H "User-Agent: Shopware-HeroBlocks-Plugin/1.0.0" \
    -w "\nHTTP_STATUS:%{http_code}" \
    -s)
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
json_response=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ HTTP Status: ${http_status}${NC}"
    
    if command -v jq &> /dev/null; then
        release_id=$(echo "$json_response" | jq -r '.releaseId // empty')
        release_url=$(echo "$json_response" | jq -r '.releaseUrl // empty')
        latest_version=$(echo "$json_response" | jq -r '.latestVersion // empty')
        
        echo -e "\n${GREEN}Release-ID Details:${NC}"
        echo -e "  Release-ID: ${release_id:-'null'}"
        echo -e "  Release-URL: ${release_url:-'null'}"
        echo -e "  Latest Version: ${latest_version:-'null'}"
        
        if [ -n "$release_id" ] && [ "$release_id" != "null" ]; then
            echo -e "${GREEN}✅ Release-ID ist dynamisch extrahiert: ${release_id}${NC}"
        else
            echo -e "${YELLOW}⚠️  Release-ID ist null (kein Release gefunden)${NC}"
        fi
    else
        echo "$json_response"
    fi
else
    echo -e "${RED}❌ HTTP Status: ${http_status}${NC}"
fi
echo -e "\n"

# Test 2: Update Check (aktuell)
run_test "Update Check (Aktuell - v1.0.0)" "update" "1.0.0" "available"

# Test 3: Update Check (veraltet - sollte Update finden)
run_test "Update Check (Veraltet - v0.9.0)" "update" "0.9.0" "available"

# Test 4: Update Check (neue Version - sollte kein Update finden)
run_test "Update Check (Neue Version - v2.0.0)" "update" "2.0.0" "available"

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test Suite abgeschlossen${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${GREEN}Nächste Schritte:${NC}"
echo "1. Prüfe n8n Execution Logs für Details"
echo "2. Prüfe Slack-Notifications (falls konfiguriert)"
echo "3. Prüfe GitHub Releases: https://github.com/chooomedia/hero-blocks/releases"
echo -e "\n"

