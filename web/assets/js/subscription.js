
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
            // 2. Remove usage stats like "-2.87GB" at the end
            name = name.replace(/-\s*\d+(\.\d+)?[GMKT]B.*$/i, '');
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
        const active = !expired && !depleted;

        let label = active ? 'User Active' : 'User Inactive';
        let colorVar = 'var(--usage-active)';
        if (expired) colorVar = 'var(--usage-expired)';
        else if (depleted) colorVar = 'var(--usage-depleted)';

        const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100);

        return { active, expired, depleted, label, color: colorVar, pct, used, total };
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
                isp: dataEl.getAttribute('data-isp') || 'Detecting...',
                location: dataEl.getAttribute('data-location') || 'Unknown Region'
            };
            STATE.subUrl = STATE.raw.subUrl;

            // FALLBACK: If server-side injection failed (still "Detecting..."), try client-side
            if (STATE.raw.isp === 'Detecting...') {
                detectClientSideInfrastructure();
            }
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

        // 5. Status Loop (Keep alive)
        if (!window.statusLoop) {
            window.statusLoop = setInterval(updateStatus, 60000); // Check status every min
        }
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
        // Nodes List (Span 12)
        grid.appendChild(renderNodesList());

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
                dispName = cleanupName(links[0].split('#')[1]);
            }
        }

        const s = getStatusInfo();

        // New Layout: User Dashboard (Top) -> Info Row (Bottom)
        const profile = mkEl('div', 'user-profile');
        profile.innerHTML = `
            <div class="avatar">${dispName.substring(0, 2).toUpperCase()}</div>
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
              <div class="progress-bar" id="prog-bar" style="transform:scaleX(0); background-color:${s.color}; box-shadow: 0 0 15px ${s.color}66"></div>
          </div>
            <div class="usage-sub">
                ${t('limit')}: ${s.total === 0 ? t('unlimited') : formatBytes(s.total)}
            </div>
        `;
        return card;
    }

    function renderInfoCard() {
        const card = mkEl('div', 'glass-panel span-4 stat-mini-grid');
        // Info Card -> Simplified (Removed Global QR/Copy Buttons)
        // "Optimized if multiple configurations..." -> We focus on the Global Subscription Link here.

        // Remaining usage...
        let remText = '∞';
        if (STATE.raw.total > 0) {
            const left = STATE.raw.total - (STATE.raw.up + STATE.raw.down);
            remText = formatBytes(left < 0 ? 0 : left);
        }

        const rem = mkEl('div', 'stat-mini');
        // SVG Icon for Remaining Data (Pie Chart / Data)
        const icoRem = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`;

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
        // SVG Icon for Expiration (Calendar/Clock)
        const icoExp = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--status-warn)"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

        exp.innerHTML = `
            <div class="stat-icon">${icoExp}</div>
            <div class="stat-value">${expText}</div>
            <div class="stat-label">${t('exp')}</div>
        `;

        // Upload
        const up = mkEl('div', 'stat-mini');
        const icoUp = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#3b82f6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`;
        up.innerHTML = `
            <div class="stat-icon">${icoUp}</div>
            <div class="stat-value">${formatBytes(STATE.raw.up)}</div>
            <div class="stat-label">${t('upload')}</div>
        `;

        // Download
        const down = mkEl('div', 'stat-mini');
        const icoDown = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#8b5cf6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
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

        const icoOnline = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#10b981"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
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

        // Bind Events (Separate from click to avoid conflicts if we add card expansion later)
        const copyB = card.querySelector(`#btn-copy-${idx}`);
        copyB.onclick = (e) => { e.stopPropagation(); copy(link); };

        const qrB = card.querySelector(`#btn-qr-${idx}`);
        qrB.onclick = (e) => { e.stopPropagation(); showQR(link, name); };

        // Card main click also copies for convenience? Or removing to prevent accidental copies vs actions.
        // User asked to move buttons to grid. having discrete buttons is better.
        // Removed card.onclick = () => copy(link);
        return card;
    }



    function renderInfrastructureSection() {
        const wrap = mkEl('div', 'span-12');
        const icoCloud = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19L19 19C20.1046 19 21 18.1046 21 17C21 15.8954 20.1046 15 19 15L18.1 15C17.55 12.15 15.05 10 12 10C9.6 10 7.55 11.35 6.55 13.35C4.55 13.7 3 15.45 3 17.5C3 19.433 4.567 21 6.5 21L7.5 21"></path></svg>`;
        wrap.innerHTML = `<div class="nodes-header" style="margin-top:20px;">${icoCloud} Infrastructure Insights</div>`;

        const grid = mkEl('div', 'infra-grid');

        // Hosting Card (Provider)
        const hosting = mkEl('div', 'infra-card');
        const icoServer = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;
        hosting.innerHTML = `
            <div class="infra-icon">${icoServer}</div>
            <div class="infra-details">
                <div class="infra-value" id="infra-isp">${STATE.raw.isp}</div>
                <div class="infra-label">Provider</div>
            </div>
        `;

        // Location Card (Region)
        const locCard = mkEl('div', 'infra-card');
        const icoGlobe = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#3b82f6"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
        locCard.innerHTML = `
            <div class="infra-icon">${icoGlobe}</div>
            <div class="infra-details">
                <div class="infra-value" id="infra-loc">${STATE.raw.location}</div>
                <div class="infra-label">Region</div>
            </div>
        `;

        // Ping Card
        const ping = mkEl('div', 'infra-card');
        const icoWifi = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#10b981"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`;
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
        btn.style.animation = 'shimmer 1s infinite linear'; // Keep button shimmer for now

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

    function detectClientSideInfrastructure() {
        console.log('☁️ Server-side injection failed. Attempting client-side detection...');
        // Query the SERVER'S hostname/IP, not the client's
        const target = window.location.hostname;
        fetch(`https://ipapi.co/${target}/json/`)
            .then(res => res.json())
            .then(data => {
                const isp = data.org || data.asn || 'Cloud Provider';
                const loc = (data.city ? data.city + ', ' : '') + (data.country_name || 'Unknown');

                // Update State
                STATE.raw.isp = isp;
                STATE.raw.location = loc;

                // Update DOM if it exists
                const ispEl = document.getElementById('infra-isp');
                const locEl = document.getElementById('infra-loc');

                if (ispEl) ispEl.textContent = isp;
                if (locEl) locEl.textContent = loc;
            })
            .catch(e => console.error('Client-side infra detection failed', e));
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

        // RELIABLE CDN
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

    // New Helper for Dynamic QR
    function showQR(val, title) {
        const modal = getEl('qr-modal');
        const canv = getEl('qr-canv');
        const titleEl = getEl('qr-title');

        if (titleEl) titleEl.textContent = title || t('qr');

        // Update QR
        if (window.QRious) {
            requestAnimationFrame(() => {
                new QRious({ element: canv, value: val, size: 250 });
                // Remove inline guards before opening
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
                // Unlock scrolling after loader vanishes
                document.body.style.overflow = '';
                document.body.style.overflowY = 'auto'; // Force scroll
                document.body.style.height = 'auto'; // Allow expansion
            }, 800);
        }
    }

    function renderToast() {
        const toastEl = mkEl('div', 'premium-toast');
        toastEl.id = 'toast';
        // Mobile Safe Area support for Notches
        toastEl.style.top = 'max(24px, env(safe-area-inset-top) + 24px)';
        toastEl.innerText = t('copied');
        return toastEl;
    }

    // --- LOGIC ---
    function calcPct() {
        if (STATE.raw.total === 0) return 0;
        const used = STATE.raw.up + STATE.raw.down;
        return Math.min(100, (used / STATE.raw.total) * 100);
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

    // STATS REFRESH (No Page Reload)
    function refreshStats() {
        const dataEl = getEl('subscription-data');
        if (!dataEl) return;

        STATE.raw.total = parseInt(dataEl.getAttribute('data-totalbyte') || 0);
        STATE.raw.up = parseInt(dataEl.getAttribute('data-uploadbyte') || 0);
        STATE.raw.down = parseInt(dataEl.getAttribute('data-downloadbyte') || 0);
        STATE.raw.expire = parseInt(dataEl.getAttribute('data-expire') || 0) * 1000;

        const s = getStatusInfo();

        // Update Indicators
        const statusTextInline = document.querySelector('.status-text-inline');
        if (statusTextInline) {
            statusTextInline.textContent = s.label;
            statusTextInline.style.color = s.color;
        }

        const statusDot = document.querySelector('.status-dot-inline');
        if (statusDot) {
            statusDot.style.background = s.color;
            statusDot.style.boxShadow = `0 0 10px ${s.color}`;
        }

        // Update Usage Card
        const usageCard = document.querySelector('.usage-overview');
        if (usageCard) {
            usageCard.querySelector('.usage-big-number').textContent = formatBytes(s.used);
            const headers = usageCard.querySelectorAll('.usage-header .usage-title');
            if (headers.length > 1) headers[1].textContent = s.pct.toFixed(1) + '%';
            usageCard.querySelector('.usage-sub').innerHTML = `${t('limit')}: ${s.total === 0 ? t('unlimited') : formatBytes(s.total)}`;

            const bar = getEl('prog-bar');
            if (bar) {
                bar.style.background = s.color;
                bar.style.boxShadow = `0 0 20px ${s.color}`;
                bar.style.transform = `scaleX(${s.pct / 100})`;
            }
        }

        // Update Info Card Stats
        const statValues = document.querySelectorAll('.stat-mini .stat-value');
        if (statValues.length >= 5) {
            statValues[0].textContent = formatBytes(STATE.raw.up);
            statValues[1].textContent = formatBytes(STATE.raw.down);

            let remText = '∞';
            if (STATE.raw.total > 0) {
                const left = STATE.raw.total - (STATE.raw.up + STATE.raw.down);
                remText = formatBytes(left < 0 ? 0 : left);
            }
            statValues[2].textContent = remText;

            let expText = '∞';
            if (STATE.raw.expire > 0) {
                const diff = STATE.raw.expire - Date.now();
                expText = diff < 0 ? 'Expired' : Math.ceil(diff / (1000 * 60 * 60 * 24)) + 'd';
            }
            statValues[3].textContent = expText;
        }

        showToast('Stats Refreshed!');
    }

    function toggleTheme(e) {
        // 1. Calculate next theme colors for burst
        const nextTheme = STATE.theme === 'dark' ? 'light' : 'dark';
        const burstColor = nextTheme === 'dark' ? '#020617' : '#f8fafc'; // Match bg-main of target theme

        // 2. Spawn Aura Burst
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const burst = mkEl('div', 'theme-burst');

        // Position at button center
        burst.style.background = burstColor;
        burst.style.left = (rect.left + rect.width / 2) + 'px';
        burst.style.top = (rect.top + rect.height / 2) + 'px';

        document.body.appendChild(burst);

        // 3. Switch state MID-ANIMATION (at 40% of 1.5s = 600ms. Let's do 500ms to be safe inside coverage)
        setTimeout(() => {
            STATE.theme = nextTheme;
            localStorage.setItem('xui_theme', STATE.theme);
            applyTheme();

            // Update button icon
            const btnIcon = getEl('theme-btn');
            // Simple Icon Logic
            const newSVG = STATE.theme === 'dark' ?
                `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>` :
                `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            if (btnIcon) btnIcon.innerHTML = newSVG;

        }, 500);

        // 4. Cleanup after animation (1.5s)
        setTimeout(() => {
            burst.remove();
        }, 1600);
    }

    function showToast(msg) {
        const toastEl = getEl('toast');
        if (toastEl) {
            toastEl.innerText = msg;
            toastEl.classList.add('show');
            if (toastEl._timeout) clearTimeout(toastEl._timeout);
            toastEl._timeout = setTimeout(() => {
                toastEl.classList.remove('show');
            }, 2000);
        }
    }

    function applyTheme() {
        document.body.classList.remove('s-dark', 's-light');
        document.body.classList.add(STATE.theme === 'dark' ? 's-dark' : 's-light');
    }

    function updateStatus() {
        // Mock status logic - keep simple
    }

    // --- BOOT ---
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
