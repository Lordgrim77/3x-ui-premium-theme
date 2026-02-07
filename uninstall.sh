#!/bin/bash

# 3x-ui Subscription Theme Uninstaller (v3.2.0 - Nuke & Reinstall)
# Author: LORD GRIM
# Repo: https://github.com/Lordgrim77/3x-ui-premium-theme

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}💎 Starting 3x-ui Subscription Theme Uninstallation (v3.2.0)...${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo bash uninstall.sh)${NC}"
  exit 1
fi

# --- 1. Path Detection ---
if [[ -d "/usr/local/x-ui" ]]; then
    XUI_ROOT="/usr/local/x-ui"
else
    XUI_ROOT=$(dirname $(readlink -f $(which x-ui 2>/dev/null || echo "/usr/local/x-ui/x-ui")))
fi

# --- 2. Remove Theme Assets (Nuke Web Folder) ---
echo -e "${YELLOW}⚠️  Removing modified web assets...${NC}"
if [[ -d "$XUI_ROOT/web" ]]; then
    rm -rf "$XUI_ROOT/web"
    echo -e "${GREEN}✅ Premium Theme assets removed successfully.${NC}"
else
    echo -e "${YELLOW}Warning: web directory not found at $XUI_ROOT/web${NC}"
fi

# --- 3. Revert Systemd Persistence ---
echo -e "${BLUE}Disabling debugging environment...${NC}"
SERVICE_FILES=("/etc/systemd/system/x-ui.service" "/lib/systemd/system/x-ui.service")
for FILE in "${SERVICE_FILES[@]}"; do
    if [[ -f "$FILE" ]]; then
        sed -i '/Environment="XUI_DEBUG=true"/d' "$FILE"
        echo -e "${GREEN}Cleaned service file: $FILE${NC}"
    fi
done
systemctl daemon-reload

# --- 4. Official Re-install ---
echo -e "${BLUE}🚀 Re-installing official 3x-ui (Data will be preserved)...${NC}"
echo -e "${YELLOW}Please stay connected, the official installer will now take over.${NC}"
sleep 2

bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ 3X-UI restored to official version successfully.${NC}"
else
    echo -e "${RED}❌ Official restoration may have encountered an issue. Please check the logs above.${NC}"
fi

echo -e "${BLUE}Note: If the UI still looks modified, please clear your browser cache.${NC}"
