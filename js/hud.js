/*
 * CYBER-SKUF — gameplay-first HUD v1.6
 * Readability, compact navigation, rewarded-ad UX guards and input cooldown tuning.
 */
(() => {
'use strict';

const VERSION = '1.6.0';
const app = () => document.getElementById('app-viewport');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isLocalDev = () => location.protocol === 'file:' || ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(location.hostname);

function injectStyles() {
  document.getElementById('skuf-ui-focus-styles')?.remove();
  const style = document.createElement('style');
  style.id = 'skuf-ui-focus-styles';
  style.textContent = `
    #app-viewport.ui-focus { font-size: 12px; }
    #app-viewport.ui-focus .hud-nav-bar { display:none!important; }
    #app-viewport.ui-focus #status-bar { gap:5px; padding-top:7px; padding-bottom:7px; }
    #app-viewport.ui-focus .hud-top-row { min-height:38px; gap:8px; }
    #app-viewport.ui-focus #motivation-counter { font-size:16px; line-height:1.05; white-space:nowrap; }
    #app-viewport.ui-focus .stamina-box { gap:3px; }
    #app-viewport.ui-focus .stamina-label-row { min-height:12px; line-height:1; }
    #app-viewport.ui-focus .stamina-label-row .label { font-size:9px; opacity:.86; letter-spacing:.2px; }
    #app-viewport.ui-focus #stamina-track { height:6px; }

    #app-viewport.ui-focus .hud-quick-actions { gap:5px; flex-shrink:0; align-items:center; }
    #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn,
    #btn-open-hub-menu { min-width:34px; height:34px; padding:0 7px; border-radius:10px; }
    #app-viewport.ui-focus .hud-quick-actions .hud-btn-caption { display:none!important; }
    #app-viewport.ui-focus #btn-open-leaderboard { width:auto!important; min-width:55px!important; gap:4px; }
    #app-viewport.ui-focus #btn-open-leaderboard .hud-btn-caption {
      display:inline!important; font-size:10px; font-weight:900; line-height:1; color:#e5e7eb;
    }
    #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn,
    #app-viewport.ui-focus .boost-btn-glow,
    #app-viewport.ui-focus .roulette-btn-glow {
      background:rgba(255,255,255,.055)!important;
      border-color:rgba(255,255,255,.11)!important;
      box-shadow:none!important;
    }
    #app-viewport.ui-focus .roulette-btn-glow .hud-badge-gold {
      min-width:9px; width:9px; height:9px; padding:0; border-radius:50%; font-size:0; right:-2px; top:-2px;
    }
    #btn-open-hub-menu {
      position:relative; width:34px; border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.055); color:#dbe5f3; display:inline-flex;
      align-items:center; justify-content:center; font:900 17px/1 inherit; cursor:pointer;
    }

    #app-viewport.ui-focus #rent-day-label { font-size:9.5px!important; }
    #app-viewport.ui-focus .crisis-tag { font-size:9.5px!important; max-width:165px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #app-viewport.ui-focus .rent-timer { font-size:10px!important; }
    #app-viewport.ui-focus #boss-name { font-size:11.5px!important; line-height:1.1; }
    #app-viewport.ui-focus #boss-hp-text { font-size:10px!important; white-space:nowrap; }
    #app-viewport.ui-focus .sidebar-title { font-size:10px!important; }
    #app-viewport.ui-focus .evo-count { font-size:10px!important; }
    #app-viewport.ui-focus .slot-count { font-size:10px!important; }
    #app-viewport.ui-focus .action-btn { font-size:11px!important; font-weight:850; }

    @media (orientation:landscape) and (min-width:520px),
           (min-aspect-ratio:1.15/1) and (min-width:520px) {
      #app-viewport.ui-focus .motivation-box {
        display:grid; grid-template-columns:auto 1fr; grid-template-areas:"l l" "v p";
        align-items:baseline; column-gap:8px; row-gap:4px; min-width:0;
      }
      #app-viewport.ui-focus .motivation-box .label {
        display:block!important; grid-area:l; width:max-content; font-size:9px; line-height:1;
        color:#7dd3fc; opacity:.95; font-weight:900;
      }
      #app-viewport.ui-focus #motivation-counter { grid-area:v; font-size:17px; }
      #app-viewport.ui-focus #passive-counter {
        display:block!important; grid-area:p; margin:0; color:#86efac; font-size:10.5px;
        font-weight:900; line-height:1; white-space:nowrap;
      }
      #app-viewport.ui-focus:not(.hud-collapsed) {
        --skuf-focus-sidebar:clamp(250px,22vw,278px);
        grid-template-columns:var(--skuf-focus-sidebar) minmax(0,1fr)!important;
      }
      #app-viewport.ui-focus:not(.hud-collapsed) #btn-collapse-hud { left:calc(var(--skuf-focus-sidebar) - 1px)!important; }
      #app-viewport.ui-focus.hud-collapsed #btn-collapse-hud { left:0!important; }
      #app-viewport.ui-focus #desktop-sidebar { gap:6px; padding:7px 9px; overflow:hidden; }
      #app-viewport.ui-focus #desktop-sidebar .profile-section,
      #app-viewport.ui-focus #desktop-sidebar .metrics-section,
      #app-viewport.ui-focus #desktop-sidebar .actions-section { display:none!important; }
      #app-viewport.ui-focus #desktop-sidebar .evo-section { padding:8px; margin:0; }
      #app-viewport.ui-focus #desktop-sidebar .evo-icons-row { gap:4px; margin-top:5px; }
      #app-viewport.ui-focus #desktop-sidebar .evo-ball-chip { border-radius:8px; padding:3px; }
      #app-viewport.ui-focus #desktop-sidebar .evo-chip-tier { font-size:8.5px!important; }

      #app-viewport.ui-focus .action-buttons-group {
        display:grid!important; grid-template-columns:repeat(6,minmax(0,1fr)); gap:5px!important;
      }
      #app-viewport.ui-focus #btn-brain-shake,
      #app-viewport.ui-focus #btn-toggle-autodrop { grid-column:span 3; min-width:0; min-height:35px; }
      #app-viewport.ui-focus #btn-tilt-left,
      #app-viewport.ui-focus #btn-tilt-right,
      #app-viewport.ui-focus #btn-toggle-gyro { grid-column:span 2; min-width:0; min-height:32px; }
      #app-viewport.ui-focus #action-panel { padding:6px 8px; }
    }

    @media (max-width:519px), (orientation:portrait) and (max-aspect-ratio:1.149/1) {
      #app-viewport.ui-focus #status-bar { padding:6px 8px; gap:4px; }
      #app-viewport.ui-focus .motivation-box .label,
      #app-viewport.ui-focus #passive-counter { display:none!important; }
      #app-viewport.ui-focus #motivation-counter { font-size:14.5px; }
      #app-viewport.ui-focus #rent-day-label,
      #app-viewport.ui-focus .crisis-tag,
      #app-viewport.ui-focus .rent-timer { font-size:9px!important; }
      #app-viewport.ui-focus #boss-name { font-size:10.5px!important; }
      #app-viewport.ui-focus #boss-hp-text { font-size:9.5px!important; }
      #app-viewport.ui-focus .action-buttons-group {
        display:grid!important; grid-template-columns:minmax(0,1.2fr) minmax(0,1.3fr) 38px 38px 38px;
        gap:4px!important; width:100%;
      }
      #app-viewport.ui-focus .action-btn { min-width:0!important; width:100%!important; padding-left:5px!important; padding-right:5px!important; }
      #app-viewport.ui-focus #btn-brain-shake,
      #app-viewport.ui-focus #btn-toggle-autodrop { font-size:10px!important; }
      #app-viewport.ui-focus #btn-tilt-left,
      #app-viewport.ui-focus #btn-tilt-right,
      #app-viewport.ui-focus #btn-toggle-gyro { padding:0!important; font-size:17px!important; }
      #app-viewport.ui-focus #btn-open-leaderboard { min-width:51px!important; padding:0 6px; }
      #app-viewport.ui-focus #btn-open-leaderboard .hud-btn-caption { font-size:9.5px; }
    }

    #hub-menu-popover {
      position:absolute; z-index:125; width:min(320px,calc(100% - 16px)); padding:10px;
      border:1px solid rgba(255,255,255,.11); border-radius:14px; background:rgba(6,10,20,.97);
      box-shadow:0 18px 42px rgba(0,0,0,.48); backdrop-filter:blur(14px);
      opacity:0; transform:translateY(-5px) scale(.985); pointer-events:none; transition:.14s;
    }
    #hub-menu-popover.open { opacity:1; transform:none; pointer-events:auto; }
    .hub-menu-head { display:flex; align-items:center; justify-content:space-between; padding:0 2px 8px; color:#a7b3c6; font-size:11px; font-weight:900; }
    .hub-menu-close { width:30px; height:30px; padding:0; border:0; border-radius:8px; background:transparent; color:#a7b3c6; cursor:pointer; font-size:16px; }
    .hub-menu-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; }
    #hub-menu-popover .hub-menu-item {
      min-width:0; width:100%; min-height:48px; padding:9px 10px; border:1px solid rgba(255,255,255,.08);
      border-radius:10px; background:rgba(255,255,255,.042); color:#e3e9f2; display:flex!important;
      flex-direction:row; align-items:center; justify-content:flex-start; gap:8px; box-shadow:none!important; overflow:hidden;
    }
    #hub-menu-popover .hub-menu-item.menu-danger { grid-column:1/-1; color:#fca5a5; border-color:rgba(239,68,68,.18); background:rgba(127,29,29,.11); }
    .hub-menu-icon { flex:0 0 auto; font-size:18px; }
    .hub-menu-label { min-width:0; font-size:11.5px; font-weight:850; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    .room-quick-settings.ui-settings-group { display:flex; align-items:center; gap:4px; padding:4px; border-radius:10px; background:rgba(5,9,18,.66); }
    .room-quick-settings.settings-collapsed .room-quick-btn:not(.room-settings-toggle) { display:none!important; }
    .room-settings-toggle { order:-1; }
    .room-quick-settings.ui-settings-group .room-quick-btn { width:31px; min-width:31px; height:31px; padding:0; border-radius:8px; font-size:14px; }

    #app-viewport.ui-focus #boss-bar { padding-top:5px; padding-bottom:5px; }
    #app-viewport.ui-focus .mission-top-row { margin-bottom:3px; }
    #app-viewport.ui-focus .effect-chip-strip { display:flex!important; align-items:center; gap:5px; margin-bottom:5px; min-width:0; }
    #app-viewport.ui-focus #daily-mod-badge.daily-mod-tag,
    #app-viewport.ui-focus .boss-effect-badge {
      flex:1 1 0; min-width:0; height:24px; padding:0 7px; border-radius:7px; display:flex;
      align-items:center; white-space:nowrap!important; overflow:hidden; text-overflow:ellipsis;
      font-size:9.5px!important; line-height:1;
    }
    #app-viewport.ui-focus .boss-info { margin-bottom:3px; gap:5px; }
    #app-viewport.ui-focus #boss-day-tag,
    #app-viewport.ui-focus #boss-quote-bubble,
    #app-viewport.ui-focus .quote-strip,
    #app-viewport.ui-focus .skuf-status-desc { display:none!important; }
    #btn-toggle-boss-assist {
      width:27px; min-width:27px; height:27px; padding:0; border:1px solid rgba(255,255,255,.08);
      border-radius:8px; background:rgba(255,255,255,.04); color:#a7b3c6; font-size:13px; cursor:pointer;
      display:inline-flex; align-items:center; justify-content:center;
    }
    #boss-tactical-assist.focus-collapsed { display:none!important; }
    #boss-tactical-assist.focus-expanded { display:flex!important; margin-top:5px; }
    #boss-tactical-assist.focus-expanded .tactical-ad-btn { font-size:10px!important; min-height:31px; }

    #app-viewport.ui-focus #fever-bar {
      left:50%!important; right:auto!important; width:min(320px,50%)!important; height:11px!important;
      transform:translateX(-50%); top:6px!important; opacity:.9;
    }

    #compact-play-hud {
      position:absolute; z-index:68; top:7px; left:50%; transform:translateX(-50%); display:none;
      align-items:center; gap:7px; width:min(500px,calc(100% - 124px)); min-height:32px; padding:6px 10px 8px;
      border:1px solid rgba(255,255,255,.09); border-radius:10px; background:rgba(5,9,18,.76);
      backdrop-filter:blur(8px); pointer-events:none;
    }
    #app-viewport.hud-collapsed #compact-play-hud { display:flex; }
    .compact-play-stat { min-width:0; color:#e2e8f0; font-size:10.5px; font-weight:850; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .compact-play-stat.score { color:#facc15; }
    .compact-play-stat.passive { color:#86efac; }
    .compact-play-stat.timer { margin-left:auto; }
    .compact-play-bars { position:absolute; left:10px; right:10px; bottom:2px; display:grid; grid-template-columns:1fr 1fr; gap:5px; height:2px; }
    .compact-play-track { overflow:hidden; border-radius:999px; background:rgba(255,255,255,.08); }
    .compact-play-fill { width:100%; height:100%; border-radius:inherit; transition:width .15s linear; }
    #compact-play-stamina-fill { background:#19d3c5; }
    #compact-play-boss-fill { background:#ff4d6d; }
    @media(max-width:430px) {
      #compact-play-hud { width:min(338px,calc(100% - 76px)); gap:5px; }
      .compact-play-stat { font-size:9px; }
      .compact-play-stat.passive { display:none; }
    }

    #app-viewport.ui-focus .roulette-modal { width:min(360px,calc(100% - 16px)); padding:13px; }
    #app-viewport.ui-focus .roulette-modal>p { display:none!important; }
    #app-viewport.ui-focus .roulette-modal .wheel-container { margin:6px auto 8px; }
    #app-viewport.ui-focus #roulette-canvas { width:min(238px,72vw)!important; height:auto!important; max-width:100%; }
    #app-viewport.ui-focus .roulette-prize-banner { min-height:26px; margin:6px 0 8px; padding:5px 7px; font-size:11.5px; line-height:1.2; }
    #app-viewport.ui-focus #btn-spin-wheel,
    #app-viewport.ui-focus #btn-spin-wheel-ad { min-height:45px; padding:9px 11px!important; border-radius:12px; font-size:12px!important; line-height:1.15; white-space:normal; }

    #app-viewport.ui-focus .modal-box { border-radius:16px; border-color:rgba(255,255,255,.1); box-shadow:0 24px 60px rgba(0,0,0,.5); }
    #app-viewport.ui-focus .modal-top h3 { font-size:14px!important; }
    #app-viewport.ui-focus .modal-box p,
    #app-viewport.ui-focus .modal-box li,
    #app-viewport.ui-focus .modal-box .upg-desc,
    #app-viewport.ui-focus .modal-box .quest-desc,
    #app-viewport.ui-focus .modal-box .boost-desc { font-size:11.5px!important; line-height:1.35!important; }
    #app-viewport.ui-focus .shop-tab,
    #app-viewport.ui-focus .btn-cta,
    #app-viewport.ui-focus .btn-ad-cta,
    #app-viewport.ui-focus .choice-btn { font-size:11.5px!important; }
    #app-viewport.ui-focus .upg-desc,
    #app-viewport.ui-focus .quest-desc,
    #app-viewport.ui-focus .boost-desc { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; }

    .hud-status-toast {
      position:fixed; z-index:260; left:50%; bottom:max(70px,calc(env(safe-area-inset-bottom) + 58px));
      transform:translate(-50%,10px); max-width:min(420px,calc(100vw - 24px)); padding:9px 12px;
      border:1px solid rgba(255,255,255,.12); border-radius:10px; background:rgba(5,9,18,.94);
      color:#edf2f7; font-size:11.5px; font-weight:750; line-height:1.3; text-align:center;
      opacity:0; pointer-events:none; transition:.18s; box-shadow:0 12px 30px rgba(0,0,0,.4);
    }
    .hud-status-toast.visible { opacity:1; transform:translate(-50%,0); }
    .ad-loading { opacity:.62!important; pointer-events:none!important; }
  `;
  document.head.appendChild(style);
}

function toast(message, ms = 2600) {
  let el = document.getElementById('hud-status-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hud-status-toast';
    el.className = 'hud-status-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.remove('visible'), ms);
}

function createMenu() {
  const A = app();
  const quick = document.querySelector('.hud-quick-actions');
  if (!A || !quick || document.getElementById('btn-open-hub-menu')) return;

  const open = document.createElement('button');
  open.id = 'btn-open-hub-menu';
  open.type = 'button';
  open.textContent = '☰';
  open.title = 'Меню';
  open.setAttribute('aria-label', 'Открыть меню');
  quick.appendChild(open);

  const pop = document.createElement('div');
  pop.id = 'hub-menu-popover';
  pop.innerHTML = '<div class="hub-menu-head"><span>МЕНЮ</span><button type="button" class="hub-menu-close">✕</button></div><div class="hub-menu-grid"></div>';
  A.appendChild(pop);
  const grid = pop.querySelector('.hub-menu-grid');

  [
    ['btn-open-shop','🛠️','Прокачка'],
    ['btn-open-quests','📋','Квесты'],
    ['btn-open-prestige','🌀','Сансара'],
    ['btn-open-stats','📊','Статистика'],
    ['btn-side-leaderboard','🏆','Лидерборд'],
    ['btn-side-guide','📖','Правила'],
    ['btn-reset-game','🗑️','Сброс']
  ].forEach(([id, icon, label]) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.classList.add('hub-menu-item');
    if (id === 'btn-reset-game') button.classList.add('menu-danger');
    button.innerHTML = `<span class="hub-menu-icon">${icon}</span><span class="hub-menu-label">${label}</span>`;
    button.title = label;
    button.setAttribute('aria-label', label);
    grid.appendChild(button);
  });

  const place = () => {
    const ar = A.getBoundingClientRect();
    const br = open.getBoundingClientRect();
    const width = Math.min(320, Math.max(250, ar.width - 16));
    pop.style.width = `${width}px`;
    pop.style.left = `${clamp(br.right - ar.left - width, 6, Math.max(6, ar.width - width - 6))}px`;
    pop.style.top = `${clamp(br.bottom - ar.top + 6, 6, Math.max(6, ar.height - Math.max(190, pop.offsetHeight) - 6))}px`;
  };
  const close = () => { pop.classList.remove('open'); open.classList.remove('active'); };
  open.addEventListener('click', e => {
    e.stopPropagation();
    if (pop.classList.contains('open')) close();
    else { place(); pop.classList.add('open'); open.classList.add('active'); }
  });
  pop.querySelector('.hub-menu-close')?.addEventListener('click', close);
  grid.addEventListener('click', e => { if (e.target.closest('.hub-menu-item')) close(); });
  document.addEventListener('pointerdown', e => {
    if (pop.classList.contains('open') && !pop.contains(e.target) && !open.contains(e.target)) close();
  }, { passive:true });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (pop.classList.contains('open')) place(); }, { passive:true });
}

