
/*
 * 💎 3x-ui Premium Dashboard Logic
 * v2.0 - STABLE
 * 
 * Author: Lordgrim77
 * License: Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
 * Repository: https://github.com/Lordgrim77/3x-ui-premium-theme
 */

(function () {
    // --- CONFIG & STATE ---
    const STATE = {
        theme: localStorage.getItem('xui_theme') || 'dark', // 'dark' | 'light'
        lang: localStorage.getItem('xui_lang') || 'en',   // 'en' | 'cn' | 'fa'
        subUrl: '',
        raw: null // Data cached here to prevent loss on re-render
    };

    const I18N = {
        en: {
            title: 'My Subscription',
            limit: 'Data Limit',
            used: 'Used',
            rem: 'Remaining',
            exp: 'Expires',
            nodes: 'Configuration Links',
            copy: 'Copy Link',
            qr: 'QR Code',
            online: 'Online',
            offline: 'Offline',
            unlimited: 'Unlimited',
            refresh: 'Refresh Status',
            upload: 'Upload',
            download: 'Download',
            copied: 'Copied!'
        },
        cn: {
            title: '我的订阅',
            limit: '流量限制',
            used: '已用',
            rem: '剩余',
            exp: '到期时间',
            nodes: '配置链接',
            copy: '复制链接',
            qr: '二维码',
            online: '在线',
            offline: '离线',
            unlimited: '不限流量',
            refresh: '刷新状态',
            upload: '上传',
            download: '下载',
            copied: '已复制!'
        },
        fa: {
            title: 'اشتراک من',
            limit: 'محدودیت داده',
            used: 'استفاده شده',
            rem: 'باقی‌مانده',
            exp: 'انقضا',
            nodes: 'لینک‌های اتصال',
            copy: 'کپی لینک',
            qr: 'کد QR',
            online: 'آنلاین',
            offline: 'آفلاین',
            unlimited: 'نامحدود',
            refresh: 'بروزرسانی وضعیت',
            upload: 'آپلود',
            download: 'دانلود',
            copied: 'کپی شد!'
        },
    };

    function t(key) { return I18N[STATE.lang][key] || key; }

    // --- UTILS ---
    const getEl = (id) => document.getElementById(id);
    const mkEl = (tag, cls, html) => {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (html) el.innerHTML = html;
        return el;
    };

    function cleanupName(raw) {
        if (!raw) return 'User';
        try {
            let name = decodeURIComponent(raw);
            // 1. Remove "⛔️N/A-" or similar prefixes
            name = name.replace(/^[⛔️N\/A\s-]+/i, '');
            // 2. Remove usage stats and time indicators at the end (e.g., -5GB, -7d, -24h)
            // This catches patterns like -10.5GB, -500MB, -7d, -24h, -1mo, etc.
            name = name.replace(/-\s*\d+(\.\d+)?\s*([GMKT]B|[dhmy]|min|mo).*$/i, '');
            // 3. Remove trailing emojis or stats symbols
            name = name.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F680}-\u{1F6FF}\u{24C2}-\u{1F251}].*$/u, '');
            return name.trim() || 'User';
        } catch (e) { return raw; }
    }

    function getStatusInfo() {
        const now = Date.now();
        const total = STATE.raw.total || 0;
        const used = (STATE.raw.up || 0) + (STATE.raw.down || 0);
        const expired = STATE.raw.expire > 0 && now > STATE.raw.expire;
        const depleted = total > 0 && used >= total;

        let state = 'active';
        if (expired) state = 'warn'; // Expired = Yellow (warn)
        else if (depleted) state = 'depleted'; // Depleted = Red
        else if (total === 0) state = 'unlimited'; // Unlimited = Cyan
        else state = 'active'; // Else Green

        if (state === 'warn') {
            colorVar = 'var(--usage-expired)';
            label = 'Expired';
        } else if (state === 'depleted') {
            colorVar = 'var(--usage-depleted)';
            label = 'Limited';
        } else if (state === 'unlimited') {
            colorVar = 'var(--accent)';
            label = 'Active';
        } else if (state === 'active') {
            colorVar = 'var(--usage-active)';
            label = 'Active';
        }

        const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100);
        const active = !expired && !depleted;

        return { active, expired, depleted, label, color: colorVar, pct, used, total, state };
    }

    // --- INITIALIZATION ---
    function init() {
        // Inject Theme Class into HTML text to override root styles
        document.documentElement.classList.add('premium-theme');
        document.body.classList.add('premium-theme');
        renderLoader(); // 1. Start Pre-loader

        // 2. Parse Data ONLY ONCE (Safe from re-renders)
        if (!STATE.raw) {
            const dataEl = getEl('subscription-data');
            if (!dataEl) return;

            STATE.raw = {
                sid: dataEl.getAttribute('data-email') || dataEl.getAttribute('data-sid') || 'User',
                total: parseInt(dataEl.getAttribute('data-totalbyte') || 0),
                up: parseInt(dataEl.getAttribute('data-uploadbyte') || 0),
                down: parseInt(dataEl.getAttribute('data-downloadbyte') || 0),
                expire: parseInt(dataEl.getAttribute('data-expire') || 0) * 1000,
                subUrl: dataEl.getAttribute('data-sub-url') || '',
                lastOnline: parseInt(dataEl.getAttribute('data-lastonline') || 0),
                isp: 'Detecting...',
                location: 'Detecting...',
                serverIp: dataEl.getAttribute('data-ip') || 'Self'
            };
            STATE.subUrl = STATE.raw.subUrl;
        }

        // 3. CSS Fail-safe
        if (!document.querySelector('link[href*="premium.css"]')) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = './assets/css/premium.css';
            document.head.appendChild(css);
        }

        // 4. Render Application
        renderApp();
        applyTheme();
        startStatsPolling(); // Start polling for stats

        // 5. Status Loop (Keep alive)
        if (!window.statusLoop) {
            window.statusLoop = setInterval(updateStatus, 60000); // Check status every min
        }

        // 6. Start Background Animation
        new NeuralNetwork();
    }

    // --- RENDERERS ---
    function renderApp() {
        // Clean previous render if exists
        const old = getEl('app-root');
        if (old) old.remove();

        const app = mkEl('div', 'app-container');
        app.id = 'app-root';

        // 1. Header
        app.appendChild(renderHeader());

        // 2. Dashboard Grid
        const grid = mkEl('div', 'dashboard-grid');

        // Usage Card (Span 8)
        grid.appendChild(renderUsageCard());

        // Info Card (Span 4)
        grid.appendChild(renderInfoCard());


        // Nodes List (Span 12)
        grid.appendChild(renderNodesList());

        // Server Monitor Stats (Span 12)
        grid.appendChild(renderStatsGrid());

        // Infrastructure Section (v1.8.0)
        grid.appendChild(renderInfrastructureSection());

        app.appendChild(grid);

        // Footer
        const footer = mkEl('div', 'custom-footer');
        footer.innerHTML = `
        Made with <span class="heart-pulse">❤️</span> by&nbsp;
        <a class="footer-link" href="https://t.me/xXxIo_oIxXx" target="_blank" rel="noopener noreferrer">
          𝙇𝙊𝙍𝘿 𝙂𝙍𝙄𝙈 ᶻ 𝗓 𐰁 .ᐟ
        </a>
    `;
        app.appendChild(footer);

        // 3. Modals & FX
        app.appendChild(renderQRModal());
        app.appendChild(renderToast());

        document.body.appendChild(app);

        // Trigger Animations with RequestAnimationFrame for sync
        requestAnimationFrame(() => {
            setTimeout(() => {
                document.body.classList.add('ready'); // Trigger CSS Entrance Animations
                hideLoader();

                const bar = getEl('prog-bar');
                if (bar) {
                    const s = getStatusInfo();
                    setTimeout(() => {
                        bar.style.transform = `scaleX(${s.pct / 100})`;
                    }, 400); // Progress bar slides after card reveal
                }
            }, 600);
        });
    }

    function renderHeader() {
        const h = mkEl('header', 'dashboard-header');

        // Logic to get best name
        let dispName = STATE.raw.sid;
        const linksEl = getEl('subscription-links');
        const links = linksEl ? linksEl.value.split('\n').filter(Boolean) : [];

        if (!STATE.raw.sid.includes('@') && links.length > 0) {
            if (links[0].includes('#')) {
                dispName = links[0].split('#')[1];
            }
        }
        dispName = cleanupName(dispName);

        const s = getStatusInfo();

        const profile = mkEl('div', 'user-profile');
        profile.innerHTML = `
            <div class="avatar">${dispName.substring(0, 1).toUpperCase()}</div>
            <div class="user-text-group">
                <div class="dashboard-title">User Dashboard</div>
                <div class="user-main-row">
                    <div class="username-display">${dispName}</div>
                    <div class="status-indicator-wrap">
                        <span class="status-text-inline" style="color: ${s.color}">${s.label}</span>
                        <div class="status-dot-inline" style="background:${s.color}; box-shadow: 0 0 10px ${s.color}; border-color: ${s.color}44;"></div>
                    </div>
                </div>
            </div>
        `;

        // Controls (Theme only)
        const ctrls = mkEl('div', 'controls');
        ctrls.style.position = 'relative';
        ctrls.style.zIndex = '200';

        // Theme Toggle with Bounce
        const themeBtn = mkEl('div', 'icon-btn');
        themeBtn.innerHTML = STATE.theme === 'dark' ?
            `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>` :
            `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        themeBtn.onclick = (e) => {
            // Add bounce animation
            themeBtn.style.animation = 'bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            setTimeout(() => { themeBtn.style.animation = ''; }, 600);
            toggleTheme(e);
        };
        themeBtn.id = 'theme-btn';

        ctrls.appendChild(themeBtn);
        h.appendChild(profile);
        h.appendChild(ctrls);

        return h;
    }

    function renderUsageCard() {
        const card = mkEl('div', 'glass-panel span-8 usage-overview');
        const s = getStatusInfo();

        card.innerHTML = `
            <div class="usage-header">
                <span class="usage-title">Data Usage Metrics</span>
                <span class="usage-title">${s.pct.toFixed(1)}%</span>
            </div>
            <div class="usage-big-number">${formatBytes(s.used)}</div>
          <div class="progress-container">
              <div class="progress-bar ${s.total === 0 ? 'unlimited-bar' : ''}" 
                   id="prog-bar" 
                   style="transform:scaleX(${s.total === 0 ? 1 : 0});">
                   <div class="bloom"></div>
              </div>
          </div>
            <div class="usage-sub">
                ${t('limit')}: ${s.total === 0 ? t('unlimited') : formatBytes(s.total)}
            </div>
        `;
        return card;
    }

    function renderInfoCard() {
        const card = mkEl('div', 'glass-panel span-4 stat-mini-grid');

        // Remaining usage...
        let remText = '∞';
        if (STATE.raw.total > 0) {
            const left = STATE.raw.total - (STATE.raw.up + STATE.raw.down);
            remText = formatBytes(left < 0 ? 0 : left);
        }

        const rem = mkEl('div', 'stat-mini');
        const icoRem = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--theme-rem)"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`;

        rem.innerHTML = `
            <div class="stat-icon">${icoRem}</div>
            <div class="stat-value">${remText}</div>
            <div class="stat-label">${t('rem')}</div>
        `;

        // Expire...
        let expText = '∞';
        if (STATE.raw.expire > 0) {
            const diff = STATE.raw.expire - Date.now();
            if (diff < 0) expText = 'Expired';
            else expText = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 'd';
        }

        const exp = mkEl('div', 'stat-mini');
        const icoExp = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--theme-exp)"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

        exp.innerHTML = `
            <div class="stat-icon">${icoExp}</div>
            <div class="stat-value">${expText}</div>
            <div class="stat-label">${t('exp')}</div>
        `;

        // Upload
        const up = mkEl('div', 'stat-mini');
        const icoUp = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--theme-up)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`;
        up.innerHTML = `
            <div class="stat-icon">${icoUp}</div>
            <div class="stat-value">${formatBytes(STATE.raw.up)}</div>
            <div class="stat-label">${t('upload')}</div>
        `;

        // Download
        const down = mkEl('div', 'stat-mini');
        const icoDown = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--theme-down)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
        down.innerHTML = `
            <div class="stat-icon">${icoDown}</div>
            <div class="stat-value">${formatBytes(STATE.raw.down)}</div>
            <div class="stat-label">${t('download')}</div>
        `;

        // Last Online
        const lastOnline = mkEl('div', 'stat-mini');
        let lastOnlineText = 'Never';
        if (STATE.raw.lastOnline > 0) {
            const now = Date.now();
            const diff = now - STATE.raw.lastOnline;
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (minutes < 1) lastOnlineText = 'Just now';
            else if (minutes < 60) lastOnlineText = minutes + 'm ago';
            else if (hours < 24) lastOnlineText = hours + 'h ago';
            else lastOnlineText = days + 'd ago';
        }

        const icoOnline = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--status-online)"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
        lastOnline.innerHTML = `
            <div class="stat-icon">${icoOnline}</div>
            <div class="stat-value">${lastOnlineText}</div>
            <div class="stat-label">Last Online</div>
        `;

        card.appendChild(up);
        card.appendChild(down);
        card.appendChild(rem);
        card.appendChild(exp);
        card.appendChild(lastOnline);

        return card;
    }

    function renderNodesList() {
        const wrap = mkEl('div', 'span-12');
        const icoLinks = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
        wrap.innerHTML = `<div class="nodes-header">${icoLinks} Configuration Links</div>`;

        const grid = mkEl('div', 'node-grid');
        const links = getEl('subscription-links')?.value.split('\n').filter(Boolean) || [];

        links.forEach((link, i) => {
            const node = renderNode(link, i);
            grid.appendChild(node);
        });

        wrap.appendChild(grid);
        return wrap;
    }

    function renderNode(link, idx) {
        let proto = link.split('://')[0].toUpperCase();
        let name = 'Node ' + (idx + 1);
        try {
            if (link.includes('#')) {
                name = cleanupName(link.split('#')[1]);
            } else if (proto === 'VMESS') {
                const b = JSON.parse(atob(link.replace('vmess://', '')));
                if (b.ps) name = cleanupName(b.ps);
            }
        } catch (e) { }

        const card = mkEl('div', 'node-card');
        card.style.animationDelay = (0.3 + (idx * 0.04)) + 's';

        // Icons (Premium SVGs)
        const icoCopy = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        const icoQR = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;

        card.innerHTML = `
            <div class="node-info">
                <span class="proto-badge">${proto}</span>
                <span class="node-name">${name}</span>
            </div>
            <div class="node-actions" style="display:flex; gap:8px;">
                 <div class="icon-btn-mini" id="btn-copy-${idx}" title="Copy Config">${icoCopy}</div>
                 <div class="icon-btn-mini" id="btn-qr-${idx}" title="Show QR">${icoQR}</div>
            </div>
        `;

        // Bind Events
        const copyB = card.querySelector(`#btn-copy-${idx}`);
        copyB.onclick = (e) => { e.stopPropagation(); copy(link); };

        const qrB = card.querySelector(`#btn-qr-${idx}`);
        qrB.onclick = (e) => { e.stopPropagation(); showQR(link, name); };

        return card;
    }

    function renderInfrastructureSection() {
        const wrap = mkEl('div', 'span-12');
        const icoCloud = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19L19 19C20.1046 19 21 18.1046 21 17C21 15.8954 20.1046 15 19 15L18.1 15C17.55 12.15 15.05 10 12 10C9.6 10 7.55 11.35 6.55 13.35C4.55 13.7 3 15.45 3 17.5C3 19.433 4.567 21 6.5 21L7.5 21"></path></svg>`;
        wrap.innerHTML = `<div class="nodes-header" style="margin-top:20px;">${icoCloud} Infrastructure Insights</div>`;

        const grid = mkEl('div', 'infra-grid');

        // Hosting Card (Provider)
        const hosting = mkEl('div', 'infra-card');
        const icoServer = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--theme-isp)"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;
        hosting.innerHTML = `
            <div class="infra-icon" id="infra-isp-icon">${icoServer}</div>
            <div class="infra-details">
                <div class="infra-value" id="infra-isp">${STATE.raw.isp}</div>
                <div class="infra-label">Provider</div>
            </div>
        `;

        // Location Card (Region)
        const locCard = mkEl('div', 'infra-card');
        const icoGlobe = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--theme-loc)"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
        locCard.innerHTML = `
            <div class="infra-icon" id="infra-loc-icon">${icoGlobe}</div>
            <div class="infra-details">
                <div class="infra-value" id="infra-loc">${STATE.raw.location}</div>
                <div class="infra-label">Region</div>
            </div>
        `;

        // Ping Card
        const ping = mkEl('div', 'infra-card');
        const icoWifi = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--theme-ping)"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`;
        ping.innerHTML = `
            <div class="infra-icon">${icoWifi}</div>
            <div class="infra-details">
                <div class="infra-value" id="ping-value">Check Latency</div>
                <div class="infra-label">Client to Server</div>
            </div>
            <div class="ping-action-wrap">
                <div class="ping-dot" id="ping-dot"></div>
                <div class="icon-btn-mini" id="btn-ping" title="Check Ping">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
            </div>
        `;

        const pingBtn = ping.querySelector('#btn-ping');
        pingBtn.onclick = () => checkPing();

        grid.appendChild(hosting);
        grid.appendChild(locCard);
        grid.appendChild(ping);
        wrap.appendChild(grid);
        return wrap;
    }

    // --- STATS GRID (System Monitor - 4x1 Horizontal) ---
    function renderStatsGrid() {
        const wrap = mkEl('div', 'span-12');

        // Header
        const header = mkEl('div', 'nodes-header');
        const monitorIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
        header.innerHTML = `${monitorIcon} Server Monitor`;
        wrap.appendChild(header);

        const grid = mkEl('div', 'stats-grid-horizontal');
        grid.id = 'stats-grid';

        // CPU Card (Top Left)
        const cpuCard = mkEl('div', 'stat-card-mini');
        const cpuIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>`;
        cpuCard.innerHTML = `
            <div class="stat-mini-icon" style="color: var(--theme-cpu);">${cpuIcon}</div>
            <div class="stat-mini-content">
                <div class="stat-mini-label">CPU Usage</div>
                <div class="stat-mini-value"><span id="cpu-val">0</span>%</div>
            </div>
        `;

        // RAM Card (Top Right)
        const ramCard = mkEl('div', 'stat-card-mini');
        const ramIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h16M8 2v20M12 2v20M16 2v20"/></svg>`;
        ramCard.innerHTML = `
            <div class="stat-mini-icon" style="color: var(--theme-ram);">${ramIcon}</div>
            <div class="stat-mini-content">
                <div class="stat-mini-label">Memory</div>
                <div class="stat-mini-value"><span id="ram-val">0</span>%</div>
            </div>
        `;

        // Upload Card (Bottom Left)
        const uploadCard = mkEl('div', 'stat-card-mini');
        const uploadIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`;
        uploadCard.innerHTML = `
            <div class="stat-mini-icon" style="color: var(--theme-up);">${uploadIcon}</div>
            <div class="stat-mini-content">
                <div class="stat-mini-label">Upload</div>
                <div class="stat-mini-value" id="upload-val">0 KB/s</div>
            </div>
        `;

        // Download Card (Bottom Right)
        const downloadCard = mkEl('div', 'stat-card-mini');
        const downloadIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="8 12 12 16 16 12"/><line x1="12" y1="16" x2="12" y2="3"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`;
        downloadCard.innerHTML = `
            <div class="stat-mini-icon" style="color: var(--theme-down);">${downloadIcon}</div>
            <div class="stat-mini-content">
                <div class="stat-mini-label">Download</div>
                <div class="stat-mini-value" id="download-val">0 KB/s</div>
            </div>
        `;

        grid.appendChild(cpuCard);
        grid.appendChild(ramCard);
        grid.appendChild(uploadCard);
        grid.appendChild(downloadCard);

        wrap.appendChild(grid);
        return wrap;
    }

    function startStatsPolling() {
        // Helper: Format network speed
        const formatSpeed = (kbps) => {
            if (kbps >= 1024) {
                return (kbps / 1024).toFixed(1) + ' MB/s';
            }
            return kbps + ' KB/s';
        };

        const poll = async () => {
            try {
                const res = await fetch('assets/css/status.json?t=' + Date.now());
                if (res.ok) {
                    const data = await res.json();

                    // CPU & RAM
                    const cpuEl = getEl('cpu-val');
                    const ramEl = getEl('ram-val');

                    if (cpuEl) cpuEl.textContent = data.cpu || 0;
                    if (ramEl) ramEl.textContent = data.ram || 0;

                    // Network Traffic (text only)
                    const uploadEl = getEl('upload-val');
                    const downloadEl = getEl('download-val');

                    if (uploadEl) uploadEl.textContent = formatSpeed(data.net_out || 0);
                    if (downloadEl) downloadEl.textContent = formatSpeed(data.net_in || 0);

                    // Infrastructure Info (Dynamic Update)
                    if (data.isp) {
                        const ispEl = getEl('infra-isp');
                        if (ispEl) ispEl.textContent = data.isp;
                        if (STATE.raw) STATE.raw.isp = data.isp;
                    }
                    if (data.region) {
                        const locEl = getEl('infra-loc');
                        if (locEl) locEl.textContent = data.region;
                        if (STATE.raw) STATE.raw.location = data.region;
                    }

                    // Adaptive Sync: Update state based on potential new usage/ISP data
                    applyTheme();
                }
            } catch (e) {
                // Silent fail - stats are supplementary
            }
            setTimeout(poll, 2000);
        };
        poll();
    }

    function checkPing() {
        const valEl = getEl('ping-value');
        const dot = getEl('ping-dot');
        const btn = getEl('btn-ping');

        if (!valEl || !btn) return;
        if (btn.classList.contains('loading')) return;

        btn.classList.add('loading');

        // Reset state
        dot.className = 'ping-dot pinging';
        valEl.className = 'infra-value';
        valEl.textContent = 'Testing...';
        btn.style.animation = 'shimmer 1s infinite linear';

        const startTime = Date.now();
        fetch(window.location.href, { method: 'HEAD', cache: 'no-cache' })
            .then(() => {
                const latency = Date.now() - startTime;
                valEl.textContent = latency + 'ms';
                btn.classList.remove('loading');
                btn.style.animation = '';
                dot.classList.remove('pinging');

                // Clear old status
                dot.classList.remove('success', 'warn', 'error');
                valEl.classList.remove('text-green', 'text-yellow', 'text-red');

                if (latency < 150) {
                    dot.classList.add('success');
                    valEl.classList.add('text-green');
                } else if (latency < 400) {
                    dot.classList.add('warn');
                    valEl.classList.add('text-yellow');
                } else {
                    dot.classList.add('error');
                    valEl.classList.add('text-red');
                }
                showToast('Latency: ' + latency + 'ms');
            })
            .catch(() => {
                valEl.textContent = 'Error';
                btn.classList.remove('loading');
                btn.style.animation = '';
                dot.classList.remove('pinging');
                dot.classList.add('error');
                valEl.classList.add('text-red');
            });
    }

    function renderQRModal() {
        const overlay = mkEl('div', 'modal-overlay');
        overlay.id = 'qr-modal';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('open'); };

        // Inline guard to prevent initial flash before CSS loads
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        overlay.style.pointerEvents = 'none';

        const content = mkEl('div', 'qr-modal');
        content.innerHTML = `
            <div class="qr-header">
                <div class="qr-spacer"></div>
                <h3 id="qr-title">${t('qr')}</h3>
                <div class="qr-close" onclick="document.getElementById('qr-modal').classList.remove('open')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
            </div>
            <div class="qr-container">
                <canvas id="qr-canv"></canvas>
                <div class="qr-scan-line"></div>
            </div>
            <div class="qr-footer">Scan this QR code to import configuration</div>
        `;

        overlay.appendChild(content);

        setTimeout(() => {
            const loadQR = () => new QRious({ element: getEl('qr-canv'), value: STATE.subUrl, size: 250 });
            if (window.QRious) loadQR();
            else {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
                s.onload = loadQR;
                document.body.appendChild(s);
            }
        }, 100);

        return overlay;
    }

    function showQR(val, title) {
        const modal = getEl('qr-modal');
        const canv = getEl('qr-canv');
        const titleEl = getEl('qr-title');

        if (titleEl) titleEl.textContent = title || t('qr');

        // Update QR
        if (window.QRious) {
            requestAnimationFrame(() => {
                new QRious({ element: canv, value: val, size: 250 });
                modal.style.opacity = '';
                modal.style.visibility = '';
                modal.style.pointerEvents = '';
                modal.classList.add('open');
            });
        } else {
            alert('QR Library loading...');
        }
    }

    function renderLoader() {
        const loader = mkEl('div', 'preloader');
        loader.id = 'app-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <div class="loader-text">USER DASHBOARD</div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    function hideLoader() {
        const loader = getEl('app-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
                document.body.style.overflow = '';
                document.body.style.overflowY = 'auto';
                document.body.style.height = 'auto';
            }, 800);
        }
    }

    function renderToast() {
        const toastEl = mkEl('div', 'premium-toast');
        toastEl.id = 'toast';
        toastEl.style.top = 'max(24px, env(safe-area-inset-top) + 24px)';
        toastEl.innerText = t('copied');
        return toastEl;
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function copy(txt) {
        if (!txt) return;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(txt).then(() => showToast(t('copied'))).catch(err => {
                console.error('Clipboard API failed', err);
                fallbackCopy(txt, () => showToast(t('copied')));
            });
        } else {
            fallbackCopy(txt, () => showToast(t('copied')));
        }
    }

    function fallbackCopy(txt, cb) {
        const textArea = document.createElement("textarea");
        textArea.value = txt;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            if (cb) cb();
        } catch (e) { console.error('Fallback copy failed', e); }
        document.body.removeChild(textArea);
    }

    // --- PREMIUM BACKGROUND ANIMATION (Digital Rain 2.0) ---
    // --- PREMIUM BACKGROUND ANIMATION (Neural Network v1.6.1) ---
    class NeuralNetwork {
        constructor() {
            if (document.getElementById('canvas-bg')) return;
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'canvas-bg';
            document.body.prepend(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.mouse = { x: null, y: null, radius: 180 };
            this.isScrolling = false;
            this.scrollTimeout = null;
            this.resizeTimeout = null;

            this.resize();
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => this.resize(), 200);
            });
            window.addEventListener('mousemove', (e) => {
                if (this.isScrolling) return;
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            });
            window.addEventListener('mouseout', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });

            // Scroll detection
            window.addEventListener('scroll', () => {
                this.isScrolling = true;
                this.mouse.x = null; // Clear interaction during scroll
                this.mouse.y = null;
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = setTimeout(() => {
                    this.isScrolling = false;
                    // Restart animation loop when scroll stops
                    requestAnimationFrame(this.animate);
                }, 200); // Resume interaction 200ms after scroll stops
            }, { passive: true });

            this.initParticles();
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);
        }

        resize() {
            // High DPI (Retina) Fix
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = window.innerWidth * dpr;
            this.canvas.height = window.innerHeight * dpr;
            this.canvas.style.width = window.innerWidth + 'px';
            this.canvas.style.height = window.innerHeight + 'px';
            this.ctx.scale(dpr, dpr);

            if (this.particles.length === 0) {
                this.initParticles();
            }
        }

        initParticles() {
            this.particles = [];
            // Optimized density for bold, clean look
            let n = (window.innerWidth * window.innerHeight) / 10000;
            for (let i = 0; i < n; i++) {
                let size = (Math.random() * 2.5) + 1.5; // Range: 1.5 to 4
                let x = Math.random() * (innerWidth - size * 2) + size * 2;
                let y = Math.random() * (innerHeight - size * 2) + size * 2;
                let dirX = (Math.random() * 0.4) - 0.2; // Calm drift
                let dirY = (Math.random() * 0.4) - 0.2;
                let pulseSpeed = 0.02 + Math.random() * 0.02; // Breathing speed
                this.particles.push({ x, y, dirX, dirY, size, baseSize: size, angle: Math.random() * 6.28, pulseSpeed });
            }
        }

        animate() {
            if (this.isScrolling) return;
            requestAnimationFrame(this.animate);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const connectDist = this.isMobile ? 120 : 150;
            const style = getComputedStyle(document.body);
            const pColor = style.getPropertyValue('--node-color').trim() || '99, 102, 241';
            const lColor = style.getPropertyValue('--line-color').trim() || '148, 163, 184';

            for (let i = 0; i < this.particles.length; i++) {
                let p = this.particles[i];

                // Movement
                p.x += p.dirX;
                p.y += p.dirY;

                // Wall Bounce & Clamping (Stability Fix)
                if (p.x > innerWidth) { p.x = innerWidth; p.dirX *= -1; }
                else if (p.x < 0) { p.x = 0; p.dirX *= -1; }

                if (p.y > innerHeight) { p.y = innerHeight; p.dirY *= -1; }
                else if (p.y < 0) { p.y = 0; p.dirY *= -1; }

                // Pulse (Breathing Effect)
                if (p.angle !== undefined) {
                    p.angle += (p.pulseSpeed || 0.02);
                    p.size = (p.baseSize || p.size) + Math.sin(p.angle) * 0.6;
                }

                // Repulsion Field: Push particles away from cursor
                if (this.mouse.x != null) {
                    let dx = p.x - this.mouse.x;
                    let dy = p.y - this.mouse.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    let repulsionRadius = 200;
                    if (dist < repulsionRadius && dist > 0) {
                        let force = (repulsionRadius - dist) / repulsionRadius; // 1 = on cursor, 0 = at edge
                        let pushX = (dx / dist) * force * 4; // Push strength
                        let pushY = (dy / dist) * force * 4;
                        p.x += pushX;
                        p.y += pushY;
                    }
                }

                // Draw Particle
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, Math.max(0, p.size), 0, Math.PI * 2, false);
                this.ctx.fillStyle = `rgba(${pColor}, 0.85)`;
                this.ctx.fill();

                // Draw Connections (Smooth Distance-Based Fade)
                for (let j = i + 1; j < this.particles.length; j++) {
                    let p2 = this.particles[j];
                    let dx = p.x - p2.x;
                    let dy = p.y - p2.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectDist) {
                        let opacity = 1 - (dist / connectDist);
                        this.ctx.beginPath();
                        this.ctx.strokeStyle = `rgba(${lColor}, ${opacity * 0.4})`;
                        this.ctx.lineWidth = 1.2;
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    function applyTheme() {
        const s = getStatusInfo();
        document.body.classList.remove('s-dark', 's-light', 'status-active', 'status-warn', 'status-depleted', 'status-unlimited');
        document.body.classList.add(STATE.theme === 'dark' ? 's-dark' : 's-light');
        document.body.classList.add(`status-${s.state}`);
    }

    function toggleTheme(e) {
        const nextTheme = STATE.theme === 'dark' ? 'light' : 'dark';

        // Logic to fetch target background color dynamically
        const status = getStatusInfo().state;
        const mockClass = `premium-theme ${nextTheme === 'dark' ? 's-dark' : 's-light'} status-${status}`;

        const dummy = document.createElement('div');
        dummy.className = mockClass;
        dummy.style.display = 'none';
        document.body.appendChild(dummy);
        const burstColor = getComputedStyle(dummy).getPropertyValue('--bg-main').trim() || (nextTheme === 'dark' ? '#020617' : '#f8fafc');
        document.body.removeChild(dummy);

        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const burst = mkEl('div', 'theme-burst');

        burst.style.background = burstColor;
        burst.style.left = (rect.left + rect.width / 2) + 'px';
        burst.style.top = (rect.top + rect.height / 2) + 'px';
        document.body.appendChild(burst);

        setTimeout(() => {
            STATE.theme = nextTheme;
            localStorage.setItem('xui_theme', STATE.theme);
            applyTheme();
            const btnIcon = getEl('theme-btn');
            const newSVG = STATE.theme === 'dark' ?
                `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>` :
                `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            if (btnIcon) btnIcon.innerHTML = newSVG;
        }, 500);

        setTimeout(() => burst.remove(), 1600);
    }

    function showToast(msg) {
        const toastEl = getEl('toast');
        if (toastEl) {
            toastEl.innerText = msg;
            toastEl.classList.add('show');
            if (toastEl._timeout) clearTimeout(toastEl._timeout);
            toastEl._timeout = setTimeout(() => toastEl.classList.remove('show'), 2000);
        }
    }

    function updateStatus() { }

    // --- BOOT ---
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
