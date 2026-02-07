#!/bin/bash

# 3x-ui Subscription Theme Uninstaller
# Author: LORD GRIM
# Repo: https://github.com/Lordgrim77/3x-ui-premium-theme

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}💎 Starting 3x-ui Subscription Theme Uninstallation...${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo bash uninstall.sh)${NC}"
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
SUBPAGE_PATH="$HTML_PATH/settings/panel/subscription/subpage.html"

# 1. Revert Systemd Persistence
echo -e "${BLUE}Removing XUI_DEBUG persistence...${NC}"
SERVICE_FILE="/etc/systemd/system/x-ui.service"
if [[ -f "$SERVICE_FILE" ]]; then
    sed -i '/Environment="XUI_DEBUG=true"/d' "$SERVICE_FILE"
    echo -e "${GREEN}Persistence removed from systemd service.${NC}"
fi

# 2. Restore Official Assets
echo -e "${BLUE}Restoring official 3x-ui assets...${NC}"

# If backups exist, restore them
if [[ -f "$ASSETS_PATH/js/subscription.js.bak" ]]; then
    mv "$ASSETS_PATH/js/subscription.js.bak" "$ASSETS_PATH/js/subscription.js"
    echo -e "${GREEN}Restored subscription.js from backup.${NC}"
else
    echo -e "${YELLOW}No backup found for subscription.js, fetching official version...${NC}"
    curl -Ls "https://raw.githubusercontent.com/MHSanaei/3x-ui/main/web/assets/js/subscription.js" -o "$ASSETS_PATH/js/subscription.js"
fi

if [[ -f "$ASSETS_PATH/css/premium.css.bak" ]]; then
    rm "$ASSETS_PATH/css/premium.css"
    mv "$ASSETS_PATH/css/premium.css.bak" "$ASSETS_PATH/css/premium.css"
    echo -e "${GREEN}Restored premium.css from backup (if applicable).${NC}"
else
    rm -f "$ASSETS_PATH/css/premium.css"
    echo -e "${GREEN}Removed premium.css.${NC}"
fi

# Restore subpage.html (Always fetched to ensure official state)
echo -e "${BLUE}Restoring official subpage.html...${NC}"
curl -Ls "https://raw.githubusercontent.com/MHSanaei/3x-ui/main/web/html/settings/panel/subscription/subpage.html" -o "$SUBPAGE_PATH"

# 3. Final Cleanup & Restart
chmod -R 755 "$BASE_PATH"
echo -e "${BLUE}Refreshing systemd & Restarting x-ui...${NC}"
systemctl daemon-reload
if command -v x-ui &> /dev/null; then
    x-ui restart
else
    systemctl restart x-ui
fi

echo -e "${GREEN}✅ 3X-UI Subscription Theme uninstalled successfully. Returned to official state.${NC}"