function createSettingsToggle() {
  const group = document.querySelector('.room-quick-settings');
  if (!group || document.getElementById('btn-room-settings-toggle')) return;
  group.classList.add('ui-settings-group', 'settings-collapsed');
  const button = document.createElement('button');
  button.id = 'btn-room-settings-toggle';
  button.type = 'button';
  button.className = 'room-quick-btn room-settings-toggle';
  button.textContent = '⚙️';
  button.title = 'Звук и эффекты';
  group.prepend(button);
  let timer;
  const setOpen = open => {
    group.classList.toggle('settings-collapsed', !open);
    button.textContent = open ? '✕' : '⚙️';
    clearTimeout(timer);
    if (open) timer = setTimeout(() => setOpen(false), 7000);
  };
  button.addEventListener('click', e => { e.stopPropagation(); setOpen(group.classList.contains('settings-collapsed')); });
  document.addEventListener('pointerdown', e => {
    if (!group.classList.contains('settings-collapsed') && !group.contains(e.target)) setOpen(false);
  }, { passive:true });
}

function ensureBossBadge() {
  const bar = document.getElementById('boss-bar');
  if (!bar) return;
  let strip = document.getElementById('effect-chip-strip');
  if (!strip) {
    strip = document.createElement('div');
    strip.id = 'effect-chip-strip';
    strip.className = 'effect-chip-strip';
    const top = bar.querySelector('.mission-top-row');
    const info = bar.querySelector('.boss-info');
    if (top?.nextSibling) bar.insertBefore(strip, top.nextSibling);
    else if (info) bar.insertBefore(strip, info);
    else bar.prepend(strip);
  }
  const daily = document.getElementById('daily-mod-badge');
  if (daily && daily.parentElement !== strip) strip.appendChild(daily);
  let badge = document.getElementById('boss-effect-badge');
  if (!badge) {
    badge = document.createElement('button');
    badge.id = 'boss-effect-badge';
    badge.type = 'button';
    badge.className = 'boss-effect-badge';
    badge.textContent = '👹 Эффект босса';
    badge.title = 'Эффект текущего босса';
    strip.appendChild(badge);
  } else if (badge.parentElement !== strip) {
    strip.appendChild(badge);
  }
}

