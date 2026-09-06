class SkufLifeGame {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-wrapper');

        this.ui = new UIManager(this);
        this.roomRenderer = new RoomRenderer();

        this.runMotivationEarned = 0;
        this.runBossesDefeated = 0;
        this.uiTickAccumulator = 0;
        // Основное состояние
        this.motivation = 0;
        this.totalMotivationEarned = 0;
        this.passiveIncome = 0;
        this.globalIncomeMultiplier = 1.0;
        this.bossDamageMultiplier = 1.0;

        // Выносливость
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRecoveryRate = 14;
        this.isExhausted = false;

        // Фаза и Боссы
        this.day = 1;
        this.maxDays = 20;
        this.currentBossIndex = 1;
        this.bossHp = CONFIG.BOSSES[1].hp;
        this.rentTimeMax = 120;
        this.rentTimer = this.rentTimeMax;
        this.isGameOver = false;

        // Престиж / Сансара
        this.prestigeCouches = 0;
        this.prestigeLevel = 0;
        this.autoDropEnabled = false;
        this.autoDropTimer = 0;

        // Статистика
        this.totalMerges = 0;
        this.gigachadsCreated = 0;
        this.bossesDefeated = 0;
        this.trashDestroyed = 0;
        this.maxCombo = 0;
        this.totalTaps = 0;
        this.totalSpins = 0;
        this.tierCreatedCounts = {};
        this.playTimeSeconds = 0;
        this.unlockedAchievements = [];

        // Расходники
        this.items = { beer: 1, script: 1, energy: 1, bomb: 1, magnet: 1 };
        this.activeRelics = [];
        this.activeConsumableMode = null; // 'beer' | 'bomb'
        this.flashActiveUntil = 0;
        this.flashDuration = 12000;
        this.magnetActiveUntil = 0;
        this.bossBreakTimer = 0; // Кулдаун между боссами

        // Хайп / Fever Mode
        this.feverCharge = 0;
        this.isFeverActive = false;
        this.feverTimer = 0;
        this.feverDuration = 10;

        // Колесо Фортуны / Рулетка
        this.freeSpinsAvailable = 1;
        this.rouletteTimer = 90;

        // Ранг / Звание
        this.currentRankIndex = 0;

        // Квесты (Полноценный пул с синхронизацией по 00:00 МСК)
        this.questsDateKey = CONFIG.getMoscowDateKey();
        this.dailyQuests = [];
        this.initDailyQuestsPool();

        // Механика сброса мыслей
        this.nextTier = 1;
        this.aimX = 180;
        this.dropCooldown = 0;
        this.dropCooldownMs = 380;
        this.shakeCooldown = 0;
        this.shakeCooldownMax = 12;

        // Комбо
        this.combo = 0;
        this.comboMultiplier = 1.0;
        this.comboTimer = 0;

        // Красная черта
        this.dangerTimer = 0;
        this.dangerLimit = 2.2;

        // Всплывающие эффекты
        this.floatingTexts = [];
        this.sparkleParticles = [];

        // Настройка спецэффектов (FX)
        const savedFx = localStorage.getItem('skuf_fx_enabled');
        this.fxEnabled = savedFx !== null ? savedFx === 'true' : true;

        // Размеры
        this.roomHeight = 160;
        this.brainTopY = 175;
        this.dropY = 195;
        this.dangerLineY = 225;

        // Интерактивные фичи (Инсайты, Тилт, Двойной тап)
        this.insightBubbles = [];
        this.bubbleSpawnTimer = 8;
        this.tiltTimer = 0;
        this.gyroEnabled = false;
        this.lastTapTime = 0;
        this.lastTapPos = { x: 0, y: 0 };

        // Физика
        this.physics = new BrainPhysics(
            this.canvas,
            this.handleMerge.bind(this),
            this.handleGarbageDestroyed.bind(this)
        );

        this.isRunning = false;
        this.hasStarted = false;
        this.isPaused = true;
        this.isGameOver = false;

        this.pauseReasons = new Set(['start-menu']);

        this.rafId = null;

        // bind делаем один раз, а не каждый requestAnimationFrame
        this.gameLoop = this.gameLoop.bind(this);

        // Fixed timestep для Matter.js
        this.fixedPhysicsStepMs = 1000 / 60;
        this.physicsAccumulatorMs = 0;

        // Более редкое обновление DOM
        this.uiTickAccumulator = 0;
        this.lastHudUpdate = 0;
        this.hudDirty = true;

        // Кулдауны предметов комнаты
        this.roomInteractionReadyAt = Object.create(null);
        this.setupInputHandlers();
        this.applyFxState();
        this.resizeCanvas();
        this.loadGame();
        this.ensureInitialBodies();
        this.boundHandleOrientation = this.handleOrientation.bind(this);
        window.addEventListener('resize', () => this.resizeCanvas());

        if (window.ResizeObserver && this.container) {
            new ResizeObserver(() => this.resizeCanvas()).observe(this.container);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause('visibility');
            } else {
                this.resume('visibility');
            }
        });

        window.addEventListener('pagehide', () => {
            this.saveGame();
        });

        // Авто-сохранение каждые 4 секунды
        setInterval(() => this.saveGame(), 4000);
        window.YandexBridge
            ?.markGameReady?.();
    }

    scheduleNextFrame() {
        if (
            this.rafId !== null ||
            !this.isRunning ||
            this.isPaused ||
            this.isGameOver
        ) {
            return;
        }

        this.rafId = requestAnimationFrame(this.gameLoop);
    }

    tryRoomInteractionCooldown(
        id,
        cooldownMs,
        x,
        y
    ) {
        const now = performance.now();

        const readyAt =
            this.roomInteractionReadyAt[id] || 0;

        if (now < readyAt) {
            const seconds =
                Math.ceil(
                    (readyAt - now) / 1000
                );

            this.spawnFloatingText(
                x,
                y - 18,
                `⏳ ${seconds}с`,
                "#94a3b8"
            );

            return false;
        }

        this.roomInteractionReadyAt[id] =
            now + cooldownMs;

        return true;
    }

    pause(reason = 'manual') {
        this.pauseReasons.add(reason);
        this.isPaused = true;

        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        if (this.hasStarted) {
            window.YandexBridge?.gameplayStop?.();
        }

        AudioCtrl.suspend?.();
    }

    resume(reason = 'manual') {
        this.pauseReasons.delete(reason);

        if (
            !this.hasStarted ||
            this.isGameOver ||
            this.pauseReasons.size > 0
        ) {
            return;
        }

        this.isPaused = false;
        this.isRunning = true;

        this.lastTime = performance.now();
        this.physicsAccumulatorMs = 0;

        window.YandexBridge?.gameplayStart?.();

        AudioCtrl.resume?.();

        this.scheduleNextFrame();
    }

    resizeCanvas() {
        const rect =
            this.container
                .getBoundingClientRect();

        const w =
            Math.round(
                rect.width ||
                this.container.clientWidth ||
                window.innerWidth ||
                360
            );

        const h =
            Math.round(
                rect.height ||
                this.container.clientHeight ||
                window.innerHeight ||
                540
            );

        if (w <= 0 || h <= 0) {
            return;
        }

        this.canvas.width = w;
        this.canvas.height = h;

        // -----------------------------------------
        // ОРИЕНТАЦИЯ
        // -----------------------------------------

        const isLandscape =
            w > h ||
            w / h > 1.12;

        // -----------------------------------------
        // КОМНАТА
        // -----------------------------------------

        if (isLandscape) {

            // Низкие мобильные landscape
            if (h < 420) {
                this.roomHeight =
                    Math.max(
                        84,
                        Math.min(
                            125,
                            Math.floor(
                                h * 0.28
                            )
                        )
                    );
            } else if (h < 600) {
                this.roomHeight =
                    Math.max(
                        115,
                        Math.min(
                            170,
                            Math.floor(
                                h * 0.30
                            )
                        )
                    );
            } else {
                this.roomHeight =
                    Math.max(
                        170,
                        Math.min(
                            265,
                            Math.floor(
                                h * 0.35
                            )
                        )
                    );
            }

            this.brainTopY =
                this.roomHeight + 20;

            this.dropY =
                this.brainTopY + 20;

            this.dangerLineY =
                this.brainTopY + 44;

        } else {

            // -----------------------------------------
            // PORTRAIT
            // -----------------------------------------

            if (h < 420) {
                this.roomHeight = 72;

            } else if (h < 520) {
                this.roomHeight = 88;

            } else if (h < 650) {
                this.roomHeight = 105;

            } else {
                const maxRoomAllowed =
                    Math.floor(
                        h * 0.28
                    );

                this.roomHeight =
                    Math.max(
                        120,
                        Math.min(
                            170,
                            maxRoomAllowed
                        )
                    );
            }

            this.brainTopY =
                this.roomHeight + 20;

            this.dropY =
                this.brainTopY + 20;

            this.dangerLineY =
                this.brainTopY + 44;
        }

        // -----------------------------------------
        // ОБНОВЛЯЕМ СТЕНКИ
        // -----------------------------------------

        this.physics.setDimensions(
            this.roomHeight
        );

        // -----------------------------------------
        // SCALE ШАРОВ
        // -----------------------------------------

        const bottomY =
            this.canvas.height - 6;

        const usableBelowDanger =
            Math.max(
                70,
                bottomY -
                    this.dangerLineY
            );

        /*
            T10 radius = 86 px.
            Диаметр ≈172px.
            Добавляем небольшой запас.
        */

        const radiusScale =
            Math.min(
                1,
                usableBelowDanger /
                    184
            );

        this.physics.setRadiusScale(
            radiusScale
        );

        // На случай изменения ориентации
        this.physics.keepBodiesInBounds();

        // -----------------------------------------
        // AIM
        // -----------------------------------------

        const bounds =
            this.physics
                .getCupBounds();

        if (
            !this.aimX ||
            this.aimX <= 0 ||
            this.aimX > w
        ) {
            this.aimX =
                w / 2;

        } else {
            this.aimX =
                Math.max(
                    bounds.leftX + 16,

                    Math.min(
                        bounds.rightX - 16,
                        this.aimX
                    )
                );
        }
    }

    start() {
        if (this.isGameOver) return;

        this.hasStarted = true;
        this.isRunning = true;

        this.pauseReasons.delete('start-menu');

        if (this.pauseReasons.size > 0) {
            this.isPaused = true;
            return;
        }

        this.isPaused = false;

        this.lastTime = performance.now();
        this.physicsAccumulatorMs = 0;

        window.YandexBridge?.gameplayStart?.();

        AudioCtrl.resume?.();

        this.scheduleNextFrame();
    }

    // --- ОБРАБОТКА ВВОДА ---
    setupInputHandlers() {
        // Тапы / Клики
        let activePointerId = null;
        let pointerStartedInCup = false;

        const updateAim = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();

            const x = clientX - rect.left;
            const y = clientY - rect.top;

            if (y >= this.roomHeight) {
                const bounds = this.physics.getCupBounds();

                this.aimX = Math.max(
                    bounds.leftX + 16,
                    Math.min(bounds.rightX - 16, x)
                );
            }

            return { x, y };
        };

        this.canvas.addEventListener('pointerdown', e => {
            if (this.isPaused || this.isGameOver) return;

            activePointerId = e.pointerId;

            this.canvas.setPointerCapture?.(e.pointerId);

            const { x, y } = updateAim(
                e.clientX,
                e.clientY
            );

            pointerStartedInCup = y >= this.roomHeight;

            if (!pointerStartedInCup) {
                this.handleRoomInteraction(
                    x,
                    y,
                    e.clientX,
                    e.clientY
                );
            }
        });

        this.canvas.addEventListener('pointermove', e => {
            if (e.pointerId !== activePointerId) return;

            updateAim(
                e.clientX,
                e.clientY
            );
        });

        this.canvas.addEventListener('pointerup', e => {
            if (e.pointerId !== activePointerId) return;

            const { x, y } = updateAim(
                e.clientX,
                e.clientY
            );

            activePointerId = null;

            if (!pointerStartedInCup) {
                return;
            }

            // Расходник
            if (this.activeConsumableMode) {
                this.handleConsumableClick(x, y);
                return;
            }

            // Двойной тап оставляем как подброс
            const now = performance.now();

            if (
                now - this.lastTapTime < 280 &&
                Math.hypot(
                    x - this.lastTapPos.x,
                    y - this.lastTapPos.y
                ) < 45
            ) {
                this.physics.microBounce(this.canvas.width / 2);

                AudioCtrl.playShake();

                this.ui.triggerScreenShake();

                this.spawnFloatingText(
                    x,
                    y - 20,
                    "💫 ПОДБРОС!",
                    "#00f0ff"
                );

                this.lastTapTime = 0;

                return;
            }

            this.lastTapTime = now;
            this.lastTapPos = { x, y };

            // Сбрасываем только когда игрок отпустил палец
            this.dropThought();
        });

        this.canvas.addEventListener('pointercancel', () => {
            activePointerId = null;
            pointerStartedInCup = false;
        });

        // Кнопка Встряски
        const btnShake = document.getElementById('btn-brain-shake');
        const triggerShake = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            if (this.shakeCooldown <= 0) {
                this.physics.shakeBrain();
                AudioCtrl.playShake();
                this.ui.triggerScreenShake();
                this.shakeCooldown = this.shakeCooldownMax;
                this.ui.updateShake(this.shakeCooldown);
                this.ui.setQuote("«Мозги встали на место!»");
                this.trackQuestProgress('shakes', 1);
            }
        };
        btnShake?.addEventListener('pointerdown', triggerShake);
        btnShake?.addEventListener('click', triggerShake);

        // Кнопки Наклона (Тилт стакана влево/вправо) с поддержкой тач-зажатия и клика
        const btnTiltLeft = document.getElementById('btn-tilt-left');
        const applyTiltLeft = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            btnTiltLeft?.classList.add('active');
            this.physics.setGravityTilt(-0.55);
            this.tiltTimer = 1.3;
            AudioCtrl.playTilt();
            this.spawnFloatingText(this.canvas.width * 0.35, this.roomHeight + 35, "⤹ НАКЛОН ВЛЕВО", "#00f0ff");
        };
        const releaseTiltLeft = (e) => {
            btnTiltLeft?.classList.remove('active');
        };

        btnTiltLeft?.addEventListener('pointerdown', applyTiltLeft);
        btnTiltLeft?.addEventListener('pointerup', releaseTiltLeft);
        btnTiltLeft?.addEventListener('pointercancel', releaseTiltLeft);

        const btnTiltRight = document.getElementById('btn-tilt-right');
        const applyTiltRight = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            btnTiltRight?.classList.add('active');
            this.physics.setGravityTilt(0.55);
            this.tiltTimer = 1.3;
            AudioCtrl.playTilt();
            this.spawnFloatingText(this.canvas.width * 0.65, this.roomHeight + 35, "НАКЛОН ВПРАВО ⤸", "#00f0ff");
        };
        const releaseTiltRight = (e) => {
            btnTiltRight?.classList.remove('active');
        };

        btnTiltRight?.addEventListener('pointerdown', applyTiltRight);
        btnTiltRight?.addEventListener('pointerup', releaseTiltRight);
        btnTiltRight?.addEventListener('pointercancel', releaseTiltRight);
        btnTiltRight?.addEventListener('touchstart', applyTiltRight, { passive: false });
        btnTiltRight?.addEventListener('touchend', releaseTiltRight, { passive: false });
        btnTiltRight?.addEventListener('click', applyTiltRight);

        // Кнопка переключения Гироскопа
        document.getElementById('btn-toggle-gyro')?.addEventListener('click', () => {
            this.toggleGyroscope();
        });

        // Управление с клавиатуры (Стрелки / A / D / Пробел)
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.physics.setGravityTilt(-0.5);
                this.tiltTimer = 1.2;
                AudioCtrl.playTilt();
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.physics.setGravityTilt(0.5);
                this.tiltTimer = 1.2;
                AudioCtrl.playTilt();
            } else if (e.code === 'Space') {
                e.preventDefault();
                this.dropThought();
            }
        });

        // Расходники
        document.getElementById('slot-beer')?.addEventListener('click', () => {
            if (this.items.beer > 0) {
                this.activeConsumableMode = this.activeConsumableMode === 'beer' ? null : 'beer';
                this.ui.setQuote(this.activeConsumableMode ? "Выберите мысль или мусор для растворения!" : "");
            }
        });

        document.getElementById('slot-script')?.addEventListener('click', () => {
            if (this.items.script > 0) {
                this.useScriptConsumable();
            }
        });

        document.getElementById('slot-energy')?.addEventListener('click', () => {
            if (this.items.energy > 0) {
                this.items.energy--;
                this.flashActiveUntil = performance.now() + this.flashDuration;
                this.physics.engine.timing.timeScale = 0.5;
                AudioCtrl.playEndorphinFanfare();
                this.ui.updateConsumables(this.items);
                this.ui.setQuote("⚡ ВРЕМЯ ЗАМЕДЛЕНО! Синапсы разогнаны!");
            }
        });

        document.getElementById('slot-bomb')?.addEventListener('click', () => {
            if ((this.items.bomb || 0) > 0) {
                this.activeConsumableMode = this.activeConsumableMode === 'bomb' ? null : 'bomb';
                this.ui.setQuote(this.activeConsumableMode ? "💣 Выберите точку на стакане для детонации!" : "");
            }
        });

        document.getElementById('slot-magnet')?.addEventListener('click', () => {
            if ((this.items.magnet || 0) > 0) {
                this.items.magnet--;
                this.magnetActiveUntil = performance.now() + 6000;
                AudioCtrl.playEndorphinFanfare();
                this.physics.applySuperMagneticAttraction();
                this.ui.updateConsumables(this.items);
                this.ui.triggerScreenShake();
                this.ui.setQuote("🧲 СИГМА-МАГНИТ АКТИВЕН! Одинаковые мысли стягиваются!");
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, "🧲 СИГМА-ПРИТЯЖЕНИЕ!", "#8b5cf6");
            }
        });

        // Рулетка / Колесо Фортуны
        document.getElementById('btn-open-roulette')?.addEventListener('click', () => {
            this.ui.showRoulette();
        });
        document.getElementById('btn-close-roulette')?.addEventListener('click', () => {
            this.ui.hideRoulette();
        });
        document.getElementById('btn-spin-wheel')?.addEventListener('click', () => {
            this.spinRoulette();
        });
    }

    // --- ИНТЕРАКТИВНЫЕ КЛИКИ ПО КОМНАТЕ (Кот, ТВ, ПК, Пивоварня, Майнинг, Скуф) ---
    handleRoomInteraction(x, y, screenX, screenY) {
        const targets = this.roomRenderer.getInteractiveTargets(this.canvas.width, this.roomHeight);
        
        for (const target of targets) {
            const dist = Math.hypot(x - target.x, y - target.y);
            const radius = target.radius || 24;
            if (dist <= radius) {
                if (target.id === 'cat') {
                    if (
                        !this.tryRoomInteractionCooldown(
                            'cat',
                            15000,
                            target.x,
                            target.y
                        )
                    ) {
                        return;
                    }
                    this.roomRenderer.triggerCatPet();
                    AudioCtrl.playPurr();
                    this.stamina = Math.min(this.maxStamina, this.stamina + 25);
                    this.isExhausted = false;
                    this.addMotivation(250);
                    this.ui.setQuote("«Котейка довольно мурчит: МЯУ! 🐾 +25 Дыхалка!»");
                    this.spawnFloatingText(target.x, target.y - 15, "МЯУ! +25 ⚡", "#f472b6");
                    this.spawnParticles(target.x, target.y, "#f472b6", 12);
                    return;
                }
                if (target.id === 'tv') {
                    const chan = this.roomRenderer.switchChannel();
                    AudioCtrl.playTVClick();
                    if (
                        this.tryRoomInteractionCooldown(
                            'tv_reward',
                            30000,
                            target.x,
                            target.y
                        )
                    ) {
                        this.addMotivation(150);
                        this.feverCharge =
                            Math.min(
                                100,
                                this.feverCharge + 8
                            );
                    }
                    if (chan) {
                        this.ui.setQuote(chan.quote);
                        this.spawnFloatingText(target.x, target.y - 15, `${chan.title} 📺`, "#00f0ff");
                    }
                    return;
                }
                if (target.id === 'pc') {
                    if (
                        !this.tryRoomInteractionCooldown(
                            'pc',
                            20000,
                            target.x,
                            target.y
                        )
                    ) {
                        return;
                    }
                    AudioCtrl.playJackpot();
                    this.addMotivation(600);
                    this.ui.setQuote("«Майнинг на ПК приносит прибыль: +600 Мотивации!»");
                    this.spawnFloatingText(target.x, target.y - 15, "+600 💰", "#ffd700");
                    this.spawnParticles(target.x, target.y, "#ffd700", 10);
                    return;
                }
                if (target.id === 'brewery') {
                    if (
                        !this.tryRoomInteractionCooldown(
                            'brewery',
                            60000,
                            target.x,
                            target.y
                        )
                    ) {
                        return;
                    }
                    AudioCtrl.playGarbagePopped();
                    this.stamina = this.maxStamina;
                    this.isExhausted = false;
                    this.addMotivation(400);
                    this.ui.setQuote("«Холодное пенное прямо из кега! Дыхалка на 100%!»");
                    this.spawnFloatingText(target.x, target.y - 15, "🍺 100% ДЫХАЛКА!", "#facc15");
                    this.spawnParticles(target.x, target.y, "#facc15", 14);
                    return;
                }
                if (target.id === 'mining') {
                    if (
                        !this.tryRoomInteractionCooldown(
                            'mining',
                            45000,
                            target.x,
                            target.y
                        )
                    ) {
                        return;
                    }
                    AudioCtrl.playJackpot();
                    this.addMotivation(1200);
                    this.ui.setQuote("«Ферма разогнана! +1,200 Мотивации!»");
                    this.spawnFloatingText(target.x, target.y - 15, "+1,200 💎", "#8b5cf6");
                    this.spawnParticles(target.x, target.y, "#8b5cf6", 15);
                    return;
                }
                if (target.id === 'vacuum') {
                    if (
                        !this.tryRoomInteractionCooldown(
                            'vacuum',
                            12000,
                            target.x,
                            target.y
                        )
                    ) {
                        return;
                    }
                    AudioCtrl.playShake();
                    this.physics.explode(target.x, this.roomHeight + 35, 75, 0.15);
                    this.ui.setQuote("«Робот-пылесос прочистил сопла!»");
                    this.spawnFloatingText(target.x, target.y - 15, "🤖 БИП-БИП!", "#00f0ff");
                    return;
                }
                if (target.id === 'skuf') {
                    this.handleSkufTap(screenX, screenY);
                    return;
                }
            }
        }

        // По умолчанию клик по комнате тапает Скуфа
        this.handleSkufTap(screenX, screenY);
    }

    toggleGyroscope() {
        this.gyroEnabled =
            !this.gyroEnabled;

        const btn =
            document.getElementById(
                'btn-toggle-gyro'
            );

        btn?.classList.toggle(
            'active',
            this.gyroEnabled
        );

        if (this.gyroEnabled) {

            const enableHandler = () => {
                // На всякий случай не создаём дубль
                window.removeEventListener(
                    'deviceorientation',
                    this.boundHandleOrientation
                );

                window.addEventListener(
                    'deviceorientation',
                    this.boundHandleOrientation
                );
            };

            if (
                typeof DeviceOrientationEvent !==
                    'undefined' &&
                typeof DeviceOrientationEvent
                    .requestPermission ===
                    'function'
            ) {
                DeviceOrientationEvent
                    .requestPermission()
                    .then(state => {
                        if (
                            state === 'granted' &&
                            this.gyroEnabled
                        ) {
                            enableHandler();
                        }
                    })
                    .catch(() => {
                        this.gyroEnabled = false;

                        btn?.classList.remove(
                            'active'
                        );
                    });

            } else {
                enableHandler();
            }

            this.ui.setQuote(
                "🧭 Гироскоп включен! Наклоняйте телефон влево/вправо!"
            );

            this.spawnFloatingText(
                this.canvas.width / 2,
                this.roomHeight + 40,
                "🧭 ГИРОСКОП АКТИВЕН",
                "#00f0ff"
            );

        } else {

            window.removeEventListener(
                'deviceorientation',
                this.boundHandleOrientation
            );

            this.physics.setGravityTilt(0);

            this.ui.setQuote(
                "🧭 Гироскоп выключен."
            );
        }
    }

    handleOrientation(e) {
        if (!this.gyroEnabled) return;
        const gamma = e.gamma || 0;
        const tilt = Math.max(-0.6, Math.min(0.6, (gamma / 25) * 0.7));
        this.physics.setGravityTilt(tilt);
    }

    // --- ЛЕТАЮЩИЕ ИНТЕРАКТИВНЫЕ ИНСАЙТ-ПУЗЫРИ ---
    updateInsightBubbles(dt) {
        this.bubbleSpawnTimer -= dt;
        if (this.bubbleSpawnTimer <= 0) {
            this.bubbleSpawnTimer = 14 + Math.random() * 8;
            this.spawnInsightBubble();
        }

        // Удаление просроченных пузырей
        const now = performance.now();
        for (let i = this.insightBubbles.length - 1; i >= 0; i--) {
            const b = this.insightBubbles[i];
            if (now - b.createdAt > 15000) {
                b.element?.remove();
                this.insightBubbles.splice(i, 1);
            }
        }
    }

    spawnInsightBubble() {
        if (this.insightBubbles.length >= 2) return;
        const pool = CONFIG.INSIGHT_BUBBLES || [];
        if (pool.length === 0) return;
        const conf = pool[Math.floor(Math.random() * pool.length)];

        const bubbleEl = document.createElement('div');
        bubbleEl.className = 'floating-insight-bubble';
        bubbleEl.style.borderColor = conf.color;
        bubbleEl.innerHTML = `
            <span class="bubble-emoji">${conf.emoji}</span>
            <span class="bubble-tag" style="color: ${conf.color}">${conf.title}</span>
        `;

        const bounds = this.physics.getCupBounds();
        const startX = bounds.leftX + 20 + Math.random() * Math.max(40, bounds.width - 70);
        const startY = this.roomHeight + 40 + Math.random() * (this.canvas.height - this.roomHeight - 140);

        bubbleEl.style.left = `${Math.round(startX)}px`;
        bubbleEl.style.top = `${Math.round(startY)}px`;

        const bubbleObj = {
            id: performance.now(),
            type: conf.type,
            conf,
            element: bubbleEl,
            createdAt: performance.now()
        };

        bubbleEl.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.popInsightBubble(bubbleObj, startX, startY);
        });

        this.container.appendChild(bubbleEl);
        this.insightBubbles.push(bubbleObj);
    }

    popInsightBubble(bubbleObj, x, y) {
        const idx = this.insightBubbles.indexOf(bubbleObj);
        if (idx !== -1) {
            this.insightBubbles.splice(idx, 1);
        }
        if (bubbleObj.element) {
            bubbleObj.element.style.transform = 'scale(1.4)';
            bubbleObj.element.style.opacity = '0';
            setTimeout(() => bubbleObj.element?.remove(), 200);
        }

        AudioCtrl.playPop();
        this.spawnParticles(x, y, bubbleObj.conf.color, 18);

        switch (bubbleObj.type) {
            case 'insight':
                const bonus = 3500 + this.day * 1500;
                this.addMotivation(bonus);
                this.combo += 3;
                this.comboTimer = 5.0;
                this.spawnFloatingText(x, y, `+${CONFIG.formatNumber(bonus)} МОТИВАЦИИ! 💡`, "#ffd700");
                this.ui.setQuote("💡 ВНЕЗАПНЫЙ ИНСАЙТ! Мозги заработали!");
                break;
            case 'pizza':
                this.stamina = this.maxStamina;
                this.isExhausted = false;
                this.spawnFloatingText(x, y, "100% ДЫХАЛКА! 🍕", "#fb923c");
                this.ui.setQuote("«О, курьер привез пиццу! Сил хватит на всё!»");
                break;
            case 'energy':
                this.feverCharge = Math.min(100, this.feverCharge + 40);
                this.spawnFloatingText(x, y, "+40% ХАЙП! ⚡", "#00f0ff");
                this.ui.setQuote("⚡ ЭНЕРГЕТИК ЗАЛЕТЕЛ! Скоро Лихорадка!");
                break;
            case 'bomb':
                this.items.bomb = (this.items.bomb || 0) + 1;
                this.ui.updateConsumables(this.items);
                this.spawnFloatingText(x, y, "+1 ПЕТАРДА! 💣", "#ef4444");
                this.ui.setQuote("💣 Бесплатная петарда в кармане!");
                break;
            case 'spin':
                this.freeSpinsAvailable++;
                this.ui.updateRouletteTimer(this.rouletteTimer, this.freeSpinsAvailable);
                this.spawnFloatingText(x, y, "+1 ФРИСПИН! 🎡", "#a855f7");
                this.ui.setQuote("🎡 Бесплатный спин в Колесе Фортуны!");
                break;
        }
    }

    calculateTapDamage({ rollCrit = false } = {}) {
        const heroUpgs = CONFIG.UPGRADES?.hero || [];

        let damage = 1;

        if (heroUpgs[0]?.bought) damage *= 3;
        if (heroUpgs[1]?.bought) damage *= 5;
        if (heroUpgs[3]?.bought) damage *= 15;
        if (heroUpgs[4]?.bought) damage *= 40;
        if (heroUpgs[5]?.bought) damage *= 120;
        if (heroUpgs[6]?.bought) damage *= 450;
        if (heroUpgs[7]?.bought) damage *= 1800;
        if (heroUpgs[8]?.bought) damage *= 8000;

        const critChance =
            heroUpgs[8]?.bought ? 0.40 :
            heroUpgs[6]?.bought ? 0.30 :
            heroUpgs[1]?.bought ? 0.15 :
            0;

        const critMultiplier =
            heroUpgs[8]?.bought ? 50 :
            heroUpgs[3]?.bought ? 15 :
            8;

        let isCrit = false;

        if (
            rollCrit &&
            critChance > 0 &&
            Math.random() < critChance
        ) {
            damage *= critMultiplier;
            isCrit = true;
        }

        const bossHunterLevel =
            CONFIG.PRESTIGE_PERKS[6]?.level || 0;

        const bossHunterMultiplier =
            1 + bossHunterLevel * 0.5;

        damage *=
            this.bossDamageMultiplier *
            bossHunterMultiplier;

        return {
            damage: Math.max(1, Math.floor(damage)),
            isCrit,
            critChance,
            critMultiplier
        };
    }

    handleSkufTap(screenX, screenY) {
        if (
            this.stamina < 8 ||
            this.isExhausted ||
            this.isPaused ||
            this.isGameOver
        ) {
            AudioCtrl.playExhausted();

            this.ui.setQuote(
                "«Хух... Дыхалка на нуле, дай полежать...»"
            );

            return;
        }

        this.totalTaps++;
        this.trackQuestProgress('taps', 1);

        this.stamina = Math.max(
            0,
            this.stamina - 12
        );

        if (this.stamina <= 0) {
            this.isExhausted = true;
            AudioCtrl.playExhausted();
        }

        const {
            damage: finalDamage,
            isCrit
        } = this.calculateTapDamage({
            rollCrit: true
        });

        this.dealBossDamage(finalDamage);

        // Banker-реликвия теперь действительно усиливает доход от кликов
        const tapMotivation =
            Math.max(1, finalDamage * 0.4) *
            this.globalIncomeMultiplier;

        this.addMotivation(
            Math.floor(tapMotivation)
        );

        this.roomRenderer.triggerSkufBounce();

        AudioCtrl.playSkufGrunt(isCrit);

        this.spawnFloatingText(
            this.canvas.width / 2 +
                (Math.random() - 0.5) * 60,

            this.roomHeight - 35,

            isCrit
                ? `КРИТ -${CONFIG.formatNumber(finalDamage)}! 💥`
                : `-${CONFIG.formatNumber(finalDamage)}`,

            isCrit
                ? '#ff2a85'
                : '#ffd700'
        );
    }

    handleConsumableClick(x, y) {
        if (this.activeConsumableMode === 'bomb') {
            this.items.bomb--;
            this.activeConsumableMode = null;
            this.physics.explode(x, y, 140, 0.25);
            AudioCtrl.playExplosion();
            this.ui.triggerScreenShake();
            this.spawnFloatingText(x, y, "💥 БАБАХ! -ЗАВАЛ!", "#ef4444");
            this.spawnParticles(x, y, "#ef4444", 24);
            this.ui.updateConsumables(this.items);
            this.ui.setQuote("«Петарда разнесла этот хлам в щепки!»");
            return;
        }

        if (this.activeConsumableMode === 'beer') {
            const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => !b.isStatic);
            for (const b of bodies) {
                const dist = Math.hypot(b.position.x - x, b.position.y - y);
                const radius = b.circleRadius || 25;
                if (dist <= radius + 10) {
                    Matter.World.remove(this.physics.world, b);
                    this.items.beer--;
                    this.activeConsumableMode = null;
                    AudioCtrl.playGarbagePopped();
                    this.spawnFloatingText(x, y, "РАСТВОРЕНО! 🍺", "#38bdf8");
                    this.ui.updateConsumables(this.items);
                    return;
                }
            }
        }
    }

    useScriptConsumable() {
        const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => b.tier && !b.isDead);
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                if (bodies[i].tier === bodies[j].tier) {
                    this.items.script--;
                    this.handleMerge(bodies[i], bodies[j]);
                    AudioCtrl.playMerge(bodies[i].tier);
                    this.ui.updateConsumables(this.items);
                    this.ui.setQuote("«Скрипт выполнил слияние!»");
                    return;
                }
            }
        }
        this.ui.setQuote("«Нет одинаковых мыслей для скрипта!»");
    }

    dropThought() {
        if (this.dropCooldown > 0) return;
        
        const tier = this.nextTier;
        this.physics.createThought(this.aimX, this.dropY, tier);
        AudioCtrl.playDrop();

        this.dropCooldown = this.dropCooldownMs;
        this.rollNextTier();
        
        // Редкий спавн мусора в зависимости от дня
        this.checkGarbageSpawn();
    }

    checkGarbageSpawn() {
        const hasZen = CONFIG.UPGRADES.brain[3]?.bought;
        const chance = (0.05 + this.day * 0.008) * (hasZen ? 0.4 : 1.0);
        
        if (Math.random() < chance) {
            const garbageList = CONFIG.GARBAGE_TYPES;
            const garbage = garbageList[Math.floor(Math.random() * garbageList.length)];
            const spawnX = 30 + Math.random() * (this.canvas.width - 60);
            this.physics.createGarbage(spawnX, this.dropY, garbage);
            this.ui.setQuote(`«В голову лезет: ${garbage.name}»`);
        }
    }

    rollNextTier() {
        // Обычные drops остаются T1/T2
        this.nextTier =
            Math.floor(Math.random() * 2) + 1;

        this.ui.updateNextThought(
            this.nextTier
        );
    }

    getPrestigeStartingTier() {
        const level =
            CONFIG.PRESTIGE_PERKS[1]?.level || 0;

        if (level <= 0) {
            return 1;
        }

        // lvl1 → T2
        // lvl2 → T3
        // lvl3 → T4
        return Math.min(
            4,
            level + 1
        );
    }

    seedInitialThoughts() {
        if (!this.physics) return;

        const bounds =
            this.physics.getCupBounds();

        const tier =
            this.getPrestigeStartingTier();

        this.physics.createThought(
            bounds.leftX +
                bounds.width * 0.38,

            this.dropY + 40,

            tier
        );

        this.physics.createThought(
            bounds.leftX +
                bounds.width * 0.62,

            this.dropY + 40,

            tier
        );
    }

    ensureInitialBodies() {
        if (!this.physics?.world) return;

        const bodies =
            Matter.Composite
                .allBodies(this.physics.world)
                .filter(body => !body.isStatic);

        if (bodies.length === 0) {
            this.seedInitialThoughts();
        }
    }

    // --- СЛИЯНИЕ МЫСЛЕЙ ---
    handleMerge(bodyA, bodyB) {
        if (!bodyA || !bodyB) return;
        const tier = bodyA.tier;
        const nextTier = tier + 1;

        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;

        Matter.World.remove(this.physics.world, bodyA);
        Matter.World.remove(this.physics.world, bodyB);

        this.totalMerges++;
        this.trackQuestProgress('merges', 1);

        // Начисление комбо
        this.combo++;
        this.comboTimer = 2.8 + (CONFIG.UPGRADES.brain[5]?.bought ? 3.5 : 0);
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.ui.showCombo(this.combo);

        // Начисление заряда Хайпа (Fever): требует цепочек слияний и мастерства
        this.addFeverCharge(3.0 + Math.min(8, tier * 0.8 + this.combo * 0.5));

        // Награда Мотивации
        const tierConfig = CONFIG.TIERS[tier] || CONFIG.TIERS[1];
        const feverScoreMult =
            this.isFeverActive
                ? this.getFeverScoreMultiplier()
                : 1;
        let reward = tierConfig.score * Math.max(1, this.combo * 0.4) * this.comboMultiplier * this.globalIncomeMultiplier * feverScoreMult;
        
        if (this.hasGoldenCat && tier === 1) reward += 1500;
        this.addMotivation(reward);

        // Урон по боссу от слияния:
        // Во время Лихорадки урон по боссу сбалансирован (0.7x), чтобы босс не умирал мгновенно,
        // позволяя игроку насладиться хайпом, серией комбо и набором Мотивации
        let bossDmg = tierConfig.score * 2.2 * Math.max(1, this.combo * 0.3);
        if (CONFIG.UPGRADES.brain[6]?.bought) bossDmg *= 3.0; // Третий глаз Сигмы
        
        const feverBossDmgMult = this.isFeverActive ? 0.70 : 1.0;
        bossDmg *= feverBossDmgMult;
        
        const bossHunterBonus = 1.0 + (CONFIG.PRESTIGE_PERKS[6]?.level || 0) * 0.5;
        bossDmg *= this.bossDamageMultiplier * bossHunterBonus;
        if (this.bossBreakTimer <= 0) {
            this.dealBossDamage(Math.floor(bossDmg));
            this.spawnFloatingText(midX, midY + 16, `-${CONFIG.formatNumber(bossDmg)} HP ⚔️`, '#f43f5e');
        }

        // Звук и частицы сочности
        AudioCtrl.playMerge(tier);
        this.spawnParticles(midX, midY, tierConfig.color || '#3b82f6', 10 + tier);

        // Мемные всплывашки для вовлечения
        if (this.isFeverActive || Math.random() < 0.28 || tier >= 5) {
            const memes = CONFIG.MEME_POPUPS || [];
            const randomMeme = memes[Math.floor(Math.random() * memes.length)];
            this.spawnFloatingText(midX, midY - 24, randomMeme, tierConfig.glow || '#ec4899');
        }

        if (tier >= 7) {
            this.ui.triggerScreenShake();
        }

        // Очистка мусора рядом
        const blastRadius = this.hasChainBlast && tier >= 5 ? 170 : (tier >= 4 ? 95 : 50);
        this.physics.cleanseNearbyGarbage(midX, midY, blastRadius);

        // Квантовый резонанс: слияния T6+ сжигают весь мусор
        if (CONFIG.UPGRADES.brain[7]?.bought && tier >= 6) {
            this.physics.cleanseNearbyGarbage(this.canvas.width / 2, this.canvas.height / 2, 800);
            this.ui.setQuote("⚛️ КВАНТОВЫЙ РЕЗОНАНС: Мусор расщеплён!");
        }

        // Пивной щит: Скуф сжигает весь мусор
        if (this.hasBeerShield && tier === 8) {
            this.physics.cleanseNearbyGarbage(this.canvas.width / 2, this.canvas.height / 2, 800);
            this.ui.setQuote("🍺 ПИВНОЙ ЩИТ: Весь мусор сожжён!");
        }

        // Трекинг создания мыслей для квестов и ачивок
        this.tierCreatedCounts[nextTier] = (this.tierCreatedCounts[nextTier] || 0) + 1;
        if (nextTier === 5) this.trackQuestProgress('tier_5', 1);
        if (nextTier === 7) this.trackQuestProgress('tier_7', 1);
        if (nextTier === 8) this.trackQuestProgress('tier_8', 1);
        if (nextTier === 9) this.trackQuestProgress('tier_9', 1);
        this.trackQuestProgress('combo', this.combo);

        // Создание новой мысли следующего тира
        if (nextTier <= 10) {
            this.physics.createThought(midX, midY, nextTier);
            if (nextTier > (this.highestTierUnlocked || 1)) {
                this.highestTierUnlocked = nextTier;
                this.ui.updateSideDashboard(this);
            }
            if (nextTier === 10) {
                this.gigachadsCreated++;
                this.trackQuestProgress('gigachad', 1);
                AudioCtrl.playEndorphinFanfare();
                this.roomRenderer.triggerEndorphinFlash();
                this.ui.triggerScreenShake();
                this.spawnFloatingText(midX, midY, "ЯВЛЕНИЕ ГИГАЧАДА! 👑", "#ffd700");
            }
        } else {
            // Максимальный уровень (Гигачад) дает мега-взрыв
            AudioCtrl.playEndorphinFanfare();
            const gigachadBonus = 250000;
            const gigachadBossDmg = 500000 * bossHunterBonus;
            this.addMotivation(gigachadBonus);
            this.dealBossDamage(gigachadBossDmg);
            this.roomRenderer.triggerEndorphinFlash();
            this.ui.triggerScreenShake();
            this.spawnFloatingText(midX, midY, `+${CONFIG.formatNumber(gigachadBonus)} БАЗЫ! 🌌`, "#ff2a85");
        }

        // Вспышка эндорфинов при высоких тирах
        if (tier >= 6) {
            this.roomRenderer.triggerEndorphinFlash();
        }

        this.spawnFloatingText(midX, midY, `+${CONFIG.formatNumber(reward)} 🗿`, tierConfig.glow);
    }

    handleGarbageDestroyed(x, y, name) {
        this.trashDestroyed++;
        this.trackQuestProgress('trash', 1);
        AudioCtrl.playGarbagePopped();
        this.spawnFloatingText(x, y, `${name} Уничтожен! ✨`, "#a855f7");
    }

    dealBossDamage(amount) {
        if (this.bossBreakTimer > 0) return; // Во время передышки босс неуязвим/отсутствует
        this.bossHp = Math.max(0, this.bossHp - amount);
        const boss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[1];
        this.ui.updateBoss(boss, this.bossHp, this.day, this.maxDays);

        if (this.bossHp <= 0) {
            this.onBossDefeated();
        }
    }

    onBossDefeated() {
        this.bossesDefeated++;
        this.runBossesDefeated++;
        this.trackQuestProgress('boss', 1);
        AudioCtrl.playEndorphinFanfare();
        this.ui.triggerScreenShake();

        // Запуск фазы передышки / кулдауна перед следующим боссом (очередь боссов)
        this.bossBreakTimer = 3.5;

        // Награда за босса
        const jackpot = this.day * 1500;
        this.addMotivation(jackpot);
        this.items.beer += 1;
        this.items.script += 1;
        this.items.energy += 1;
        this.items.bomb = (this.items.bomb || 0) + 1;
        this.items.magnet = (this.items.magnet || 0) + 1;
        
        // Сбалансированный шанс колеса фортуны (35% шанс или каждый 3-й босс)
        const conveyorLevel =
            CONFIG.PRESTIGE_PERKS[7]?.level || 0;

        const conveyorMultiplier =
            1 + conveyorLevel * 0.25;

        const spinChance =
            Math.min(
                0.85,
                0.35 * conveyorMultiplier
            );

        if (
            Math.random() < spinChance ||
            this.bossesDefeated % 3 === 0
        ) {
            this.freeSpinsAvailable++;

            this.spawnFloatingText(
                this.canvas.width / 2,
                this.roomHeight + 35,
                "🎡 +1 СПИН РУЛЕТКИ!",
                "#f59e0b"
            );
        }

        const bonusItemChance =
            Math.min(
                0.75,
                0.20 * conveyorMultiplier
            );

        if (Math.random() < bonusItemChance) {
            const itemPool = [
                'beer',
                'script',
                'energy',
                'bomb',
                'magnet'
            ];

            const item =
                itemPool[
                    Math.floor(
                        Math.random() *
                        itemPool.length
                    )
                ];

            this.items[item] =
                (this.items[item] || 0) + 1;

            this.spawnFloatingText(
                this.canvas.width / 2,
                this.roomHeight + 55,
                "🎁 БОНУСНЫЙ РАСХОДНИК!",
                "#ffd700"
            );
        }

        this.ui.updateConsumables(this.items);
        this.ui.updateRouletteTimer(this.rouletteTimer, this.freeSpinsAvailable);

        // Показ плашки передышки
        this.ui.updateBoss({
            name: "ПЕРЕДЫШКА ☕",
            title: "ПЕРЕДЫШКА",
            desc: "Босс повержен! Передышка перед новым оппонентом...",
            hp: 100,
            color: "#10b981"
        }, 100, this.day, this.maxDays);

        // Выбор реликвии (драфт 3 случайных)
        const pool = CONFIG.RELICS_POOL.filter(r => !this.activeRelics.some(ar => ar.id === r.id));
        if (pool.length > 0) {
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            const choices = shuffled.slice(0, 3);
            this.ui.showPerkDraft(choices, (pickedRelic) => {
                this.activeRelics.push(
                    pickedRelic
                );

                this.recalculatePassives();

                this.ui.updateRelics(
                    this.activeRelics
                );

                this.saveGame();
            });
        }
    }

    advanceDay() {
        this.day++;
        this.currentBossIndex = Math.min(this.maxDays, this.day);
        const nextBoss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[20];
        
        // Если прошли 20 боссов, включается бесконечный режим с усилением
        const hpMultiplier = this.day > 20 ? Math.pow(1.3, this.day - 20) : 1.0;
        this.bossHp = Math.floor(nextBoss.hp * hpMultiplier);
        this.rentTimer = this.rentTimeMax;

        // Обновление фазы окружения
        const phaseIndex = Math.min(5, Math.ceil(this.day / 4));
        const phase = CONFIG.PHASES[phaseIndex] || CONFIG.PHASES[1];
        this.roomRenderer.updateRoomStage(phase.roomStage);

        this.ui.updateRent(this.day, this.rentTimer, phase.bgTitle);
        this.ui.updateBoss(nextBoss, this.bossHp, this.day, this.maxDays);
        this.ui.setQuote(`«День ${this.day}. Пришёл новый противник: ${nextBoss.name}»`);
        this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 35, `⚔️ БОСС: ${nextBoss.name}!`, "#ef4444");

        // Случайное событие / дилемма каждые 3 дня
        if (this.day % 3 === 0) {
            const events = CONFIG.EVENTS_POOL;
            const ev = events[Math.floor(Math.random() * events.length)];
            setTimeout(() => this.ui.showEventModal(ev), 1000);
        }
    }

    addMotivation(amount) {
        if (!Number.isFinite(amount) || amount <= 0) {
            return;
        }

        const geneLevel =
            CONFIG.PRESTIGE_PERKS[0]?.level || 0;

        // Было 0.30
        const geneBonus =
            1 + geneLevel * 0.35;

        const finalAmount =
            amount * geneBonus;

        this.motivation += finalAmount;

        // Lifetime
        this.totalMotivationEarned += finalAmount;

        // Только текущая жизнь / текущий забег
        this.runMotivationEarned += finalAmount;

        this.updateHUD();

        window.YandexBridge?.queueScore?.(
            Math.floor(this.totalMotivationEarned)
        );
    }

    // --- ПОКУПКА УЛУЧШЕНИЙ ---
    buyUpgrade(category, id) {
        const list = CONFIG.UPGRADES[category];
        if (!list) return false;
        const upg = list.find(u => u.id === id);
        if (!upg || upg.bought) return false;

        if (this.motivation >= upg.cost) {
            this.motivation -= upg.cost;
            upg.bought = true;
            this.recalculatePassives();
            this.updateHUD();
            return true;
        }
        return false;
    }

    recalculatePassives() {
        const roomUpgs =
            CONFIG.UPGRADES.room;

        const careerUpgs =
            CONFIG.UPGRADES.career;

        const brainUpgs =
            CONFIG.UPGRADES.brain;

        const prestige =
            CONFIG.PRESTIGE_PERKS;

        const relicIds = new Set(
            this.activeRelics.map(r => r.id)
        );

        // --------------------------------------------------
        // БАЗОВЫЕ ХАРАКТЕРИСТИКИ
        // --------------------------------------------------

        this.globalIncomeMultiplier = 1.0;
        this.bossDamageMultiplier = 1.0;

        this.comboMultiplier = 1.0;

        this.staminaRecoveryRate = 14;

        // P3
        this.maxStamina =
            100 +
            (prestige[2]?.level || 0) * 100;

        this.flashDuration = 12000;

        this.hasGoldenCat = false;
        this.hasChainBlast = false;
        this.hasBeerShield = false;
        this.hasMagnetRelic = false;

        // --------------------------------------------------
        // ПАССИВНЫЙ ДОХОД
        // --------------------------------------------------

        let income = 0;

        // Комната
        if (roomUpgs[0]?.bought) income += 12;
        if (roomUpgs[1]?.bought) income += 65;
        if (roomUpgs[2]?.bought) income += 320;
        if (roomUpgs[3]?.bought) income += 1600;
        if (roomUpgs[4]?.bought) income += 8500;
        if (roomUpgs[5]?.bought) income += 45000;
        if (roomUpgs[6]?.bought) income += 250000;
        if (roomUpgs[7]?.bought) income += 1500000;
        if (roomUpgs[8]?.bought) income += 12000000;

        // Карьера
        if (careerUpgs[0]?.bought) income += 25;
        if (careerUpgs[1]?.bought) income += 180;
        if (careerUpgs[2]?.bought) income += 950;
        if (careerUpgs[3]?.bought) income += 5000;
        if (careerUpgs[4]?.bought) income += 30000;
        if (careerUpgs[5]?.bought) income += 180000;
        if (careerUpgs[6]?.bought) income += 1100000;
        if (careerUpgs[7]?.bought) income += 7500000;
        if (careerUpgs[8]?.bought) income += 55000000;

        // --------------------------------------------------
        // МОЗГ
        // --------------------------------------------------

        let skullExpand = 0;

        if (brainUpgs[0]?.bought) {
            skullExpand += 18;
        }

        if (brainUpgs[4]?.bought) {
            skullExpand += 26;
        }

        // Prestige P6
        skullExpand +=
            (prestige[5]?.level || 0) * 25;

        this.baseDropCooldownMs =
            brainUpgs[1]?.bought
                ? 240
                : 380;

        this.shakeCooldownMax =
            brainUpgs[2]?.bought
                ? 5
                : 12;

        // Combo Master
        if (brainUpgs[5]?.bought) {
            this.comboMultiplier *= 2;
        }

        // --------------------------------------------------
        // РЕЛИКВИИ
        // --------------------------------------------------

        if (relicIds.has('relic_espresso')) {
            this.comboMultiplier *= 2;

            this.baseDropCooldownMs =
                Math.max(
                    140,
                    Math.floor(
                        this.baseDropCooldownMs * 0.65
                    )
                );
        }

        if (relicIds.has('relic_beer_shield')) {
            this.hasBeerShield = true;
        }

        if (relicIds.has('relic_magnet')) {
            this.hasMagnetRelic = true;
        }

        if (relicIds.has('relic_iron_lungs')) {
            this.staminaRecoveryRate *= 2.5;
        }

        if (relicIds.has('relic_skull_wall')) {
            skullExpand += 24;
        }

        if (relicIds.has('relic_stream_rig')) {
            income += 250;
        }

        if (relicIds.has('relic_pillow')) {
            this.maxStamina =
                Math.floor(
                    this.maxStamina * 1.5
                );
        }

        if (relicIds.has('relic_golden_cat')) {
            income += 300;
            this.hasGoldenCat = true;
        }

        if (relicIds.has('relic_flash_master')) {
            this.flashDuration = 25000;
        }

        if (relicIds.has('relic_chain_blast')) {
            this.hasChainBlast = true;
        }

        if (relicIds.has('relic_banker')) {
            this.globalIncomeMultiplier *= 1.5;
        }

        if (relicIds.has('relic_boss_hunter')) {
            this.bossDamageMultiplier *= 1.75;
        }

        // --------------------------------------------------

        this.passiveIncome = income;

        this.physics.expandSkull(
            skullExpand
        );

        this.updateDropCooldownFromState();

        // На случай потери реликвии Pillow
        this.stamina = Math.min(
            this.stamina,
            this.maxStamina
        );
    }

    updateDropCooldownFromState() {
        const base =
            this.baseDropCooldownMs || 380;

        if (this.isFeverActive) {
            this.dropCooldownMs =
                Math.max(
                    140,
                    Math.floor(base * 0.75)
                );
        } else {
            this.dropCooldownMs = base;
        }
    }

    // --- ПРЕСТИЖ / САНСАРА ---
    calculatePrestigeGain() {
        // Хотя бы первый босс должен быть побеждён
        if (this.runBossesDefeated <= 0) {
            return 0;
        }

        const base = Math.floor(
            Math.sqrt(
                this.runMotivationEarned / 40000
            )
        );

        const bossBonus =
            this.runBossesDefeated * 3;

        return Math.max(
            0,
            base + bossBonus
        );
    }

    triggerPrestige() {
        const gain =
            this.calculatePrestigeGain();

        if (gain <= 0) {
            this.ui.setQuote(
                "«Сначала победи хотя бы одного босса!»"
            );

            return false;
        }

        this.prestigeCouches += gain;
        this.prestigeLevel++;

        // Текущий run
        this.runMotivationEarned = 0;
        this.runBossesDefeated = 0;

        // Обычные upgrades
        Object
            .values(CONFIG.UPGRADES)
            .forEach(category => {
                category.forEach(
                    upg => {
                        upg.bought = false;
                    }
                );
            });

        // Run relics исчезают
        this.activeRelics = [];

        this.motivation = 0;

        this.day = 1;
        this.currentBossIndex = 1;

        this.bossHp =
            CONFIG.BOSSES[1].hp;

        this.rentTimer =
            this.rentTimeMax;

        this.combo = 0;
        this.comboTimer = 0;

        this.feverCharge = 0;
        this.feverTimer = 0;
        this.isFeverActive = false;

        this.dangerTimer = 0;

        this.bossBreakTimer = 0;

        this.activeConsumableMode = null;

        this.flashActiveUntil = 0;
        this.magnetActiveUntil = 0;

        this.dropCooldown = 0;
        this.shakeCooldown = 0;
        this.autoDropTimer = 0;

        this.tiltTimer = 0;

        this.physics.engine.timing.timeScale =
            1;

        if (!this.gyroEnabled) {
            this.physics.setGravityTilt(0);
        }

        this.roomInteractionReadyAt =
            Object.create(null);

        // P5
        this.autoDropEnabled =
            (CONFIG.PRESTIGE_PERKS[4]?.level || 0) >
            0;

        this.recalculatePassives();

        this.stamina =
            this.maxStamina;

        this.isExhausted = false;

        this.physics.clearAllBodies();

        this.seedInitialThoughts();

        this.rollNextTier();

        const boss =
            CONFIG.BOSSES[1];

        this.ui.updateBoss(
            boss,
            this.bossHp,
            1,
            this.maxDays
        );

        this.ui.updateRent(
            1,
            this.rentTimer,
            CONFIG.PHASES[1].bgTitle
        );

        this.ui.updateStamina(
            this.stamina,
            this.maxStamina,
            false
        );

        this.ui.updateFever(
            0,
            false,
            0,
            this.getFeverScoreMultiplier()
        );

        if (this.roomRenderer) {
            this.roomRenderer
                .updateRoomStage(0);
        }

        this.ui.updateAutoDropBadge(
            this.autoDropEnabled
        );

        this.ui.updateRelics([]);

        this.ui.prestigeOverlay
            .classList
            .remove('active');

        this.updateHUD(true);

        this.saveGame();

        this.ui.setQuote(
            `«САНСАРА! +${CONFIG.formatNumber(gain)} 🛋️»`
        );

        return true;
    }

    buyPrestigePerk(id) {
        const perk =
            CONFIG.PRESTIGE_PERKS.find(
                p => p.id === id
            );

        if (
            !perk ||
            perk.level >= perk.max
        ) {
            return false;
        }

        if (
            this.prestigeCouches <
            perk.cost
        ) {
            return false;
        }

        this.prestigeCouches -=
            perk.cost;

        perk.level++;

        // Автодроп — отдельное состояние
        if (id === 'p5') {
            this.autoDropEnabled = true;
        }

        // Все остальные характеристики
        // считаются только здесь
        this.recalculatePassives();

        // После покупки лёгких
        // сразу заполняем новый максимум
        if (id === 'p3') {
            this.stamina =
                this.maxStamina;

            this.isExhausted = false;
        }

        this.ui.updateAutoDropBadge(
            this.autoDropEnabled
        );

        this.updateHUD(true);

        this.saveGame();

        return true;
    }

    // --- КВЕСТЫ (СИНХРОНИЗАЦИЯ ПО 00:00 МСК) ---
    initDailyQuestsPool() {
        const pool = CONFIG.QUESTS_POOL || [];
        if (!pool || pool.length === 0) {
            this.dailyQuests = JSON.parse(JSON.stringify(CONFIG.DAILY_QUESTS || []));
            return;
        }
        // Выбираем 6 случайных разнообразных квестов из пула
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        this.dailyQuests = shuffled.slice(0, 6).map(q => ({
            id: q.id,
            title: q.title,
            desc: q.desc,
            type: q.type,
            goal: q.goal,
            reward: q.reward,
            rewardItem: q.rewardItem,
            progress: 0,
            claimed: false
        }));
    }

    checkDailyQuestsDate(force = false) {
        const todayKey = CONFIG.getMoscowDateKey();
        if (force || this.questsDateKey !== todayKey || !this.dailyQuests || this.dailyQuests.length === 0) {
            this.questsDateKey = todayKey;
            this.initDailyQuestsPool();
            this.saveGame();
        }
    }

    trackQuestProgress(type, count = 1) {
        if (!this.dailyQuests) return;
        this.dailyQuests.forEach(q => {
            if (q.type === type && !q.claimed) {
                q.progress = (q.progress || 0) + count;
            }
        });
    }

    claimQuest(id) {
        const q = this.dailyQuests.find(item => item.id === id);
        if (!q || q.claimed || (q.progress || 0) < q.goal) return;

        q.claimed = true;
        this.addMotivation(q.reward);
        if (q.rewardItem && this.items[q.rewardItem] !== undefined) {
            this.items[q.rewardItem]++;
            this.ui.updateConsumables(this.items);
        }
    }

    // --- СИСТЕМА ДОСТИЖЕНИЙ (ACHIEVEMENTS) ---
    checkAchievements() {
        if (!CONFIG.ACHIEVEMENTS) return;
        CONFIG.ACHIEVEMENTS.forEach(ach => {
            if (!this.unlockedAchievements.includes(ach.id) && ach.check && ach.check(this)) {
                this.unlockedAchievements.push(ach.id);
                AudioCtrl.playLevelUp();
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 30, `🏆 ${ach.badge} ${ach.name}!`, "#ffd700");
                this.ui.setQuote(`«🏆 Достижение разблокировано: ${ach.name}!»`);
            }
        });
    }

    // --- ПЕРЕКЛЮЧАТЕЛЬ СПЕЦЭФФЕКТОВ (FX) ---
    toggleFx() {
        this.fxEnabled = !this.fxEnabled;
        try {
            localStorage.setItem('skuf_fx_enabled', this.fxEnabled);
        } catch (e) {
            // ignore
        }
        this.applyFxState();
        return this.fxEnabled;
    }

    applyFxState() {
        const viewport = document.getElementById('app-viewport');
        const btnFx = document.getElementById('btn-toggle-fx');
        const iconFx = document.getElementById('fx-icon');
        if (this.fxEnabled) {
            viewport?.classList.remove('fx-off');
            btnFx?.classList.remove('fx-off');
            if (iconFx) iconFx.textContent = '✨';
            btnFx?.setAttribute('title', 'Спецэффекты: ВКЛ (Нажмите чтобы выключить для слабых устройств)');
            if (this.ui) this.ui.setQuote("«✨ Спецэффекты включены»");
        } else {
            viewport?.classList.add('fx-off');
            btnFx?.classList.add('fx-off');
            if (iconFx) iconFx.textContent = '⚡';
            btnFx?.setAttribute('title', 'Спецэффекты: ВЫКЛ (Режим производительности без лагов)');
            this.sparkleParticles = [];
            if (this.ui) this.ui.setQuote("«⚡ Режим производительности: эффекты выключены (без лагов)»");
        }
    }

    // --- ВСПЛЫВАЮЩИЙ ТЕКСТ И ЧАСТИЦЫ ---
    spawnFloatingText(x, y, text, color = "#ffd700") {
        if (!this.fxEnabled && this.floatingTexts.length > 5) return;
        this.floatingTexts.push({
            x, y, text, color,
            alpha: 1.0,
            vy: -1.4,
            size: 13
        });
    }

    spawnParticles(x, y, color = "#ffd700", count = 12) {
        if (!this.fxEnabled) return;
        if (this.sparkleParticles.length > 70) return;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4.5;
            this.sparkleParticles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                color,
                size: 2 + Math.random() * 3.5,
                alpha: 1.0,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }

    // --- ХАЙП / FEVER MODE ---
    triggerFeverMode() {
        this.isFeverActive = true;

        this.feverTimer =
            CONFIG.UPGRADES.brain[8]?.bought
                ? 14
                : 8.5;

        this.feverCharge = 100;

        this.updateDropCooldownFromState();

        const scoreMultiplier =
            this.getFeverScoreMultiplier();

        AudioCtrl.playFever();

        this.ui.triggerScreenShake();

        this.spawnFloatingText(
            this.canvas.width / 2,
            this.roomHeight + 40,
            `🔥 ЛИХОРАДКА! МОТИВАЦИЯ x${scoreMultiplier}!`,
            "#ec4899"
        );

        this.spawnParticles(
            this.canvas.width / 2,
            this.roomHeight + 40,
            "#ec4899",
            30
        );

        this.ui.setQuote(
            "«ХАЙП ПОШЁЛ! МОЗГ РАБОТАЕТ НА ПИКЕ!»"
        );
    }

    getFeverScoreMultiplier() {
        return CONFIG.UPGRADES.brain[8]?.bought
            ? 3
            : 2;
    }

    addFeverCharge(amount) {
        if (this.isFeverActive) return;
        this.feverCharge += amount;
        if (this.feverCharge >= 100) {
            this.triggerFeverMode();
        }
    }

    // --- КОЛЕСО ФОРТУНЫ / РУЛЕТКА ---
    spinRoulette() {
        if (this.ui.isWheelSpinning) return;
        if (this.freeSpinsAvailable <= 0) {
            this.ui.setQuote("«Подождите перезарядку или победите босса!»");
            return;
        }
        this.totalSpins++;
        this.trackQuestProgress('spins', 1);

        this.freeSpinsAvailable--;
        this.ui.updateRouletteTimer(this.rouletteTimer, this.freeSpinsAvailable);

        const sectors = CONFIG.ROULETTE_SECTORS || [];
        // Взвешенный расчет сектора рулетки (уменьшенный шанс джекпота и редких наград)
        const totalWeight = sectors.reduce((sum, s) => sum + (s.weight || 10), 0);
        let rnd = Math.random() * totalWeight;
        let targetIdx = 0;
        for (let i = 0; i < sectors.length; i++) {
            rnd -= (sectors[i].weight || 10);
            if (rnd <= 0) {
                targetIdx = i;
                break;
            }
        }

        this.ui.animateWheelSpin(targetIdx, (wonSector) => {
            if (!wonSector) return;
            const p = wonSector.prize;
            if (!p) return;

            if (p.type === 'empty') {
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, "💨 ПШИК! В другой раз!", "#94a3b8");
            } else if (p.type === 'item') {
                this.items[p.item] = (this.items[p.item] || 0) + p.count;
                this.ui.updateConsumables(this.items);
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `+${p.count} ${wonSector.label}!`, "#ffd700");
            } else if (p.type === 'motivation') {
                this.addMotivation(p.amount);
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `+${CONFIG.formatNumber(p.amount)} 🗿!`, "#10b981");
            } else if (p.type === 'prestige') {
                this.prestigeCouches += p.amount;
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `+${p.amount} ДИВАНА! 🛋️`, "#a855f7");
            } else if (p.type === 'fever') {
                this.triggerFeverMode();
            } else if (p.type === 'jackpot') {
                this.addMotivation(10000);
                this.items.beer = (this.items.beer || 0) + 2;
                this.items.bomb = (this.items.bomb || 0) + 2;
                this.triggerFeverMode();
                this.ui.updateConsumables(this.items);
                this.ui.triggerScreenShake();
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `👑 ДЖЕКПОТ! +${CONFIG.formatNumber(10000)}!`, "#ffd700");
            }
            this.saveGame();
        });
    }

    // --- РАНГ И ЗВАНИЯ ---
    updateRankSystem() {
        const ranks = CONFIG.RANKS || [];
        let currentRank = ranks[0];
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (this.totalMotivationEarned >= ranks[i].req) {
                currentRank = ranks[i];
                break;
            }
        }
        this.ui.updateRank(currentRank.title, currentRank.desc, currentRank.badge);
    }

    // --- РЕКЛАМНЫЕ БУСТЫ (YANDEX REWARDED ADS) ---
    applyBoost(boostType) {
        AudioCtrl.playLevelUp();
        this.ui.triggerScreenShake();

        switch (boostType) {
            case 'turbo':
                this.isFeverActive = true;
                this.feverTimer = 16.0;
                this.feverCharge = 100;
                this.stamina = this.maxStamina;
                this.isExhausted = false;
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, "ТУРБО-ХАЙП НА 16 СЕКУНД!", "#ec4899");
                this.ui.setQuote("«ЭНЕРГИЯ ЗАШКАЛИВАЕТ! МОЗГ РАБОТАЕТ НА 200%!»");
                break;
            case 'cleaning':
                this.physics.cleanseNearbyGarbage(this.canvas.width / 2, this.canvas.height / 2, 1200);
                const bonusReward = 5000 + this.day * 2000;
                this.addMotivation(bonusReward);
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `КЛИНИНГ! +${CONFIG.formatNumber(bonusReward)}`, "#10b981");
                this.ui.setQuote("«РОБОТ-ПЫЛЕСОС СОЖГЁГ ВЕСЬ МУСОР В ГОЛОВЕ!»");
                break;
            case 'crypto':
                const minutes30Income = Math.max(15000, this.passiveIncome * 1800);
                this.addMotivation(minutes30Income);
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `+${CONFIG.formatNumber(minutes30Income)} МОТИВАЦИИ!`, "#ffd700");
                this.ui.setQuote("«КРИПТО-ДРОП ПРИШЁЛ НА КОШЕЛЁК СКУФА!»");
                break;
            case 'nuke':
                const currentBoss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[1];
                const nukeDamage = Math.max(200, Math.floor(currentBoss.hp * 0.28));
                this.dealBossDamage(nukeDamage);
                this.physics.explode(this.canvas.width / 2, this.canvas.height - 100, 160, 0.35);
                AudioCtrl.playExplosion();
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight - 20, `ЯДЕРНЫЙ УДАР -${CONFIG.formatNumber(nukeDamage)} HP!`, "#ef4444");
                this.ui.setQuote("«ЯДЕРНАЯ ПЕТАРДА РАЗНЕСЛА ЗДОРОВЬЕ БОССА!»");
                break;
        }

        this.saveGame();
    }

    // --- ЦИКЛ ИГРЫ ---
    gameLoop(now) {
        this.rafId = null;

        if (
            !this.isRunning ||
            this.isPaused ||
            this.isGameOver
        ) {
            return;
        }

        try {
            const frameMs =
                Math.min(
                    100,
                    Math.max(
                        0,
                        now - this.lastTime
                    )
                );

            const dt =
                frameMs / 1000;

            this.lastTime = now;

            this.playTimeSeconds += dt;

            // -----------------------------------------
            // UI — обновляем примерно 10 раз в секунду
            // -----------------------------------------

            this.uiTickAccumulator += dt;

            if (this.uiTickAccumulator >= 0.1) {
                this.uiTickAccumulator = 0;

                this.ui.updateStamina(
                    this.stamina,
                    this.maxStamina,
                    this.isExhausted
                );

                this.ui.updateRouletteTimer(
                    this.rouletteTimer,
                    this.freeSpinsAvailable
                );

                this.ui.updateFever(
                    this.feverCharge,
                    this.isFeverActive,
                    this.feverTimer,
                    this.getFeverScoreMultiplier()
                );

                const phaseIndex =
                    Math.min(
                        5,
                        Math.ceil(this.day / 4)
                    );

                const phase =
                    CONFIG.PHASES[phaseIndex] ||
                    CONFIG.PHASES[1];

                this.ui.updateRent(
                    this.day,
                    Math.max(0, this.rentTimer),
                    phase.bgTitle
                );

                this.updateRankSystem();

                if (this.hudDirty) {
                    this.updateHUD(true);
                }
            }

            // -----------------------------------------
            // FIXED 60 Hz PHYSICS
            // -----------------------------------------

            this.physicsAccumulatorMs += frameMs;

            let physicsSteps = 0;

            const maxPhysicsSteps = 5;

            while (
                this.physicsAccumulatorMs >=
                    this.fixedPhysicsStepMs &&
                physicsSteps < maxPhysicsSteps
            ) {
                this.physics.stepPhysics(
                    this.fixedPhysicsStepMs
                );

                if (this.hasMagnetRelic) {
                    this.physics.applyMagneticAttraction();
                }

                if (this.magnetActiveUntil > now) {
                    this.physics.applySuperMagneticAttraction();
                }

                this.physicsAccumulatorMs -=
                    this.fixedPhysicsStepMs;

                physicsSteps++;
            }

            if (
                physicsSteps === maxPhysicsSteps &&
                this.physicsAccumulatorMs >=
                    this.fixedPhysicsStepMs
            ) {
                this.physicsAccumulatorMs = 0;
            }

            // Обновление таймеров
            if (this.dropCooldown > 0) this.dropCooldown -= dt * 1000;
            if (this.shakeCooldown > 0) {
                this.shakeCooldown -= dt;
                this.ui.updateShake(this.shakeCooldown);
            }

            // Замедление времени
            if (this.flashActiveUntil > 0 && now >= this.flashActiveUntil) {
                this.flashActiveUntil = 0;
                this.physics.engine.timing.timeScale = 1.0;
            }

            // Хайп / Лихорадка (Fever)
            if (this.isFeverActive) {
                this.feverTimer -= dt;
                if (this.feverTimer <= 0) {
                    this.isFeverActive = false;
                    this.feverCharge = 0;
                    this.updateDropCooldownFromState();
                    this.ui.setQuote("«Хайп утих... Но синапсы горят!»");
                }
            } else {
                // Медленное остывание хайпа если нет слияний
                this.feverCharge = Math.max(0, this.feverCharge - dt * 2.2);
            }

            // Рулетка / Колесо Фортуны (таймер 240 сек = 4 минуты)
            if (this.rouletteTimer > 0) {
                this.rouletteTimer -= dt;
                if (this.rouletteTimer <= 0) {
                    this.rouletteTimer = 240;
                    this.freeSpinsAvailable++;
                    AudioCtrl.playWheelTick();
                    this.ui.setQuote("🎡 Бесплатный спин Колеса Фортуны готов!");
                }
            }

            // Пассивный доход
            if (this.passiveIncome > 0) {
                this.addMotivation(this.passiveIncome * dt);
            }

            // Авто-атака Кибернетической Руки (hero[4])
            if (CONFIG.UPGRADES.hero[4]?.bought) {
                this.cyberPunchTimer = (this.cyberPunchTimer || 0) + dt;
                if (this.cyberPunchTimer >= 1.5) {
                    this.cyberPunchTimer = 0;
                    const punchDmg = Math.floor(40 * this.bossDamageMultiplier * (1 + (CONFIG.PRESTIGE_PERKS[6]?.level || 0) * 0.5));
                    this.dealBossDamage(punchDmg);
                    this.spawnFloatingText(this.canvas.width / 2 + 30, this.roomHeight - 20, `🤖 -${CONFIG.formatNumber(punchDmg)}`, '#00f0ff');
                }
            }

            // Пассивная Аура Гигачада (hero[7])
            if (CONFIG.UPGRADES.hero[7]?.bought) {
                const currentBoss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[1];
                const auraDmg = Math.max(1, Math.floor(currentBoss.hp * 0.005 * dt));
                this.dealBossDamage(auraDmg);
            }

            // Титановый экзоскелет (hero[5]): дыхалка не падает до нуля
            if (CONFIG.UPGRADES.hero[5]?.bought && this.stamina < 25) {
                this.stamina = 25;
                this.isExhausted = false;
            }

            // Восстановление дыхалки
            if (this.stamina < this.maxStamina) {
                let recovery = this.staminaRecoveryRate;
                if (CONFIG.UPGRADES.hero[2]?.bought) recovery *= 2.0;
                this.stamina = Math.min(this.maxStamina, this.stamina + recovery * dt);
                if (this.stamina > 30) this.isExhausted = false;
            }

            // Передышка между боссами (Очередь боссов с кулдауном)
            if (this.bossBreakTimer > 0) {
                this.bossBreakTimer -= dt;
                if (this.bossBreakTimer <= 0) {
                    this.bossBreakTimer = 0;
                    this.advanceDay();
                }
            }

            // Проверка смены суток по МСК для ежедневных квестов и проверка достижений
            if (Math.random() < 0.05) {
                this.checkDailyQuestsDate();
                this.checkAchievements();
            }

            // Таймер комбо
            if (this.comboTimer > 0) {
                this.comboTimer -= dt;
                if (this.comboTimer <= 0) {
                    this.combo = 0;
                }
            }

            // Интерактивные летающие инсайты
            this.updateInsightBubbles(dt);

            // Таймер наклона стакана
            if (this.tiltTimer > 0) {
                this.tiltTimer -= dt;
                if (this.tiltTimer <= 0 && !this.gyroEnabled) {
                    this.physics.setGravityTilt(0);
                }
            }

            // Авто-сброс мыслей
            if (this.autoDropEnabled) {
                this.autoDropTimer += dt;
                if (this.autoDropTimer >= 1.6 && this.dropCooldown <= 0) {
                    this.autoDropTimer = 0;
                    this.aimX = 50 + Math.random() * (this.canvas.width - 100);
                    this.dropThought();
                }
            }

            // Таймер аренды
            this.rentTimer -= dt;
            const phaseIndex = Math.min(5, Math.ceil(this.day / 4));
            const phase = CONFIG.PHASES[phaseIndex] || CONFIG.PHASES[1];

            if (this.rentTimer <= 0) {
                this.onGameOver("Время аренды вышло! Выселен на улицу.");
                return;
            }

            // Проверка переполнения (Красная черта)
            this.checkDangerZone(dt);

            // Отрисовка
            this.render();
        } catch (err) {
            console.error("Game loop error:", err);
        }

        if (this.isRunning && !this.isGameOver) {
            this.scheduleNextFrame();
        }
    }

    checkDangerZone(dt) {
        const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => !b.isStatic);
        let inDanger = false;

        for (const b of bodies) {
            if (b.position.y - (b.circleRadius || 20) < this.dangerLineY && b.velocity.y < 0.2) {
                inDanger = true;
                break;
            }
        }

        if (inDanger) {
            this.dangerTimer += dt;
            if (this.dangerTimer >= this.dangerLimit) {
                this.onGameOver("Стакан мыслей переполнился! Мозговое выгорание.");
            }
        } else {
            this.dangerTimer = Math.max(0, this.dangerTimer - dt * 1.5);
        }
    }

    onGameOver(reason) {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.isRunning = false;

        this.pauseReasons.add('gameover');

        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        window.YandexBridge?.gameplayStop?.();

        this.saveGame();

        AudioCtrl.playExhausted();

        this.ui.showGameOver(reason, this.day);
    }

    // --- ОТРИСОВКА СТАКАНА МЫСЛЕЙ (КИБЕР-КОЛБА) ---
    drawCup(ctx, w, h) {
        const bounds = this.physics.getCupBounds();
        const { leftX, rightX, width, topY, bottomY } = bounds;
        const cornerR = 14;

        ctx.save();
        
        // Полупрозрачный градиентный фон стакана
        const cupBg = ctx.createLinearGradient(0, topY, 0, bottomY);
        cupBg.addColorStop(0, 'rgba(10, 16, 32, 0.42)');
        cupBg.addColorStop(0.6, 'rgba(7, 12, 24, 0.65)');
        cupBg.addColorStop(1, 'rgba(4, 8, 18, 0.90)');

        ctx.fillStyle = cupBg;
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(leftX, bottomY - cornerR);
        ctx.quadraticCurveTo(leftX, bottomY, leftX + cornerR, bottomY);
        ctx.lineTo(rightX - cornerR, bottomY);
        ctx.quadraticCurveTo(rightX, bottomY, rightX, bottomY - cornerR);
        ctx.lineTo(rightX, topY);
        ctx.closePath();
        ctx.fill();

        // Неоновые стенки стакана
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(leftX, bottomY - cornerR);
        ctx.quadraticCurveTo(leftX, bottomY, leftX + cornerR, bottomY);
        ctx.lineTo(rightX - cornerR, bottomY);
        ctx.quadraticCurveTo(rightX, bottomY, rightX, bottomY - cornerR);
        ctx.lineTo(rightX, topY);
        ctx.stroke();

        // Верхние акцентные закругления/колпачки стакана
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(leftX, topY, 3, 0, Math.PI * 2);
        ctx.arc(rightX, topY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Мерные засечки на стекле
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 1;
        const cupH = bottomY - topY;
        for (let pct of [0.25, 0.5, 0.75]) {
            const markY = bottomY - cupH * pct;
            ctx.beginPath();
            ctx.moveTo(leftX + 2, markY);
            ctx.lineTo(leftX + 10, markY);
            ctx.moveTo(rightX - 10, markY);
            ctx.lineTo(rightX - 2, markY);
            ctx.stroke();
        }

        // Нижняя платформа-подставка стакана
        ctx.fillStyle = '#0b1329';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(leftX - 4, bottomY, width + 8, 6, [0, 0, 4, 4]);
        } else {
            ctx.rect(leftX - 4, bottomY, width + 8, 6);
        }
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // --- ОТРИСОВКА МЫСЛИ С ВЕКТОРНОЙ МОДЕЛЬЮ ПЕРСОНАЖА ---
    drawThoughtBall(ctx, x, y, radius, tier, isAim = false) {
        const conf = CONFIG.TIERS[tier] || CONFIG.TIERS[1];
        ctx.save();
        ctx.translate(x, y);

        const fx = this.fxEnabled;

        // 1. Свечение (при включенном FX)
        if (fx && (tier >= 6 || isAim)) {
            ctx.shadowColor = conf.glow || '#3b82f6';
            ctx.shadowBlur = isAim ? 12 : 8;
        }

        // 2. Векторная отрисовка модели персонажа (чистый Canvas без внешних картинок)
        CONFIG.drawCharacterVector(ctx, tier, radius, {
            fx: fx,
            isAim: isAim
        });

        ctx.restore();
    }

    // --- ОТРИСОВКА ---
    render() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        // 1. Отрисовка комнаты и Скуфа наверху
        this.roomRenderer.draw(this.ctx, w, this.roomHeight, this);

        // 2. Отрисовка стакана мыслей (полупрозрачная колба с неоновыми стенками)
        this.drawCup(this.ctx, w, h);

        // 3. Красная черта опасности
        const bounds = this.physics.getCupBounds();
        const isDangerous = this.dangerTimer > 0;
        this.ctx.save();
        this.ctx.strokeStyle = isDangerous ? `rgba(239, 68, 68, ${0.5 + Math.sin(performance.now() * 0.015) * 0.5})` : 'rgba(239, 68, 68, 0.3)';
        this.ctx.lineWidth = isDangerous ? 3 : 1.5;
        this.ctx.setLineDash([8, 6]);
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.leftX + 2, this.dangerLineY);
        this.ctx.lineTo(bounds.rightX - 2, this.dangerLineY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        if (isDangerous) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = "bold 9.5px 'Segoe UI', sans-serif";
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`ОПАСНОСТЬ: ${(this.dangerLimit - this.dangerTimer).toFixed(1)}с`, bounds.rightX - 8, this.dangerLineY - 6);
        }
        this.ctx.restore();

        // 3. Линия прицеливания и текущая мысль
        if (this.dropCooldown <= 0) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.aimX, this.dropY);
            this.ctx.lineTo(this.aimX, h - 16);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.restore();

            // Превью мысли на прицеле с Aspect-Ratio Cover
            const previewRadius =
                this.physics.getTierRadius(
                    this.nextTier
                );

            this.drawThoughtBall(
                this.ctx,
                this.aimX,
                this.dropY,
                previewRadius,
                this.nextTier,
                true
            );
        }

        // 4. Отрисовка тел мыслей и мусора
        const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => !b.isStatic);
        bodies.forEach(b => {
            const { x, y } = b.position;
            const r = b.circleRadius || 20;

            if (b.isGarbage) {
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(b.angle);
                CONFIG.drawGarbageVector(this.ctx, b.garbageIndex !== undefined ? b.garbageIndex : b.garbageName, r, {
                    fx: this.fxEnabled,
                    isAim: false
                });
                this.ctx.restore();
            } else if (b.tier) {
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(b.angle);
                // Отрисовываем внутри локальных координат
                this.drawThoughtBall(this.ctx, 0, 0, r, b.tier, false);
                this.ctx.restore();
            }
        });

        // 5. Отрисовка частиц сочности / искр
        if (this.fxEnabled) {
            for (let i = this.sparkleParticles.length - 1; i >= 0; i--) {
                const p = this.sparkleParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    this.sparkleParticles.splice(i, 1);
                    continue;
                }

                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, p.alpha);
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        } else if (this.sparkleParticles.length > 0) {
            this.sparkleParticles = [];
        }

        // 6. Всплывающий текст
        this.floatingTexts.forEach((ft, idx) => {
            ft.y += ft.vy;
            ft.alpha -= 0.022;

            this.ctx.save();
            this.ctx.font = `bold ${ft.size}px 'Segoe UI', sans-serif`;
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = Math.max(0, ft.alpha);
            this.ctx.textAlign = 'center';
            if (this.fxEnabled) {
                this.ctx.shadowColor = '#000000';
                this.ctx.shadowBlur = 6;
            }
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(idx, 1);
            }
        });
    }

    updateHUD(force = false) {
        const now = performance.now();

        if (
            !force &&
            this.hasStarted &&
            now - this.lastHudUpdate < 80
        ) {
            this.hudDirty = true;
            return;
        }

        this.lastHudUpdate = now;
        this.hudDirty = false;

        this.ui.updateMotivation(
            this.motivation,
            this.passiveIncome
        );

        this.ui.updateConsumables(
            this.items
        );

        this.ui.updateSideDashboard(
            this
        );
    }

    getClickDamage() {
        return this.calculateTapDamage({
            rollCrit: false
        }).damage;
    }

    // --- ПОЛНЫЙ СБРОС СТАТИСТИКИ И ПРОГРЕССА (СТАРТ С ЧИСТОГО НУЛЯ) ---
    resetGame(manual = true) {
        try {
            const keysToRemove = [
                CONFIG.STORAGE_KEYS.SAVE,
                CONFIG.STORAGE_KEYS.LEGACY_SAVE_V2,
                CONFIG.STORAGE_KEYS.LEGACY_SAVE_V1,
                CONFIG.STORAGE_KEYS.STATS,
                CONFIG.STORAGE_KEYS.HIGH_SCORE,
                CONFIG.STORAGE_KEYS.LOCAL_LB
            ];

            for (const key of keysToRemove) {
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.warn("Error clearing storage", e);
        }

        // Обнуление всех числовых и игровых показателей
        this.totalTaps = 0;
        this.totalSpins = 0;

        this.runMotivationEarned = 0;
        this.runBossesDefeated = 0;

        this.tierCreatedCounts = {};

        this.highestTierUnlocked = 1;

        this.rouletteTimer = 90;

        this.feverTimer = 0;

        this.dangerTimer = 0;
        this.bossBreakTimer = 0;
        this.motivation = 0;
        this.totalMotivationEarned = 0;
        this.passiveIncome = 0;
        this.day = 1;
        this.currentBossIndex = 1;
        this.bossHp = CONFIG.BOSSES[1].hp;
        this.rentTimer = this.rentTimeMax;
        this.prestigeCouches = 0;
        this.prestigeLevel = 0;
        this.autoDropEnabled = false;
        this.freeSpinsAvailable = 1;
        this.items = { beer: 1, script: 1, energy: 1, bomb: 1, magnet: 1 };
        this.totalMerges = 0;
        this.gigachadsCreated = 0;
        this.bossesDefeated = 0;
        this.trashDestroyed = 0;
        this.maxCombo = 0;
        this.playTimeSeconds = 0;
        this.unlockedAchievements = [];
        this.stamina = 100;
        this.isExhausted = false;
        this.combo = 0;
        this.comboTimer = 0;
        this.feverCharge = 0;
        this.isFeverActive = false;
        this.activeRelics = [];
        this.highestTierUnlocked = 1;
        this.activeConsumableMode = null;
        this.flashActiveUntil = 0;
        this.magnetActiveUntil = 0;

        this.dropCooldown = 0;
        this.shakeCooldown = 0;
        this.autoDropTimer = 0;

        this.tiltTimer = 0;

        this.roomInteractionReadyAt =
            Object.create(null);

        if (this.physics) {
            this.physics.engine.timing.timeScale =
                1;

            this.physics.setGravityTilt(0);
        }
        this.questsDateKey =
            CONFIG.getMoscowDateKey();

        this.dailyQuests = [];

        this.initDailyQuestsPool();

        // Сброс дерева апгрейдов во всех 4 ветках
        if (CONFIG.UPGRADES) {
            Object.keys(CONFIG.UPGRADES).forEach(cat => {
                CONFIG.UPGRADES[cat].forEach(u => { u.bought = false; });
            });
        }

        // Сброс перков Сансары
        if (CONFIG.PRESTIGE_PERKS) {
            CONFIG.PRESTIGE_PERKS.forEach(p => { p.level = 0; });
        }

        // Очистка стакана от всех старых мыслей и мусора
        if (this.physics) {
            this.physics.clearAllBodies();
            this.seedInitialThoughts();
        }

        this.recalculatePassives();

        // Обновление всех элементов интерфейса
        const boss = CONFIG.BOSSES[1];
        this.ui.updateMotivation(0, 0);
        this.ui.updateBoss(boss, boss.hp, 1, this.maxDays);
        this.ui.updateRent(1, this.rentTimeMax, CONFIG.PHASES[1].bgTitle);
        this.ui.updateAutoDropBadge(false);
        this.ui.updateConsumables(this.items);
        this.ui.updateRelics([]);
        this.ui.updateRank("🛋️ Тюбик с дивана", "Сделайте первые слияния мыслей", "РАНГ 1");
        this.ui.updateSideDashboard(this);
        this.rollNextTier();

        if (this.roomRenderer) {
            this.roomRenderer.updateRoomStage(0);
        }

        this.saveGame();

        if (manual) {
            AudioCtrl.playLevelUp();
            this.ui.triggerScreenShake();
            this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 50, "🚀 СТАРТ С ЧИСТОГО НУЛЯ!", "#00f0ff");
            this.ui.setQuote("«Чистый лист! Начинаем новую жизнь с дивана!»");
        }
    }

    // --- ПЕРЕЗАПУСК ПОСЛЕ ВЫСЕЛЕНИЯ / ПОРАЖЕНИЯ (СБРОС НАКОПЛЕННОЙ МОТИВАЦИИ) ---
    restart() {
        // Новый забег
        this.isGameOver = false;
        this.isRunning = false;

        this.pauseReasons.delete('gameover');

        this.motivation = 0;

        this.day = 1;
        this.currentBossIndex = 1;
        this.bossHp = CONFIG.BOSSES[1].hp;

        this.rentTimer = this.rentTimeMax;

        // Статистика именно текущего забега
        this.runMotivationEarned = 0;
        this.runBossesDefeated = 0;

        this.activeRelics = [];
        this.activeConsumableMode = null;

        this.combo = 0;
        this.comboTimer = 0;

        this.feverCharge = 0;
        this.isFeverActive = false;
        this.feverTimer = 0;

        this.dangerTimer = 0;
        this.bossBreakTimer = 0;

        this.flashActiveUntil = 0;
        this.magnetActiveUntil = 0;

        this.dropCooldown = 0;
        this.shakeCooldown = 0;
        this.autoDropTimer = 0;

        this.tiltTimer = 0;

        this.physics.engine.timing.timeScale =
            1;

        if (!this.gyroEnabled) {
            this.physics.setGravityTilt(0);
        }

        this.roomInteractionReadyAt =
            Object.create(null);

        this.recalculatePassives();

        this.stamina = this.maxStamina;
        this.isExhausted = false;

        this.physics.clearAllBodies();

        this.seedInitialThoughts();

        this.rollNextTier();

        const boss = CONFIG.BOSSES[1];

        this.ui.updateMotivation(
            this.motivation,
            this.passiveIncome
        );

        this.ui.updateStamina(
            this.stamina,
            this.maxStamina,
            false
        );

        this.ui.updateBoss(
            boss,
            this.bossHp,
            1,
            this.maxDays
        );

        this.ui.updateRent(
            1,
            this.rentTimer,
            CONFIG.PHASES[1].bgTitle
        );

        this.ui.updateRelics([]);
        this.ui.updateFever(0, false, 0, 2);

        if (this.roomRenderer) {
            this.roomRenderer.updateRoomStage(0);
        }

        this.saveGame();

        this.lastTime = performance.now();

        this.start();

        this.ui.setQuote(
            "«Новая попытка! Не дай арендодателю выселить тебя снова!»"
        );
    }

    // --- СОХРАНЕНИЕ И ЗАГРУЗКА ---
    saveGame() {
        const data = {
            version: 3,

            motivation:
                this.motivation,

            totalMotivationEarned:
                this.totalMotivationEarned,

            runMotivationEarned:
                this.runMotivationEarned,

            day:
                this.day,

            currentBossIndex:
                this.currentBossIndex,

            bossHp:
                this.bossHp,

            rentTimer:
                this.rentTimer,

            stamina:
                this.stamina,

            isExhausted:
                this.isExhausted,

            prestigeCouches:
                this.prestigeCouches,

            prestigeLevel:
                this.prestigeLevel,

            autoDropEnabled:
                this.autoDropEnabled,

            freeSpinsAvailable:
                this.freeSpinsAvailable,

            rouletteTimer:
                this.rouletteTimer,

            items:
                { ...this.items },

            totalMerges:
                this.totalMerges,

            gigachadsCreated:
                this.gigachadsCreated,

            bossesDefeated:
                this.bossesDefeated,

            runBossesDefeated:
                this.runBossesDefeated,

            trashDestroyed:
                this.trashDestroyed,

            maxCombo:
                this.maxCombo,

            totalTaps:
                this.totalTaps,

            totalSpins:
                this.totalSpins,

            tierCreatedCounts:
                { ...this.tierCreatedCounts },

            highestTierUnlocked:
                this.highestTierUnlocked || 1,

            playTimeSeconds:
                this.playTimeSeconds,

            unlockedAchievements:
                [...this.unlockedAchievements],

            activeRelicIds:
                this.activeRelics
                    .map(r => r.id),

            feverCharge:
                this.feverCharge,

            nextTier:
                this.nextTier,

            dailyQuests:
                this.dailyQuests,

            questsDateKey:
                this.questsDateKey,

            upgrades: {
                hero:
                    CONFIG.UPGRADES.hero.map(
                        u => ({
                            id: u.id,
                            bought: u.bought
                        })
                    ),

                room:
                    CONFIG.UPGRADES.room.map(
                        u => ({
                            id: u.id,
                            bought: u.bought
                        })
                    ),

                brain:
                    CONFIG.UPGRADES.brain.map(
                        u => ({
                            id: u.id,
                            bought: u.bought
                        })
                    ),

                career:
                    CONFIG.UPGRADES.career.map(
                        u => ({
                            id: u.id,
                            bought: u.bought
                        })
                    )
            },

            prestigePerks:
                CONFIG.PRESTIGE_PERKS.map(
                    p => ({
                        id: p.id,
                        level: p.level
                    })
                ),

            worldState:
                this.physics
                    ?.serializeDynamicBodies?.() ||
                [],

            lastSavedTime:
                Date.now()
        };

        try {
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.SAVE,
                JSON.stringify(data)
            );
        } catch (e) {
            console.warn(
                'Save failed:',
                e
            );
        }
    }

    migrateSave(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }

        const migrated = {
            ...data
        };

        const oldVersion =
            migrated.version || 1;

        if (oldVersion < 3) {
            migrated.rentTimer ??=
                this.rentTimeMax;

            migrated.stamina ??=
                100;

            migrated.totalTaps ??=
                0;

            migrated.totalSpins ??=
                0;

            migrated.runMotivationEarned ??=
                0;

            migrated.runBossesDefeated ??=
                0;

            migrated.tierCreatedCounts ??=
                {};

            migrated.highestTierUnlocked ??=
                1;

            migrated.activeRelicIds ??=
                [];

            migrated.worldState ??=
                [];
        }

        migrated.version = 3;

        return migrated;
    }

    loadGame() {
        try {
            const raw =
                localStorage.getItem(
                    CONFIG.STORAGE_KEYS.SAVE
                ) ||
                localStorage.getItem(
                    CONFIG.STORAGE_KEYS.LEGACY_SAVE_V2
                ) ||
                localStorage.getItem(
                    CONFIG.STORAGE_KEYS.LEGACY_SAVE_V1
                );

            // --------------------------------------------------
            // НОВАЯ ИГРА
            // --------------------------------------------------

            if (!raw) {
                this.questsDateKey =
                    CONFIG.getMoscowDateKey();

                this.dailyQuests = [];
                this.initDailyQuestsPool();

                this.rollNextTier();

                return;
            }

            const parsed =
                JSON.parse(raw);

            const data =
                this.migrateSave(parsed);

            if (!data) {
                throw new Error(
                    'Invalid save'
                );
            }

            // --------------------------------------------------
            // ОСНОВНОЕ СОСТОЯНИЕ
            // --------------------------------------------------

            this.motivation =
                data.motivation ?? 0;

            this.totalMotivationEarned =
                data.totalMotivationEarned ?? 0;

            this.runMotivationEarned =
                data.runMotivationEarned ?? 0;

            this.day =
                data.day ?? 1;

            this.currentBossIndex =
                data.currentBossIndex ?? 1;

            const currentBoss =
                CONFIG.BOSSES[
                    this.currentBossIndex
                ] ||
                CONFIG.BOSSES[1];

            this.bossHp =
                data.bossHp ??
                currentBoss.hp;

            this.rentTimer =
                data.rentTimer ??
                this.rentTimeMax;

            // Stamina окончательно ограничим
            // после recalculatePassives()
            const savedStamina =
                data.stamina;

            this.isExhausted =
                !!data.isExhausted;

            // --------------------------------------------------
            // PRESTIGE
            // --------------------------------------------------

            this.prestigeCouches =
                data.prestigeCouches ?? 0;

            this.prestigeLevel =
                data.prestigeLevel ?? 0;

            this.autoDropEnabled =
                !!data.autoDropEnabled;

            // --------------------------------------------------
            // РУЛЕТКА
            // --------------------------------------------------

            this.freeSpinsAvailable =
                data.freeSpinsAvailable ?? 1;

            this.rouletteTimer =
                data.rouletteTimer ?? 90;

            // --------------------------------------------------
            // ПРЕДМЕТЫ
            // --------------------------------------------------

            this.items =
                Object.assign(
                    {
                        beer: 1,
                        script: 1,
                        energy: 1,
                        bomb: 1,
                        magnet: 1
                    },
                    data.items || {}
                );

            // --------------------------------------------------
            // СТАТИСТИКА
            // --------------------------------------------------

            this.totalMerges =
                data.totalMerges ?? 0;

            this.gigachadsCreated =
                data.gigachadsCreated ?? 0;

            this.bossesDefeated =
                data.bossesDefeated ?? 0;

            this.runBossesDefeated =
                data.runBossesDefeated ?? 0;

            this.trashDestroyed =
                data.trashDestroyed ?? 0;

            this.maxCombo =
                data.maxCombo ?? 0;

            this.totalTaps =
                data.totalTaps ?? 0;

            this.totalSpins =
                data.totalSpins ?? 0;

            this.tierCreatedCounts =
                data.tierCreatedCounts || {};

            this.highestTierUnlocked =
                data.highestTierUnlocked ?? 1;

            this.playTimeSeconds =
                data.playTimeSeconds ?? 0;

            this.unlockedAchievements =
                Array.isArray(
                    data.unlockedAchievements
                )
                    ? data.unlockedAchievements
                    : [];

            // --------------------------------------------------
            // FEVER
            // --------------------------------------------------

            this.feverCharge =
                data.feverCharge ?? 0;

            this.isFeverActive = false;
            this.feverTimer = 0;

            // --------------------------------------------------
            // NEXT THOUGHT
            // --------------------------------------------------

            const savedNextTier =
                Number(data.nextTier);

            if (
                Number.isInteger(savedNextTier) &&
                savedNextTier >= 1 &&
                savedNextTier <= 10
            ) {
                this.nextTier =
                    savedNextTier;
            } else {
                this.nextTier = 1;
            }

            // --------------------------------------------------
            // DAILY QUESTS
            // --------------------------------------------------

            this.questsDateKey =
                data.questsDateKey ||
                CONFIG.getMoscowDateKey();

            this.dailyQuests =
                Array.isArray(data.dailyQuests)
                    ? data.dailyQuests
                    : [];

            // Важно:
            // здесь НЕ вызываем checkDailyQuestsDate(),
            // потому что она умеет сразу saveGame(),
            // а стакан мы ещё не восстановили.

            const todayKey =
                CONFIG.getMoscowDateKey();

            if (
                this.questsDateKey !== todayKey ||
                this.dailyQuests.length === 0
            ) {
                this.questsDateKey =
                    todayKey;

                this.initDailyQuestsPool();
            }

            // --------------------------------------------------
            // UPGRADES
            // --------------------------------------------------

            if (data.upgrades) {
                Object
                    .keys(data.upgrades)
                    .forEach(category => {
                        const currentCategory =
                            CONFIG.UPGRADES[
                                category
                            ];

                        if (!currentCategory) {
                            return;
                        }

                        data.upgrades[
                            category
                        ].forEach(savedUpg => {
                            const found =
                                currentCategory.find(
                                    upg =>
                                        upg.id ===
                                        savedUpg.id
                                );

                            if (found) {
                                found.bought =
                                    !!savedUpg.bought;
                            }
                        });
                    });
            }

            // --------------------------------------------------
            // PRESTIGE PERKS
            // --------------------------------------------------

            if (
                Array.isArray(
                    data.prestigePerks
                )
            ) {
                data.prestigePerks
                    .forEach(savedPerk => {
                        const found =
                            CONFIG
                                .PRESTIGE_PERKS
                                .find(
                                    perk =>
                                        perk.id ===
                                        savedPerk.id
                                );

                        if (found) {
                            found.level =
                                Math.max(
                                    0,
                                    Math.min(
                                        found.max,
                                        savedPerk.level || 0
                                    )
                                );
                        }
                    });
            }

            // --------------------------------------------------
            // RELICS
            // --------------------------------------------------

            const relicIds =
                Array.isArray(
                    data.activeRelicIds
                )
                    ? data.activeRelicIds
                    : [];

            this.activeRelics =
                relicIds
                    .map(id =>
                        CONFIG
                            .RELICS_POOL
                            .find(
                                relic =>
                                    relic.id === id
                            )
                    )
                    .filter(Boolean);

            // --------------------------------------------------
            // СЧИТАЕМ ВСЕ ХАРАКТЕРИСТИКИ
            // --------------------------------------------------

            this.recalculatePassives();

            this.stamina =
                Math.min(
                    savedStamina ??
                        this.maxStamina,

                    this.maxStamina
                );

            // --------------------------------------------------
            // ВОССТАНАВЛИВАЕМ СТАКАН
            // --------------------------------------------------

            this.physics
                .restoreDynamicBodies(
                    data.worldState || []
                );

            // --------------------------------------------------
            // OFFLINE INCOME
            // --------------------------------------------------

            if (data.lastSavedTime) {
                const now =
                    Date.now();

                const offlineSeconds =
                    Math.max(
                        0,
                        Math.floor(
                            (
                                now -
                                data.lastSavedTime
                            ) / 1000
                        )
                    );

                const offlineLevel =
                    CONFIG
                        .PRESTIGE_PERKS[3]
                        ?.level || 0;

                const maxOfflineHours =
                    8 +
                    offlineLevel * 4;

                const cappedSeconds =
                    Math.min(
                        maxOfflineHours *
                            3600,

                        offlineSeconds
                    );

                if (
                    cappedSeconds > 60 &&
                    this.passiveIncome > 0
                ) {
                    const offlineRate =
                        0.8 +
                        offlineLevel * 0.05;

                    const offlineEarned =
                        cappedSeconds *
                        this.passiveIncome *
                        offlineRate;

                    this.addMotivation(
                        offlineEarned
                    );

                    this.ui.showOfflineIncome(
                        cappedSeconds,
                        offlineEarned
                    );
                }
            }

            // --------------------------------------------------
            // UI
            // --------------------------------------------------

            const boss =
                CONFIG.BOSSES[
                    this.currentBossIndex
                ] ||
                CONFIG.BOSSES[1];

            this.ui.updateBoss(
                boss,
                this.bossHp,
                this.day,
                this.maxDays
            );

            this.ui.updateAutoDropBadge(
                this.autoDropEnabled
            );

            this.ui.updateConsumables(
                this.items
            );

            this.ui.updateRelics(
                this.activeRelics
            );

            this.ui.updateStamina(
                this.stamina,
                this.maxStamina,
                this.isExhausted
            );

            this.ui.updateFever(
                this.feverCharge,
                false,
                0,
                this.getFeverScoreMultiplier()
            );

            this.ui.updateNextThought(
                this.nextTier
            );

            const phaseIndex =
                Math.min(
                    5,
                    Math.ceil(
                        this.day / 4
                    )
                );

            const phase =
                CONFIG.PHASES[
                    phaseIndex
                ] ||
                CONFIG.PHASES[1];

            this.roomRenderer
                ?.updateRoomStage(
                    phase.roomStage
                );

            this.ui.updateRent(
                this.day,
                Math.max(
                    0,
                    this.rentTimer
                ),
                phase.bgTitle
            );

            this.updateHUD(true);

            // --------------------------------------------------
            // SAVE MIGRATION
            // --------------------------------------------------

            // Только СЕЙЧАС.
            // Стакан уже восстановлен.
            this.saveGame();

        } catch (error) {
            console.error(
                'Failed to load save:',
                error
            );

            this.rollNextTier();
        }
    }
}

// Надежный запуск игры в любых браузерах, iframes и окружениях
function initGame() {
    if (!window.gameInstance) {
        window.gameInstance = new SkufLifeGame();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
