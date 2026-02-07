#!/bin/bash

# 3x-ui Subscription Theme Uninstaller (v3.1.0 - Robustness Update)
# Author: LORD GRIM
# Repo: https://github.com/Lordgrim77/3x-ui-premium-theme

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}💎 Starting 3x-ui Subscription Theme Uninstallation (v3.1.0)...${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo bash uninstall.sh)${NC}"
  exit 1
fi

# --- 1. Path Detection ---
echo -e "${BLUE}Searching for x-ui directory...${NC}"
if [[ -d "/usr/local/x-ui" ]]; then
    XUI_ROOT="/usr/local/x-ui"
else
    XUI_ROOT=$(dirname $(readlink -f $(which x-ui 2>/dev/null || echo "/usr/local/x-ui/x-ui")))
fi

if [[ ! -d "$XUI_ROOT" ]]; then
    echo -e "${RED}❌ x-ui directory not found at $XUI_ROOT. Uninstallation aborted.${NC}"
    exit 1
fi

BASE_PATH="$XUI_ROOT/web"
ASSETS_PATH="$BASE_PATH/assets"
HTML_PATH="$BASE_PATH/html"
SUBPAGE_PATH="$HTML_PATH/settings/panel/subscription/subpage.html"

# --- 2. Revert Systemd Persistence ---
echo -e "${BLUE}Removing XUI_DEBUG persistence...${NC}"
# Check multiple potential service file locations
SERVICE_FILES=("/etc/systemd/system/x-ui.service" "/lib/systemd/system/x-ui.service")
FOUND_SERVICE=false

for FILE in "${SERVICE_FILES[@]}"; do
    if [[ -f "$FILE" ]]; then
        if grep -q "XUI_DEBUG=true" "$FILE"; then
            sed -i '/Environment="XUI_DEBUG=true"/d' "$FILE"
            echo -e "${GREEN}Removed persistence from $FILE${NC}"
            FOUND_SERVICE=true
        fi
    fi
done

if [[ "$FOUND_SERVICE" == "true" ]]; then
    systemctl daemon-reload
fi

# --- 3. Restore Official Assets ---
echo -e "${BLUE}Restoring official 3x-ui assets...${NC}"

# Ensure directories exist for restoration
mkdir -p "$ASSETS_PATH/js"
mkdir -p "$ASSETS_PATH/css"
mkdir -p "$(dirname "$SUBPAGE_PATH")"

# Restore subscription.js
if [[ -f "$ASSETS_PATH/js/subscription.js.bak" ]]; then
    mv "$ASSETS_PATH/js/subscription.js.bak" "$ASSETS_PATH/js/subscription.js"
    echo -e "${GREEN}Restored subscription.js from backup.${NC}"
else
    echo -e "${YELLOW}No backup for subscription.js, fetching official version...${NC}"
    curl -Ls "https://raw.githubusercontent.com/MHSanaei/3x-ui/main/web/assets/js/subscription.js" -o "$ASSETS_PATH/js/subscription.js"
    [[ $? -eq 0 ]] && echo -e "${GREEN}Successfully restored subscription.js from GitHub.${NC}" || echo -e "${RED}⚠️ Failed to fetch subscription.js${NC}"
fi

# Remove/Restore premium.css
if [[ -f "$ASSETS_PATH/css/premium.css.bak" ]]; then
    rm -f "$ASSETS_PATH/css/premium.css"
    mv "$ASSETS_PATH/css/premium.css.bak" "$ASSETS_PATH/css/premium.css"
    echo -e "${GREEN}Restored premium.css from backup.${NC}"
else
    rm -f "$ASSETS_PATH/css/premium.css"
    echo -e "${GREEN}Removed premium theme CSS.${NC}"
fi

# Restore subpage.html (Always fetched to ensure official state)
echo -e "${BLUE}Restoring official subpage.html...${NC}"
curl -Ls "https://raw.githubusercontent.com/MHSanaei/3x-ui/main/web/html/settings/panel/subscription/subpage.html" -o "$SUBPAGE_PATH"
[[ $? -eq 0 ]] && echo -e "${GREEN}Successfully restored subpage.html.${NC}" || echo -e "${RED}⚠️ Failed to fetch subpage.html${NC}"

# --- 4. Final Cleanup & Restart ---
chmod -R 755 "$BASE_PATH"
echo -e "${BLUE}Restarting x-ui...${NC}"

if command -v x-ui &> /dev/null; then
    x-ui restart
else
    systemctl restart x-ui
fi

echo -e "${GREEN}✅ 3X-UI Subscription Theme uninstalled Successfully.${NC}"
echo -e "${BLUE}Note: If the UI still looks modified, please clear your browser cache.${NC}"
