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
        
        // Локальное кэширование рекордов для оффлайн/тестового режима
        this.localLeaderboard = this.loadLocalLeaderboard();
        
        // Бусты рекламы
        this.boosts = {
            turbo: {
                id: 'turbo',
                title: 'Турбо-Хайп',
                desc: 'Мгновенный вход в Лихорадку (16с) + 100% Дыхалка',
                cooldown: 45, // сек
                lastUsed: 0,
                color: '#ec4899',
                icon: '⚡'
            },
            energy: {
                id: 'energy',
                title: 'Турбо-Энергетик',
                desc: 'Мгновенный вход в Лихорадку (16с) + 100% Дыхалка',
                cooldown: 45, // сек
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

    showRewardedVideo(boostId, onRewarded, onClose) {
        this.showRewardedBoost(boostId, {
            onRewarded: onRewarded,
            onClose: onClose
        });
    }

    gameplayStart() {
        if (!this.isInitialized) return;

        try {
            this.ysdk?.features
                ?.GameplayAPI
                ?.start();
        } catch (e) {
            console.warn(
                'GameplayAPI.start error:',
                e
            );
        }
    }

    gameplayStop() {
        if (!this.isInitialized) return;

        try {
            this.ysdk?.features
                ?.GameplayAPI
                ?.stop();
        } catch (e) {
            console.warn(
                'GameplayAPI.stop error:',
                e
            );
        }
    }

    queueScore(score) {
        const numericScore =
            Math.max(
                0,
                Math.floor(score)
            );

        this.pendingScore =
            Math.max(
                this.pendingScore,
                numericScore
            );

        if (this.scoreFlushTimer) {
            return;
        }

        // Запас относительно лимита Яндекса 1 req/sec
        this.scoreFlushTimer =
            setTimeout(async () => {
                this.scoreFlushTimer = null;

                const scoreToSend =
                    this.pendingScore;

                this.pendingScore = 0;

                await this.submitScore(
                    scoreToSend
                );
            }, 1500);
    }

    markGameReady() {
        this.gameReadyRequested = true;

        this.flushGameReady();
    }

    flushGameReady() {
        if (
            !this.gameReadyRequested ||
            !this.isInitialized ||
            !this.ysdk
        ) {
            return;
        }

        try {
            this.ysdk.features
                ?.LoadingAPI
                ?.ready();
        } catch (e) {
            console.warn(
                'LoadingAPI.ready error:',
                e
            );
        }
    }

    // --- ЛОКАЛЬНЫЙ ЛИДЕРБОРД (Fallback) ---
    loadLocalLeaderboard() {
        const saved = localStorage.getItem('cyber_skuf_local_lb');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        // Начальный реалистичный список лидеров
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

    // --- РЕКЛАМНЫЕ БУСТЫ (Rewarded Video) ---
    showRewardedBoost(boostId, callbacks = {}) {
        const boost = this.boosts[boostId];
        if (!boost) return;

        const now = Date.now();
        const elapsed = (now - boost.lastUsed) / 1000;
        if (elapsed < boost.cooldown) {
            const left = Math.ceil(boost.cooldown - elapsed);
            if (callbacks.onCooldown) callbacks.onCooldown(left);
            return;
        }

        if (this.ysdk && this.isInitialized && this.ysdk.adv) {
            // Настоящий вызов Rewarded Video Яндекс Игр
            try {
                this.ysdk.adv.showRewardedVideo({
                    callbacks: {
                        onOpen: () => {
                            if (callbacks.onOpen) callbacks.onOpen();
                        },
                        onRewarded: () => {
                            boost.lastUsed = Date.now();
                            if (callbacks.onRewarded) callbacks.onRewarded(boostId);
                        },
                        onClose: () => {
                            if (callbacks.onClose) callbacks.onClose();
                        },
                        onError: (e) => {
                            console.warn(
                                'Ошибка показа Rewarded Video Яндекс:',
                                e
                            );

                            if (callbacks.onError) {
                                callbacks.onError(e);
                            }

                            // Обязательно освобождаем gameplay
                            if (callbacks.onClose) {
                                callbacks.onClose();
                            }
                        }
                    }
                });
                return;
            } catch (err) {
                console.warn('Исключение при вызове showRewardedVideo:', err);
            }
        }

        // Fallback-режим (симуляция просмотра промо 3 секунды с наградой)
        this.simulateAdModal(boost, callbacks);
    }

    simulateAdModal(boost, callbacks) {
        if (callbacks.onOpen) callbacks.onOpen();
        
        let secondsLeft = 3;
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop active';
        modal.style.zIndex = '99999';
        modal.innerHTML = `
            <div class="modal-box alert glass-panel" style="max-width: 320px; text-align: center; border-color: ${boost.color};">
                <div style="font-size: 36px; margin-bottom: 6px;">🎬</div>
                <h3 style="color: #ffd700; font-size: 16px; margin-bottom: 4px;">РЕКЛАМА ЯНДЕКС ИГР</h3>
                <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 12px;">Получение буста: <b>${boost.title}</b></p>
                <div class="lock-progress-track" style="height: 8px; margin-bottom: 12px;">
                    <div id="ad-sim-bar" class="lock-progress-bar" style="width: 0%; background: ${boost.color}; transition: width 3s linear;"></div>
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
                boost.lastUsed = Date.now();
                if (callbacks.onRewarded) callbacks.onRewarded(boost.id);
                if (callbacks.onClose) callbacks.onClose();
            }
        }, 1000);
    }

    getBoostCooldownLeft(boostId) {
        const boost = this.boosts[boostId];
        if (!boost) return 0;
        const elapsed = (Date.now() - boost.lastUsed) / 1000;
        return Math.max(0, Math.ceil(boost.cooldown - elapsed));
    }
}

window.YandexBridge = new YandexManager();
