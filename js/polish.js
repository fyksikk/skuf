/*
 * Runtime polish layer for CYBER-SKUF.
 * Keeps the base architecture intact while adding:
 * - fully synchronized daily modifiers;
 * - unique boss passives with HUD output;
 * - collapsible HUD for desktop and mobile.
 */
(() => {
    'use strict';

    const POLISH_VERSION = '1.0.4';

    const BOSS_EFFECTS = {
        1:  { icon: '🏠', title: 'Проверка квартиры', desc: 'Атаки босса происходят на 8% чаще.', attackCooldownMult: 0.92 },
        2:  { icon: '💳', title: 'Долговая петля', desc: 'После сброса мысли есть +6% шанс получить дополнительный мусор.', extraGarbageChance: 0.06 },
        3:  { icon: '📋', title: 'Сверхурочные', desc: 'Восстановление Дыхалки снижено на 12%.', staminaRecoveryMult: 0.88 },
        4:  { icon: '💔', title: 'Эмоциональные качели', desc: 'Кулдаун сброса мыслей увеличен на 7%.', dropCooldownMult: 1.07 },
        5:  { icon: '🍔', title: 'Комбо-набор', desc: 'Тапы по Скуфу расходуют на 15% больше Дыхалки.', tapStaminaMult: 1.15 },
        6:  { icon: '🌧️', title: 'Апатия', desc: 'Пассивный доход снижен на 10%.', incomeMult: 0.90 },
        7:  { icon: '🎓', title: 'Продажа воздуха', desc: 'Босс получает на 8% меньше урона.', bossDamageTakenMult: 0.92 },
        8:  { icon: '🪙', title: 'Рагпул', desc: 'Пассивный доход снижен на 12%, но Хайп заряжается на 10% быстрее.', incomeMult: 0.88, feverChargeMult: 1.10 },
        9:  { icon: '🎭', title: 'Синдром сомнений', desc: 'Босс получает на 10% меньше урона.', bossDamageTakenMult: 0.90 },
        10: { icon: '🏦', title: 'Проценты капают', desc: 'После сброса мысли есть +7% шанс получить дополнительный мусор.', extraGarbageChance: 0.07 },
        11: { icon: '🛵', title: 'Курьер уже у двери', desc: 'Атаки босса происходят на 10% чаще.', attackCooldownMult: 0.90 },
        12: { icon: '🤖', title: 'Автоматизация', desc: 'Босс получает на 12% меньше урона, а сброс мыслей медленнее на 5%.', bossDamageTakenMult: 0.88, dropCooldownMult: 1.05 },
        13: { icon: '🔥', title: 'Выгорание', desc: 'Восстановление Дыхалки снижено на 25%.', staminaRecoveryMult: 0.75 },
        14: { icon: '🎖️', title: 'Внезапный визит', desc: 'Атаки босса происходят на 16% чаще.', attackCooldownMult: 0.84 },
        15: { icon: '🏍️', title: 'Кризис среднего возраста', desc: 'Тапы расходуют на 20% больше Дыхалки.', tapStaminaMult: 1.20 },
        16: { icon: '🗂️', title: 'Бумажная волокита', desc: 'Кулдаун сброса мыслей увеличен на 15%.', dropCooldownMult: 1.15 },
        17: { icon: '🛋️', title: 'Чёрная дыра дивана', desc: 'Дыхалка восстанавливается на 20% медленнее, тапы дороже на 10%.', staminaRecoveryMult: 0.80, tapStaminaMult: 1.10 },
        18: { icon: '⏳', title: 'Тик-так', desc: 'Атаки босса происходят на 20% чаще.', attackCooldownMult: 0.80 },
        19: { icon: '☠️', title: 'Последний порог', desc: 'Босс получает на 15% меньше урона, +8% шанс дополнительного мусора.', bossDamageTakenMult: 0.85, extraGarbageChance: 0.08 },
        20: { icon: '👑', title: 'Судьба давит', desc: 'Босс получает на 20% меньше урона, атакует на 22% чаще и чаще подкидывает мусор.', bossDamageTakenMult: 0.80, attackCooldownMult: 0.78, extraGarbageChance: 0.08 }
    };

    function normalizeDailyModifiers() {
        if (typeof CONFIG === 'undefined' || !CONFIG.DAILY_MODIFIERS) return;
        Object.assign(CONFIG.DAILY_MODIFIERS[0], { id: 'sunday_beer', title: 'Пивной Выходной', desc: '🍺 40% шанс дополнительного расходника после босса, заряд Хайпа +25%' });
        Object.assign(CONFIG.DAILY_MODIFIERS[1], { id: 'monday_grind', title: 'Тяжёлый Понедельник', desc: '💼 Награда за слияния x2, боссы атакуют на 25% чаще' });
        Object.assign(CONFIG.DAILY_MODIFIERS[2], { id: 'tuesday_fever', title: 'Крипто-Вторник', desc: '📈 Пассивный доход +50%, автосброс ускорен до 0.9с' });
        Object.assign(CONFIG.DAILY_MODIFIERS[3], { id: 'wednesday_cat', title: 'День Котика', desc: '🐾 Кулдаун кота 5с; если мусор есть, кот гарантированно убирает 1 штуку' });
        Object.assign(CONFIG.DAILY_MODIFIERS[4], { id: 'thursday_clean', title: 'Чистый Четверг', desc: '✨ Радиус очистки мусора от слияний увеличен на 50%' });
        Object.assign(CONFIG.DAILY_MODIFIERS[5], { id: 'friday_hype', title: 'Пятничный Хайп', desc: '🎉 Лихорадка / Fever длится в 2 раза дольше' });
        Object.assign(CONFIG.DAILY_MODIFIERS[6], { id: 'saturday_chill', title: 'Субботний Чилл', desc: '🎮 Тапы по Скуфу расходуют на 50% меньше Дыхалки' });
    }

    function getBossEffect(game) {
        const idx = Math.max(1, Math.min(20, Number(game?.currentBossIndex || game?.day || 1)));
        return BOSS_EFFECTS[idx] || BOSS_EFFECTS[1];
    }

    function applyDerivedModifiers(game) {
        if (!game) return;
        const effect = getBossEffect(game);
        if (game.activeDailyMod?.id === 'tuesday_fever') game.passiveIncome *= 1.5;
        if (Number.isFinite(effect.incomeMult)) game.passiveIncome *= effect.incomeMult;
        if (Number.isFinite(effect.staminaRecoveryMult)) game.staminaRecoveryRate *= effect.staminaRecoveryMult;
        if (Number.isFinite(effect.dropCooldownMult)) game.baseDropCooldownMs = Math.max(140, Math.round((game.baseDropCooldownMs || 380) * effect.dropCooldownMult));
        game.updateDropCooldownFromState?.();
        game.hudDirty = true;
    }

    function spawnExtraGarbage(game, chance) {
        if (!game?.physics || !chance || Math.random() >= chance) return;
        const garbageList = CONFIG.GARBAGE_TYPES || [];
        if (!garbageList.length) return;
        const bounds = game.physics.getCupBounds();
        const garbage = garbageList[Math.floor(Math.random() * garbageList.length)];
        const x = bounds.leftX + 32 + Math.random() * Math.max(1, bounds.width - 64);
        game.physics.createGarbage(x, game.dropY, garbage);
        game.spawnFloatingText?.(x, game.roomHeight + 38, `⚠️ ${garbage.name}`, garbage.hazardColor || '#f59e0b');
    }

    function renderBossEffect(game, boss = null) {
        const bossBar = document.getElementById('boss-bar');
        if (!bossBar) return;
        let row = document.getElementById('boss-effect-row');
        if (!row) {
            row = document.createElement('div');
            row.id = 'boss-effect-row';
            row.className = 'boss-effect-row';
            row.innerHTML = '<span class="boss-effect-label">ЭФФЕКТ БОССА</span><span id="boss-effect-badge" class="boss-effect-badge"></span>';
            const dailyRow = bossBar.querySelector('.mission-effect-row');
            const bossInfo = bossBar.querySelector('.boss-info');
            if (dailyRow?.nextSibling) bossBar.insertBefore(row, dailyRow.nextSibling);
            else if (bossInfo) bossBar.insertBefore(row, bossInfo);
            else bossBar.appendChild(row);
        }
        const isBreak = boss && /ПЕРЕДЫШКА/i.test(String(boss.name || boss.title || ''));
        row.classList.toggle('hidden', !!isBreak);
        if (isBreak) return;
        const effect = getBossEffect(game);
        const badge = document.getElementById('boss-effect-badge');
        if (!badge) return;
        badge.textContent = `${effect.icon} ${effect.title}`;
        badge.title = effect.desc;
        badge.dataset.desc = effect.desc;
    }

    function patchGame(game) {
        if (!game || game.__polishPatched) return;
        game.__polishPatched = true;
        game.initDailyModifier?.();
        game.ui?.updateDailyModifier?.(game.activeDailyMod);

        const originalRecalculatePassives = game.recalculatePassives.bind(game);
        game.recalculatePassives = function (...args) {
            const result = originalRecalculatePassives(...args);
            applyDerivedModifiers(this);
            return result;
        };

        const originalDealBossDamage = game.dealBossDamage.bind(game);
        game.dealBossDamage = function (amount, ...rest) {
            if (this.bossBreakTimer > 0) return originalDealBossDamage(amount, ...rest);
            const effect = getBossEffect(this);
            const mult = this.__polishBypassBossResistance ? 1 : (Number.isFinite(effect.bossDamageTakenMult) ? effect.bossDamageTakenMult : 1);
            return originalDealBossDamage(Math.max(0, Number(amount || 0) * mult), ...rest);
        };

        const originalApplyBossNuke = game.applyBossNuke?.bind(game);
        if (originalApplyBossNuke) {
            game.applyBossNuke = function (...args) {
                this.__polishBypassBossResistance = true;
                try { return originalApplyBossNuke(...args); }
                finally { this.__polishBypassBossResistance = false; }
            };
        }
        const originalApplyBoost = game.applyBoost?.bind(game);
        if (originalApplyBoost) {
            game.applyBoost = function (boostType, ...args) {
                const bypass = boostType === 'nuke';
                if (bypass) this.__polishBypassBossResistance = true;
                try { return originalApplyBoost(boostType, ...args); }
                finally { if (bypass) this.__polishBypassBossResistance = false; }
            };
        }

        const originalExecuteBossAttack = game.executeBossAttack.bind(game);
        game.executeBossAttack = function (...args) {
            const result = originalExecuteBossAttack(...args);
            const effect = getBossEffect(this);
            if (Number.isFinite(effect.attackCooldownMult)) this.bossAttackTimer = Math.max(4.5, this.bossAttackTimer * effect.attackCooldownMult);
            return result;
        };
        const originalCheckGarbageSpawn = game.checkGarbageSpawn.bind(game);
        game.checkGarbageSpawn = function (...args) {
            const result = originalCheckGarbageSpawn(...args);
            spawnExtraGarbage(this, getBossEffect(this).extraGarbageChance || 0);
            return result;
        };
        const originalHandleSkufTap = game.handleSkufTap.bind(game);
        game.handleSkufTap = function (...args) {
            const before = this.stamina;
            const result = originalHandleSkufTap(...args);
            const spent = Math.max(0, before - this.stamina);
            if (spent > 0) {
                let staminaMult = getBossEffect(this).tapStaminaMult || 1;
                if (this.activeDailyMod?.id === 'saturday_chill') staminaMult *= 0.5;
                this.stamina = Math.max(0, Math.min(this.maxStamina, this.stamina - (spent * staminaMult - spent)));
                if (this.stamina > 0) this.isExhausted = false;
                this.ui?.updateStamina?.(this.stamina, this.maxStamina, this.isExhausted);
            }
            return result;
        };
        const originalTriggerFeverMode = game.triggerFeverMode.bind(game);
        game.triggerFeverMode = function (durationOverride = null, ...rest) {
            let duration = durationOverride;
            if (this.activeDailyMod?.id === 'friday_hype') duration = (durationOverride ?? this.feverDuration ?? 10) * 2;
            return originalTriggerFeverMode(duration, ...rest);
        };
        const originalAddFeverCharge = game.addFeverCharge?.bind(game);
        if (originalAddFeverCharge) {
            game.addFeverCharge = function (amount, ...rest) {
                let mult = this.activeDailyMod?.id === 'sunday_beer' ? 1.25 : 1;
                mult *= getBossEffect(this).feverChargeMult || 1;
                return originalAddFeverCharge(Number(amount || 0) * mult, ...rest);
            };
        }
        const originalOnBossDefeated = game.onBossDefeated.bind(game);
        game.onBossDefeated = function (...args) {
            const result = originalOnBossDefeated(...args);
            if (this.activeDailyMod?.id === 'sunday_beer' && Math.random() < 0.40) {
                const itemPool = ['beer', 'script', 'energy', 'bomb', 'magnet'];
                const item = itemPool[Math.floor(Math.random() * itemPool.length)];
                this.items[item] = (this.items[item] || 0) + 1;
                this.ui?.updateConsumables?.(this.items);
                this.spawnFloatingText?.(this.canvas.width / 2, this.roomHeight + 68, '🍺 ВЫХОДНОЙ: +1 РАСХОДНИК!', '#facc15');
                this.saveGame?.();
            }
            return result;
        };
        const originalAdvanceDay = game.advanceDay.bind(game);
        game.advanceDay = function (...args) {
            const result = originalAdvanceDay(...args);
            this.recalculatePassives();
            renderBossEffect(this, CONFIG.BOSSES[this.currentBossIndex]);
            return result;
        };

        const refreshResetFlow = methodName => {
            const original = game[methodName]?.bind(game);
            if (!original) return;
            game[methodName] = function (...args) {
                const result = original(...args);
                this.recalculatePassives?.();
                this.ui?.updateDailyModifier?.(this.activeDailyMod);
                renderBossEffect(this, CONFIG.BOSSES[this.currentBossIndex]);
                return result;
            };
        };
        refreshResetFlow('restart');
        refreshResetFlow('resetGame');
        refreshResetFlow('triggerPrestige');

        if (game.ui && !game.ui.__bossEffectPatched) {
            game.ui.__bossEffectPatched = true;
            const originalUpdateBoss = game.ui.updateBoss.bind(game.ui);
            game.ui.updateBoss = (...args) => {
                const result = originalUpdateBoss(...args);
                renderBossEffect(game, args[0]);
                return result;
            };
        }
        game.recalculatePassives();
        renderBossEffect(game, CONFIG.BOSSES[game.currentBossIndex]);
        game.ui?.updateDailyModifier?.(game.activeDailyMod);
        console.info(`[POLISH ${POLISH_VERSION}] Daily modifiers and boss passives enabled`);
    }

    function injectStyles() {
        if (document.getElementById('skuf-polish-styles')) return;
        const style = document.createElement('style');
        style.id = 'skuf-polish-styles';
        style.textContent = `
            .boss-effect-row { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:start; gap:5px; width:100%; margin:0 0 5px; }
            .boss-effect-row.hidden { display:none !important; }
            .boss-effect-label { padding:2px 5px; border-radius:6px; border:1px solid rgba(244,63,94,.30); background:rgba(244,63,94,.09); color:#fda4af; font-size:8px; font-weight:900; line-height:1.25; letter-spacing:.35px; white-space:nowrap; }
            .boss-effect-badge { display:block; min-width:0; padding:2px 6px; border:1px solid rgba(244,63,94,.24); border-radius:6px; background:rgba(73,16,33,.24); color:#fecdd3; font-size:8.5px; font-weight:800; line-height:1.25; white-space:normal; overflow:hidden; cursor:help; }
            .boss-effect-badge::after { content:" — " attr(data-desc); color:#aeb9cc; font-weight:600; }
            #btn-collapse-hud { position:absolute; z-index:85; width:28px; height:42px; padding:0; border:1px solid rgba(0,229,255,.30); border-radius:0 10px 10px 0; background:rgba(5,9,18,.90); color:#67e8f9; font-size:18px; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 0 14px rgba(0,229,255,.12); backdrop-filter:blur(8px); transition:left .22s ease,top .22s ease,transform .12s ease,background .12s ease; touch-action:manipulation; }
            #btn-collapse-hud:hover { background:rgba(0,229,255,.10); border-color:rgba(0,229,255,.55); }
            @media (orientation:landscape) and (min-width:520px), (min-aspect-ratio:1.15/1) and (min-width:520px) {
                #app-viewport { transition:grid-template-columns .22s ease; }
                #app-viewport.hud-collapsed { grid-template-columns:0 minmax(0,1fr) !important; }
                #app-viewport.hud-collapsed #status-bar,#app-viewport.hud-collapsed #boss-bar,#app-viewport.hud-collapsed #relics-bar,#app-viewport.hud-collapsed #consumables-bar,#app-viewport.hud-collapsed #desktop-sidebar,#app-viewport.hud-collapsed #action-panel { display:none !important; }
                #app-viewport.hud-collapsed #canvas-wrapper { grid-column:1/-1 !important; grid-row:1/-1 !important; width:100% !important; height:100% !important; }
            }
            @media (max-width:519px), (orientation:portrait) and (max-aspect-ratio:1.149/1) {
                #btn-collapse-hud { width:46px; height:24px; border-radius:0 0 10px 10px; font-size:15px; }
                #app-viewport.hud-collapsed #status-bar,#app-viewport.hud-collapsed #boss-bar,#app-viewport.hud-collapsed #relics-bar,#app-viewport.hud-collapsed #consumables-bar { display:none !important; }
                #app-viewport.hud-collapsed #action-panel { display:block !important; flex-shrink:0; }
                #app-viewport.hud-collapsed #canvas-wrapper { flex:1 1 auto !important; width:100% !important; height:100% !important; min-height:0 !important; }
            }
        `;
        document.head.appendChild(style);
    }

    function isDesktopLayout() {
        return window.matchMedia('(orientation: landscape) and (min-width: 520px), (min-aspect-ratio: 1.15/1) and (min-width: 520px)').matches;
    }

    function initHudCollapse() {
        const app = document.getElementById('app-viewport');
        if (!app || document.getElementById('btn-collapse-hud')) return;
        const button = document.createElement('button');
        button.id = 'btn-collapse-hud';
        button.type = 'button';
        button.setAttribute('aria-label', 'Свернуть интерфейс');
        app.appendChild(button);
        const getKey = () => isDesktopLayout() ? 'skuf_hud_collapsed_desktop_v1' : 'skuf_hud_collapsed_mobile_v1';
        const getStored = () => { try { return localStorage.getItem(getKey()) === 'true'; } catch { return false; } };
        const saveStored = value => { try { localStorage.setItem(getKey(), String(value)); } catch {} };
        const placeButton = () => {
            const collapsed = app.classList.contains('hud-collapsed');
            const appRect = app.getBoundingClientRect();
            if (isDesktopLayout()) {
                const statusRect = document.getElementById('status-bar')?.getBoundingClientRect();
                const panelWidth = statusRect && statusRect.width > 0 ? statusRect.width : 300;
                button.style.left = collapsed ? '0px' : `${Math.max(0, panelWidth - 1)}px`;
                button.style.top = '50%';
                button.style.right = 'auto';
                button.style.transform = 'translateY(-50%)';
                button.style.borderRadius = '0 10px 10px 0';
                button.textContent = collapsed ? '›' : '‹';
                button.title = collapsed ? 'Развернуть левую панель' : 'Свернуть левую панель';
            } else {
                let expandedTop = 4;
                if (!collapsed) {
                    for (const id of ['relics-bar','boss-bar','status-bar']) {
                        const el = document.getElementById(id);
                        if (!el || getComputedStyle(el).display === 'none') continue;
                        const rect = el.getBoundingClientRect();
                        if (rect.height > 0) { expandedTop = Math.max(4, rect.bottom - appRect.top - 12); break; }
                    }
                }
                button.style.left = '50%';
                button.style.top = `${collapsed ? 0 : expandedTop}px`;
                button.style.right = 'auto';
                button.style.transform = 'translateX(-50%)';
                button.style.borderRadius = '0 0 10px 10px';
                button.textContent = collapsed ? '⌄' : '⌃';
                button.title = collapsed ? 'Развернуть верхнюю панель' : 'Свернуть верхнюю панель';
            }
            button.setAttribute('aria-expanded', String(!collapsed));
            button.setAttribute('aria-label', button.title);
        };
        const applyState = collapsed => {
            app.classList.toggle('hud-collapsed', collapsed);
            saveStored(collapsed);
            placeButton();
            const resizeGame = () => window.gameInstance?.resizeCanvas?.();
            requestAnimationFrame(resizeGame);
            setTimeout(resizeGame, 40);
            setTimeout(resizeGame, 240);
        };
        button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); applyState(!app.classList.contains('hud-collapsed')); });
        let lastDesktop = isDesktopLayout();
        applyState(getStored());
        window.addEventListener('resize', () => {
            const nowDesktop = isDesktopLayout();
            if (nowDesktop !== lastDesktop) {
                lastDesktop = nowDesktop;
                app.classList.toggle('hud-collapsed', getStored());
            }
            placeButton();
            window.gameInstance?.resizeCanvas?.();
        }, { passive: true });
    }

    function waitForGame() {
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            if (window.gameInstance) { clearInterval(timer); patchGame(window.gameInstance); }
            else if (attempts > 240) { clearInterval(timer); console.warn('[POLISH] gameInstance was not created in time'); }
        }, 50);
    }

    normalizeDailyModifiers();
    injectStyles();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { initHudCollapse(); waitForGame(); });
    else { initHudCollapse(); waitForGame(); }
})();
