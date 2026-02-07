# 3X-UI Subscription Theme 🎨

##  Disclaimer ❗
> [!WARNING]
> This project is for **educational purposes only**.
> 
> **Standard of Use**: The author is NOT responsible for any misuse or damages caused by this software. Use at your own risk.
> 
> **Self-Responsibility**: By using this script/theme, you agree that you are solely responsible for any consequences, including but not limited to system instability, data loss, or security risks.
>

## ✨ Design Specifications
- **Glassmorphism**: Sophisticated depth using high-blur `backdrop-filter` and multi-layered shadows.
- **Micro-Animations**: Elastic hover effects and staggered entrance transitions.
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
If you wish to return to the Stock Version, run:

```bash
bash <(curl -Ls https://raw.githubusercontent.com/Lordgrim77/3x-ui-premium-theme/main/uninstall.sh)
```
> [!WARNING]
> This will update your x-ui panel to the latest version
> 

## 🛡️ Technical Note & Security
- **Recommendation**: For extreme high-security environments, consider manual source-code integration.

## Notes
- IF CDNs are used in Subscription, Some Infrastructure Stats may shows "Protected" for security reasons.
  
## 👨‍💻 Author
Made with ❤️ by 𝙇𝙊𝙍𝘿𝙂𝙍𝙄𝙈
