/*
 * CYBER-SKUF — gameplay-first HUD v1.4
 * Keeps the main playfield calm, moves secondary actions behind context menus,
 * and preserves essential information when the big HUD is collapsed.
 */
(() => {
    'use strict';

    const UI_FOCUS_VERSION = '1.4.0';
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function injectStyles() {
        if (document.getElementById('skuf-ui-focus-styles')) return;

        const style = document.createElement('style');
        style.id = 'skuf-ui-focus-styles';
        style.textContent = `
            #app-viewport.ui-focus .hud-nav-bar { display: none !important; }
            #app-viewport.ui-focus #status-bar { gap: 3px; padding-top: 5px; padding-bottom: 5px; }
            #app-viewport.ui-focus .hud-top-row { min-height: 30px; }
            #app-viewport.ui-focus .motivation-box .label { display: none !important; }
            #app-viewport.ui-focus #motivation-counter { font-size: 14px; line-height: 1; letter-spacing: .1px; }
            #app-viewport.ui-focus #passive-counter { display: none !important; }
            #app-viewport.ui-focus .stamina-box { gap: 2px; }
            #app-viewport.ui-focus .stamina-label-row { min-height: 9px; line-height: 1; }
            #app-viewport.ui-focus .stamina-label-row .label { font-size: 7px; opacity: .68; }
            #app-viewport.ui-focus #stamina-track { height: 5px; }
            #app-viewport.ui-focus .hud-quick-actions { gap: 4px; }
            #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn,
            #btn-open-hub-menu { width: 29px; min-width: 29px; height: 29px; padding: 0; border-radius: 9px; }
            #app-viewport.ui-focus .hud-quick-actions .hud-btn-caption { display: none !important; }
            #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn,
            #app-viewport.ui-focus .hud-quick-actions .boost-btn-glow,
            #app-viewport.ui-focus .hud-quick-actions .roulette-btn-glow {
                background: rgba(255,255,255,.05) !important;
                border-color: rgba(255,255,255,.10) !important;
                box-shadow: none !important;
            }
            #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn:hover,
            #app-viewport.ui-focus .hud-quick-actions .boost-btn-glow:hover,
            #app-viewport.ui-focus .hud-quick-actions .roulette-btn-glow:hover {
                background: rgba(0,229,255,.08) !important;
                border-color: rgba(0,229,255,.25) !important;
            }
            #app-viewport.ui-focus .roulette-btn-glow .hud-badge-gold {
                min-width: 8px; width: 8px; height: 8px; padding: 0; border-radius: 999px;
                font-size: 0; right: -2px; top: -2px;
            }
            #btn-open-hub-menu {
                position: relative;
                border: 1px solid rgba(255,255,255,.12);
                background: rgba(255,255,255,.05);
                color: #dbe5f3;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font: 900 15px/1 inherit;
                cursor: pointer;
                transition: transform .1s ease, background .15s ease, border-color .15s ease;
            }
            #btn-open-hub-menu:hover, #btn-open-hub-menu.active {
                background: rgba(0,229,255,.09);
                border-color: rgba(0,229,255,.30);
                color: #67e8f9;
            }
            #btn-open-hub-menu:active { transform: scale(.92); }

            #hub-menu-popover {
                position: absolute;
                z-index: 125;
                width: min(272px, calc(100% - 16px));
                padding: 8px;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 13px;
                background: rgba(6,10,20,.97);
                box-shadow: 0 18px 42px rgba(0,0,0,.48), 0 0 24px rgba(0,229,255,.06);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                opacity: 0;
                transform: translateY(-5px) scale(.985);
                transform-origin: top right;
                pointer-events: none;
                transition: opacity .14s ease, transform .14s ease;
            }
            #hub-menu-popover.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
            .hub-menu-head {
                display: flex; align-items: center; justify-content: space-between; min-height: 27px;
                padding: 0 2px 6px; color: #94a3b8; font-size: 9px; font-weight: 900;
                letter-spacing: .55px; text-transform: uppercase;
            }
            .hub-menu-close {
                width: 25px; height: 25px; padding: 0; border: 0; border-radius: 7px;
                background: transparent; color: #94a3b8; cursor: pointer; font-size: 14px;
            }
            .hub-menu-close:hover { color: #fff; background: rgba(255,255,255,.07); }
            .hub-menu-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 6px; }
            #hub-menu-popover .hub-menu-item {
                min-width: 0; width: 100%; min-height: 46px; padding: 7px 8px;
                border: 1px solid rgba(255,255,255,.075); border-radius: 10px;
                background: rgba(255,255,255,.038); color: #dbe5f3; display: flex !important;
                flex-direction: column; align-items: flex-start; justify-content: center; gap: 4px;
                box-shadow: none !important; cursor: pointer; overflow: hidden;
                transition: background .14s ease, border-color .14s ease, transform .1s ease;
            }
            #hub-menu-popover .hub-menu-item:hover { background: rgba(0,229,255,.07); border-color: rgba(0,229,255,.20); }
            #hub-menu-popover .hub-menu-item:active { transform: scale(.97); }
            #hub-menu-popover .hub-menu-item.menu-danger {
                color: #fca5a5; border-color: rgba(239,68,68,.16); background: rgba(127,29,29,.10);
            }
            .hub-menu-icon { font-size: 16px; line-height: 1; }
            .hub-menu-label {
                width: 100%; font-size: 9.5px; font-weight: 800; line-height: 1.1; white-space: nowrap;
                overflow: hidden; text-overflow: ellipsis; text-align: left;
            }

            .room-quick-settings.ui-settings-group {
                display: flex; align-items: center; gap: 3px; padding: 3px; border-radius: 10px;
                background: rgba(5,9,18,.64); border: 1px solid rgba(255,255,255,.06);
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                transition: background .15s ease, border-color .15s ease;
            }
            .room-quick-settings.ui-settings-group.settings-collapsed {
                background: rgba(5,9,18,.42); border-color: rgba(255,255,255,.04);
            }
            .room-quick-settings.ui-settings-group.settings-collapsed .room-quick-btn:not(.room-settings-toggle) { display: none !important; }
            .room-settings-toggle { order: -1; }
            .room-quick-settings.ui-settings-group .room-quick-btn {
                width: 27px; min-width: 27px; height: 27px; padding: 0; border-radius: 7px; font-size: 12.5px;
            }

            #app-viewport.ui-focus #boss-bar { padding-top: 4px; padding-bottom: 4px; }
            #app-viewport.ui-focus .mission-top-row { margin-bottom: 2px; }
            #app-viewport.ui-focus .mission-left { min-width: 0; }
            #app-viewport.ui-focus .crisis-tag {
                max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            #app-viewport.ui-focus .effect-chip-strip { gap: 3px; margin-bottom: 3px; }
            #app-viewport.ui-focus #daily-mod-badge.daily-mod-tag,
            #app-viewport.ui-focus .boss-effect-badge {
                height: 20px; padding: 0 5px; font-size: 7.8px; border-radius: 6px;
            }
            #app-viewport.ui-focus .boss-info { margin-bottom: 2px; gap: 4px; }
            #app-viewport.ui-focus #boss-hp-text { font-size: 8.5px; white-space: nowrap; }
            #app-viewport.ui-focus #boss-day-tag,
            #app-viewport.ui-focus #boss-quote-bubble,
            #app-viewport.ui-focus .quote-strip,
            #app-viewport.ui-focus .skuf-status-desc { display: none !important; }
            #btn-toggle-boss-assist {
                width: 23px; min-width: 23px; height: 23px; margin: 0 0 0 2px; padding: 0;
                border: 1px solid rgba(255,255,255,.075); border-radius: 7px;
                background: rgba(255,255,255,.03); color: #94a3b8; font-size: 12px; cursor: pointer;
                display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
                transition: background .14s ease, color .14s ease, border-color .14s ease;
            }
            #btn-toggle-boss-assist:hover, #btn-toggle-boss-assist.open {
                color: #e2e8f0; background: rgba(0,229,255,.07); border-color: rgba(0,229,255,.18);
            }
            #boss-tactical-assist.focus-collapsed { display: none !important; }
            #boss-tactical-assist.focus-expanded {
                display: flex !important; margin-top: 4px; animation: focusAssistIn .13s ease-out;
            }
            @keyframes focusAssistIn {
                from { opacity: 0; transform: translateY(-3px); }
                to { opacity: 1; transform: translateY(0); }
            }

            #app-viewport.ui-focus #fever-bar {
                left: 50% !important; right: auto !important; width: min(300px, 48%) !important;
                height: 11px !important; transform: translateX(-50%); top: 6px !important; opacity: .88;
            }
            #app-viewport.ui-focus #next-thought-indicator { padding: 5px 7px; }

            @media (orientation: landscape) and (min-width: 520px),
                   (min-aspect-ratio: 1.15/1) and (min-width: 520px) {
                #app-viewport.ui-focus:not(.hud-collapsed) {
                    --skuf-focus-sidebar: clamp(235px, 23vw, 260px);
                    grid-template-columns: var(--skuf-focus-sidebar) minmax(0,1fr) !important;
                }
                #app-viewport.ui-focus:not(.hud-collapsed) #btn-collapse-hud {
                    left: calc(var(--skuf-focus-sidebar) - 1px) !important;
                }
                #app-viewport.ui-focus.hud-collapsed #btn-collapse-hud { left: 0 !important; }
                #app-viewport.ui-focus #desktop-sidebar { gap: 5px; padding: 6px 8px; overflow: hidden; }
                #app-viewport.ui-focus #desktop-sidebar .profile-section,
                #app-viewport.ui-focus #desktop-sidebar .metrics-section,
                #app-viewport.ui-focus #desktop-sidebar .actions-section { display: none !important; }
                #app-viewport.ui-focus #desktop-sidebar .evo-section { padding: 6px 7px; margin: 0; }
                #app-viewport.ui-focus #desktop-sidebar .evo-icons-row { gap: 3px; margin-top: 3px; }
                #app-viewport.ui-focus #desktop-sidebar .evo-ball-chip { border-radius: 7px; padding: 2px; }
                #app-viewport.ui-focus #desktop-sidebar .evo-chip-tier { font-size: 7px; }
            }

            #app-viewport.ui-focus #action-panel { padding-top: 4px; padding-bottom: 4px; }
            #app-viewport.ui-focus .action-buttons-group { gap: 3px; }
            #app-viewport.ui-focus #btn-tilt-left span:not(.action-icon),
            #app-viewport.ui-focus #btn-tilt-right span:not(.action-icon),
            #app-viewport.ui-focus #btn-toggle-gyro span:not(.action-icon) { display: none !important; }

            #compact-play-hud {
                position: absolute; z-index: 68; top: 7px; left: 50%; transform: translateX(-50%);
                display: none; align-items: center; gap: 7px; width: min(430px, calc(100% - 124px));
                min-height: 28px; padding: 4px 8px 6px; border: 1px solid rgba(255,255,255,.08);
                border-radius: 10px; background: rgba(5,9,18,.72); box-shadow: 0 8px 24px rgba(0,0,0,.25);
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); pointer-events: none;
            }
            #app-viewport.hud-collapsed #compact-play-hud { display: flex; }
            .compact-play-stat {
                min-width: 0; color: #e2e8f0; font-size: 9px; font-weight: 800; white-space: nowrap;
                overflow: hidden; text-overflow: ellipsis;
            }
            .compact-play-stat.score { color: #facc15; }
            .compact-play-stat.timer { margin-left: auto; color: #f8fafc; }
            .compact-play-bars {
                position: absolute; left: 8px; right: 8px; bottom: 2px; display: grid;
                grid-template-columns: 1fr 1fr; gap: 4px; height: 2px;
            }
            .compact-play-track { overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.08); }
            .compact-play-fill { width: 100%; height: 100%; border-radius: inherit; transition: width .15s linear; }
            #compact-play-stamina-fill { background: #19d3c5; }
            #compact-play-boss-fill { background: #ff4d6d; }

            #app-viewport.ui-focus .modal-box {
                border-radius: 16px; border-color: rgba(255,255,255,.10); box-shadow: 0 24px 60px rgba(0,0,0,.50);
            }
            #app-viewport.ui-focus .modal-top {
                min-height: 34px; padding-bottom: 7px; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,.06);
            }
            #app-viewport.ui-focus .modal-top h3 { font-size: 13px; letter-spacing: .25px; }
            #app-viewport.ui-focus .upgrade-card,
            #app-viewport.ui-focus .quest-card,
            #app-viewport.ui-focus .achievement-card,
            #app-viewport.ui-focus .boost-card {
                border-radius: 10px; border-color: rgba(255,255,255,.07); background: rgba(255,255,255,.035); box-shadow: none;
            }
            #app-viewport.ui-focus .upg-name,
            #app-viewport.ui-focus .quest-name,
            #app-viewport.ui-focus .boost-title { font-size: 11px; line-height: 1.18; }
            #app-viewport.ui-focus .upg-desc,
            #app-viewport.ui-focus .quest-desc,
            #app-viewport.ui-focus .boost-desc {
                color: #91a0b6; font-size: 9.5px; line-height: 1.32; display: -webkit-box;
                -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
            }
            #app-viewport.ui-focus .tabs-nav {
                gap: 4px; padding: 3px; border-radius: 10px; background: rgba(255,255,255,.025);
            }
            #app-viewport.ui-focus .shop-tab { min-height: 28px; border-radius: 7px; font-size: 9px; }

            @media (max-width: 519px),
                   (orientation: portrait) and (max-aspect-ratio: 1.149/1) {
                #app-viewport.ui-focus #status-bar { padding: 4px 7px; gap: 2px; }
                #app-viewport.ui-focus #motivation-counter { font-size: 13px; }
                #app-viewport.ui-focus .stamina-label-row .label { font-size: 6.8px; }
                #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn,
                #btn-open-hub-menu { width: 27px; min-width: 27px; height: 27px; }
                #app-viewport.ui-focus .mission-top-row { gap: 4px; }
                #app-viewport.ui-focus .rent-day-tag { font-size: 8px; }
                #app-viewport.ui-focus .crisis-tag { max-width: 142px; font-size: 7.5px; }
                #app-viewport.ui-focus .rent-timer { font-size: 8px; }
                #app-viewport.ui-focus #daily-mod-badge.daily-mod-tag,
                #app-viewport.ui-focus .boss-effect-badge { height: 19px; font-size: 7.3px; padding: 0 5px; }
                #app-viewport.ui-focus #boss-name { font-size: 10px; }
                #app-viewport.ui-focus #boss-hp-text { font-size: 7.8px; }
                #app-viewport.ui-focus #fever-bar { width: 42% !important; height: 10px !important; }
                #app-viewport.ui-focus #next-thought-indicator {
                    width: 46px; min-width: 46px; height: 42px; padding: 4px; border-radius: 10px;
                }
                #app-viewport.ui-focus #next-thought-indicator .next-copy { display: none !important; }
                #app-viewport.ui-focus #next-thought-circle { width: 32px; height: 32px; margin: auto; }
                #app-viewport.ui-focus #consumables-bar { padding-top: 3px; padding-bottom: 3px; }
                #app-viewport.ui-focus .item-slot { min-height: 38px; }
                #app-viewport.ui-focus #action-panel { padding: 4px 6px; }
                #app-viewport.ui-focus .action-btn { min-height: 30px; padding: 3px 5px; }
                #app-viewport.ui-focus #btn-tilt-left,
                #app-viewport.ui-focus #btn-tilt-right,
                #app-viewport.ui-focus #btn-toggle-gyro {
                    flex: 0 0 35px; min-width: 35px; padding-left: 0; padding-right: 0;
                }
                #app-viewport.ui-focus #btn-brain-shake,
                #app-viewport.ui-focus #btn-toggle-autodrop { flex: 1 1 0; min-width: 0; }
                #hub-menu-popover { width: calc(100% - 12px); border-radius: 12px; padding: 7px; }
                .hub-menu-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap: 5px; }
                #hub-menu-popover .hub-menu-item {
                    min-height: 48px; padding: 6px; align-items: center; text-align: center;
                }
                .hub-menu-label { font-size: 8.2px; text-align: center; }
                #compact-play-hud {
                    top: 6px; width: calc(100% - 116px); min-height: 27px; gap: 5px; padding-left: 7px; padding-right: 7px;
                }
                .compact-play-stat { font-size: 8px; }
                #app-viewport.ui-focus .modal-backdrop { padding: 6px; }
                #app-viewport.ui-focus .modal-box {
                    width: 100%; max-height: calc(100dvh - 12px); padding: 10px; border-radius: 13px;
                }
                #app-viewport.ui-focus .cards-scroll { max-height: 64dvh; }
                .room-quick-settings.ui-settings-group .room-quick-btn {
                    width: 26px; min-width: 26px; height: 26px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function setMenuButtonContent(button, icon, label) {
        if (!button) return null;
        button.classList.add('hub-menu-item');
        button.innerHTML = `<span class="hub-menu-icon" aria-hidden="true">${icon}</span><span class="hub-menu-label">${label}</span>`;
        button.title = label;
        button.setAttribute('aria-label', label);
        return button;
    }

    function initHubMenu() {
        const app = document.getElementById('app-viewport');
        const quickActions = document.querySelector('.hud-quick-actions');
        if (!app || !quickActions || document.getElementById('btn-open-hub-menu')) return;

        const menuButton = document.createElement('button');
        menuButton.id = 'btn-open-hub-menu';
        menuButton.type = 'button';
        menuButton.textContent = '☰';
        menuButton.title = 'Меню';
        menuButton.setAttribute('aria-label', 'Открыть меню');
        menuButton.setAttribute('aria-expanded', 'false');
        quickActions.appendChild(menuButton);

        const popover = document.createElement('div');
        popover.id = 'hub-menu-popover';
        popover.setAttribute('role', 'dialog');
        popover.setAttribute('aria-label', 'Меню игры');
        popover.innerHTML = `<div class="hub-menu-head"><span>Меню</span><button type="button" class="hub-menu-close" aria-label="Закрыть меню">✕</button></div><div class="hub-menu-grid"></div>`;
        app.appendChild(popover);

        const grid = popover.querySelector('.hub-menu-grid');
        const items = [
            [document.getElementById('btn-open-shop'), '🛠️', 'Прокачка'],
            [document.getElementById('btn-open-quests'), '📋', 'Квесты'],
            [document.getElementById('btn-open-prestige'), '🌀', 'Сансара'],
            [document.getElementById('btn-open-stats'), '📊', 'Статистика'],
            [document.getElementById('btn-open-leaderboard'), '🏆', 'Лидерборд'],
            [document.getElementById('btn-side-guide'), '📖', 'Правила'],
            [document.getElementById('btn-reset-game'), '🗑️', 'Сброс']
        ];

        items.forEach(([button, icon, label]) => {
            const item = setMenuButtonContent(button, icon, label);
            if (!item) return;
            if (button.id === 'btn-reset-game') item.classList.add('menu-danger');
            grid?.appendChild(item);
        });

        document.querySelector('.hud-nav-bar')?.setAttribute('aria-hidden', 'true');

        const placePopover = () => {
            const appRect = app.getBoundingClientRect();
            const buttonRect = menuButton.getBoundingClientRect();
            const width = Math.min(272, Math.max(210, appRect.width - 16));
            popover.style.width = `${width}px`;
            const left = clamp(buttonRect.right - appRect.left - width, 6, Math.max(6, appRect.width - width - 6));
            const top = clamp(buttonRect.bottom - appRect.top + 6, 6, Math.max(6, appRect.height - Math.max(150, popover.offsetHeight) - 6));
            popover.style.left = `${left}px`;
            popover.style.top = `${top}px`;
        };

        const closeMenu = () => {
            popover.classList.remove('open');
            menuButton.classList.remove('active');
            menuButton.setAttribute('aria-expanded', 'false');
        };
        const openMenu = () => {
            placePopover();
            popover.classList.add('open');
            menuButton.classList.add('active');
            menuButton.setAttribute('aria-expanded', 'true');
            requestAnimationFrame(placePopover);
        };

        menuButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            popover.classList.contains('open') ? closeMenu() : openMenu();
        });
        popover.querySelector('.hub-menu-close')?.addEventListener('click', closeMenu);
        grid?.addEventListener('click', event => { if (event.target.closest('.hub-menu-item')) closeMenu(); });
        document.addEventListener('pointerdown', event => {
            if (!popover.classList.contains('open')) return;
            if (popover.contains(event.target) || menuButton.contains(event.target)) return;
            closeMenu();
        }, { passive: true });
        document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
        window.addEventListener('resize', () => { if (popover.classList.contains('open')) placePopover(); }, { passive: true });

        const observer = new MutationObserver(() => {
            if (app.classList.contains('hud-collapsed')) {
                closeMenu();
                return;
            }
            if (popover.classList.contains('open')) requestAnimationFrame(placePopover);
        });
        observer.observe(app, { attributes: true, attributeFilter: ['class'] });
    }

    function initRoomSettings() {
        const group = document.querySelector('.room-quick-settings');
        if (!group || document.getElementById('btn-room-settings-toggle')) return;
        group.classList.add('ui-settings-group', 'settings-collapsed');

        const toggle = document.createElement('button');
        toggle.id = 'btn-room-settings-toggle';
        toggle.type = 'button';
        toggle.className = 'room-quick-btn room-settings-toggle';
        toggle.textContent = '⚙️';
        toggle.title = 'Звук и эффекты';
        toggle.setAttribute('aria-label', 'Открыть настройки звука и эффектов');
        toggle.setAttribute('aria-expanded', 'false');
        group.prepend(toggle);

        let closeTimer = null;
        const setOpen = open => {
            group.classList.toggle('settings-collapsed', !open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.textContent = open ? '✕' : '⚙️';
            clearTimeout(closeTimer);
            if (open) closeTimer = setTimeout(() => setOpen(false), 7000);
        };
        toggle.addEventListener('click', event => {
            event.stopPropagation();
            setOpen(group.classList.contains('settings-collapsed'));
        });
        group.addEventListener('click', event => {
            if (event.target.closest('.room-quick-btn:not(.room-settings-toggle)')) {
                clearTimeout(closeTimer);
                closeTimer = setTimeout(() => setOpen(false), 1800);
            }
        });
        document.addEventListener('pointerdown', event => {
            if (group.classList.contains('settings-collapsed')) return;
            if (!group.contains(event.target)) setOpen(false);
        }, { passive: true });
    }

    function initBossAssist() {
        const tactical = document.getElementById('boss-tactical-assist');
        const bossInfo = document.querySelector('#boss-bar .boss-info');
        if (!tactical || !bossInfo || document.getElementById('btn-toggle-boss-assist')) return;

        const toggle = document.createElement('button');
        toggle.id = 'btn-toggle-boss-assist';
        toggle.type = 'button';
        toggle.textContent = '🎬';
        toggle.title = 'Помощь за рекламу';
        toggle.setAttribute('aria-label', 'Открыть тактическую помощь за рекламу');
        toggle.setAttribute('aria-expanded', 'false');
        bossInfo.appendChild(toggle);
        tactical.classList.add('focus-collapsed');

        let autoCloseTimer = null;
        const setOpen = open => {
            tactical.classList.toggle('focus-collapsed', !open);
            tactical.classList.toggle('focus-expanded', open);
            toggle.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', String(open));
            clearTimeout(autoCloseTimer);
            if (open) autoCloseTimer = setTimeout(() => setOpen(false), 8000);
        };
        toggle.addEventListener('click', () => setOpen(!tactical.classList.contains('focus-expanded')));
        tactical.addEventListener('click', event => {
            if (event.target.closest('button')) setTimeout(() => setOpen(false), 120);
        });
    }

    function initCompactPlayHud() {
        const app = document.getElementById('app-viewport');
        const canvasWrapper = document.getElementById('canvas-wrapper');
        if (!app || !canvasWrapper || document.getElementById('compact-play-hud')) return;

        const hud = document.createElement('div');
        hud.id = 'compact-play-hud';
        hud.setAttribute('aria-hidden', 'true');
        hud.innerHTML = `<span id="compact-play-score" class="compact-play-stat score">💎 0</span><span id="compact-play-boss" class="compact-play-stat">👹 100%</span><span id="compact-play-timer" class="compact-play-stat timer">⏳ 00:00</span><span class="compact-play-bars"><span class="compact-play-track"><span id="compact-play-stamina-fill" class="compact-play-fill"></span></span><span class="compact-play-track"><span id="compact-play-boss-fill" class="compact-play-fill"></span></span></span>`;
        canvasWrapper.appendChild(hud);

        const score = hud.querySelector('#compact-play-score');
        const boss = hud.querySelector('#compact-play-boss');
        const timer = hud.querySelector('#compact-play-timer');
        const staminaFill = hud.querySelector('#compact-play-stamina-fill');
        const bossFill = hud.querySelector('#compact-play-boss-fill');

        const update = () => {
            if (!app.classList.contains('hud-collapsed')) return;
            const motivationText = document.getElementById('motivation-counter')?.textContent?.trim();
            if (score && motivationText) score.textContent = `💎 ${motivationText.replace(/^💎\s*/, '')}`;
            const bossIcon = document.getElementById('boss-icon')?.textContent?.trim() || '👹';
            const bossWidth = document.getElementById('boss-hp-fill')?.style?.width || '100%';
            if (boss) boss.textContent = `${bossIcon} ${bossWidth || '100%'}`;
            const timerText = document.getElementById('rent-timer-display')?.textContent?.trim();
            if (timer && timerText) timer.textContent = timerText;
            const staminaWidth = document.getElementById('stamina-bar')?.style?.width || '100%';
            if (staminaFill) staminaFill.style.width = staminaWidth || '100%';
            if (bossFill) bossFill.style.width = bossWidth || '100%';
        };

        update();
        const interval = setInterval(update, 250);
        window.addEventListener('pagehide', () => clearInterval(interval), { once: true });
    }

    function initFocusMode() {
        const app = document.getElementById('app-viewport');
        if (!app || app.classList.contains('ui-focus')) return;
        app.classList.add('ui-focus');
        initHubMenu();
        initRoomSettings();
        initBossAssist();
        initCompactPlayHud();
        console.info(`[UI FOCUS ${UI_FOCUS_VERSION}] enabled`);
    }

    injectStyles();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFocusMode);
    } else {
        initFocusMode();
    }
})();
