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

BASE_PATH="$XUI_ROOT/web/assets"
JS_PATH="$BASE_PATH/js/subscription.js"
CSS_PATH="$BASE_PATH/css/premium.css"
REPO_URL="https://raw.githubusercontent.com/Lordgrim77/3x-ui-premium-theme/main"

# Create directories if they don't exist
echo -e "${BLUE}📁 Ensuring theme directories exist...${NC}"
mkdir -p "$BASE_PATH/js"
mkdir -p "$BASE_PATH/css"

# Backup existing files
echo -e "${BLUE}📦 Backing up existing files...${NC}"
[[ -f "$JS_PATH" ]] && cp "$JS_PATH" "${JS_PATH}.bak" 2>/dev/null
[[ -f "$CSS_PATH" ]] && cp "$CSS_PATH" "${CSS_PATH}.bak" 2>/dev/null

echo -e "${BLUE}🚀 Fetching premium assets...${NC}"
curl -Ls "$REPO_URL/web/assets/js/subscription.js" -o "$JS_PATH"
curl -Ls "$REPO_URL/web/assets/css/premium.css" -o "$CSS_PATH"

chmod 777 "$JS_PATH"
chmod 777 "$CSS_PATH"

echo -e "${BLUE}🔄 Restarting x-ui to apply changes...${NC}"
if command -v x-ui &> /dev/null; then
    x-ui restart
else
    systemctl restart x-ui
fi

echo -e "${GREEN}✅ Premium Theme installed successfully!${NC}"
echo -e "${BLUE}Visit your dashboard to see the new look.${NC}"