function createBossAssistToggle() {
  const tactical = document.getElementById('boss-tactical-assist');
  if (!tactical || document.getElementById('btn-toggle-boss-assist')) return;
  const button = document.createElement('button');
  button.id = 'btn-toggle-boss-assist';
  button.type = 'button';
  button.textContent = '🎬';
  button.title = 'Помощь за рекламу';
  (document.querySelector('#boss-bar .boss-info') || tactical.parentNode).appendChild(button);
  tactical.classList.add('focus-collapsed');
  const setOpen = open => {
    tactical.classList.toggle('focus-collapsed', !open);
    tactical.classList.toggle('focus-expanded', open);
    button.classList.toggle('open', open);
  };
  button.addEventListener('click', () => setOpen(!tactical.classList.contains('focus-expanded')));
  tactical.addEventListener('click', e => { if (e.target.closest('button')) setTimeout(() => setOpen(false), 120); });
}

function normalizeControls() {
  const left = document.querySelector('#btn-tilt-left .action-icon');
  const right = document.querySelector('#btn-tilt-right .action-icon');
  if (left) left.textContent = '←';
  if (right) right.textContent = '→';
}

function createCompactHud() {
  const A = app();
  const wrap = document.getElementById('canvas-wrapper');
  if (!A || !wrap || document.getElementById('compact-play-hud')) return;
  const hud = document.createElement('div');
  hud.id = 'compact-play-hud';
  hud.innerHTML = `<span id="compact-play-score" class="compact-play-stat score">💎 0</span>
    <span id="compact-play-passive" class="compact-play-stat passive">+0/с</span>
    <span id="compact-play-boss" class="compact-play-stat">👹 100%</span>
    <span id="compact-play-timer" class="compact-play-stat timer">⏳ 00:00</span>
    <span class="compact-play-bars"><span class="compact-play-track"><span id="compact-play-stamina-fill" class="compact-play-fill"></span></span>
    <span class="compact-play-track"><span id="compact-play-boss-fill" class="compact-play-fill"></span></span></span>`;
  wrap.appendChild(hud);
  const update = () => {
    if (!A.classList.contains('hud-collapsed')) return;
    const motivation = document.getElementById('motivation-counter')?.textContent?.trim();
    if (motivation) document.getElementById('compact-play-score').textContent = `💎 ${motivation.replace(/^💎\s*/, '')}`;
    document.getElementById('compact-play-passive').textContent = document.getElementById('passive-counter')?.textContent?.trim() || '+0/с';
    const bossWidth = document.getElementById('boss-hp-fill')?.style.width || '100%';
    const bossIcon = document.getElementById('boss-icon')?.textContent?.trim() || '👹';
    document.getElementById('compact-play-boss').textContent = `${bossIcon} ${bossWidth}`;
    const timer = document.getElementById('rent-timer-display')?.textContent?.trim();
    if (timer) document.getElementById('compact-play-timer').textContent = timer;
    document.getElementById('compact-play-stamina-fill').style.width = document.getElementById('stamina-bar')?.style.width || '100%';
    document.getElementById('compact-play-boss-fill').style.width = bossWidth;
  };
  setInterval(update, 300);
  new MutationObserver(update).observe(A, { attributes:true, attributeFilter:['class'] });
}

