#!/bin/bash

# 3x-ui Premium Theme Installer
# Author: LORD GRIM
# Repo: https://github.com/Lordgrim77/3x-ui-premium-theme

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}💎 Starting 3x-ui Premium Theme Installation...${NC}"

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
echo -e "${BLUE}📁 Ensuring theme directories exist...${NC}"
mkdir -p "$ASSETS_PATH/js"
mkdir -p "$ASSETS_PATH/css"
mkdir -p "$HTML_PATH"

# Backup existing files
echo -e "${BLUE}📦 Backing up existing files...${NC}"
[[ -f "$ASSETS_PATH/js/subscription.js" ]] && cp "$ASSETS_PATH/js/subscription.js" "$ASSETS_PATH/js/subscription.js.bak" 2>/dev/null
[[ -f "$ASSETS_PATH/css/premium.css" ]] && cp "$ASSETS_PATH/css/premium.css" "$ASSETS_PATH/css/premium.css.bak" 2>/dev/null

echo -e "${BLUE}🚀 Fetching premium assets & templates...${NC}"
# Assets
curl -Ls "$REPO_URL/web/assets/js/subscription.js" -o "$ASSETS_PATH/js/subscription.js"
curl -Ls "$REPO_URL/web/assets/css/premium.css" -o "$ASSETS_PATH/css/premium.css"

# Templates (Crucial for Persistence/Debug Mode)
# We download the specific subpage template we modified
SUBPAGE_PATH="$HTML_PATH/settings/panel/subscription/subpage.html"
mkdir -p $(dirname "$SUBPAGE_PATH")
curl -Ls "$REPO_URL/web/html/settings/panel/subscription/subpage.html" -o "$SUBPAGE_PATH"

chmod -R 777 "$BASE_PATH"

echo -e "${BLUE}🛡️ Injecting Persistence (Update Survival)...${NC}"
SERVICE_FILE="/etc/systemd/system/x-ui.service"
if [[ -f "$SERVICE_FILE" ]]; then
    if ! grep -q "XUI_DEBUG=true" "$SERVICE_FILE"; then
        sed -i '/\[Service\]/a Environment="XUI_DEBUG=true"' "$SERVICE_FILE"
        echo -e "${GREEN}✅ Persistence injected successfully!${NC}"
    else
        echo -e "${BLUE}ℹ️ Persistence already enabled.${NC}"
    fi
fi

echo -e "${BLUE}🔄 Refreshing systemd & Restarting x-ui...${NC}"
systemctl daemon-reload
if command -v x-ui &> /dev/null; then
    x-ui restart
else
    systemctl restart x-ui
fi

echo -e "${GREEN}✅ Premium Theme installed & Persistent!${NC}"
echo -e "${BLUE}Your theme will now survive official 3x-ui updates.${NC}"

