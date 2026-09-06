class UIManager {
    constructor(game) {
        this.game = game;
        this.activeTab = 'hero';
        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        // Оверлеи
        this.startMenu = document.getElementById('start-menu-overlay');
        this.guideOverlay = document.getElementById('guide-overlay');
        this.shopOverlay = document.getElementById('shop-overlay');
        this.questsOverlay = document.getElementById('quests-overlay');
        this.prestigeOverlay = document.getElementById('prestige-overlay');
        this.statsOverlay = document.getElementById('stats-overlay');
        this.perkOverlay = document.getElementById('perk-overlay');
        this.offlineOverlay = document.getElementById('offline-overlay');
        this.gameOverOverlay = document.getElementById('gameover-overlay');
        this.eventOverlay = document.getElementById('event-overlay');
        
        // HUD
        this.motivationCounter = document.getElementById('motivation-counter');
        this.passiveCounter = document.getElementById('passive-counter');
        this.staminaBar = document.getElementById('stamina-bar');
        this.staminaAlert = document.getElementById('stamina-alert');
        
        // Босс
        this.bossName = document.getElementById('boss-name');
        this.bossDayTag = document.getElementById('boss-day-tag');
        this.bossHpText = document.getElementById('boss-hp-text');
        this.bossHpFill = document.getElementById('boss-hp-fill');
        this.bossQuoteBubble = document.getElementById('boss-quote-bubble');
        
        // Фаза & Аренда
        this.rentDayLabel = document.getElementById('rent-day-label');
        this.crisisBadge = document.getElementById('crisis-badge');
        this.rentTimerDisplay = document.getElementById('rent-timer-display');
        this.autoDropBadge = document.getElementById('auto-drop-badge');
        this.relicsContainer = document.getElementById('relics-container');
        
        // Индикаторы
        this.nextThoughtCircle = document.getElementById('next-thought-circle');
        this.comboDisplay = document.getElementById('combo-display');
        this.comboText = document.getElementById('combo-text');
        
        // Кнопки и слоты
        this.countBeer = document.getElementById('count-beer');
        this.countScript = document.getElementById('count-script');
        this.countEnergy = document.getElementById('count-energy');
        this.countBomb = document.getElementById('count-bomb');
        this.countMagnet = document.getElementById('count-magnet');
        
        // Хайп / Fever
        this.feverFill = document.getElementById('fever-fill');
        this.feverLabel = document.getElementById('fever-label');
        this.feverBanner = document.getElementById('fever-banner');

        // Рулетка / Колесо
        this.rouletteOverlay = document.getElementById('roulette-overlay');
        this.rouletteCanvas = document.getElementById('roulette-canvas');
        this.rouletteCtx = this.rouletteCanvas ? this.rouletteCanvas.getContext('2d') : null;
        this.rouletteBadge = document.getElementById('roulette-badge');
        this.btnSpinWheel = document.getElementById('btn-spin-wheel');
        this.roulettePrize = document.getElementById('roulette-prize');
        this.wheelCurrentAngle = 0;
        this.isWheelSpinning = false;

        // Ранг
        this.rankTitle = document.getElementById('rank-title');
        this.rankDesc = document.getElementById('rank-desc');
        this.rankBadge = document.getElementById('rank-badge');

        this.btnShake = document.getElementById('btn-brain-shake');
        this.btnShakeLabel = document.getElementById('btn-shake-label');
        this.heroQuote = document.getElementById('hero-quote');
        this.soundIcon = document.getElementById('sound-icon');
    }

    bindEvents() {
        // Старт и Гайд
        document.getElementById('btn-start-game')?.addEventListener('click', () => {
            this.startMenu.classList.remove('active');
            AudioCtrl.init();
            this.game.start();
        });

        document.getElementById('btn-open-guide')?.addEventListener('click', () => {
            this.guideOverlay.classList.add('active');
        });

        document.getElementById('btn-close-guide')?.addEventListener('click', () => {
            this.guideOverlay.classList.remove('active');
        });

        document.getElementById('btn-guide-back')?.addEventListener('click', () => {
            this.guideOverlay.classList.remove('active');
        });

        // Рулетка Фортуны
        document.getElementById('btn-open-roulette')?.addEventListener('click', () => {
            this.showRoulette();
        });
        document.getElementById('btn-close-roulette')?.addEventListener('click', () => {
            this.hideRoulette();
        });
        this.btnSpinWheel?.addEventListener('click', () => {
            if (!this.isWheelSpinning) {
                this.game.spinRoulette();
            }
        });

        // Открытие окон
        document.getElementById('btn-open-shop')?.addEventListener('click', () => {
            this.openShop();
        });

        document.getElementById('btn-close-shop')?.addEventListener('click', () => {
            this.shopOverlay.classList.remove('active');
        });

        document.getElementById('btn-open-quests')?.addEventListener('click', () => {
            this.openQuests();
        });

        document.getElementById('btn-close-quests')?.addEventListener('click', () => {
            this.questsOverlay.classList.remove('active');
        });

        document.getElementById('btn-open-prestige')?.addEventListener('click', () => {
            this.openPrestige();
        });

        document.getElementById('btn-close-prestige')?.addEventListener('click', () => {
            this.prestigeOverlay.classList.remove('active');
        });

        document.getElementById('btn-open-stats')?.addEventListener('click', () => {
            this.openStats();
        });

        document.getElementById('btn-close-stats')?.addEventListener('click', () => {
            this.statsOverlay.classList.remove('active');
        });

        // Вкладки магазина
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeTab = tab.dataset.category;
                this.renderUpgrades();
            });
        });

        // Кнопка звука
        document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
            const muted = AudioCtrl.toggleMute();
            this.soundIcon.textContent = muted ? '🔇' : '🔊';
        });

        // Кнопка спецэффектов (FX Вкл/Выкл)
        document.getElementById('btn-toggle-fx')?.addEventListener('click', () => {
            this.game.toggleFx();
        });

        // Забрать оффлайн доход
        document.getElementById('btn-claim-offline')?.addEventListener('click', () => {
            this.offlineOverlay.classList.remove('active');
        });

        // Рестарт после поражения
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            this.gameOverOverlay.classList.remove('active');
            this.game.restart();
        });

        // Совершить Престиж
        document.getElementById('btn-do-prestige')?.addEventListener('click', () => {
            this.game.triggerPrestige();
        });
    }

    updateMotivation(val, passive) {
        this.motivationCounter.textContent = `${CONFIG.formatNumber(val)} 🗿`;
        this.passiveCounter.textContent = `+${CONFIG.formatNumber(passive)}/сек`;
    }

    updateStamina(current, max, isExhausted) {
        const pct = Math.max(0, Math.min(100, (current / max) * 100));
        this.staminaBar.style.width = `${pct}%`;

        if (isExhausted) {
            this.staminaBar.style.background = '#ef4444';
            this.staminaAlert.textContent = 'ОДЫШКА!';
        } else {
            this.staminaBar.style.background = 'linear-gradient(90deg, #10b981, #00f0ff)';
            this.staminaAlert.textContent = '';
        }
    }

    updateBoss(boss, currentHp, day, maxDays = 20) {
        this.bossName.textContent = `БОСС: ${boss.name}`;
        this.bossDayTag.textContent = `День ${day}/${maxDays}`;
        const pct = Math.max(0, Math.min(100, (currentHp / boss.hp) * 100));
        this.bossHpFill.style.width = `${pct}%`;
        this.bossHpText.textContent = `${CONFIG.formatNumber(Math.max(0, Math.floor(currentHp)))} / ${CONFIG.formatNumber(boss.hp)} HP`;
        this.bossQuoteBubble.textContent = boss.quote || '';
    }

    updateRent(day, timeRemaining, phaseName) {
        this.rentDayLabel.textContent = `ДЕНЬ ${day}`;
        this.crisisBadge.textContent = phaseName;
        
        const m = Math.floor(timeRemaining / 60);
        const s = Math.floor(timeRemaining % 60);
        this.rentTimerDisplay.textContent = `⏳ ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    updateAutoDropBadge(enabled) {
        if (enabled) {
            this.autoDropBadge.classList.remove('hidden');
        } else {
            this.autoDropBadge.classList.add('hidden');
        }
    }

    updateRelics(relics) {
        this.relicsContainer.innerHTML = '';
        const bar = document.getElementById('relics-bar');
        if (relics && relics.length > 0) {
            if (bar) bar.classList.remove('hidden');
            relics.forEach(r => {
                const chip = document.createElement('div');
                chip.className = 'relic-chip';
                chip.title = `${r.badge} ${r.name}: ${r.desc}`;
                chip.textContent = r.badge;
                chip.addEventListener('click', () => {
                    this.setQuote(`«${r.badge} ${r.name}: ${r.desc}»`);
                });
                this.relicsContainer.appendChild(chip);
            });
        } else {
            if (bar) bar.classList.add('hidden');
        }
    }

    updateNextThought(tier) {
        const conf = CONFIG.TIERS[tier] || CONFIG.TIERS[1];
        this.nextThoughtCircle.style.background = conf.color;
        const img = this.game.charImages && this.game.charImages[tier];
        if (img && img.complete && img.naturalWidth > 0) {
            this.nextThoughtCircle.innerHTML = `<img src="${img.src}" style="max-width: 80%; max-height: 80%; object-fit: contain; border-radius: 4px; display: block;" alt="${conf.name}">`;
        } else {
            this.nextThoughtCircle.textContent = conf.emoji;
        }
    }

    updateShake(cooldown) {
        if (cooldown > 0) {
            this.btnShake.classList.add('disabled');
            this.btnShakeLabel.textContent = `Встряска (${Math.ceil(cooldown)}с)`;
        } else {
            this.btnShake.classList.remove('disabled');
            this.btnShakeLabel.textContent = 'Встряска мозга';
        }
    }

    updateConsumables(items) {
        if (this.countBeer) this.countBeer.textContent = `x${items.beer || 0}`;
        if (this.countScript) this.countScript.textContent = `x${items.script || 0}`;
        if (this.countEnergy) this.countEnergy.textContent = `x${items.energy || 0}`;
        if (this.countBomb) this.countBomb.textContent = `x${items.bomb || 0}`;
        if (this.countMagnet) this.countMagnet.textContent = `x${items.magnet || 0}`;
        
        document.getElementById('slot-beer')?.classList.toggle('disabled', (items.beer || 0) <= 0);
        document.getElementById('slot-script')?.classList.toggle('disabled', (items.script || 0) <= 0);
        document.getElementById('slot-energy')?.classList.toggle('disabled', (items.energy || 0) <= 0);
        document.getElementById('slot-bomb')?.classList.toggle('disabled', (items.bomb || 0) <= 0);
        document.getElementById('slot-magnet')?.classList.toggle('disabled', (items.magnet || 0) <= 0);
    }

    showCombo(count) {
        if (count >= 2) {
            this.comboText.textContent = `COMBO x${count}! 🔥`;
            this.comboDisplay.classList.add('active');
            clearTimeout(this.comboTimeout);
            this.comboTimeout = setTimeout(() => {
                this.comboDisplay.classList.remove('active');
            }, 1200);
        }
    }

    triggerScreenShake() {
        if (this.game && !this.game.fxEnabled) return;
        const viewport = document.getElementById('app-viewport');
        if (viewport) {
            viewport.classList.remove('shake-effect');
            void viewport.offsetWidth; // Trigger reflow
            viewport.classList.add('shake-effect');
        }
    }

    setQuote(text) {
        if (this.heroQuote) {
            this.heroQuote.textContent = text;
        }
    }

    // --- МОДАЛКА МАГАЗИНА ---
    openShop() {
        this.renderUpgrades();
        this.shopOverlay.classList.add('active');
    }

    renderUpgrades() {
        const container = document.getElementById('upgrades-container');
        if (!container) return;
        container.innerHTML = '';

        const list = CONFIG.UPGRADES[this.activeTab] || [];
        list.forEach(upg => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';

            const info = document.createElement('div');
            info.className = 'upg-info';
            info.innerHTML = `
                <div class="upg-name">${upg.name}</div>
                <div class="upg-desc">${upg.desc}</div>
            `;

            const btn = document.createElement('button');
            btn.className = 'upg-buy-btn';
            
            if (upg.bought) {
                btn.className += ' bought';
                btn.textContent = 'КУПЛЕНО ✓';
            } else {
                const canAfford = this.game.motivation >= upg.cost;
                if (!canAfford) btn.className += ' disabled';
                btn.textContent = `${CONFIG.formatNumber(upg.cost)} 🗿`;
                btn.addEventListener('click', () => {
                    if (this.game.buyUpgrade(this.activeTab, upg.id)) {
                        AudioCtrl.playUpgrade();
                        this.renderUpgrades();
                    }
                });
            }

            card.appendChild(info);
            card.appendChild(btn);
            container.appendChild(card);
        });
    }

    // --- МОДАЛКА КВЕСТОВ ---
    openQuests() {
        const container = document.getElementById('quests-container');
        if (!container) return;
        container.innerHTML = '';

        this.game.dailyQuests.forEach(q => {
            const card = document.createElement('div');
            card.className = 'quest-card';

            const progress = Math.min(q.goal, q.progress || 0);
            const isReady = progress >= q.goal && !q.claimed;
            const isClaimed = q.claimed;

            const info = document.createElement('div');
            info.className = 'quest-info';
            info.innerHTML = `
                <div class="quest-name">${q.title} (${CONFIG.formatNumber(progress)}/${CONFIG.formatNumber(q.goal)})</div>
                <div class="quest-desc">${q.desc}</div>
                <div style="font-size: 9px; color: #ffd700; margin-top: 2px;">Награда: +${CONFIG.formatNumber(q.reward)} 🗿 ${q.rewardItem ? `& +1 ${q.rewardItem}` : ''}</div>
            `;

            const btn = document.createElement('button');
            btn.className = 'quest-claim-btn';

            if (isClaimed) {
                btn.className += ' bought';
                btn.textContent = 'ЗАБРАНО ✓';
            } else if (isReady) {
                btn.textContent = 'ЗАБРАТЬ 🎁';
                btn.addEventListener('click', () => {
                    this.game.claimQuest(q.id);
                    AudioCtrl.playEndorphinFanfare();
                    this.openQuests();
                });
            } else {
                btn.className += ' disabled';
                btn.textContent = `${CONFIG.formatNumber(progress)}/${CONFIG.formatNumber(q.goal)}`;
            }

            card.appendChild(info);
            card.appendChild(btn);
            container.appendChild(card);
        });

        this.questsOverlay.classList.add('active');
    }

    // --- МОДАЛКА ПРЕСТИЖА ---
    openPrestige() {
        document.getElementById('golden-couches-count').textContent = `${CONFIG.formatNumber(this.game.prestigeCouches)} 🛋️`;
        const estimate = this.game.calculatePrestigeGain();
        document.getElementById('prestige-estimate').textContent = `При сбросе получите: +${CONFIG.formatNumber(estimate)} 🛋️ Золотых Диванов`;

        const container = document.getElementById('prestige-perks-container');
        if (container) {
            container.innerHTML = '';
            CONFIG.PRESTIGE_PERKS.forEach(perk => {
                const card = document.createElement('div');
                card.className = 'upgrade-card';

                const info = document.createElement('div');
                info.className = 'upg-info';
                info.innerHTML = `
                    <div class="upg-name">${perk.name} (Ур. ${perk.level}/${perk.max})</div>
                    <div class="upg-desc">${perk.desc}</div>
                `;

                const btn = document.createElement('button');
                btn.className = 'upg-buy-btn';
                
                if (perk.level >= perk.max) {
                    btn.className += ' bought';
                    btn.textContent = 'МАКС ✓';
                } else {
                    const canAfford = this.game.prestigeCouches >= perk.cost;
                    if (!canAfford) btn.className += ' disabled';
                    btn.textContent = `${CONFIG.formatNumber(perk.cost)} 🛋️`;
                    btn.addEventListener('click', () => {
                        if (this.game.buyPrestigePerk(perk.id)) {
                            AudioCtrl.playUpgrade();
                            this.openPrestige();
                        }
                    });
                }

                card.appendChild(info);
                card.appendChild(btn);
                container.appendChild(card);
            });
        }

        this.prestigeOverlay.classList.add('active');
    }

    // --- МОДАЛКА СТАТИСТИКИ & ДОСТИЖЕНИЙ ---
    openStats() {
        document.getElementById('stat-merges').textContent = CONFIG.formatNumber(this.game.totalMerges);
        document.getElementById('stat-gigachads').textContent = CONFIG.formatNumber(this.game.gigachadsCreated);
        document.getElementById('stat-bosses').textContent = CONFIG.formatNumber(this.game.bossesDefeated);
        document.getElementById('stat-time').textContent = `${Math.floor(this.game.playTimeSeconds / 60)} мин`;

        const container = document.getElementById('achievements-container');
        if (container) {
            container.innerHTML = '';
            CONFIG.ACHIEVEMENTS.forEach(ach => {
                const isUnlocked = ach.check(this.game) || this.game.unlockedAchievements.includes(ach.id);
                if (isUnlocked && !this.game.unlockedAchievements.includes(ach.id)) {
                    this.game.unlockedAchievements.push(ach.id);
                }

                const card = document.createElement('div');
                card.className = 'achievement-card';
                card.style.opacity = isUnlocked ? '1.0' : '0.4';
                card.innerHTML = `
                    <div style="font-size: 22px;">${ach.badge}</div>
                    <div class="upg-info">
                        <div class="upg-name">${ach.name} ${isUnlocked ? '✓' : '🔒'}</div>
                        <div class="upg-desc">${ach.desc}</div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        this.statsOverlay.classList.add('active');
    }

    // --- МОДАЛКА ВЫБОРА РЕЛИКВИЙ (ПОСЛЕ БОССА С ЗАЩИТОЙ ОТ СЛУЧАЙНОГО НАЖАТИЯ) ---
    showPerkDraft(choices, onPick) {
        const container = document.getElementById('perk-cards-container');
        const lockBanner = document.getElementById('perk-lock-banner');
        const lockText = document.getElementById('perk-lock-text');
        const lockBar = document.getElementById('perk-lock-bar');
        if (!container) return;
        container.innerHTML = '';

        let isLocked = true;
        container.classList.add('locked-choices');

        if (lockBanner) {
            lockBanner.className = 'safety-lock-banner locked';
        }

        const lockDurationMs = 1400;
        const startTime = performance.now();

        if (this.perkLockInterval) clearInterval(this.perkLockInterval);

        const updatePerkTimer = () => {
            const elapsed = performance.now() - startTime;
            const remaining = Math.max(0, (lockDurationMs - elapsed) / 1000);
            const progress = Math.min(100, (elapsed / lockDurationMs) * 100);

            if (lockBar) lockBar.style.width = `${Math.max(0, 100 - progress)}%`;
            if (lockText) lockText.innerHTML = `Защита от случайного клика: <b>${remaining.toFixed(1)}с</b>`;

            if (elapsed >= lockDurationMs) {
                clearInterval(this.perkLockInterval);
                this.perkLockInterval = null;
                isLocked = false;
                container.classList.remove('locked-choices');
                if (lockBanner) {
                    lockBanner.className = 'safety-lock-banner unlocked';
                }
                if (lockText) lockText.innerHTML = `✅ <b>Разблокировано</b> — выберите благословение:`;
                if (lockBar) lockBar.style.width = '0%';
            }
        };

        updatePerkTimer();
        this.perkLockInterval = setInterval(updatePerkTimer, 40);

        choices.forEach(relic => {
            const card = document.createElement('div');
            card.className = 'perk-choice-card';
            card.innerHTML = `
                <div class="perk-choice-header">
                    <span class="perk-choice-badge">${relic.badge}</span>
                    <span class="perk-choice-title">${relic.name}</span>
                </div>
                <div class="perk-choice-desc">${relic.desc}</div>
                <div class="perk-choice-btn-tag">ВЫБРАТЬ ✨</div>
            `;
            card.addEventListener('click', () => {
                if (isLocked) return; // Защита от случайного клика!
                clearInterval(this.perkLockInterval);
                this.perkOverlay.classList.remove('active');
                onPick(relic);
            });
            container.appendChild(card);
        });

        this.perkOverlay.classList.add('active');
    }

    // --- МОДАЛКА ОФФЛАЙН ДОХОДА ---
    showOfflineIncome(seconds, amount) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        document.getElementById('offline-desc').textContent = 
            `Пока вы отсутствовали (${hrs > 0 ? `${hrs} ч ` : ''}${mins} мин), ваши активы принесли пассивный доход:`;
        document.getElementById('offline-amount').textContent = `+${CONFIG.formatNumber(amount)} 🗿`;
        
        const claimBtn = document.getElementById('btn-claim-offline');
        if (claimBtn) {
            claimBtn.classList.add('locked-choices');
            setTimeout(() => {
                claimBtn.classList.remove('locked-choices');
            }, 600);
        }

        this.offlineOverlay.classList.add('active');
    }

    // --- МОДАЛКА ПОРАЖЕНИЯ (С ЗАЩИТОЙ) ---
    showGameOver(reason, days) {
        document.getElementById('gameover-reason').textContent = reason;
        document.getElementById('gameover-stats').textContent = `Вы выживали ${days} дн. Боссов пало: ${CONFIG.formatNumber(this.game.bossesDefeated)}`;

        const btnRetry = document.getElementById('btn-retry');
        const lockBanner = document.getElementById('gameover-lock-banner');
        const lockText = document.getElementById('gameover-lock-text');

        if (btnRetry) {
            btnRetry.classList.add('locked-choices');
            if (lockBanner) lockBanner.className = 'safety-lock-banner locked';
            
            let timeLeft = 10;
            const timer = setInterval(() => {
                timeLeft -= 1;
                if (lockText) lockText.innerHTML = `Защита от клика: <b>${(timeLeft / 10).toFixed(1)}с</b>`;
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    btnRetry.classList.remove('locked-choices');
                    if (lockBanner) lockBanner.className = 'safety-lock-banner unlocked';
                    if (lockText) lockText.innerHTML = `✅ <b>Готово</b> — можно начать заново:`;
                }
            }, 100);
        }

        this.gameOverOverlay.classList.add('active');
    }

    // --- МОДАЛКА ДИЛЕММЫ / СОБЫТИЯ (С ЗАЩИТОЙ ОТ СЛУЧАЙНОГО НАЖАТИЯ) ---
    showEventModal(eventData) {
        document.getElementById('event-icon').textContent = eventData.icon;
        document.getElementById('event-title').textContent = eventData.title;
        document.getElementById('event-desc').textContent = eventData.desc;

        document.getElementById('choice-a-title').textContent = eventData.choiceA.title;
        document.getElementById('choice-a-penalty').textContent = eventData.choiceA.penalty;

        document.getElementById('choice-b-title').textContent = eventData.choiceB.title;
        document.getElementById('choice-b-penalty').textContent = eventData.choiceB.penalty;

        const container = document.getElementById('event-choices-container');
        const lockBanner = document.getElementById('event-lock-banner');
        const lockText = document.getElementById('event-lock-text');
        const lockBar = document.getElementById('event-lock-bar');

        let isLocked = true;
        if (container) container.classList.add('locked-choices');
        if (lockBanner) lockBanner.className = 'safety-lock-banner locked';

        const lockDurationMs = 1400;
        const startTime = performance.now();

        if (this.eventLockInterval) clearInterval(this.eventLockInterval);

        const updateEventTimer = () => {
            const elapsed = performance.now() - startTime;
            const remaining = Math.max(0, (lockDurationMs - elapsed) / 1000);
            const progress = Math.min(100, (elapsed / lockDurationMs) * 100);

            if (lockBar) lockBar.style.width = `${Math.max(0, 100 - progress)}%`;
            if (lockText) lockText.innerHTML = `Защита от случайного клика: <b>${remaining.toFixed(1)}с</b>`;

            if (elapsed >= lockDurationMs) {
                clearInterval(this.eventLockInterval);
                this.eventLockInterval = null;
                isLocked = false;
                if (container) container.classList.remove('locked-choices');
                if (lockBanner) lockBanner.className = 'safety-lock-banner unlocked';
                if (lockText) lockText.innerHTML = `✅ <b>Разблокировано</b> — выберите вариант:`;
                if (lockBar) lockBar.style.width = '0%';
            }
        };

        updateEventTimer();
        this.eventLockInterval = setInterval(updateEventTimer, 40);

        const btnA = document.getElementById('btn-choice-a');
        const btnB = document.getElementById('btn-choice-b');

        const handleA = () => {
            if (isLocked) return;
            clearInterval(this.eventLockInterval);
            btnA.removeEventListener('click', handleA);
            btnB.removeEventListener('click', handleB);
            this.eventOverlay.classList.remove('active');
            eventData.choiceA.action(this.game);
        };

        const handleB = () => {
            if (isLocked) return;
            clearInterval(this.eventLockInterval);
            btnA.removeEventListener('click', handleA);
            btnB.removeEventListener('click', handleB);
            this.eventOverlay.classList.remove('active');
            eventData.choiceB.action(this.game);
        };

        btnA.addEventListener('click', handleA);
        btnB.addEventListener('click', handleB);
        this.eventOverlay.classList.add('active');
    }

    // --- ХАЙП / FEVER MODE ---
    updateFever(charge, isFeverActive, timeLeft) {
        if (!this.feverFill || !this.feverLabel) return;
        const pct = Math.min(100, Math.max(0, charge));
        this.feverFill.style.width = `${pct}%`;
        const viewport = document.getElementById('app-viewport');
        
        if (isFeverActive) {
            this.feverLabel.textContent = `🔥 ХАЙП АКТИВЕН! ${Math.ceil(timeLeft)}с (x3 ОЧКИ)`;
            this.feverBanner?.classList.add('active');
            viewport?.classList.add('fever-mode-active');
        } else {
            this.feverLabel.textContent = `🔥 ХАЙП ${Math.floor(pct)}%`;
            this.feverBanner?.classList.remove('active');
            viewport?.classList.remove('fever-mode-active');
        }
    }

    // --- КОЛЕСО ФОРТУНЫ / РУЛЕТКА ---
    showRoulette() {
        if (!this.rouletteOverlay) return;
        this.rouletteOverlay.classList.add('active');
        this.drawRouletteWheel(this.wheelCurrentAngle);
        this.updateRouletteTimer(this.game.rouletteTimer, this.game.freeSpinsAvailable);
    }

    hideRoulette() {
        if (!this.rouletteOverlay) return;
        this.rouletteOverlay.classList.remove('active');
    }

    updateRouletteTimer(timeLeft, freeSpins) {
        if (this.rouletteBadge) {
            if (freeSpins > 0) {
                this.rouletteBadge.textContent = `СПИН (${freeSpins})!`;
                this.rouletteBadge.style.display = 'inline-block';
            } else {
                const s = Math.ceil(Math.max(0, timeLeft));
                this.rouletteBadge.textContent = `${s}с`;
                this.rouletteBadge.style.display = 'inline-block';
            }
        }

        if (this.btnSpinWheel && !this.isWheelSpinning) {
            if (freeSpins > 0) {
                this.btnSpinWheel.textContent = `КРУТИТЬ БЕСПЛАТНО! (Осталось: ${freeSpins}) ✨`;
                this.btnSpinWheel.classList.remove('disabled');
            } else {
                this.btnSpinWheel.textContent = `Ожидание: ${Math.ceil(timeLeft)}с или победи босса`;
                this.btnSpinWheel.classList.add('disabled');
            }
        }
    }

    drawRouletteWheel(angle) {
        if (!this.rouletteCtx || !this.rouletteCanvas) return;
        const ctx = this.rouletteCtx;
        const size = this.rouletteCanvas.width;
        const cx = size / 2;
        const cy = size / 2;
        const radius = cx - 8;
        const sectors = CONFIG.ROULETTE_SECTORS || [];
        const numSectors = sectors.length || 8;
        const arc = (Math.PI * 2) / numSectors;

        ctx.clearRect(0, 0, size, size);

        // Внешнее кольцо
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();
        ctx.restore();

        // Секторы
        for (let i = 0; i < numSectors; i++) {
            const startAngle = angle + i * arc;
            const endAngle = startAngle + arc;
            const sector = sectors[i];

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = sector.color || (i % 2 === 0 ? '#1e1b4b' : '#312e81');
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Текст и иконка сектора
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(startAngle + arc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px system-ui, sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(sector.label, radius - 14, 4);
            ctx.restore();
        }

        // Центральная ступица
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1338';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();

        ctx.font = '16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎰', cx, cy);
    }

    animateWheelSpin(targetSectorIndex, onComplete) {
        if (this.isWheelSpinning) return;
        this.isWheelSpinning = true;
        this.btnSpinWheel?.classList.add('disabled');
        if (this.roulettePrize) this.roulettePrize.textContent = 'Колесо вращается... Удачи!';

        const sectors = CONFIG.ROULETTE_SECTORS || [];
        const numSectors = sectors.length || 8;
        const arc = (Math.PI * 2) / numSectors;

        // Стрелка находится вверху: угол 3 * Math.PI / 2
        // Чтобы targetSectorIndex оказался под стрелкой:
        // angle + targetSectorIndex * arc + arc/2 = 3 * Math.PI / 2 (mod 2PI)
        const targetAngleAtArrow = (3 * Math.PI / 2) - (targetSectorIndex * arc + arc / 2);
        
        // Добавим 5-7 полных оборотов
        const extraTurns = (5 + Math.floor(Math.random() * 2)) * Math.PI * 2;
        const startAngle = this.wheelCurrentAngle % (Math.PI * 2);
        const totalDelta = extraTurns + (targetAngleAtArrow - startAngle + Math.PI * 8) % (Math.PI * 2);
        const finalAngle = startAngle + totalDelta;

        const duration = 4000;
        const startTime = performance.now();
        let lastTickAngle = startAngle;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Плавное кубическое замедление (ease-out-cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3.5);
            this.wheelCurrentAngle = startAngle + totalDelta * easeOut;

            // Звук щелчка при проходе сектора
            if (Math.abs(this.wheelCurrentAngle - lastTickAngle) >= arc) {
                AudioCtrl.playWheelTick();
                lastTickAngle = this.wheelCurrentAngle;
            }

            this.drawRouletteWheel(this.wheelCurrentAngle);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isWheelSpinning = false;
                this.wheelCurrentAngle = finalAngle;
                this.drawRouletteWheel(this.wheelCurrentAngle);
                
                const wonSector = sectors[targetSectorIndex];
                if (wonSector) {
                    if (this.roulettePrize) {
                        this.roulettePrize.textContent = `🎉 ПРИЗ: ${wonSector.label} (${wonSector.desc})!`;
                    }
                    if (wonSector.label.includes('ДЖЕКПОТ')) {
                        AudioCtrl.playJackpot();
                    } else {
                        AudioCtrl.playLevelUp();
                    }
                }
                
                if (onComplete) onComplete(wonSector);
            }
        };

        requestAnimationFrame(animate);
    }

    // --- РАНГ И ЗВАНИЯ ---
    updateRank(title, desc, badge) {
        if (this.rankTitle) this.rankTitle.textContent = title;
        if (this.rankDesc) this.rankDesc.textContent = desc;
        if (this.rankBadge) this.rankBadge.textContent = badge;
    }
}
