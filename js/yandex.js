// Управление интеграцией с SDK Яндекс Игр (Yandex Games SDK v2)
// Включает: Авторизацию, Лидерборд (Leaderboards), Рекламные бусты (Rewarded Ads) и Fallback-режим

class YandexManager {
    constructor() {
        this.ysdk = null;
        this.player = null;
        this.leaderboards = null;
        this.isInitialized = false;
        this.isFallbackMode = false;
        this.leaderboardName = 'gigachad_leaderboard';
        this.pendingScore = 0;
        this.scoreFlushTimer = null;

        this.gameReadyRequested = false;
        this.isBannerVisible = false;
        
        // Cooldown для полноэкранной рекламы (между показами минимум 180 секунд = 3 минуты)
        this.lastInterstitialTime = 0;
        this.interstitialCooldown = 180000; // 180s в мс
        
        // Локальное кэширование рекордов для оффлайн/тестового режима
        this.localLeaderboard = this.loadLocalLeaderboard();
        
        // Реестр всех наград и бустов за просмотр рекламы (Rewarded Video)
        this.rewardsCatalog = {
            // 1. Возрождение в забеге
            revive: {
                id: 'revive',
                title: 'Второе Дыхание',
                desc: 'Восстановление 50% Дыхалки, очистка завала и +45с таймера',
                cooldown: 0,
                lastUsed: 0,
                color: '#38bdf8',
                icon: '🔄'
            },
            // 2. Умножение оффлайн дохода
            offline_x2: {
                id: 'offline_x2',
                title: '2x Оффлайн Доход',
                desc: 'Удвоение накопленной за время отсутствия Мотивации',
                cooldown: 0,
                lastUsed: 0,
                color: '#ffd700',
                icon: '💰'
            },
            // 3. Дополнительный спин рулетки
            roulette_spin: {
                id: 'roulette_spin',
                title: 'Фриспин Фортуны',
                desc: 'Мгновенный бесплатный запуск Колеса Фортуны',
                cooldown: 0,
                lastUsed: 0,
                color: '#a855f7',
                icon: '🎡'
            },
            // 4. Набор расходников в магазине
            consumable_pack: {
                id: 'consumable_pack',
                title: 'Гуманитарная Помощь',
                desc: 'Бесплатный комплект: +1 каждого из 5 расходников',
                cooldown: 40,
                lastUsed: 0,
                color: '#4ade80',
                icon: '📦'
            },
            // 5. Тактическая помощь боссу: Заморозка
            boss_freeze: {
                id: 'boss_freeze',
                title: 'Заморозка Аренды',
                desc: '+35 секунд к таймеру выселения хозяйки',
                cooldown: 35,
                lastUsed: 0,
                color: '#00e5ff',
                icon: '⏳'
            },
            // 5. Тактическая помощь боссу: Удар
            boss_nuke: {
                id: 'boss_nuke',
                title: 'Тактический Авиаудар',
                desc: 'Мгновенно сносит 15% от максимального HP босса',
                cooldown: 45,
                lastUsed: 0,
                color: '#ef4444',
                icon: '💥'
            },
            // 6. Удвоение награды за квест
            quest_x2: {
                id: 'quest_x2',
                title: '2x Награда Квеста',
                desc: 'Удвоение полученной Мотивации за выполненное задание',
                cooldown: 0,
                lastUsed: 0,
                color: '#f59e0b',
                icon: '🎁'
            },
            // 7. Супер-бонус при перерождении
            prestige_boost: {
                id: 'prestige_boost',
                title: 'Супер-Старт Сансары',
                desc: '+50 000 стартовой Мотивации и комплект расходников',
                cooldown: 0,
                lastUsed: 0,
                color: '#ec4899',
                icon: '🌀'
            },
            // Пользовательские бусты из меню
            turbo: {
                id: 'turbo',
                title: 'Турбо-Хайп',
                desc: 'Мгновенный вход в Лихорадку (16с) + 100% Дыхалка',
                cooldown: 45,
                lastUsed: 0,
                color: '#ec4899',
                icon: '⚡'
            },
            cleaning: {
                id: 'cleaning',
                title: 'Генеральный Клининг',
                desc: 'Робот-пылесос сжигает ВСЕ тревожные мысли на поле',
                cooldown: 60,
                lastUsed: 0,
                color: '#00f0ff',
                icon: '🧹'
            },
            crypto: {
                id: 'crypto',
                title: 'Крипто-Дроп',
                desc: 'Мгновенный бонус: +30 минут пассивного дохода',
                cooldown: 60,
                lastUsed: 0,
                color: '#ffd700',
                icon: '💰'
            },
            nuke: {
                id: 'nuke',
                title: 'Ядерная Петарда',
                desc: 'Наносит боссу сокрушительный урон: -25% от макс. HP',
                cooldown: 90,
                lastUsed: 0,
                color: '#ef4444',
                icon: '💣'
            }
        };

        this.boosts = this.rewardsCatalog;

        this.init();
    }

