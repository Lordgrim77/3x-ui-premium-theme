#!/bin/bash

# 3x-ui Subscription Theme Installer
# Author: LORD GRIM
# Repo: https://github.com/Lordgrim77/3x-ui-premium-theme
# Version for cache busting
VERSION="3.0.1"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}💎 Starting 3x-ui Subscription Theme Installation...${NC}"
echo -e "${RED}⚠️  NOTICE: This project is for EDUCATIONAL PURPOSES ONLY.${NC}"
echo -e "${RED}⚠️  The user is solely responsible for any consequences or damages.${NC}"
echo -e "${RED}⚠️  USE AT YOUR OWN RISK.${NC}"
sleep 2

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo bash install.sh)${NC}"
  exit
fi

# Define paths
if [[ -d "/usr/local/x-ui" ]]; then
    XUI_ROOT="/usr/local/x-ui"
else
    XUI_ROOT=$(dirname $(readlink -f $(which x-ui 2>/dev/null || echo "/usr/local/x-ui/x-ui")))
fi

BASE_PATH="$XUI_ROOT/web"
ASSETS_PATH="$BASE_PATH/assets"
HTML_PATH="$BASE_PATH/html"
REPO_URL="https://raw.githubusercontent.com/Lordgrim77/3x-ui-premium-theme/main"

# Create directories if they don't exist
echo -e "${BLUE}Ensuring theme directories exist...${NC}"
mkdir -p "$ASSETS_PATH/js"
mkdir -p "$ASSETS_PATH/css"
mkdir -p "$HTML_PATH"

# Backup existing files
echo -e "${BLUE}Backing up existing files...${NC}"
[[ -f "$ASSETS_PATH/js/subscription.js" ]] && cp "$ASSETS_PATH/js/subscription.js" "$ASSETS_PATH/js/subscription.js.bak" 2>/dev/null
[[ -f "$ASSETS_PATH/css/premium.css" ]] && cp "$ASSETS_PATH/css/premium.css" "$ASSETS_PATH/css/premium.css.bak" 2>/dev/null

# Templates & Full Asset Sync (Crucial for Persistence/Debug Mode)
echo -e "${BLUE}Syncing official web assets for full compatibility...${NC}"
if ! command -v unzip &> /dev/null; then
    echo -e "${BLUE}🔧 Installing unzip...${NC}"
    apt-get install unzip -y >/dev/null 2>&1 || yum install unzip -y >/dev/null 2>&1
fi

TEMP_ZIP="/tmp/3x-ui-main.zip"
curl -Ls "https://github.com/MHSanaei/3x-ui/archive/refs/heads/main.zip" -o "$TEMP_ZIP"
mkdir -p "/tmp/3x-ui-extract"
unzip -qo "$TEMP_ZIP" -d "/tmp/3x-ui-extract"

