// Yandex Games SDK v2 Mock / Stub for standalone and local development environments
(function() {
    if (typeof window.YaGames !== 'undefined') return;

    class MockPlayer {
        constructor() {
            this.uniqueID = 'local_user_' + (localStorage.getItem('skuf_mock_uid') || (() => {
                const id = Math.random().toString(36).substring(2, 9);
                localStorage.setItem('skuf_mock_uid', id);
                return id;
            })());
            this.name = 'Игрок Гигачад';
        }

        async getData(keys) {
            const raw = localStorage.getItem('yandex_cloud_mock_data');
            if (!raw) return {};
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(keys)) {
                    const res = {};
                    keys.forEach(k => { if (parsed[k] !== undefined) res[k] = parsed[k]; });
                    return res;
                }
                return parsed;
            } catch (e) {
                return {};
            }
        }

        async setData(data, flush = true) {
            const currentRaw = localStorage.getItem('yandex_cloud_mock_data');
            let current = {};
            try { if (currentRaw) current = JSON.parse(currentRaw); } catch(e) {}
            const updated = { ...current, ...data };
            localStorage.setItem('yandex_cloud_mock_data', JSON.stringify(updated));
            return true;
        }

        async getStats(keys) {
            const raw = localStorage.getItem('yandex_cloud_mock_stats');
            try { return raw ? JSON.parse(raw) : {}; } catch(e) { return {}; }
        }

        async setStats(stats) {
            const currentRaw = localStorage.getItem('yandex_cloud_mock_stats');
            let current = {};
            try { if (currentRaw) current = JSON.parse(currentRaw); } catch(e) {}
            const updated = { ...current, ...stats };
            localStorage.setItem('yandex_cloud_mock_stats', JSON.stringify(updated));
            return true;
        }

        getUniqueID() { return this.uniqueID; }
        getName() { return this.name; }
        getPhoto(size) { return ''; }
        getMode() { return 'lite'; }
    }

    class MockLeaderboards {
        async getLeaderboardDescription(name) {
            return {
                app: { id: 'cyber-skuf-2026' },
                default: true,
                description: { invert_sort_order: false, score_format: { Float: { decimal_offset: 0 } } },
                name: name,
                title: { ru: 'Зал Славы Гигачадов' }
            };
        }

        async getLeaderboardPlayerEntry(name) {
            const score = parseInt(localStorage.getItem('cyber_skuf_mock_score') || '0', 10);
            return {
                score: score,
                extraData: 'Кибер-Скуф',
                rank: 1,
                player: {
                    publicName: 'Игрок Гигачад',
                    uniqueID: 'local_user_001',
                    getAvatarSrc: () => ''
                }
            };
        }

        async getEntries(name, options = {}) {
            let entries = [];
            const saved = localStorage.getItem('cyber_skuf_local_lb');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    entries = parsed.map((e, idx) => ({
                        rank: idx + 1,
                        score: e.score,
                        extraData: e.title || 'Скуф',
                        player: {
                            publicName: e.name || 'Игрок',
                            uniqueID: 'mock_p_' + idx,
                            getAvatarSrc: () => ''
                        }
                    }));
                } catch(err) {}
            }

            if (entries.length === 0) {
                entries = [
                    { rank: 1, score: 45000000000, extraData: 'Абсолютный Гигачад', player: { publicName: 'Сигма-Лорд 3000', uniqueID: 'p1', getAvatarSrc: () => '' } },
                    { rank: 2, score: 18500000000, extraData: 'Сигма Мастер', player: { publicName: 'Виктор Превозмогатель', uniqueID: 'p2', getAvatarSrc: () => '' } },
                    { rank: 3, score: 7200000000, extraData: 'Владыка Разума', player: { publicName: 'Кибер-Скуф 2077', uniqueID: 'p3', getAvatarSrc: () => '' } }
                ];
            }

            return {
                leaderboard: { name },
                ranges: [{ start: 0, size: entries.length }],
                userRank: 1,
                entries: entries
            };
        }

        async getLeaderboardEntries(name, options) {
            return this.getEntries(name, options);
        }

        async setScore(name, score, extraData = '') {
            localStorage.setItem('cyber_skuf_mock_score', String(score));
            return true;
        }

        async setLeaderboardScore(name, score, extraData = '') {
            return this.setScore(name, score, extraData);
        }
    }

    const eventListeners = {};

    const mockInstance = {
        environment: {
            i18n: { lang: 'ru' },
            app: { id: 'cyber-skuf-2026' }
        },
        serverTime: () => Date.now(),
        on: (event, handler) => {
            if (!eventListeners[event]) eventListeners[event] = [];
            eventListeners[event].push(handler);
        },
        auth: {
            openAuthDialog: async () => true
        },
        features: {
            LoadingAPI: {
                ready: () => {
                    console.log('🚀 [YaGames Mock] LoadingAPI.ready() вызван');
                }
            },
            GameplayAPI: {
                start: () => {
                    console.log('🎮 [YaGames Mock] GameplayAPI.start()');
                },
                stop: () => {
                    console.log('⏸️ [YaGames Mock] GameplayAPI.stop()');
                }
            }
        },
        adv: {
            showFullscreenAdv: (opts = {}) => {
                if (opts.callbacks?.onOpen) opts.callbacks.onOpen();
                setTimeout(() => {
                    if (opts.callbacks?.onClose) opts.callbacks.onClose(true);
                }, 400);
            },
            showRewardedVideo: (opts = {}) => {
                if (opts.callbacks?.onOpen) opts.callbacks.onOpen();
                setTimeout(() => {
                    if (opts.callbacks?.onRewarded) opts.callbacks.onRewarded();
                    if (opts.callbacks?.onClose) opts.callbacks.onClose(true);
                }, 500);
            },
            showBannerAdv: async () => ({ stickyAdvIsShowing: true }),
            hideBannerAdv: async () => true,
            getBannerAdvStatus: async () => ({ stickyAdvIsShowing: true })
        },
        leaderboards: new MockLeaderboards(),
        getLeaderboards: async function() { return this.leaderboards; },
        getPlayer: async (opts) => new MockPlayer(),
        feedback: {
            canReview: async () => ({ value: true }),
            requestReview: async () => ({ feedbackSent: true })
        },
        shortcut: {
            canShowPrompt: async () => ({ canShow: true }),
            showPrompt: async () => ({ outcome: 'accepted' })
        },
        isAvailableMethod: async (methodName) => true
    };

    window.YaGames = {
        init: async () => {
            console.log('🌟 [YaGames Mock SDK v2] Инициализирован для автономной среды');
            return mockInstance;
        }
    };
})();