    async init() {
        if (typeof YaGames === 'undefined') {
            console.log(
                'ℹ️ YaGames SDK отсутствует — локальный fallback'
            );

            this.isFallbackMode = true;
            return;
        }

        try {
            this.ysdk =
                await YaGames.init();

            this.isInitialized = true;

            console.log(
                '✅ Yandex Games SDK инициализирован'
            );

            try {
                this.player =
                    await this.ysdk.getPlayer({
                        scopes: false
                    });
            } catch (e) {
                console.log(
                    'Гостевой режим Яндекс Игр'
                );
            }

            // Новый API
            this.leaderboards =
                this.ysdk.leaderboards || null;

            this.flushGameReady();

        } catch (err) {
            console.warn(
                'Ошибка YaGames.init():',
                err
            );

            this.isFallbackMode = true;
        }
    }

    // --- БЛОК 6: ОБЛАЧНЫЕ СОХРАНЕНИЯ (YANDEX CLOUD SAVES) ---
    async saveCloudData(data) {
        if (!data) return;
        try {
            if (this.isInitialized && this.player && typeof this.player.setData === 'function') {
                await this.player.setData({
                    saveData: JSON.stringify(data),
                    savedAt: Date.now()
                }, true);
                console.log('☁️ Сохранение успешно отправлено в Яндекс Облако');
            }
        } catch (e) {
            console.warn('Ошибка отправки в облако Яндекс:', e);
        }
    }

    async loadCloudData() {
        if (this.isInitialized && this.player && typeof this.player.getData === 'function') {
            try {
                const res = await this.player.getData(['saveData', 'savedAt']);
                if (res && res.saveData) {
                    const parsed = JSON.parse(res.saveData);
                    console.log('☁️ Облачное сохранение загружено');
                    return parsed;
                }
            } catch (e) {
                console.warn('Ошибка загрузки из облака Яндекс:', e);
            }
        }
        return null;
    }

    // --- ЛИДЕРБОРД ---
    async submitScore(
        score,
        extraData = ''
    ) {
        const numericScore =
            Math.floor(score);

        if (numericScore <= 0) {
            return;
        }

        this.updateLocalScore(
            numericScore
        );

        if (
            !this.isInitialized ||
            !this.ysdk?.leaderboards
        ) {
            return;
        }

        try {
            if (
                typeof this.ysdk
                    .isAvailableMethod ===
                'function'
            ) {
                const available =
                    await this.ysdk
                        .isAvailableMethod(
                            'leaderboards.setScore'
                        );

                if (!available) {
                    return;
                }
            }

            await this.ysdk
                .leaderboards
                .setScore(
                    this.leaderboardName,
                    numericScore,
                    extraData
                );

            console.log(
                `🏆 Score ${numericScore} отправлен`
            );

        } catch (err) {
            console.warn(
                'Leaderboard setScore error:',
                err
            );
        }
    }

