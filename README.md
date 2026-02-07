# 💎 3X-UI Subscription Theme

Elevate your 3x-ui experience with this ultra-premium, high-performance dashboard theme. Features glassmorphism, hardware-accelerated animations, and a sophisticated "Deep Space" visual style.

## ✨ Features
- **Premium Aesthetics**: Professional glassmorphism with dynamic "Deep Space" orbs.
- **Smart Titles**: Hardware-accelerated entrance animations for all section headers.
- **Improved UX**: Redesigned QR modal, better mobile layout, and consistent status indicators.
- **Dark/Light Mode**: Fully optimized themes for both ceramic light and deep space dark modes.

## 🚀 One-Click Installer
Run the following command on your 3x-ui server to install or update to this theme:

```bash
bash <(curl -Ls https://raw.githubusercontent.com/Lordgrim77/3x-ui-premium-theme/main/install.sh)
```
    
## 🛡️ Technical Note & Security
To inject this premium theme without requiring a complete recompilation of the `x-ui` binary, the installer enables `XUI_DEBUG=true` in your system service.

### What this means:
- **Custom Assets**: It allows the server to load `premium.css` and `subscription.js` directly from your disk.
- **Security Trade-off**: Enabling debug mode is standard for customization but theoretically broadens the attack surface slightly compared to a sealed production binary.
- **Recommendation**: For 99% of users, this is perfectly safe and the standard way to apply themes. If you run a high-traffic production environment with specific security mandates, consider "baking" the assets into the source code manually.

## 👨‍💻 Author
Made with ❤️ by [𝙇𝙊𝙍𝘿 𝙂𝙍𝙄𝙈](https://t.me/xXxIo_oIxXx)
