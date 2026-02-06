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

BASE_PATH="/usr/local/x-ui/bin/web/assets"
JS_PATH="$BASE_PATH/js/subscription.js"
CSS_PATH="$BASE_PATH/css/premium.css"
REPO_URL="https://raw.githubusercontent.com/Lordgrim77/3x-ui-premium-theme/main"

echo -e "${BLUE}📦 Backing up existing files...${NC}"
cp "$JS_PATH" "${JS_PATH}.bak" 2>/dev/null
cp "$CSS_PATH" "${CSS_PATH}.bak" 2>/dev/null

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
