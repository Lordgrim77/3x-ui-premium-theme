
(function () {
  'use strict';

  // --- 1. CONFIG & STATE ---
  const STATE = {
    theme: localStorage.getItem('xui_theme') || 'dark',
    lang: localStorage.getItem('xui_lang') || 'en',
    subUrl: '',
    raw: null
  };

  const I18N = {
    en: { title: 'User Dashboard', limit: 'Data Limit', used: 'Used', rem: 'Remaining', exp: 'Expires', nodes: 'Configuration Links', copy: 'Copy Link', qr: 'QR Code', online: 'Online', offline: 'Offline', unlimited: 'Unlimited', refresh: 'Refresh Status', upload: 'Upload', download: 'Download' },
    cn: { title: '用户中心', limit: '流量限制', used: '已用', rem: '剩余', exp: '到期时间', nodes: '配置链接', copy: '复制链接', qr: '二维码', online: '在线', offline: '离线', unlimited: '不限流量', refresh: '刷新状态', upload: '上传', download: '下载' },
    fa: { title: 'پیشخوان کاربر', limit: 'محدودیت داده', used: 'استفاده شده', rem: 'باقی‌مانده', exp: 'انقضا', nodes: 'لینک‌های اتصال', copy: 'کپی لینک', qr: 'کد QR', online: 'آنلاین', offline: 'آفلاین', unlimited: 'نامحدود', refresh: 'بروزرسانی وضعیت', upload: 'آپلود', download: 'دانلود' },
  };

  // --- 2. UI ASSET REGISTRY ---
  const UI_ICONS = {
    sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    copy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    qr: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    up: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    down: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    rem: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`,
    exp: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    online: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    nodes: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`
  };

  // --- 3. CORE UTILITIES ---
  const getEl = (id) => document.getElementById(id);
  const mkEl = (tag, cls, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html) el.innerHTML = html;
    return el;
  };
  const t = (key) => I18N[STATE.lang][key] || key;

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function cleanupName(raw) {
    if (!raw) return 'User';
    try {
      let name = decodeURIComponent(raw);
      name = name.replace(/^[⛔️N\/A\s-]+/i, '')
        .replace(/-\s*\d+(\.\d+)?[GMKT]B.*$/i, '')
        .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F680}-\u{1F6FF}\u{24C2}-\u{1F251}].*$/u, '');
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

    let label = active ? 'Status Active' : 'Status Inactive';
    let color = '#10b981';
    if (expired) color = '#64748b';
    else if (depleted) color = '#ef4444';

    const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100);
    return { active, expired, depleted, label, color, pct, used, total };
  }

  // --- 4. COMPONENT RENDERERS ---
  function renderHeader() {
    const h = mkEl('header', 'dashboard-header');
    let dispName = STATE.raw.sid;
    const linksEl = getEl('subscription-links');
    const links = linksEl ? linksEl.value.split('\n').filter(Boolean) : [];

    if (!STATE.raw.sid.includes('@') && links.length > 0) {
      if (links[0].includes('#')) dispName = cleanupName(links[0].split('#')[1]);
    }

    const s = getStatusInfo();
    const profile = mkEl('div', 'user-profile');
    profile.innerHTML = `
      <div class="avatar">${dispName.substring(0, 2).toUpperCase()}</div>
      <div class="user-text-group">
        <div class="dashboard-title">${t('title').toUpperCase()}</div>
        <div class="user-main-row">
          <div class="username-display">${dispName}</div>
          <div class="status-indicator-wrap">
            <span class="status-text-inline" style="color: ${s.color}">${s.label}</span>
            <div class="status-dot-inline" style="background:${s.color}; box-shadow: 0 0 10px ${s.color}; border-color: ${s.color}44;"></div>
          </div>
        </div>
      </div>
    `;

    const ctrls = mkEl('div', 'controls');
    const themeBtn = mkEl('div', 'icon-btn');
    themeBtn.id = 'theme-btn';
    themeBtn.innerHTML = STATE.theme === 'dark' ? UI_ICONS.sun : UI_ICONS.moon;
    themeBtn.onclick = (e) => toggleTheme(e);

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
        <div class="progress-bar" id="prog-bar" style="transform:scaleX(0); background:${s.color}; box-shadow: 0 0 20px ${s.color}"></div>
      </div>
      <div class="usage-sub">${t('limit')}: ${s.total === 0 ? t('unlimited') : formatBytes(s.total)}</div>
    `;
    return card;
  }

  function createStatMini(icon, value, label, color) {
    const el = mkEl('div', 'stat-mini');
    el.innerHTML = `
      <div class="stat-icon" style="color:${color}">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    `;
    return el;
  }

  function renderInfoCard() {
    const card = mkEl('div', 'glass-panel span-4 stat-mini-grid');
    const remVal = STATE.raw.total > 0 ? formatBytes(Math.max(0, STATE.raw.total - (STATE.raw.up + STATE.raw.down))) : '∞';
    let expVal = '∞';
    if (STATE.raw.expire > 0) {
      const diff = STATE.raw.expire - Date.now();
      expVal = diff < 0 ? 'Expired' : Math.ceil(diff / (1000 * 60 * 60 * 24)) + 'd';
    }

    let lastOnlineText = 'Never';
    if (STATE.raw.lastOnline > 0) {
      const diff = Date.now() - STATE.raw.lastOnline;
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (mins < 1) lastOnlineText = 'Just now';
      else if (mins < 60) lastOnlineText = mins + 'm ago';
      else if (hours < 24) lastOnlineText = hours + 'h ago';
      else lastOnlineText = days + 'd ago';
    }

    card.appendChild(createStatMini(UI_ICONS.up, formatBytes(STATE.raw.up), t('upload'), '#3b82f6'));
    card.appendChild(createStatMini(UI_ICONS.down, formatBytes(STATE.raw.down), t('download'), '#8b5cf6'));
    card.appendChild(createStatMini(UI_ICONS.rem, remVal, t('rem'), 'var(--accent)'));
    card.appendChild(createStatMini(UI_ICONS.exp, expVal, t('exp'), 'var(--status-warn)'));
    card.appendChild(createStatMini(UI_ICONS.online, lastOnlineText, 'Last Online', '#10b981'));
    return card;
  }

  function renderNodesList() {
    const wrap = mkEl('div', 'span-12');
    wrap.innerHTML = `<div class="nodes-header">${UI_ICONS.nodes} Configuration Links</div>`;
    const grid = mkEl('div', 'node-grid');
    const links = getEl('subscription-links')?.value.split('\n').filter(Boolean) || [];
    links.forEach((link, i) => grid.appendChild(renderNode(link, i)));
    wrap.appendChild(grid);
    return wrap;
  }

  function renderNode(link, idx) {
    let proto = link.split('://')[0].toUpperCase();
    let name = 'Node ' + (idx + 1);
    try {
      if (link.includes('#')) name = cleanupName(link.split('#')[1]);
      else if (proto === 'VMESS') {
        const b = JSON.parse(atob(link.replace('vmess://', '')));
        if (b.ps) name = cleanupName(b.ps);
      }
    } catch (e) { }

    const card = mkEl('div', 'node-card');
    card.style.animationDelay = (idx * 0.05) + 's';
    card.innerHTML = `
      <div class="node-info"><span class="proto-badge">${proto}</span><span class="node-name">${name}</span></div>
      <div class="node-actions" style="display:flex; gap:8px;">
        <div class="icon-btn-mini" id="btn-copy-${idx}" title="Copy Config">${UI_ICONS.copy}</div>
        <div class="icon-btn-mini" id="btn-qr-${idx}" title="Show QR">${UI_ICONS.qr}</div>
      </div>
    `;
    card.querySelector(`#btn-copy-${idx}`).onclick = (e) => { e.stopPropagation(); copy(link); };
    card.querySelector(`#btn-qr-${idx}`).onclick = (e) => { e.stopPropagation(); showQR(link, name); };
    return card;
  }

  function renderQRModal() {
    const overlay = mkEl('div', 'modal-overlay');
    overlay.id = 'qr-modal';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('open'); };
    overlay.innerHTML = `
      <div class="qr-modal">
        <div class="qr-header"><h3 id="qr-title">${t('qr')}</h3><div class="qr-close" id="qr-close-btn">${UI_ICONS.close}</div></div>
        <div class="qr-container"><canvas id="qr-canv"></canvas><div class="qr-scan-line"></div></div>
        <div class="qr-footer">Scan this QR code to import configuration</div>
      </div>
    `;
    overlay.querySelector('#qr-close-btn').onclick = () => overlay.classList.remove('open');
    return overlay;
  }

  // --- 5. CORE LOGIC ---
  function copy(txt) {
    if (!txt) return;
    const feedback = () => showToast('Copied to Clipboard!');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(feedback).catch(() => fallbackCopy(txt, feedback));
    } else {
      fallbackCopy(txt, feedback);
    }
  }

  function fallbackCopy(txt, cb) {
    const textArea = document.createElement("textarea");
    textArea.value = txt;
    textArea.style.position = "fixed"; textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try { document.execCommand('copy'); if (cb) cb(); } catch (e) { }
    document.body.removeChild(textArea);
  }

  function showToast(msg) {
    const t = getEl('toast');
    if (!t) return;
    t.innerText = msg;
    t.style.visibility = 'visible'; t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => t.style.visibility = 'hidden', 300);
    }, 2000);
  }

  function showQR(val, title) {
    const modal = getEl('qr-modal');
    if (!modal) return;
    getEl('qr-title').textContent = title || t('qr');
    const gen = () => { new QRious({ element: getEl('qr-canv'), value: val, size: 250 }); modal.classList.add('open'); };
    if (window.QRious) gen();
    else {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
      s.onload = gen; document.body.appendChild(s);
    }
  }

  function toggleTheme(e) {
    const next = STATE.theme === 'dark' ? 'light' : 'dark';
    const burst = mkEl('div', 'theme-burst');
    const rect = e.currentTarget.getBoundingClientRect();
    burst.style.background = next === 'dark' ? '#020617' : '#f8fafc';
    burst.style.left = (rect.left + rect.width / 2) + 'px';
    burst.style.top = (rect.top + rect.height / 2) + 'px';
    document.body.appendChild(burst);

    setTimeout(() => {
      STATE.theme = next;
      localStorage.setItem('xui_theme', next);
      document.body.className = next === 'dark' ? 's-dark' : 's-light';
      getEl('theme-btn').innerHTML = next === 'dark' ? UI_ICONS.sun : UI_ICONS.moon;
    }, 500);
    setTimeout(() => burst.remove(), 1600);
  }

  function init() {
    if (!STATE.raw) {
      const data = getEl('subscription-data');
      if (!data) return;
      STATE.raw = {
        sid: data.getAttribute('data-email') || data.getAttribute('data-sid') || 'User',
        total: parseInt(data.getAttribute('data-totalbyte') || 0),
        up: parseInt(data.getAttribute('data-uploadbyte') || 0),
        down: parseInt(data.getAttribute('data-downloadbyte') || 0),
        expire: parseInt(data.getAttribute('data-expire') || 0) * 1000,
        subUrl: data.getAttribute('data-sub-url') || '',
        lastOnline: parseInt(data.getAttribute('data-lastonline') || 0)
      };
      STATE.subUrl = STATE.raw.subUrl;
    }

    const app = mkEl('div', 'app-container');
    app.id = 'app-root';
    app.appendChild(renderHeader());
    const grid = mkEl('div', 'dashboard-grid');
    grid.appendChild(renderUsageCard());
    grid.appendChild(renderInfoCard());
    grid.appendChild(renderNodesList());
    app.appendChild(grid);

    const footer = mkEl('div', 'custom-footer');
    footer.innerHTML = `Made with <span class="heart-pulse">❤️</span> by&nbsp;<a class="footer-link" href="https://t.me/xXxIo_oIxXx" target="_blank">𝙇𝙊𝙍𝘿 𝙂𝙍𝙄𝙈</a>`;
    app.appendChild(footer);
    app.appendChild(mkEl('div', 'bg-fx', `
      <div class="cyber-grid"></div>
      <div class="data-packet pkt-1"></div>
      <div class="data-packet pkt-2"></div>
      <div class="data-packet pkt-3"></div>
      <div class="tech-glow glow-top"></div>
      <div class="tech-glow glow-bottom"></div>
    `));
    app.appendChild(renderQRModal());

    const toast = mkEl('div', 'glass-panel');
    toast.id = 'toast';
    Object.assign(toast.style, { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%) translateY(100px)', opacity: '0', visibility: 'hidden', transition: 'all 0.3s', padding: '12px 24px', zIndex: 10001 });
    app.appendChild(toast);

    const old = getEl('app-root'); if (old) old.remove();
    document.body.appendChild(app);
    document.body.className = STATE.theme === 'dark' ? 's-dark' : 's-light';

    const splash = getEl('premium-preloader');
    if (splash) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.body.style.overflow = 'auto';
          splash.style.opacity = '0'; splash.style.visibility = 'hidden';
          const bar = getEl('prog-bar');
          if (bar) bar.style.transform = `scaleX(${getStatusInfo().pct / 100})`;
          setTimeout(() => splash.remove(), 600);
        }, 500);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
