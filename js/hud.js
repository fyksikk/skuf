/*
 * CYBER-SKUF UI focus layer.
 * Keeps the gameplay screen calm: persistent HUD shows only what matters now,
 * secondary navigation lives behind one menu button, and boss ad actions are contextual.
 */
(() => {
    'use strict';

    const UI_FOCUS_VERSION = '1.2.0';

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function injectStyles() {
        if (document.getElementById('skuf-ui-focus-styles')) return;

        const style = document.createElement('style');
        style.id = 'skuf-ui-focus-styles';
        style.textContent = `
            /* ---------------------------------------------------------
               PRIMARY HUD: only immediate gameplay information stays live
               --------------------------------------------------------- */
            #app-viewport.ui-focus .hud-nav-bar {
                display: none !important;
            }

            #app-viewport.ui-focus .hud-quick-actions {
                gap: 5px;
            }

            #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn {
                width: 30px;
                min-width: 30px;
                height: 30px;
                padding: 0;
                border-radius: 9px;
            }

            #app-viewport.ui-focus .hud-quick-actions .hud-btn-caption {
                display: none !important;
            }

            #app-viewport.ui-focus .hud-top-row {
                min-height: 32px;
            }

            #app-viewport.ui-focus #status-bar {
                gap: 4px;
            }

            /* Main menu trigger */
            #btn-open-hub-menu {
                position: relative;
                width: 30px;
                min-width: 30px;
                height: 30px;
                padding: 0;
                border: 1px solid rgba(255,255,255,.14);
                border-radius: 9px;
                background: rgba(255,255,255,.06);
                color: #e2e8f0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font: 900 16px/1 inherit;
                cursor: pointer;
                transition: transform .1s ease, background .15s ease, border-color .15s ease;
            }

            #btn-open-hub-menu:hover,
            #btn-open-hub-menu.active {
                background: rgba(0,229,255,.10);
                border-color: rgba(0,229,255,.34);
                color: #67e8f9;
            }

            #btn-open-hub-menu:active {
                transform: scale(.92);
            }

            /* ---------------------------------------------------------
               SECONDARY NAVIGATION POPOVER
               --------------------------------------------------------- */
            #hub-menu-popover {
                position: absolute;
                z-index: 125;
                width: min(270px, calc(100% - 16px));
                padding: 8px;
                border: 1px solid rgba(255,255,255,.11);
                border-radius: 13px;
                background: rgba(6,10,20,.97);
                box-shadow: 0 18px 42px rgba(0,0,0,.48), 0 0 24px rgba(0,229,255,.07);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                opacity: 0;
                transform: translateY(-5px) scale(.985);
                transform-origin: top right;
                pointer-events: none;
                transition: opacity .14s ease, transform .14s ease;
            }

            #hub-menu-popover.open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }

            .hub-menu-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: 27px;
                padding: 0 2px 6px;
                color: #94a3b8;
                font-size: 9px;
                font-weight: 900;
                letter-spacing: .55px;
                text-transform: uppercase;
            }

            .hub-menu-close {
                width: 25px;
                height: 25px;
                padding: 0;
                border: 0;
                border-radius: 7px;
                background: transparent;
                color: #94a3b8;
                cursor: pointer;
                font-size: 14px;
            }

            .hub-menu-close:hover {
                color: #fff;
                background: rgba(255,255,255,.07);
            }

            .hub-menu-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 6px;
            }

            #hub-menu-popover .hub-menu-item {
                min-width: 0;
                width: 100%;
                min-height: 48px;
                padding: 7px 8px;
                border: 1px solid rgba(255,255,255,.08);
                border-radius: 10px;
                background: rgba(255,255,255,.045);
                color: #dbe5f3;
                display: flex !important;
                flex-direction: column;
                align-items: flex-start;
                justify-content: center;
                gap: 4px;
                box-shadow: none !important;
                cursor: pointer;
                overflow: hidden;
                transition: background .14s ease, border-color .14s ease, transform .1s ease;
            }

            #hub-menu-popover .hub-menu-item:hover {
                background: rgba(0,229,255,.075);
                border-color: rgba(0,229,255,.22);
            }

            #hub-menu-popover .hub-menu-item:active {
                transform: scale(.97);
            }

            .hub-menu-icon {
                font-size: 17px;
                line-height: 1;
            }

            .hub-menu-label {
                width: 100%;
                font-size: 10px;
                font-weight: 800;
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-align: left;
            }

            /* Hide old desktop duplicates after they have been moved or superseded. */
            #app-viewport.ui-focus #desktop-sidebar #btn-side-leaderboard,
            #app-viewport.ui-focus #desktop-sidebar #btn-side-stats,
            #app-viewport.ui-focus #desktop-sidebar #btn-side-boosts {
                display: none !important;
            }

            #app-viewport.ui-focus #desktop-sidebar .sidebar-actions-grid {
                grid-template-columns: 1fr !important;
            }

            /* ---------------------------------------------------------
               BOSS HELP: one contextual entry instead of two permanent ad buttons
               --------------------------------------------------------- */
            #btn-toggle-boss-assist {
                width: 100%;
                min-height: 24px;
                margin-top: 4px;
                padding: 3px 8px;
                border: 1px solid rgba(255,255,255,.08);
                border-radius: 7px;
                background: rgba(255,255,255,.035);
                color: #94a3b8;
                font-size: 8.5px;
                font-weight: 800;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                transition: background .14s ease, color .14s ease, border-color .14s ease;
            }

            #btn-toggle-boss-assist:hover,
            #btn-toggle-boss-assist.open {
                color: #e2e8f0;
                background: rgba(255,255,255,.06);
                border-color: rgba(255,255,255,.13);
            }

            #boss-tactical-assist.focus-collapsed {
                display: none !important;
            }

            #boss-tactical-assist.focus-expanded {
                display: flex !important;
                animation: focusAssistIn .13s ease-out;
            }

            @keyframes focusAssistIn {
                from { opacity: 0; transform: translateY(-3px); }
                to   { opacity: 1; transform: translateY(0); }
            }

            /* ---------------------------------------------------------
               DESKTOP DOSSIER: reduce text density, keep visual evolution
               --------------------------------------------------------- */
            #app-viewport.ui-focus #desktop-sidebar {
                gap: 6px;
                padding: 7px 9px;
            }

            #app-viewport.ui-focus #desktop-sidebar .sidebar-section {
                padding: 6px 8px;
                border-radius: 10px;
            }

            #app-viewport.ui-focus #desktop-sidebar .profile-section {
                padding-top: 5px;
                padding-bottom: 5px;
            }

            #app-viewport.ui-focus #desktop-sidebar .skuf-status-desc {
                display: none !important;
            }

            #app-viewport.ui-focus #desktop-sidebar .metrics-section {
                gap: 4px;
            }

            #app-viewport.ui-focus #desktop-sidebar .side-metric-item {
                min-height: 32px;
                padding: 4px 7px;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                gap: 5px;
            }

            #app-viewport.ui-focus #desktop-sidebar .side-metric-lbl {
                margin: 0;
                font-size: 8.5px;
            }

            #app-viewport.ui-focus #desktop-sidebar .side-metric-val {
                font-size: 11px;
                text-align: right;
            }

            #app-viewport.ui-focus #desktop-sidebar .evo-section {
                padding-bottom: 7px;
            }

            /* ---------------------------------------------------------
               MODALS: one visual language, lower perceived text density
               --------------------------------------------------------- */
            #app-viewport.ui-focus .modal-box {
                border-radius: 16px;
                border-color: rgba(255,255,255,.10);
                box-shadow: 0 24px 60px rgba(0,0,0,.50);
            }

            #app-viewport.ui-focus .modal-top {
                min-height: 34px;
                padding-bottom: 7px;
                margin-bottom: 5px;
                border-bottom: 1px solid rgba(255,255,255,.06);
            }

            #app-viewport.ui-focus .modal-top h3 {
                font-size: 13px;
                letter-spacing: .25px;
            }

            #app-viewport.ui-focus .upgrade-card,
            #app-viewport.ui-focus .quest-card,
            #app-viewport.ui-focus .achievement-card,
            #app-viewport.ui-focus .boost-card {
                border-radius: 10px;
                border-color: rgba(255,255,255,.07);
                background: rgba(255,255,255,.035);
                box-shadow: none;
            }

            #app-viewport.ui-focus .upg-name,
            #app-viewport.ui-focus .quest-name,
            #app-viewport.ui-focus .boost-title {
                font-size: 11px;
                line-height: 1.18;
            }

            #app-viewport.ui-focus .upg-desc,
            #app-viewport.ui-focus .quest-desc,
            #app-viewport.ui-focus .boost-desc {
                color: #91a0b6;
                font-size: 9.5px;
                line-height: 1.32;
            }

            #app-viewport.ui-focus .tabs-nav {
                gap: 4px;
                padding: 3px;
                border-radius: 10px;
                background: rgba(255,255,255,.025);
            }

            #app-viewport.ui-focus .shop-tab {
                min-height: 28px;
                border-radius: 7px;
                font-size: 9px;
            }

            /* ---------------------------------------------------------
               MOBILE
               --------------------------------------------------------- */
            @media (max-width: 519px),
                   (orientation: portrait) and (max-aspect-ratio: 1.149/1) {
                #app-viewport.ui-focus #status-bar {
                    padding: 4px 7px;
                    gap: 3px;
                }

                #app-viewport.ui-focus .motivation-box .label,
                #app-viewport.ui-focus .stamina-box .label {
                    font-size: 7.5px;
                }

                #app-viewport.ui-focus #motivation-counter {
                    font-size: 13px;
                }

                #app-viewport.ui-focus #passive-counter {
                    font-size: 8px;
                }

                #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn,
                #btn-open-hub-menu {
                    width: 28px;
                    min-width: 28px;
                    height: 28px;
                }

                #hub-menu-popover {
                    width: calc(100% - 12px);
                    border-radius: 12px;
                    padding: 7px;
                }

                .hub-menu-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 5px;
                }

                #hub-menu-popover .hub-menu-item {
                    min-height: 52px;
                    padding: 6px;
                    align-items: center;
                    text-align: center;
                }

                .hub-menu-label {
                    font-size: 8.5px;
                    text-align: center;
                }

                #btn-toggle-boss-assist {
                    min-height: 22px;
                    margin-top: 3px;
                    font-size: 8px;
                }

                #app-viewport.ui-focus .modal-backdrop {
                    padding: 6px;
                }

                #app-viewport.ui-focus .modal-box {
                    width: 100%;
                    max-height: calc(100dvh - 12px);
                    padding: 10px;
                    border-radius: 13px;
                }

                #app-viewport.ui-focus .cards-scroll {
                    max-height: 64dvh;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createMenuItem(button, icon, label) {
        if (!button) return null;

        button.classList.add('hub-menu-item');
        button.innerHTML = `
            <span class="hub-menu-icon" aria-hidden="true">${icon}</span>
            <span class="hub-menu-label">${label}</span>
        `;
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
        popover.innerHTML = `
            <div class="hub-menu-head">
                <span>Меню</span>
                <button type="button" class="hub-menu-close" aria-label="Закрыть меню">✕</button>
            </div>
            <div class="hub-menu-grid"></div>
        `;
        app.appendChild(popover);

        const grid = popover.querySelector('.hub-menu-grid');
        const sourceNav = document.querySelector('.hud-nav-bar');

        const items = [
            [document.getElementById('btn-open-shop'), '🛠️', 'Прокачка'],
            [document.getElementById('btn-open-quests'), '📋', 'Квесты'],
            [document.getElementById('btn-open-prestige'), '🌀', 'Сансара'],
            [document.getElementById('btn-open-stats'), '📊', 'Статистика'],
            [document.getElementById('btn-open-leaderboard'), '🏆', 'Лидерборд'],
            [document.getElementById('btn-side-guide'), '📖', 'Правила']
        ];

        items.forEach(([button, icon, label]) => {
            const item = createMenuItem(button, icon, label);
            if (item) grid?.appendChild(item);
        });

        if (sourceNav) {
            sourceNav.setAttribute('aria-hidden', 'true');
        }

        const placePopover = () => {
            const appRect = app.getBoundingClientRect();
            const buttonRect = menuButton.getBoundingClientRect();
            const width = Math.min(270, Math.max(210, appRect.width - 16));

            popover.style.width = `${width}px`;

            const left = clamp(
                buttonRect.right - appRect.left - width,
                6,
                Math.max(6, appRect.width - width - 6)
            );

            const top = clamp(
                buttonRect.bottom - appRect.top + 6,
                6,
                Math.max(6, appRect.height - popover.offsetHeight - 6)
            );

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
            if (popover.classList.contains('open')) closeMenu();
            else openMenu();
        });

        popover.querySelector('.hub-menu-close')?.addEventListener('click', closeMenu);

        grid?.addEventListener('click', event => {
            const item = event.target.closest('.hub-menu-item');
            if (item) closeMenu();
        });

        document.addEventListener('pointerdown', event => {
            if (!popover.classList.contains('open')) return;
            if (popover.contains(event.target) || menuButton.contains(event.target)) return;
            closeMenu();
        }, { passive: true });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeMenu();
        });

        window.addEventListener('resize', () => {
            if (popover.classList.contains('open')) placePopover();
        }, { passive: true });
    }

    function initBossAssist() {
        const bossBar = document.getElementById('boss-bar');
        const tactical = document.getElementById('boss-tactical-assist');
        if (!bossBar || !tactical || document.getElementById('btn-toggle-boss-assist')) return;

        const toggle = document.createElement('button');
        toggle.id = 'btn-toggle-boss-assist';
        toggle.type = 'button';
        toggle.innerHTML = '<span>🎬 Помощь</span><span aria-hidden="true">⌄</span>';
        toggle.title = 'Тактическая помощь за рекламу';
        toggle.setAttribute('aria-expanded', 'false');

        tactical.parentNode.insertBefore(toggle, tactical);
        tactical.classList.add('focus-collapsed');

        let autoCloseTimer = null;

        const setOpen = open => {
            tactical.classList.toggle('focus-collapsed', !open);
            tactical.classList.toggle('focus-expanded', open);
            toggle.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.lastElementChild.textContent = open ? '⌃' : '⌄';

            clearTimeout(autoCloseTimer);
            if (open) {
                autoCloseTimer = setTimeout(() => setOpen(false), 8000);
            }
        };

        toggle.addEventListener('click', () => {
            setOpen(!tactical.classList.contains('focus-expanded'));
        });

        tactical.addEventListener('click', event => {
            if (event.target.closest('button')) {
                setTimeout(() => setOpen(false), 120);
            }
        });
    }

    function initFocusMode() {
        const app = document.getElementById('app-viewport');
        if (!app || app.classList.contains('ui-focus')) return;

        app.classList.add('ui-focus');
        initHubMenu();
        initBossAssist();

        console.info(`[UI FOCUS ${UI_FOCUS_VERSION}] enabled`);
    }

    injectStyles();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFocusMode);
    } else {
        initFocusMode();
    }
})();