function compactRouletteText() {
  const button = document.getElementById('btn-spin-wheel');
  if (!button) return;
  let lock = false;
  const fix = () => {
    if (lock) return;
    const text = button.textContent?.trim() || '';
    const free = text.match(/КРУТИТЬ БЕСПЛАТНО!?\s*\(Осталось:\s*(\d+)\)/i);
    const wait = text.match(/Ожидание:\s*(\d+)с/i);
    let next = text;
    if (free) { next = `КРУТИТЬ • БЕСПЛАТНО ×${free[1]}`; button.title = `Бесплатных вращений: ${free[1]}`; }
    else if (wait) { next = `СПИН ЧЕРЕЗ ${wait[1]}с`; button.title = 'Или победите босса'; }
    if (next !== text) { lock = true; button.textContent = next; lock = false; }
  };
  new MutationObserver(fix).observe(button, { childList:true, characterData:true, subtree:true });
  fix();
}

async function ensureLocalYandexMock() {
  if (!isLocalDev() || typeof window.YaGames !== 'undefined') return;
  if (window.__skufMockLoadPromise) return window.__skufMockLoadPromise;
  window.__skufMockLoadPromise = new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'dev/sdk-mock.js';
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
  }).then(async () => {
    const bridge = window.YandexBridge;
    if (bridge && typeof window.YaGames !== 'undefined' && !bridge.isInitialized) {
      bridge.isFallbackMode = false;
      bridge.readyPromise = bridge.init();
      try { await bridge.readyPromise; } catch (_) {}
    }
  });
  return window.__skufMockLoadPromise;
}

