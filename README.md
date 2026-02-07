# 💎 3X-UI Subscription Theme
## 🛡️ Disclaimer
> [!WARNING]
> This project is for **educational purposes only**.
> 
> **Standard of Use**: The author is NOT responsible for any misuse or damages caused by this software. Use at your own risk.
> 
> **Self-Responsibility**: By using this script/theme, you agree that you are solely responsible for any consequences, including but not limited to system instability, data loss, or security risks.
>   
## ✨ Design Specifications
- **Glassmorphism 2.0**: Sophisticated depth using high-blur `backdrop-filter` and multi-layered shadows.
- **Micro-Animations**: Elastic hover effects, heart-pulse footers, and staggered entrance transitions.
- **Theme-Aware System**: 
  - **🌌 Obsidian (Dark Mode)**: Deep space palette with glowing indigo accents.
  - **❄️ Ceramic (Light Mode)**: Professional frost-white aesthetic with high-contrast slate typography.
- **Pill-Shaped UI**: Modern, fluid geometry for buttons, toasts, and modal elements.

## 🚀 Optimizations
- **GPU Progress Bars**: Uses `scaleX()` transforms instead of `width` to bypass Reflow cycles.
- **Pseudo-Shadows**: Shadows are rendered via `opacity` on pseudo-elements to minimize GPU overdraw.
- **Layout Containment**: Cards use `contain: layout style paint` to isolate rendering and speed up repaints.
- **Compositor Sync**: All animation triggers are synchronized via `requestAnimationFrame`.






## 🚀 Installation
1. Make sure to take a backup of the system before doing anything.
2. Run the following command on your 3x-ui server to install or update:

```bash
bash <(curl -Ls https://raw.githubusercontent.com/Lordgrim77/3x-ui-premium-theme/main/install.sh)
```

## 🧹 Uninstallation
If you wish to return to the official 3x-ui theme, run:

```bash
bash <(curl -Ls https://raw.githubusercontent.com/Lordgrim77/3x-ui-premium-theme/main/uninstall.sh)
```

## 🛡️ Technical Note & Security
To inject this theme without binary recompilation, the installer enables `XUI_DEBUG=true`.

- **Custom Assets**: Loads `premium.css` and `subscription.js` directly from disk.
- **Security**: Standard for customization; theoretically broadens attack surface slightly compared to a sealed binary.
- **Recommendation**: Safe for 99% of users. For extreme high-security environments, consider manual source-code integration.

## Notes
- IF CDNs are used in Subscription, Some Infrastructure Stats may shows "Protected" for security reasons.
- 
## 👨‍💻 Author
Made with ❤️ by 𝙇𝙊𝙍𝘿𝙂𝙍𝙄𝙈
