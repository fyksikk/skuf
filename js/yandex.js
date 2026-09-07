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
                desc: 'Мгновенно активирует Лихорадку на 16 сек и восполняет 100% Дыхалки.',
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
                desc: 'Наносит 28% максимального HP босса',
                cooldown: 90,
                lastUsed: 0,
                color: '#ef4444',
                icon: '💣'
            }
        };

        this.boosts = this.rewardsCatalog;

        this.language = 'ru';

        this.platformPaused = false;

        this.pendingCloudData = null;
        this.cloudSaveTimer = null;

        this.adStateKey = 'skuf_yandex_ad_state_v1';

        this.loadAdState();

        this.readyPromise = this.init();
    }

    async whenReady() {
        try {
            await this.readyPromise;
        } catch (e) {
            console.warn(
                'Yandex SDK ready error:',
                e
            );
        }

        return this;
    }

    now() {
        try {
            return (
                this.ysdk?.serverTime?.() ??
                Date.now()
            );
        } catch {
            return Date.now();
        }
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
            this.ysdk = await YaGames.init();
            
            // -----------------------------------------
            // AUTOMATIC LANGUAGE DETECTION
            // -----------------------------------------

            const detectedLanguage =
                this.ysdk
                    ?.environment
                    ?.i18n
                    ?.lang ||
                'ru';

            // Сейчас игра имеет русскую локализацию.
            // Для неизвестных языков остаёмся на RU.
            const supportedLanguages = [
                'ru'
            ];

            this.language =
                supportedLanguages.includes(
                    detectedLanguage
                )
                    ? detectedLanguage
                    : 'ru';

            window.GAME_LANG =
                this.language;

            document.documentElement.lang =
                this.language;

            document.documentElement.dataset.platformLang =
                detectedLanguage;

            this.isInitialized = true;

            console.log(
                '✅ Yandex Games SDK инициализирован'
            );

            try {
                this.player = await this.ysdk.getPlayer();
            } catch (e) {
                console.warn(
                    'Player init failed:',
                    e
                );

                this.player = null;
            }

            // Новый API
            this.leaderboards =
                this.ysdk.leaderboards || null;

            this.bindPlatformEvents();

            this.flushGameReady();

        } catch (err) {
            console.warn(
                'Ошибка YaGames.init():',
                err
            );

            this.isFallbackMode = true;
        }
    }

    bindPlatformEvents() {
        if (!this.ysdk?.on) {
            return;
        }

        this.platformPauseHandler = () => {
            this.platformPaused = true;

            window.gameInstance?.pause?.(
                'yandex-platform',
                {
                    skipSdk: true
                }
            );

            if (typeof AudioCtrl !== 'undefined') {
                AudioCtrl?.suspend?.();
            }
        };

        this.platformResumeHandler = () => {
            this.platformPaused = false;

            window.gameInstance?.resume?.(
                'yandex-platform',
                {
                    skipSdk: true
                }
            );
        };

        this.ysdk.on(
            'game_api_pause',
            this.platformPauseHandler
        );

        this.ysdk.on(
            'game_api_resume',
            this.platformResumeHandler
        );
    }

    queueCloudSave(
        data,
        {
            flush = false
        } = {}
    ) {
        if (!data) return;

        // saveGame каждый раз создаёт новый object,
        // поэтому ссылку можно безопасно заменить.
        this.pendingCloudData = data;

        if (flush) {
            return this.flushCloudSave(true);
        }

        if (this.cloudSaveTimer) {
            return;
        }

        // Максимум примерно один cloud write в 15 секунд.
        this.cloudSaveTimer = setTimeout(() => {
            this.flushCloudSave(false);
        }, 15000);
    }

    async flushCloudSave(flush = true) {
        if (this.cloudSaveTimer) {
            clearTimeout(this.cloudSaveTimer);
            this.cloudSaveTimer = null;
        }

        const data = this.pendingCloudData;

        if (!data) {
            return false;
        }

        if (
            !this.isInitialized ||
            !this.player ||
            typeof this.player.setData !== 'function'
        ) {
            return false;
        }

        this.pendingCloudData = null;

        try {
            await this.player.setData(
                {
                    saveData: JSON.stringify(data),
                    savedAt: this.now()
                },
                flush
            );

            return true;

        } catch (e) {
            // Не теряем последнее состояние.
            this.pendingCloudData = data;

            console.warn(
                'Cloud save failed:',
                e
            );

            return false;
        }
    }

    async loadCloudData() {
        if (
            !this.isInitialized ||
            !this.player ||
            typeof this.player.getData !== 'function'
        ) {
            return null;
        }

        try {
            const res = await this.player.getData([
                'saveData',
                'savedAt'
            ]);

            if (!res?.saveData) {
                return null;
            }

            const parsed = JSON.parse(res.saveData);

            return {
                data: parsed,
                savedAt: Number(
                    res.savedAt ||
                    parsed.lastSavedTime ||
                    0
                )
            };

        } catch (e) {
            console.warn(
                'Cloud load failed:',
                e
            );

            return null;
        }
    }

    isAuthorized() {
        try {
            return !!this.player?.isAuthorized?.();
        } catch {
            return false;
        }
    }

    async authorize() {
        if (
            !this.isInitialized ||
            !this.ysdk?.auth?.openAuthDialog
        ) {
            return false;
        }

        if (this.isAuthorized()) {
            return true;
        }

        try {
            await this.ysdk.auth.openAuthDialog();
            this.player = await this.ysdk.getPlayer();
            return this.isAuthorized();
        } catch (e) {
            console.warn(
                'Authorization cancelled:',
                e
            );
            return false;
        }
    }

    // --- ЛИДЕРБОРД ---
    async submitScore(score, extraData = '') {
        const numericScore = Math.floor(score);

        if (numericScore <= 0) {
            return;
        }

        this.updateLocalScore(numericScore);

        if (!this.isAuthorized()) {
            return;
        }

        if (
            !this.isInitialized ||
            !this.ysdk?.leaderboards
        ) {
            return;
        }

        try {
            if (typeof this.ysdk.isAvailableMethod === 'function') {
                const available = await this.ysdk.isAvailableMethod(
                    'leaderboards.setScore'
                );

                if (!available) {
                    return;
                }
            }

            await this.ysdk.leaderboards.setScore(
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

    async getLeaderboard(quantityTop = 10, quantityAround = 3) {
        if (
            this.isInitialized &&
            this.ysdk?.leaderboards
        ) {
            try {
                const res = await this.ysdk.leaderboards.getEntries(
                    this.leaderboardName,
                    {
                        quantityTop,
                        includeUser: true,
                        quantityAround
                    }
                );

                const playerId =
                    this.player?.getUniqueID?.() || null;

                const entries = (res.entries || []).map(entry => {
                    const isCurrentUser =
                        entry.player?.uniqueID === playerId;

                    return {
                        rank: entry.rank,
                        name:
                            entry.player?.publicName ||
                            'Анонимный Гигачад',
                        score: entry.score,
                        avatar:
                            entry.player?.getAvatarSrc?.(
                                'small'
                            ) || '',
                        isUser: isCurrentUser,
                        isCurrentUser,
                        title:
                            entry.extraData ||
                            'Кибер-Скуф'
                    };
                });

                return {
                    entries,
                    userRank: res.userRank || 0
                };

            } catch (err) {
                console.warn(
                    'Leaderboard getEntries error:',
                    err
                );
            }
        }

        return {
            entries: this.getLocalEntries(),
            userRank: this.getUserLocalRank()
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
    loadAdState() {
        try {
            const raw = localStorage.getItem(this.adStateKey);
            if (!raw) return;

            const data = JSON.parse(raw);
            this.lastInterstitialTime = Number(data.lastInterstitialTime || 0);
            const rewards = data.rewards || {};

            for (const [id, reward] of Object.entries(this.rewardsCatalog)) {
                reward.lastUsed = Number(rewards[id] || 0);
            }
        } catch (e) {
            console.warn('Ad state load error:', e);
        }
    }

    saveAdState() {
        try {
            const rewards = {};
            for (const [id, reward] of Object.entries(this.rewardsCatalog)) {
                rewards[id] = reward.lastUsed || 0;
            }

            localStorage.setItem(
                this.adStateKey,
                JSON.stringify({
                    lastInterstitialTime: this.lastInterstitialTime,
                    rewards
                })
            );
        } catch (e) {
            console.warn('Ad state save error:', e);
        }
    }

    canShowInterstitial() {
        const now = this.now();
        return (now - this.lastInterstitialTime) >= this.interstitialCooldown;
    }

    getInterstitialCooldownLeft() {
        const now = this.now();
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
        
        let finished = false;

        const finish = (wasShown = false) => {
            if (finished) return;
            finished = true;

            if (wasShown) {
                this.lastInterstitialTime = this.now();
                this.saveAdState();
            }

            window.gameInstance?.resume?.('interstitial-ad');

            if (typeof AudioCtrl !== 'undefined') {
                AudioCtrl?.resumeBGMForAd?.();
            }

            callbacks.onClose?.(wasShown);
        };

        // Пауза игры и музыки
        if (window.gameInstance && typeof window.gameInstance.pause === 'function') {
            window.gameInstance.pause('interstitial-ad');
        }
        if (typeof AudioCtrl !== 'undefined' && typeof AudioCtrl.pauseBGMForAd === 'function') {
            AudioCtrl.pauseBGMForAd();
        }

        if (this.ysdk && this.isInitialized && this.ysdk.adv && typeof this.ysdk.adv.showFullscreenAdv === 'function') {
            try {
                this.ysdk.adv.showFullscreenAdv({
                    callbacks: {
                        onOpen: () => {
                            if (typeof callbacks.onOpen === 'function') callbacks.onOpen();
                        },
                        onClose: wasShown => {
                            finish(wasShown);
                        },
                        onError: error => {
                            console.warn('Fullscreen ad error:', error);
                            callbacks.onError?.(error);
                            finish(false);
                        }
                    }
                });
                return;
            } catch (err) {
                console.warn('Исключение при вызове showFullscreenAdv:', err);
                callbacks.onError?.(err);
                finish(false);
                return;
            }
        }

        // Production fallback: no fake ad modal
        const error = new Error('YANDEX_AD_UNAVAILABLE');
        callbacks.onError?.(error);
        finish(false);
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

        const now = this.now();
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
        let finished = false;

        const cleanupAndResume = () => {
            if (finished) return;
            finished = true;

            window.gameInstance?.resume?.('rewarded-ad');

            if (typeof AudioCtrl !== 'undefined') {
                AudioCtrl?.resumeBGMForAd?.();
            }

            callbacks.onClose?.(userEarnedReward);
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
                            reward.lastUsed = this.now();
                            this.saveAdState();
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
                        onError: e => {
                            console.warn('Ошибка вызова showRewardedVideo SDK:', e);
                            if (typeof callbacks.onError === 'function') callbacks.onError(e);
                            cleanupAndResume();
                        }
                    }
                });
                return;
            } catch (err) {
                console.warn('Исключение при вызове showRewardedVideo:', err);
                if (typeof callbacks.onError === 'function') callbacks.onError(err);
                cleanupAndResume();
                return;
            }
        }

        // Production fallback: no fake modal, no reward
        const error = new Error('YANDEX_REWARDED_UNAVAILABLE');
        callbacks.onError?.(error);
        cleanupAndResume();
    }

    // Совместимость со старым методом
    showRewardedBoost(boostId, callbacks = {}) {
        this.showRewardedVideo(boostId, callbacks);
    }

    getBoostCooldownLeft(boostId) {
        const reward = this.rewardsCatalog[boostId];
        if (!reward) return 0;
        const elapsed = (this.now() - reward.lastUsed) / 1000;
        return Math.max(0, Math.ceil(reward.cooldown - elapsed));
    }

    // =========================================================
    // МЕХАНИКА 3: БАННЕРНАЯ РЕКЛАМА (BANNER ADS / STICKY BANNER)
    // Показывается ТОЛЬКО на пассивных экранах (Меню, Магазин, Лидерборд, Статы)
    // Скрывается во время активного геймплея и боссфайтов.
    // =========================================================
    showBannerAdv() {
        if (
            !this.isInitialized ||
            !this.ysdk?.adv?.showBannerAdv
        ) {
            return;
        }

        return this.ysdk.adv.showBannerAdv()
            .then(result => {
                this.isBannerVisible = !!result?.stickyAdvIsShowing;
                console.log(
                    'Sticky banner:',
                    result?.stickyAdvIsShowing,
                    result?.reason || ''
                );
                return result;
            })
            .catch(e => {
                console.warn('showBannerAdv error:', e);
            });
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