# Copy official web folder to local x-ui root
cp -rf /tmp/3x-ui-extract/3x-ui-main/web/* "$BASE_PATH/"
rm -rf "$TEMP_ZIP" "/tmp/3x-ui-extract"

echo -e "${BLUE}Fetching assets...${NC}"
#  Assets (Overwriting official ones where needed)
curl -Ls "$REPO_URL/web/assets/js/subscription.js?v=$VERSION" -o "$ASSETS_PATH/js/subscription.js"
curl -Ls "$REPO_URL/web/assets/css/premium.css?v=$VERSION" -o "$ASSETS_PATH/css/premium.css"

# Templates (Crucial for Persistence/Debug Mode)
SUBPAGE_PATH="$HTML_PATH/settings/panel/subscription/subpage.html"
mkdir -p $(dirname "$SUBPAGE_PATH")
curl -Ls "$REPO_URL/web/html/settings/panel/subscription/subpage.html?v=$VERSION" -o "$SUBPAGE_PATH"

# INFRASTRUCTURE AUTO-DETECTION
echo -e "${BLUE}Detecting hosting infrastructure...${NC}"

# Helper: Extract JSON value safely
extract_json() {
    echo "$1" | grep -oE "\"$2\"\s*:\s*\"[^\"]*\"" | sed -E "s/\"$2\"\s*:\s*\"//g" | sed 's/"$//g'
}

# --- SOURCE 1: ip-api.com ---
IP_DATA=$(curl -s --max-time 3 http://ip-api.com/json/)
ISP=$(extract_json "$IP_DATA" "isp")
REGION=$(extract_json "$IP_DATA" "city")
COUNTRY=$(extract_json "$IP_DATA" "country")

# --- SOURCE 2: ipinfo.io ---
if [[ -z "$ISP" ]]; then
    echo -e "${YELLOW}Primary API failed, trying RIPE database...${NC}"
    IP_DATA=$(curl -s --max-time 3 https://ipinfo.io/json)
    ISP=$(extract_json "$IP_DATA" "org" | sed 's/^AS[0-9]* //')
    REGION=$(extract_json "$IP_DATA" "city")
    COUNTRY=$(extract_json "$IP_DATA" "country")
fi

# --- SOURCE 3: ifconfig.co ---
if [[ -z "$ISP" ]]; then
    echo -e "${YELLOW}RIPE failed, trying deep lookup...${NC}"
    IP_DATA=$(curl -s --max-time 5 https://ifconfig.co/json)
    ISP=$(extract_json "$IP_DATA" "asn_org")
    REGION=$(extract_json "$IP_DATA" "city")
    COUNTRY=$(extract_json "$IP_DATA" "country")
fi

# --- FINAL FALLBACK ---
if [[ -z "$ISP" ]]; then
    ISP="Unknown Cloud"
    LOCATION="Unknown Region"
    echo -e "${RED}❌ All detection sources failed. Using fallback placeholders.${NC}"
else
    LOCATION="$REGION, $COUNTRY"
fi

# --- SIMPLE REPLACEMENT STRATEGY ---

if [[ -n "$ISP" ]]; then
    # Capture Real IP for client-side fallback
    # Try multiple sources to ensure we get it even if one is geoblocked
    REAL_IP=$(curl -s --max-time 3 ifconfig.me || curl -s --max-time 3 api.ipify.org || curl -s --max-time 3 icanhazip.com || curl -s --max-time 3 ident.me)

    # Escape special characters for sed
    SAFE_ISP=$(echo "$ISP" | sed -e 's/[]\/$*.^[]/\\&/g')
    SAFE_LOCATION=$(echo "$LOCATION" | sed -e 's/[]\/$*.^[]/\\&/g')

    sed -i "s|data-isp=\"Detecting...\"|data-isp=\"$SAFE_ISP\"|g" "$SUBPAGE_PATH"
    sed -i "s|data-location=\"Unknown Region\"|data-location=\"$SAFE_LOCATION\"|g" "$SUBPAGE_PATH"
    
    if [[ -n "$REAL_IP" ]]; then
        sed -i "s|data-ip=\"Self\"|data-ip=\"$REAL_IP\"|g" "$SUBPAGE_PATH"
    fi

    # Verification
    if grep -q "$SAFE_ISP" "$SUBPAGE_PATH"; then
        echo -e "${GREEN}Infrastructure data injected successfully${NC}"
    else
        echo -e "${RED}❌ Injection failed. Could not find placeholder text in template.${NC}"
    fi
else
    echo -e "${RED}❌ No ISP detected to inject.${NC}"
fi

chmod -R 777 "$BASE_PATH"

echo -e "${BLUE}Injecting Persistence (Update Survival)...${NC}"
SERVICE_FILE="/etc/systemd/system/x-ui.service"
if [[ -f "$SERVICE_FILE" ]]; then
    if ! grep -q "XUI_DEBUG=true" "$SERVICE_FILE"; then
        sed -i '/\[Service\]/a Environment="XUI_DEBUG=true"' "$SERVICE_FILE"
        echo -e "${GREEN}Persistence injected successfully!${NC}"
    else
        echo -e "${BLUE}Persistence already enabled.${NC}"
    fi
fi

echo -e "${BLUE}Refreshing systemd & Restarting x-ui...${NC}"
systemctl daemon-reload
if command -v x-ui &> /dev/null; then
    x-ui restart
else
    systemctl restart x-ui
fi

echo -e "${GREEN}✅ 3X-UI Subscription Theme installed Successfully${NC}"
echo -e "${GREEN}🔧 Turn on the Inbuilt Subscription System (If not enabled)${NC}"