    async getLeaderboard(
        quantityTop = 10,
        quantityAround = 3
    ) {
        if (
            this.isInitialized &&
            this.ysdk?.leaderboards
        ) {
            try {
                const res =
                    await this.ysdk
                        .leaderboards
                        .getEntries(
                            this.leaderboardName,
                            {
                                quantityTop,
                                includeUser: true,
                                quantityAround
                            }
                        );

                const playerId =
                    this.player?.getUniqueID?.() ||
                    null;

                const entries =
                    (res.entries || []).map(
                        entry => {
                            const isCurrentUser =
                                entry.player
                                    ?.uniqueID ===
                                playerId;

                            return {
                                rank: entry.rank,

                                name:
                                    entry.player
                                        ?.publicName ||
                                    'Анонимный Гигачад',

                                score:
                                    entry.score,

                                avatar:
                                    entry.player
                                        ?.getAvatarSrc?.(
                                            'small'
                                        ) || '',

                                isUser:
                                    isCurrentUser,

                                isCurrentUser,

                                title:
                                    entry.extraData ||
                                    'Кибер-Скуф'
                            };
                        }
                    );

                return {
                    entries,
                    userRank:
                        res.userRank || 0
                };

            } catch (err) {
                console.warn(
                    'Leaderboard getEntries error:',
                    err
                );
            }
        }

        return {
            entries:
                this.getLocalEntries(),

            userRank:
                this.getUserLocalRank()
        };
    }

    async getLeaderboardEntries(quantity = 15) {
        return this.getLeaderboard(quantity, 3);
    }

    gameplayStart() {
        if (!this.isInitialized) return;
        try {
            this.ysdk?.features?.GameplayAPI?.start();
        } catch (e) {
            console.warn('GameplayAPI.start error:', e);
        }
    }

    gameplayStop() {
        if (!this.isInitialized) return;
        try {
            this.ysdk?.features?.GameplayAPI?.stop();
        } catch (e) {
            console.warn('GameplayAPI.stop error:', e);
        }
    }

    queueScore(score) {
        const numericScore = Math.max(0, Math.floor(score));
        this.pendingScore = Math.max(this.pendingScore, numericScore);

        if (this.scoreFlushTimer) {
            return;
        }

        // Запас относительно лимита Яндекса 1 req/sec
        this.scoreFlushTimer = setTimeout(async () => {
            this.scoreFlushTimer = null;
            const scoreToSend = this.pendingScore;
            this.pendingScore = 0;
            await this.submitScore(scoreToSend);
        }, 1500);
    }

    markGameReady() {
        this.gameReadyRequested = true;
        this.flushGameReady();
    }

    flushGameReady() {
        if (!this.gameReadyRequested || !this.isInitialized || !this.ysdk) {
            return;
        }
        try {
            this.ysdk.features?.LoadingAPI?.ready();
        } catch (e) {
            console.warn('LoadingAPI.ready error:', e);
        }
    }

