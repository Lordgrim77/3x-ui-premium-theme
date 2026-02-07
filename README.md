# 💎 3x-ui Premium Dashboard Theme (v1.7.0)

Elevate your 3x-ui experience with an ultra-premium, reference-quality dashboard. This theme isn't just a skin—it's a high-performance visual engine designed for professional-grade networking interfaces.

## ✨ Design Specifications
- **Glassmorphism 2.0**: Sophisticated depth using high-blur `backdrop-filter` (35px) and multi-layered shadows.
- **Micro-Animations**: Elastic hover effects, heart-pulse footers, and staggered entrance transitions (300ms–800ms).
- **Theme-Aware System**: 
  - **🌌 Obsidian (Dark Mode)**: Deep space palette with glowing indigo accents.
  - **❄️ Ceramic (Light Mode)**: Professional frost-white aesthetic with high-contrast slate typography.
- **Pill-Shaped UI**: Modern, fluid geometry for buttons, toasts, and modal elements.

## 🚀 "Zero-Lag" Performance Engine
Engineered for 60FPS smoothness even on low-end hardware:
- **GPU Progress Bars**: Uses `scaleX()` transforms instead of `width` to bypass Reflow cycles.
- **Pseudo-Shadows**: Shadows are rendered via `opacity` on pseudo-elements to minimize GPU overdraw.
- **Layout Containment**: Cards use `contain: layout style paint` to isolate rendering and speed up repaints.
- **Compositor Sync**: All animation triggers are synchronized via `requestAnimationFrame`.

## 🍮 Universal Accessibility
- **Universal Scroll Fix**: Overrides host-panel locks to ensure fluid scrolling on both 4K desktops and mobile notches.
- **Isolated Toast Logic**: A dedicated `.premium-toast` system that guarantees perfect horizontal centering regardless of global UI animations.
- **Robust QR Grid**: Logic-driven 3-column CSS Grid ensures QR titles never overlap buttons.

## 🚀 One-Click Installer
Run the following command on your 3x-ui server to install or update:

```bash
bash <(curl -Ls https://raw.githubusercontent.com/Lordgrim77/3x-ui-premium-theme/main/install.sh)
```

## 🛡️ Technical Note & Security
To inject this premium theme without binary recompilation, the installer enables `XUI_DEBUG=true`.

- **Custom Assets**: Loads `premium.css` and `subscription.js` directly from disk.
- **Security**: Standard for customization; theoretically broadens attack surface slightly compared to a sealed binary.
- **Performance**: Negligible Disk I/O increase.
- **Recommendation**: Safe for 99% of users. For extreme high-security environments, consider manual source-code integration.

## 👨‍💻 Author
Made with ❤️ by [𝙇𝙊𝙍𝘿 𝙂𝙍𝙄𝙈](https://t.me/xXxIo_oIxXx)
