class UIManager {
    constructor(game) {
        this.game = game;
        this.activeTab = 'hero';
        this.initDOMElements();
        this.bindEvents();
        this.installModalPauseObserver();
    }

    installModalPauseObserver() {
        const overlays = Array.from(
            document.querySelectorAll('.modal-backdrop')
        );

        const syncPauseState = () => {
            const hasBlockingModal = overlays.some(overlay => {
                if (overlay.id === 'start-menu-overlay') {
                    return false;
                }

                return overlay.classList.contains('active');
            });

            if (hasBlockingModal) {
                this.game.pause('modal');
            } else {
                this.game.resume('modal');
            }
        };

        const observer = new MutationObserver(syncPauseState);

        overlays.forEach(overlay => {
            observer.observe(overlay, {
                attributes: true,
                attributeFilter: ['class']
            });
        });

        this.modalObserver = observer;

    }

    initDOMElements() {
        // Оверлеи
        this.startMenu = document.getElementById('start-menu-overlay');
        this.guideOverlay = document.getElementById('guide-overlay');
        this.shopOverlay = document.getElementById('shop-overlay');
        this.questsOverlay = document.getElementById('quests-overlay');
        this.prestigeOverlay = document.getElementById('prestige-overlay');
        this.statsOverlay = document.getElementById('stats-overlay');
        this.boostsOverlay = document.getElementById('boosts-overlay');
        this.leaderboardOverlay = document.getElementById('leaderboard-overlay');
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
        this.btnSpinWheelAd = document.getElementById('btn-spin-wheel-ad');
        this.roulettePrize = document.getElementById('roulette-prize');
        this.wheelCurrentAngle = 0;
        this.isWheelSpinning = false;

        // Монетизация & Рекламные элементы
        this.btnReviveAd = document.getElementById('btn-revive-ad');
        this.btnClaimOfflineX2 = document.getElementById('btn-claim-offline-x2');
        this.btnShopAidAd = document.getElementById('btn-shop-aid-ad');
        this.btnDoPrestigeAd = document.getElementById('btn-do-prestige-ad');
        this.btnBossFreezeAd = document.getElementById('btn-boss-freeze-ad');
        this.btnBossNukeAd = document.getElementById('btn-boss-nuke-ad');

        // Ранг
        this.rankTitle = document.getElementById('rank-title');
        this.rankDesc = document.getElementById('rank-desc');
        this.rankBadge = document.getElementById('rank-badge');

        // Боковая панель для ПК
        this.sideRankTitle = document.getElementById('side-rank-title');
        this.sideRankDesc = document.getElementById('side-rank-desc');
        this.sideRankBadge = document.getElementById('side-rank-badge');
        this.sideTapPower = document.getElementById('side-tap-power');
        this.sidePassiveInc = document.getElementById('side-passive-inc');
        this.sideComboStat = document.getElementById('side-combo-stat');
        this.sideTrashStat = document.getElementById('side-trash-stat');
        this.sideEvoRow = document.getElementById('side-evo-row');
        this.sideEvoCount = document.getElementById('side-evo-count');
        this.btnResetGame = document.getElementById('btn-reset-game');
        this.btnSideGuide = document.getElementById('btn-side-guide');
        this.btnSideStats = document.getElementById('btn-side-stats');
        this.resetOverlay = document.getElementById('reset-overlay');
        this.btnCancelReset = document.getElementById('btn-cancel-reset');
        this.btnConfirmReset = document.getElementById('btn-confirm-reset');

        this.btnShake = document.getElementById('btn-brain-shake');
        this.btnShakeLabel = document.getElementById('btn-shake-label');
        this.heroQuote = document.getElementById('hero-quote');
        this.soundIcon = document.getElementById('sound-icon');
        this.bgmIcon = document.getElementById('bgm-icon');
        this.dailyModBadge = document.getElementById('daily-mod-badge');
        this.sideRivalStat = document.getElementById('side-rival-stat');
        this.btnAutoDrop = document.getElementById('btn-toggle-autodrop');
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
            window.YandexBridge?.showBannerAdv();
        });
        document.getElementById('btn-close-roulette')?.addEventListener('click', () => {
            this.hideRoulette();
            window.YandexBridge?.hideBannerAdv();
        });
        this.btnSpinWheel?.addEventListener('click', () => {
            if (!this.isWheelSpinning) {
                this.game.spinRoulette();
            }
        });
        this.btnSpinWheelAd?.addEventListener('click', () => {
            if (!this.isWheelSpinning) {
                window.YandexBridge?.showRewardedVideo('roulette_spin', () => {
                    this.game.freeSpinsAvailable++;
                    this.game.spinRoulette();
                });
            }
        });

        // Открытие окон
        document.getElementById('btn-open-shop')?.addEventListener('click', () => {
            this.openShop();
            window.YandexBridge?.showBannerAdv();
        });

        document.getElementById('btn-close-shop')?.addEventListener('click', () => {
            this.shopOverlay.classList.remove('active');
            window.YandexBridge?.hideBannerAdv();
        });

        document.getElementById('btn-open-quests')?.addEventListener('click', () => {
            this.openQuests();
            window.YandexBridge?.showBannerAdv();
        });

        document.getElementById('btn-close-quests')?.addEventListener('click', () => {
            this.questsOverlay.classList.remove('active');
            window.YandexBridge?.hideBannerAdv();
        });

        document.getElementById('btn-open-prestige')?.addEventListener('click', () => {
            this.openPrestige();
            window.YandexBridge?.showBannerAdv();
        });

        document.getElementById('btn-close-prestige')?.addEventListener('click', () => {
            this.prestigeOverlay.classList.remove('active');
            window.YandexBridge?.hideBannerAdv();
        });

        document.getElementById('btn-open-stats')?.addEventListener('click', () => {
            this.openStats();
            window.YandexBridge?.showBannerAdv();
        });

        document.getElementById('btn-close-stats')?.addEventListener('click', () => {
            this.statsOverlay.classList.remove('active');
            window.YandexBridge?.hideBannerAdv();
        });

        // Бусты (Рекламные усиления)
        document.getElementById('btn-open-boosts')?.addEventListener('click', () => {
            this.openBoosts();
            window.YandexBridge?.showBannerAdv();
        });
        document.getElementById('btn-close-boosts')?.addEventListener('click', () => {
            this.boostsOverlay?.classList.remove('active');
            window.YandexBridge?.hideBannerAdv();
        });
        document.getElementById('btn-side-boosts')?.addEventListener('click', () => {
            this.openBoosts();
            window.YandexBridge?.showBannerAdv();
        });

        // Таблица лидеров (Яндекс Игры)
        document.getElementById('btn-open-leaderboard')?.addEventListener('click', () => {
            this.openLeaderboard();
            window.YandexBridge?.showBannerAdv();
        });
        document.getElementById('btn-close-leaderboard')?.addEventListener('click', () => {
            this.leaderboardOverlay?.classList.remove('active');
            window.YandexBridge?.hideBannerAdv();
        });
        document.getElementById('btn-side-leaderboard')?.addEventListener('click', () => {
            this.openLeaderboard();
            window.YandexBridge?.showBannerAdv();
        });

        // Боковая панель для ПК
        this.btnSideGuide?.addEventListener('click', () => {
            this.guideOverlay.classList.add('active');
        });
        this.btnSideStats?.addEventListener('click', () => {
            this.openStats();
            window.YandexBridge?.showBannerAdv();
        });
        this.btnResetGame?.addEventListener('click', () => {
            if (this.resetOverlay) {
                this.resetOverlay.classList.add('active');
            } else {
                this.game.resetGame(true);
            }
        });
        this.btnCancelReset?.addEventListener('click', () => {
            this.resetOverlay?.classList.remove('active');
        });
        this.btnConfirmReset?.addEventListener('click', () => {
            this.resetOverlay?.classList.remove('active');
            this.game.resetGame(true);
        });
        this.resetOverlay?.addEventListener('click', (e) => {
            if (e.target === this.resetOverlay) {
                this.resetOverlay.classList.remove('active');
            }
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

        // Гуманитарная помощь в магазине
        this.btnShopAidAd?.addEventListener('click', () => {
            window.YandexBridge?.showRewardedVideo('consumable_pack', () => {
                this.game.claimShopAid();
            });
        });

        // Тактическая помощь при боссе
        this.btnBossFreezeAd?.addEventListener('click', () => {
            window.YandexBridge?.showRewardedVideo('boss_freeze', () => {
                this.game.applyBossFreeze();
            });
        });

        this.btnBossNukeAd?.addEventListener('click', () => {
            window.YandexBridge?.showRewardedVideo('boss_nuke', () => {
                this.game.applyBossNuke();
            });
        });

        // Кнопка звука
        document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
            const muted = AudioCtrl.toggleMute();
            this.soundIcon.textContent = muted ? '🔇' : '🔊';
        });

        // Кнопка фоновой кибер-музыки (BGM)
        document.getElementById('btn-toggle-bgm')?.addEventListener('click', () => {
            const isPlaying = AudioCtrl.toggleBGM();
            if (this.bgmIcon) {
                this.bgmIcon.textContent = isPlaying ? '🎵' : '🔇';
            }
            this.setQuote(isPlaying ? "🎶 Кибер-Лоуфай включён! Вайб на высоте." : "🔇 Музыка выключена.");
        });

        // Кнопка авто-сброса мыслей
        this.btnAutoDrop?.addEventListener('click', () => {
            if (this.game) {
                this.game.toggleAutoDrop();
            }
        });

        // Клик по бейджу ежедневного модификатора
        this.dailyModBadge?.addEventListener('click', () => {
            if (this.game && this.game.activeDailyMod) {
                this.setQuote(`📅 ${this.game.activeDailyMod.title}: ${this.game.activeDailyMod.desc}`);
            }
        });

        // Кнопка спецэффектов (FX Вкл/Выкл)
        document.getElementById('btn-toggle-fx')?.addEventListener('click', () => {
            this.game.toggleFx();
        });

        // Забрать оффлайн доход (1x и 2x за рекламу)
        this.btnClaimOfflineX2?.addEventListener('click', () => {
            window.YandexBridge?.showRewardedVideo('offline_x2', () => {
                this.game.claimOfflineIncome(true);
                this.offlineOverlay.classList.remove('active');
                window.YandexBridge?.hideBannerAdv();
            });
        });

        document.getElementById('btn-claim-offline')?.addEventListener('click', () => {
            this.game.claimOfflineIncome(false);
            this.offlineOverlay.classList.remove('active');
            window.YandexBridge?.hideBannerAdv();
        });

        // Второе дыхание (Revive за рекламу)
        this.btnReviveAd?.addEventListener('click', () => {
            if (this.game.hasRevivedThisRun) {
                this.setQuote("«Второе дыхание уже было использовано в этом забеге!»");
                return;
            }
            window.YandexBridge?.showRewardedVideo('revive', () => {
                this.game.revivePlayer();
                window.YandexBridge?.hideBannerAdv();
            });
        });

        // Рестарт после поражения (с вызовом межстраничной рекламы по кулдауну 180с)
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            this.gameOverOverlay.classList.remove('active');
            window.YandexBridge?.hideBannerAdv();
            window.YandexBridge?.showFullscreenAdv({
                onClose: () => {
                    this.game.restart();
                }
            });
        });

        // Совершить Престиж (1x и Супер-Бонус за рекламу)
        this.btnDoPrestigeAd?.addEventListener('click', () => {
            window.YandexBridge?.showRewardedVideo('prestige_boost', () => {
                this.game.triggerPrestige(true);
                this.prestigeOverlay.classList.remove('active');
                window.YandexBridge?.hideBannerAdv();
            });
        });

        document.getElementById('btn-do-prestige')?.addEventListener('click', () => {
            const ok = this.game.triggerPrestige(false);
            if (ok) {
                this.prestigeOverlay.classList.remove('active');
                window.YandexBridge?.hideBannerAdv();
                window.YandexBridge?.showFullscreenAdv();
            }
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

    updateBoss(
        boss,
        currentHp,
        day,
        maxDays = 20
    ) {
        const bossChanged =
            this.lastBossName &&
            this.lastBossName !==
                boss.name;

        this.bossName.textContent =
            boss.name;

        this.bossDayTag.textContent =
            `День ${day}/${maxDays}`;

        const pct =
            Math.max(
                0,
                Math.min(
                    100,
                    (
                        currentHp /
                        boss.hp
                    ) * 100
                )
            );

        this.bossHpFill.style.width =
            `${pct}%`;

        this.bossHpText.textContent =
            `${CONFIG.formatNumber(
                Math.max(
                    0,
                    Math.floor(currentHp)
                )
            )} / ${CONFIG.formatNumber(
                boss.hp
            )} HP`;

        this.bossQuoteBubble.textContent =
            boss.quote || "";

        const bossIcon =
            document.getElementById(
                "boss-icon"
            );

        const bossIndex =
            this.game
                ?.currentBossIndex ||
            day;

        if (bossIcon) {
            bossIcon.textContent =
                CONFIG.BOSS_ICONS[
                    bossIndex
                ] ||
                "👹";
        }

        if (bossChanged) {
            const bar =
                document.getElementById(
                    "boss-bar"
                );

            if (bar) {
                bar.classList.remove(
                    "boss-enter"
                );

                void bar.offsetWidth;

                bar.classList.add(
                    "boss-enter"
                );
            }
        }

        this.lastBossName =
            boss.name;
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
        this.nextThoughtCircle.style.background = 'transparent';
        const dataUrl = CONFIG.getCharacterDataURL(tier, 64);
        if (dataUrl) {
            this.nextThoughtCircle.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: contain; display: block;" alt="${conf.name}">`;
        } else {
            this.nextThoughtCircle.style.background = conf.color;
            this.nextThoughtCircle.textContent = conf.emoji;
        }
        const nameEl =
            document.getElementById(
                "next-thought-name"
            );

        if (nameEl) {
            nameEl.textContent =
                conf.name;
        }
    }

    updateShake(cooldown) {
        if (!this.btnShake || !this.btnShakeLabel) return;
        if (cooldown > 0) {
            this.btnShake.classList.add('disabled');
            this.btnShakeLabel.textContent = `⏳ ${Math.ceil(cooldown)}с`;
        } else {
            this.btnShake.classList.remove('disabled');
            this.btnShakeLabel.textContent = 'Встряска';
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

    updateDailyModifier(mod) {
        if (this.dailyModBadge && mod) {
            this.dailyModBadge.textContent = `${mod.icon} ${mod.title}`;
            this.dailyModBadge.title = mod.desc;
        }
    }

    updateRivalGhost(rivalName, scoreDiff) {
        if (this.sideRivalStat) {
            if (scoreDiff > 0) {
                this.sideRivalStat.textContent = `${rivalName} (+${CONFIG.formatNumber(scoreDiff)})`;
            } else {
                this.sideRivalStat.textContent = `👑 Топ-1! (${rivalName})`;
            }
        }
    }

    updateAutoDrop(active) {
        if (this.btnAutoDrop) {
            if (active) {
                this.btnAutoDrop.classList.add('active');
            } else {
                this.btnAutoDrop.classList.remove('active');
            }
        }
        const autoBadge = document.getElementById('auto-drop-badge');
        if (autoBadge) {
            if (active) autoBadge.classList.remove('hidden');
            else autoBadge.classList.add('hidden');
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

        // Проверяем смену дня по МСК перед рендером
        if (this.game && typeof this.game.checkDailyQuestsDate === 'function') {
            this.game.checkDailyQuestsDate();
        }

        // Обновление таймера МСК
        const timerEl = document.getElementById('quest-reset-timer');
        if (timerEl) {
            const msLeft = CONFIG.getMsUntilMoscowMidnight();
            timerEl.textContent = CONFIG.formatTimeHMS(msLeft);
            
            if (this.questTimerInterval) clearInterval(this.questTimerInterval);
            this.questTimerInterval = setInterval(() => {
                if (!this.questsOverlay || !this.questsOverlay.classList.contains('active')) {
                    clearInterval(this.questTimerInterval);
                    return;
                }
                const ms = CONFIG.getMsUntilMoscowMidnight();
                timerEl.textContent = CONFIG.formatTimeHMS(ms);
                if (ms <= 1000 && this.game) {
                    this.game.checkDailyQuestsDate(true);
                    this.openQuests();
                }
            }, 1000);
        }

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

            if (isClaimed) {
                const btn = document.createElement('button');
                btn.className = 'quest-claim-btn bought';
                btn.textContent = 'ЗАБРАНО ✓';
                card.appendChild(btn);
            } else if (isReady) {
                const btnGroup = document.createElement('div');
                btnGroup.style.display = 'flex';
                btnGroup.style.flexDirection = 'column';
                btnGroup.style.gap = '4px';

                const btn2x = document.createElement('button');
                btn2x.className = 'quest-claim-btn';
                btn2x.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';
                btn2x.style.color = '#000';
                btn2x.style.fontWeight = 'bold';
                btn2x.textContent = '📺 2X НАГРАДА';
                btn2x.addEventListener('click', () => {
                    window.YandexBridge?.showRewardedVideo('quest_2x', () => {
                        this.game.claimQuest(q.id, true);
                        this.openQuests();
                    });
                });

                const btn1x = document.createElement('button');
                btn1x.className = 'quest-claim-btn';
                btn1x.style.opacity = '0.85';
                btn1x.textContent = 'ЗАБРАТЬ 1X';
                btn1x.addEventListener('click', () => {
                    this.game.claimQuest(q.id, false);
                    AudioCtrl.playEndorphinFanfare();
                    this.openQuests();
                });

                btnGroup.appendChild(btn2x);
                btnGroup.appendChild(btn1x);
                card.appendChild(btnGroup);
            } else {
                const btn = document.createElement('button');
                btn.className = 'quest-claim-btn disabled';
                btn.textContent = `${CONFIG.formatNumber(progress)}/${CONFIG.formatNumber(q.goal)}`;
                card.appendChild(btn);
            }

            card.appendChild(info);
            container.appendChild(card);
        });

        this.questsOverlay.classList.add('active');
    }

    // --- МОДАЛКА ПРЕСТИЖА ---
    openPrestige() {
        document.getElementById('golden-couches-count').textContent = `${CONFIG.formatNumber(this.game.prestigeCouches)} 🛋️`;
        const estimate = this.game.calculatePrestigeGain();
        const estimateEl =
            document.getElementById('prestige-estimate');

        const prestigeBtn =
            document.getElementById('btn-do-prestige');

        if (estimate <= 0) {
            estimateEl.textContent =
                'Победите хотя бы одного босса для Перерождения';

            prestigeBtn.disabled = true;
            prestigeBtn.classList.add('disabled');
        } else {
            estimateEl.textContent =
                `При сбросе получите: +${CONFIG.formatNumber(estimate)} 🛋️ Золотых Диванов`;

            prestigeBtn.disabled = false;
            prestigeBtn.classList.remove('disabled');
        }

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

    // --- МОДАЛКА РЕКЛАМНЫХ БУСТОВ (YANDEX ADS) ---
    openBoosts() {
        const container = document.getElementById('boosts-cards-container') || document.getElementById('boosts-container');
        if (!container) return;
        container.innerHTML = '';

        const boosts = [
            {
                id: 'turbo',
                title: '⚡ Турбо-Хайп',
                desc: 'Мгновенно активирует Лихорадку (Fever Mode x3) на 16 сек и восполняет 100% Дыхалки.',
                btnText: 'СМОТРЕТЬ [ADS]'
            },
            {
                id: 'cleaning',
                title: '🧹 Генеральный Клининг',
                desc: 'Сжигает все тревожные мысли и завалы мусора на поле + начисляет щедрую награду Мотивации.',
                btnText: 'СМОТРЕТЬ [ADS]'
            },
            {
                id: 'crypto',
                title: '💎 Крипто-Дроп',
                desc: 'Мгновенно начисляет Мотивацию за 30 минут пассивного дохода (минимум +15 000 🗿).',
                btnText: 'СМОТРЕТЬ [ADS]'
            },
            {
                id: 'nuke',
                title: '💥 Ядерная Петарда',
                desc: 'Сносит сразу 28% максимального здоровья текущего босса и разбрасывает мысли в стакане.',
                btnText: 'СМОТРЕТЬ [ADS]'
            }
        ];

        boosts.forEach(b => {
            const card = document.createElement('div');
            card.className = 'boost-card';

            const info = document.createElement('div');
            info.className = 'boost-card-info';
            info.innerHTML = `
                <div class="boost-title">${b.title}</div>
                <div class="boost-desc">${b.desc}</div>
            `;

            const btn = document.createElement('button');
            btn.className = 'boost-btn';
            
            const cooldownLeft = window.YandexBridge ? window.YandexBridge.getBoostCooldownLeft(b.id) : 0;
            if (cooldownLeft > 0) {
                btn.classList.add('disabled');
                btn.textContent = `⏳ ${cooldownLeft}с`;
            } else {
                btn.textContent = b.btnText;
            }

            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                btn.classList.add('disabled');
                btn.textContent = 'ЗАГРУЗКА...';

                if (window.YandexBridge && typeof window.YandexBridge.showRewardedVideo === 'function') {
                    this.game.pause('rewarded-ad');
                    window.YandexBridge.showRewardedVideo(
                        b.id,
                        (rewardId) => {
                            this.game.applyBoost(rewardId);
                            this.boostsOverlay?.classList.remove('active');
                        },
                        () => {
                            this.game.resume('rewarded-ad');
                            const left = window.YandexBridge ? window.YandexBridge.getBoostCooldownLeft(b.id) : 0;
                            if (left > 0) {
                                btn.classList.add('disabled');
                                btn.textContent = `⏳ ${left}с`;
                            } else {
                                btn.classList.remove('disabled');
                                btn.textContent = b.btnText;
                            }
                        }
                    );
                } else {
                    // Локальный режим/резервный фоллбек
                    this.game.applyBoost(b.id);
                    this.boostsOverlay?.classList.remove('active');
                }
            });

            card.appendChild(info);
            card.appendChild(btn);
            container.appendChild(card);
        });

        this.boostsOverlay?.classList.add('active');
    }

    // --- МОДАЛКА ТАБЛИЦЫ ЛИДЕРОВ (ЯНДЕКС ИГРЫ) ---
    async openLeaderboard() {
        if (!this.leaderboardOverlay) return;
        this.leaderboardOverlay.classList.add('active');

        const userScoreEl = document.getElementById('lb-user-score-val') || document.getElementById('lb-user-score');
        const userRankEl = document.getElementById('lb-user-rank-val') || document.getElementById('lb-user-rank');
        const listEl = document.getElementById('leaderboard-entries-container') || document.getElementById('leaderboard-list');

        const currentScore = Math.floor(this.game.totalMotivationEarned);
        if (userScoreEl) {
            userScoreEl.textContent = `${CONFIG.formatNumber(currentScore)} 🗿`;
        }

        if (listEl) {
            listEl.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 11px;">Загрузка таблицы лидеров...</div>';
        }

        if (window.YandexBridge) {
            // Передаем актуальный счет игрока
            window.YandexBridge.updateLocalScore(currentScore);
            const data = await window.YandexBridge.getLeaderboardEntries(15);
            if (!listEl) return;
            listEl.innerHTML = '';

            if (userRankEl) {
                userRankEl.textContent = data.userRank ? `#${data.userRank} в рейтинге` : 'Вне рейтинга';
            }

            if (data.entries && data.entries.length > 0) {
                data.entries.forEach(entry => {
                    const row = document.createElement('div');
                    row.className = `leaderboard-row ${entry.isCurrentUser || entry.isUser ? 'is-current-user' : ''}`;

                    let rankClass = '';
                    if (entry.rank === 1) rankClass = 'rank-1';
                    else if (entry.rank === 2) rankClass = 'rank-2';
                    else if (entry.rank === 3) rankClass = 'rank-3';

                    row.innerHTML = `
                        <div class="lb-rank-num ${rankClass}">#${entry.rank}</div>
                        <div class="lb-player-cell">
                            <span class="lb-player-name">${entry.name} ${(entry.isCurrentUser || entry.isUser) ? ' (Вы)' : ''}</span>
                            <span class="lb-player-title">${entry.title || 'Кибер-Скуф'}</span>
                        </div>
                        <div class="lb-player-score">${CONFIG.formatNumber(entry.score)} 🗿</div>
                    `;
                    listEl.appendChild(row);
                });
            } else {
                listEl.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 11px;">Нет данных рейтинга. Начните копить мотивацию!</div>';
            }
        }
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
        window.YandexBridge?.showBannerAdv();
    }

    // --- МОДАЛКА ПОРАЖЕНИЯ (С ЗАЩИТОЙ) ---
    showGameOver(reason, days) {
        document.getElementById('gameover-reason').textContent = reason;
        document.getElementById('gameover-stats').textContent = `Вы выживали ${days} дн. Боссов пало: ${CONFIG.formatNumber(this.game.bossesDefeated)}`;

        const btnRetry = document.getElementById('btn-retry');
        const lockBanner = document.getElementById('gameover-lock-banner');
        const lockText = document.getElementById('gameover-lock-text');

        // Кнопка второго дыхания (Revive)
        if (this.btnReviveAd) {
            if (this.game.hasRevivedThisRun) {
                this.btnReviveAd.style.display = 'none';
            } else {
                this.btnReviveAd.style.display = 'flex';
            }
        }

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
        window.YandexBridge?.showBannerAdv();
    }

    hideGameOver() {
        this.gameOverOverlay.classList.remove('active');
        window.YandexBridge?.hideBannerAdv();
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
    updateFever(
        charge,
        isFeverActive,
        timeLeft,
        scoreMultiplier = 2
    ) {
        if (!this.feverFill || !this.feverLabel) {
            return;
        }

        const pct =
            Math.min(
                100,
                Math.max(0, charge)
            );

        this.feverFill.style.width =
            `${pct}%`;

        const viewport =
            document.getElementById('app-viewport');

        const feverBar =
            document.getElementById(
                "fever-bar"
            );

        feverBar
            ?.classList
            .toggle(
                "ready",
                !isFeverActive &&
                pct >= 100
            );

        if (isFeverActive) {
            this.feverLabel.textContent =
                `🔥 ХАЙП АКТИВЕН! ${Math.ceil(timeLeft)}с (x${scoreMultiplier} МОТИВАЦИЯ)`;

            if (this.feverBanner) {
                this.feverBanner.textContent =
                    `РЕЖИМ ЛИХОРАДКИ! МОТИВАЦИЯ x${scoreMultiplier}!`;
            }

            this.feverBanner?.classList.add('active');
            viewport?.classList.add('fever-mode-active');
        } else {
            this.feverLabel.textContent =
                `🔥 ХАЙП ${Math.floor(pct)}%`;

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

        // Также обновляем боковую панель для ПК
        if (this.sideRankTitle) this.sideRankTitle.textContent = title;
        if (this.sideRankDesc) this.sideRankDesc.textContent = desc;
        if (this.sideRankBadge) this.sideRankBadge.textContent = badge;
    }

    // --- БОКОВАЯ ПАНЕЛЬ ДЛЯ ПК (ПОКАЗАТЕЛИ И ЭВОЛЮЦИЯ) ---
    updateSideDashboard(game) {
        if (this.sideTapPower) {
            this.sideTapPower.textContent = `+${CONFIG.formatNumber(game.getClickDamage())}`;
        }
        if (this.sidePassiveInc) {
            this.sidePassiveInc.textContent = `+${CONFIG.formatNumber(game.passiveIncome)}/с`;
        }
        if (this.sideComboStat) {
            const mul = game.combo > 1 ? (1 + Math.min(2.0, (game.combo - 1) * 0.1)).toFixed(1) : '1';
            this.sideComboStat.textContent = `x${mul}`;
        }
        if (this.sideTrashStat) {
            this.sideTrashStat.textContent = `${game.trashDestroyed || 0}`;
        }

        const highestTier = game.highestTierUnlocked || 1;
        if (this.sideEvoCount) {
            this.sideEvoCount.textContent = `${highestTier}/10`;
        }

        if (this.sideEvoRow && (this._lastRenderedTier !== highestTier || !this._evoInit)) {
            this._lastRenderedTier = highestTier;
            this._evoInit = true;
            this.sideEvoRow.innerHTML = '';

            for (let t = 1; t <= 10; t++) {
                const conf = CONFIG.TIERS[t];
                if (!conf) continue;
                const isUnlocked = t <= highestTier;
                const chip = document.createElement('div');
                chip.className = `evo-ball-chip ${isUnlocked ? 'unlocked' : 'locked'}`;
                chip.title = `Тир ${t}: ${conf.name} (${isUnlocked ? 'Открыто!' : 'Ещё не создано'})`;
                chip.style.borderColor = isUnlocked ? conf.color : 'rgba(255, 255, 255, 0.1)';
                
                const dataUrl = CONFIG.getCharacterDataURL(t, 48);
                const emoji = conf.emoji || "❓";
                chip.innerHTML = `
                    <img src="${dataUrl}" alt="${conf.name}" class="evo-chip-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
                    <span class="evo-chip-emoji" style="display: none;">${emoji}</span>
                    <span class="evo-chip-tier" style="color: ${isUnlocked ? conf.color : '#64748b'}">T${t}</span>
                `;

                chip.addEventListener('click', () => {
                    if (isUnlocked) {
                        this.setQuote(`«Мысль T${t}: ${conf.name} (+${conf.score} очков при слиянии)!»`);
                    } else {
                        this.setQuote(`«Мысль T${t} ещё не открыта. Объединяйте сферы в стакане!»`);
                    }
                });

                this.sideEvoRow.appendChild(chip);
            }
        }
    }
}