    // --- ЛОКАЛЬНЫЙ ЛИДЕРБОРД (Fallback) ---
    loadLocalLeaderboard() {
        const saved = localStorage.getItem('cyber_skuf_local_lb');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            { rank: 1, name: "Сигма-Лорд 3000", score: 45000000000, title: "Абсолютный Гигачад" },
            { rank: 2, name: "Виктор Превозмогатель", score: 18500000000, title: "Сигма Мастер" },
            { rank: 3, name: "Кибер-Скуф 2077", score: 7200000000, title: "Владыка Разума" },
            { rank: 4, name: "Дмитрий_Без_Лени", score: 2800000000, title: "Марафонец" },
            { rank: 5, name: "Котовод_Альфа", score: 950000000, title: "Босс Комнаты" },
            { rank: 6, name: "Энергетик_Бой", score: 320000000, title: "Хайп Мастер" },
            { rank: 7, name: "Турбо_Гантель", score: 110000000, title: "Превозмогатель" },
            { rank: 8, name: "Программист_Михаил", score: 45000000, title: "Тюбик+" },
            { rank: 9, name: "Спящий_На_Диване", score: 12000000, title: "Скуф" },
            { rank: 10, name: "Новичок_В_Хрущёвке", score: 2500000, title: "Квадробер" }
        ];
    }

    updateLocalScore(score) {
        const userScore = Math.max(score, parseInt(localStorage.getItem('cyber_skuf_high_score') || '0', 10));
        localStorage.setItem('cyber_skuf_high_score', userScore.toString());
    }

    getLocalEntries() {
        const userScore = parseInt(localStorage.getItem('cyber_skuf_high_score') || '0', 10);
        const list = [...this.localLeaderboard];
        
        // Вставляем игрока
        const userEntry = {
            rank: 0,
            name: "Вы (Скуф-Превозмогатель)",
            score: userScore,
            isUser: true,
            title: userScore > 100000000 ? "Гигачад" : "На пути к величию"
        };
        
        list.push(userEntry);
        list.sort((a, b) => b.score - a.score);
        
        return list.slice(0, 10).map((item, idx) => ({
            ...item,
            rank: idx + 1
        }));
    }

    getUserLocalRank() {
        const userScore = parseInt(localStorage.getItem('cyber_skuf_high_score') || '0', 10);
        const list = [...this.localLeaderboard, { score: userScore }];
        list.sort((a, b) => b.score - a.score);
        const idx = list.findIndex(item => item.score === userScore);
        return idx !== -1 ? idx + 1 : list.length;
    }

    // =========================================================
    // МЕХАНИКА 1: ПОЛНОЭКРАННАЯ МЕЖСТРАНИЧНАЯ РЕКЛАМА (INTERSTITIAL)
    // Cooldown 180с между показами. Безопасная пауза игры и звука.
    // =========================================================
    canShowInterstitial() {
        const now = Date.now();
        return (now - this.lastInterstitialTime) >= this.interstitialCooldown;
    }

    getInterstitialCooldownLeft() {
        const now = Date.now();
        const elapsed = now - this.lastInterstitialTime;
        return Math.max(0, Math.ceil((this.interstitialCooldown - elapsed) / 1000));
    }

    showFullscreenAdv(callbacks = {}) {
        if (!this.canShowInterstitial()) {
            console.log(`ℹ️ Межстраничная реклама на кулдауне (${this.getInterstitialCooldownLeft()}с осталось)`);
            if (typeof callbacks.onClose === 'function') callbacks.onClose(false);
            return;
        }

        console.log('🎬 Запуск Interstitial рекламы...');
        
        // Пауза игры и музыки
        if (window.gameInstance && typeof window.gameInstance.pause === 'function') {
            window.gameInstance.pause('interstitial-ad');
        }
        if (typeof AudioCtrl !== 'undefined' && typeof AudioCtrl.pauseBGMForAd === 'function') {
            AudioCtrl.pauseBGMForAd();
        }

        const resumeEverything = (wasShown = true) => {
            this.lastInterstitialTime = Date.now();
            if (window.gameInstance && typeof window.gameInstance.resume === 'function') {
                window.gameInstance.resume('interstitial-ad');
            }
            if (typeof AudioCtrl !== 'undefined' && typeof AudioCtrl.resumeBGMForAd === 'function') {
                AudioCtrl.resumeBGMForAd();
            }
            if (typeof callbacks.onClose === 'function') {
                callbacks.onClose(wasShown);
            }
        };

        if (this.ysdk && this.isInitialized && this.ysdk.adv && typeof this.ysdk.adv.showFullscreenAdv === 'function') {
            try {
                this.ysdk.adv.showFullscreenAdv({
                    callbacks: {
                        onOpen: () => {
                            if (typeof callbacks.onOpen === 'function') callbacks.onOpen();
                        },
                        onClose: (wasShown) => {
                            resumeEverything(wasShown);
                        },
                        onError: (e) => {
                            console.warn('Ошибка вызова showFullscreenAdv SDK:', e);
                            if (typeof callbacks.onError === 'function') callbacks.onError(e);
                            resumeEverything(false);
                        }
                    }
                });
                return;
            } catch (err) {
                console.warn('Исключение при вызове showFullscreenAdv:', err);
                resumeEverything(false);
                return;
            }
        }

        // Fallback-режим: быстрая имитация межстраничной плашки
        this.simulateInterstitialModal(callbacks, resumeEverything);
    }

    simulateInterstitialModal(callbacks, onComplete) {
        if (typeof callbacks.onOpen === 'function') callbacks.onOpen();

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop active';
        modal.style.zIndex = '999999';
        modal.innerHTML = `
            <div class="modal-box alert glass-panel" style="max-width: 320px; text-align: center; border-color: #ffd700;">
                <div style="font-size: 38px; margin-bottom: 6px;">📺</div>
                <h3 style="color: #ffd700; font-size: 16px; margin-bottom: 4px;">РЕКЛАМА ЯНДЕКС ИГР</h3>
                <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 12px;">Спонсор кибер-отдыха</p>
                <div class="lock-progress-track" style="height: 6px; margin-bottom: 10px;">
                    <div id="inter-sim-bar" class="lock-progress-bar" style="width: 0%; background: #ffd700; transition: width 1.2s linear;"></div>
                </div>
                <div id="inter-sim-label" style="font-size: 12px; font-weight: 700; color: #94a3b8;">Загрузка...</div>
            </div>
        `;
        document.body.appendChild(modal);

        setTimeout(() => {
            const bar = document.getElementById('inter-sim-bar');
            if (bar) bar.style.width = '100%';
        }, 50);

        setTimeout(() => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
            onComplete(true);
        }, 1300);
    }

    // =========================================================
    // МЕХАНИКА 2: REWARDED VIDEO (7 ТОЧЕК НАГРАД + БУСТЫ)
    // Начисление строго в onRewarded. Безопасная пауза и возобновление.
    // =========================================================
    showRewardedVideo(rewardType, onRewardedOrCallbacks, onCloseFallback) {
        let callbacks = {};
        if (typeof onRewardedOrCallbacks === 'function') {
            callbacks = {
                onRewarded: onRewardedOrCallbacks,
                onClose: onCloseFallback
            };
        } else if (typeof onRewardedOrCallbacks === 'object' && onRewardedOrCallbacks !== null) {
            callbacks = onRewardedOrCallbacks;
        }

        const reward = this.rewardsCatalog[rewardType] || {
            id: rewardType,
            title: 'Бонус за просмотр',
            desc: 'Награда за активность в игре',
            cooldown: 0,
            lastUsed: 0,
            color: '#00f0ff',
            icon: '🎁'
        };

        const now = Date.now();
        if (reward.cooldown > 0) {
            const elapsed = (now - reward.lastUsed) / 1000;
            if (elapsed < reward.cooldown) {
                const left = Math.ceil(reward.cooldown - elapsed);
                if (typeof callbacks.onCooldown === 'function') {
                    callbacks.onCooldown(left);
                }
                return;
            }
        }

        // Пауза игры и музыки
        if (window.gameInstance && typeof window.gameInstance.pause === 'function') {
            window.gameInstance.pause('rewarded-ad');
        }
        if (typeof AudioCtrl !== 'undefined' && typeof AudioCtrl.pauseBGMForAd === 'function') {
            AudioCtrl.pauseBGMForAd();
        }

        let userEarnedReward = false;

        const cleanupAndResume = () => {
            if (window.gameInstance && typeof window.gameInstance.resume === 'function') {
                window.gameInstance.resume('rewarded-ad');
            }
            if (typeof AudioCtrl !== 'undefined' && typeof AudioCtrl.resumeBGMForAd === 'function') {
                AudioCtrl.resumeBGMForAd();
            }
            if (typeof callbacks.onClose === 'function') {
                callbacks.onClose(userEarnedReward);
            }
        };

        if (this.ysdk && this.isInitialized && this.ysdk.adv && typeof this.ysdk.adv.showRewardedVideo === 'function') {
            try {
                this.ysdk.adv.showRewardedVideo({
                    callbacks: {
                        onOpen: () => {
                            if (typeof callbacks.onOpen === 'function') callbacks.onOpen();
                        },
                        onRewarded: () => {
                            userEarnedReward = true;
                            reward.lastUsed = Date.now();
                            try {
                                if (typeof callbacks.onRewarded === 'function') {
                                    callbacks.onRewarded(reward.id);
                                }
                            } catch (rewardErr) {
                                console.error('Ошибка в обработчике onRewarded:', rewardErr);
                            }
                        },
                        onClose: () => {
                            cleanupAndResume();
                        },
                        onError: (e) => {
                            console.warn('Ошибка вызова showRewardedVideo SDK:', e);
                            if (typeof callbacks.onError === 'function') callbacks.onError(e);
                            cleanupAndResume();
                        }
                    }
                });
                return;
            } catch (err) {
                console.warn('Исключение при вызове showRewardedVideo:', err);
                cleanupAndResume();
                return;
            }
        }

        // Fallback-режим (симуляция просмотра промо 3 секунды)
        this.simulateRewardedModal(reward, callbacks, () => {
            userEarnedReward = true;
            reward.lastUsed = Date.now();
            try {
                if (typeof callbacks.onRewarded === 'function') {
                    callbacks.onRewarded(reward.id);
                }
            } catch (rewardErr) {
                console.error('Ошибка в обработчике onRewarded (fallback):', rewardErr);
            }
            cleanupAndResume();
        });
    }

    simulateRewardedModal(reward, callbacks, onRewardedComplete) {
        if (typeof callbacks.onOpen === 'function') callbacks.onOpen();
        
        let secondsLeft = 3;
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop active';
        modal.style.zIndex = '999999';
        modal.innerHTML = `
            <div class="modal-box alert glass-panel" style="max-width: 320px; text-align: center; border-color: ${reward.color}; box-shadow: 0 0 25px ${reward.color}44;">
                <div style="font-size: 36px; margin-bottom: 6px;">${reward.icon || '🎬'}</div>
                <h3 style="color: #ffd700; font-size: 16px; margin-bottom: 4px;">РЕКЛАМА ЯНДЕКС ИГР</h3>
                <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 12px;">Получение: <b>${reward.title}</b></p>
                <div class="lock-progress-track" style="height: 8px; margin-bottom: 12px;">
                    <div id="ad-sim-bar" class="lock-progress-bar" style="width: 0%; background: ${reward.color}; transition: width 3s linear;"></div>
                </div>
                <div id="ad-sim-timer" style="font-size: 14px; font-weight: 800; color: #00f0ff;">Просмотр: ${secondsLeft}с</div>
            </div>
        `;
        document.body.appendChild(modal);

        // Запуск прогресс-бара
        setTimeout(() => {
            const bar = document.getElementById('ad-sim-bar');
            if (bar) bar.style.width = '100%';
        }, 50);

        const interval = setInterval(() => {
            secondsLeft--;
            const timerEl = document.getElementById('ad-sim-timer');
            if (timerEl) timerEl.textContent = `Просмотр: ${secondsLeft}с`;

            if (secondsLeft <= 0) {
                clearInterval(interval);
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                onRewardedComplete();
            }
        }, 1000);
    }

    // Совместимость со старым методом
    showRewardedBoost(boostId, callbacks = {}) {
        this.showRewardedVideo(boostId, callbacks);
    }

    getBoostCooldownLeft(boostId) {
        const reward = this.rewardsCatalog[boostId];
        if (!reward) return 0;
        const elapsed = (Date.now() - reward.lastUsed) / 1000;
        return Math.max(0, Math.ceil(reward.cooldown - elapsed));
    }

    // =========================================================
    // МЕХАНИКА 3: БАННЕРНАЯ РЕКЛАМА (BANNER ADS / STICKY BANNER)
    // Показывается ТОЛЬКО на пассивных экранах (Меню, Магазин, Лидерборд, Статы)
    // Скрывается во время активного геймплея и боссфайтов.
    // =========================================================
    showBannerAdv() {
        if (this.ysdk && this.isInitialized && this.ysdk.adv && typeof this.ysdk.adv.showBannerAdv === 'function') {
            try {
                this.ysdk.adv.showBannerAdv().then(({ sticky }) => {
                    this.isBannerVisible = true;
                    console.log('📌 Баннер показан, sticky:', sticky);
                }).catch(e => {
                    console.warn('showBannerAdv warning:', e);
                });
            } catch (e) {
                console.warn('showBannerAdv error:', e);
            }
        } else {
            this.isBannerVisible = true;
        }
    }

    hideBannerAdv() {
        if (this.ysdk && this.isInitialized && this.ysdk.adv && typeof this.ysdk.adv.hideBannerAdv === 'function') {
            try {
                this.ysdk.adv.hideBannerAdv().then(() => {
                    this.isBannerVisible = false;
                    console.log('📌 Баннер скрыт');
                }).catch(e => {
                    console.warn('hideBannerAdv warning:', e);
                });
            } catch (e) {
                console.warn('hideBannerAdv error:', e);
            }
        } else {
            this.isBannerVisible = false;
        }
    }
}

window.YandexBridge = new YandexManager();