function hasBlockingModal() {
  return !!document.querySelector('.modal-backdrop.active:not(#start-menu-overlay)');
}

function syncAudioAfterAd() {
  setTimeout(() => {
    if (hasBlockingModal() || window.gameInstance?.isGameOver) {
      try { AudioCtrl?.suspend?.(); } catch (_) {}
    }
  }, 0);
}

function patchRewardedAds() {
  const tryPatch = async () => {
    await ensureLocalYandexMock();
    const bridge = window.YandexBridge;
    if (!bridge || bridge.__rewardedUxPatched || typeof bridge.showRewardedVideo !== 'function') return false;
    bridge.__rewardedUxPatched = true;
    const original = bridge.showRewardedVideo.bind(bridge);

    bridge.showRewardedVideo = function(rewardType, cbOrObject, closeFallback) {
      const sourceButton = document.activeElement?.closest?.('button') || null;
      const callbacks = typeof cbOrObject === 'function'
        ? { onRewarded: cbOrObject, onClose: closeFallback }
        : (cbOrObject && typeof cbOrObject === 'object' ? cbOrObject : {});
      let rewarded = false;
      let errored = false;
      if (sourceButton) sourceButton.classList.add('ad-loading');

      const restore = () => sourceButton?.classList.remove('ad-loading');
      const run = async () => {
        await ensureLocalYandexMock();
        if (!bridge.isInitialized && bridge.readyPromise) {
          try { await bridge.readyPromise; } catch (_) {}
        }
        original(rewardType, {
          onOpen: (...args) => callbacks.onOpen?.(...args),
          onRewarded: (...args) => {
            rewarded = true;
            callbacks.onRewarded?.(...args);
            if (rewardType === 'revive') {
              setTimeout(() => {
                const game = window.gameInstance;
                if (game && !game.isGameOver) {
                  document.getElementById('gameover-overlay')?.classList.remove('active');
                  game.resume?.('gameover');
                }
              }, 0);
            }
          },
          onClose: (...args) => {
            restore();
            callbacks.onClose?.(...args);
            if (!rewarded && !errored) toast('Просмотр не завершён — награда не начислена.');
            syncAudioAfterAd();
          },
          onError: error => {
            errored = true;
            restore();
            callbacks.onError?.(error);
            toast(isLocalDev() ? 'Локальная реклама не загрузилась. Запусти игру через npm run dev.' : 'Реклама сейчас недоступна. Попробуйте ещё раз позже.');
            syncAudioAfterAd();
          },
          onCooldown: left => {
            restore();
            callbacks.onCooldown?.(left);
            toast(`Буст будет доступен через ${left}с.`);
          }
        });
      };
      run().catch(error => {
        restore();
        console.warn('Rewarded ad wrapper error:', error);
        toast('Не удалось запустить рекламу. Попробуйте ещё раз.');
        syncAudioAfterAd();
      });
    };
    return true;
  };

  let attempts = 0;
  const timer = setInterval(async () => {
    attempts++;
    if (await tryPatch() || attempts > 80) clearInterval(timer);
  }, 100);
  tryPatch();
}

function patchGameplayCooldowns() {
  let attempts = 0;
  const timer = setInterval(() => {
    const game = window.gameInstance;
    attempts++;
    if (!game) {
      if (attempts > 120) clearInterval(timer);
      return;
    }
    clearInterval(timer);
    if (game.__hudCooldownPatch) return;
    game.__hudCooldownPatch = true;

    if (typeof game.recalculatePassives === 'function') {
      const originalRecalculate = game.recalculatePassives.bind(game);
      game.recalculatePassives = function(...args) {
        const result = originalRecalculate(...args);
        this.baseDropCooldownMs = Math.max(250, Math.round((this.baseDropCooldownMs || 380) * 1.7));
        this.updateDropCooldownFromState?.();
        return result;
      };
      game.recalculatePassives();
    } else {
      game.baseDropCooldownMs = 650;
      game.dropCooldownMs = 650;
    }

    game.doubleTapCooldownMs = 4000;
    game.doubleTapReadyAt = 0;
    game.canvas?.addEventListener('pointerup', event => {
      if (game.activeConsumableMode || game.isPaused || game.isGameOver) return;
      const rect = game.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) * (game.canvas.width / rect.width);
      const y = (event.clientY - rect.top) * (game.canvas.height / rect.height);
      const now = performance.now();
      const isDoubleTap = game.lastTapTime > 0 &&
        now - game.lastTapTime < 280 &&
        Math.hypot(x - game.lastTapPos.x, y - game.lastTapPos.y) < 45;
      if (!isDoubleTap) return;

      if (now < game.doubleTapReadyAt) {
        const left = Math.max(0.1, (game.doubleTapReadyAt - now) / 1000);
        game.lastTapTime = 0;
        game.spawnFloatingText?.(x, y - 18, `⏳ ПОДБРОС ${left.toFixed(1)}с`, '#94a3b8');
      } else {
        game.doubleTapReadyAt = now + game.doubleTapCooldownMs;
      }
    }, true);
  }, 80);
}

function boot() {
  const A = app();
  if (!A || A.dataset.uiFocusV16) return;
  A.dataset.uiFocusV16 = '1';
  A.classList.add('ui-focus');
  createMenu();
  createSettingsToggle();
  ensureBossBadge();
  createBossAssistToggle();
  normalizeControls();
  createCompactHud();
  compactRouletteText();
  patchRewardedAds();
  patchGameplayCooldowns();
  setTimeout(ensureBossBadge, 80);
  setTimeout(ensureBossBadge, 300);
  console.info(`[UI FOCUS ${VERSION}] enabled`);
}

injectStyles();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
