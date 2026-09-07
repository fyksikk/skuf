class SkufLifeGame {
    constructor(initialSaveData = null) {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-wrapper');

        this.ui = new UIManager(this);
        this.roomRenderer = new RoomRenderer();

        this.pauseReasons = new Set(['start-menu']);
        this.runMotivationEarned = 0;
        this.mergeWaves = [];
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
        this.hasRevivedThisRun = false;
        this.pendingOfflineAmount = 0;

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
        this.syncConsumableSelectionVisual();
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

        // Новые переменные для Блоков 1-6
        this.bossAttackTimer = 14;
        this.chainComboCount = 0;
        this.lastMergeTime = 0;
        this.isBasementMode = false;
        this.basementDay = 0;
        this.tapBonusUntil = 0;
        this.cryptoBonusUntil = 0;
        this.tapBonusTimer = 0;
        this.cryptoBonusTimer = 0;
        this.isAiming = false;
        this.progressResetAt = 0;
        this.hasRevivedThisRun = false;
        this.pendingOfflineAmount = 0;
        this.roomInteractionReadyAt = Object.create(null);
        this.eventPassiveBonusTimer = 0;
        this.eventPassiveBonusAmount = 0;
        this.periodicCheckTimer = 0;
        this.activeDailyMod = null;
        this.initDailyModifier();

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
        this.loadGame(
            initialSaveData
        );
        this.ensureInitialBodies();
        this.render();
        this.boundHandleOrientation = this.handleOrientation.bind(this);
        window.addEventListener('resize', () => this.resizeCanvas());

        if (window.ResizeObserver && this.container) {
            new ResizeObserver(() => this.resizeCanvas()).observe(this.container);
        }

        document.addEventListener(
            'visibilitychange',
            () => {
                if (document.hidden) {
                    this.saveGame({
                        cloudFlush: true
                    });

                    this.pause(
                        'visibility'
                    );

                } else {
                    this.resume(
                        'visibility'
                    );
                }
            }
        );

        window.addEventListener(
            'pagehide',
            () => {
                this.saveGame({
                    cloudFlush: true
                });
            }
        );

        // Авто-сохранение каждые 4 секунды
        setInterval(() => this.saveGame(), 4000);
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
        const now = Date.now();

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

    pause(
        reason = 'manual',
        {
            skipSdk = false
        } = {}
    ) {
        const wasPaused = this.isPaused;
        this.pauseReasons.add(reason);
        this.isPaused = true;

        if (!wasPaused) {
            const now = Date.now();
            if (this.tapBonusUntil && this.tapBonusUntil > now) {
                this.tapBonusRemaining = this.tapBonusUntil - now;
            } else if (this.tapBonusTimer > 0) {
                this.tapBonusRemaining = this.tapBonusTimer * 1000;
            } else {
                this.tapBonusRemaining = 0;
            }

            if (this.cryptoBonusUntil && this.cryptoBonusUntil > now) {
                this.cryptoBonusRemaining = this.cryptoBonusUntil - now;
            } else if (this.cryptoBonusTimer > 0) {
                this.cryptoBonusRemaining = this.cryptoBonusTimer * 1000;
            } else {
                this.cryptoBonusRemaining = 0;
            }
        }

        if (this.rafId !== null) {
            cancelAnimationFrame(
                this.rafId
            );

            this.rafId = null;
        }

        if (
            this.hasStarted &&
            !skipSdk
        ) {
            window.YandexBridge
                ?.gameplayStop?.();
        }

        AudioCtrl.suspend?.();
    }

    resume(
        reason = 'manual',
        {
            skipSdk = false
        } = {}
    ) {
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

        const now = Date.now();
        if (this.tapBonusRemaining > 0) {
            this.tapBonusUntil = now + this.tapBonusRemaining;
            this.tapBonusTimer = this.tapBonusRemaining / 1000;
            this.tapBonusRemaining = 0;
        }
        if (this.cryptoBonusRemaining > 0) {
            this.cryptoBonusUntil = now + this.cryptoBonusRemaining;
            this.cryptoBonusTimer = this.cryptoBonusRemaining / 1000;
            this.cryptoBonusRemaining = 0;
        }

        this.lastTime =
            performance.now();

        this.physicsAccumulatorMs = 0;

        if (!skipSdk) {
            window.YandexBridge
                ?.gameplayStart?.();
        }

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

        const rightFreeSpace =
            this.canvas.width -
            bounds.rightX;

        this.container.style.setProperty(
            '--cup-right-space',
            `${rightFreeSpace}px`
        );
        
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

            if (pointerStartedInCup) {
                this.isAiming = true;
            } else {
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
            this.isAiming = false;

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
            this.isAiming = false;
        });

        const preventContextMenu = (event) => {
            event.preventDefault();
        };
        this.canvas?.addEventListener('contextmenu', preventContextMenu);
        this.container?.addEventListener('contextmenu', preventContextMenu);
        document.getElementById('app-viewport')?.addEventListener('contextmenu', preventContextMenu);

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

        // Кнопка переключения Гироскопа
        document.getElementById('btn-toggle-gyro')?.addEventListener('click', () => {
            this.toggleGyroscope();
        });

        // Управление с клавиатуры (Стрелки / A / D / Пробел / Z)
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
            } else if (e.code === 'KeyZ') {
                e.preventDefault();
                this.toggleAutoDrop();
            }
        });

        // Расходники
        document.getElementById('slot-beer')?.addEventListener('click', () => {
            if (this.items.beer > 0) {
                this.activeConsumableMode = this.activeConsumableMode === 'beer' ? null : 'beer';
                this.syncConsumableSelectionVisual();
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
                this.flashActiveUntil =
                    Date.now() +
                    this.flashDuration;
                this.physics.engine.timing.timeScale = 0.5;
                AudioCtrl.playEndorphinFanfare();
                this.ui.updateConsumables(this.items);
                this.ui.setQuote("⚡ ВРЕМЯ ЗАМЕДЛЕНО! Синапсы разогнаны!");
            }
        });

        document.getElementById('slot-bomb')?.addEventListener('click', () => {
            if ((this.items.bomb || 0) > 0) {
                this.activeConsumableMode = this.activeConsumableMode === 'bomb' ? null : 'bomb';
                this.syncConsumableSelectionVisual();
                this.ui.setQuote(this.activeConsumableMode ? "💣 Выберите точку на стакане для детонации!" : "");
            }
        });

        document.getElementById('slot-magnet')?.addEventListener('click', () => {
            if ((this.items.magnet || 0) > 0) {
                this.items.magnet--;
                this.magnetActiveUntil =
                    Date.now() + 6000;
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
                    const catCooldown = (this.activeDailyMod?.id === 'wednesday_cat') ? 5000 : 15000;
                    if (
                        !this.tryRoomInteractionCooldown(
                            'cat',
                            catCooldown,
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

                    // Блок 2: Кот также убирает мусор/тревогу со стакана
                    const removedGarbage = this.physics.removeRandomGarbage(1);
                    if (removedGarbage) {
                        AudioCtrl.playCatClean();
                        this.addMotivation(500);
                        this.spawnFloatingText(target.x, target.y - 32, "🐾 КОТ СЪЕЛ ТРЕВОГУ!", "#f472b6");
                        this.ui.setQuote("«Котейка сцапал тревожную мысль лапкой: МЯУ! -1 Мусор!»");
                    } else {
                        this.ui.setQuote("«Котейка довольно мурчит: МЯУ! 🐾 +25 Дыхалка!»");
                    }

                    this.spawnFloatingText(target.x, target.y - 15, "МЯУ! +25 ⚡", "#f472b6");
                    this.spawnParticles(target.x, target.y, "#f472b6", 14);
                    return;
                }
                if (target.id === 'tv') {
                    const chan = this.roomRenderer.switchChannel();
                    AudioCtrl.playTVClick();
                    if (
                        this.tryRoomInteractionCooldown(
                            'tv_reward',
                            25000,
                            target.x,
                            target.y
                        )
                    ) {
                        this.addMotivation(200);
                        this.feverCharge = Math.min(100, this.feverCharge + 10);

                        // Блок 2: Реальные тактические баффы от телепередач
                        if (chan) {
                            if (chan.id === 0) { // СПАРТАК
                                this.tapBonusTimer = 20;
                                this.tapBonusUntil = Date.now() + 20000;
                                this.spawnFloatingText(target.x, target.y - 30, "⚽ ТАП-УРОН +50%!", "#22c55e");
                            } else if (chan.id === 1) { // УЛИЦЫ ФОНАРЕЙ
                                const bossDmg = Math.max(250, Math.floor(this.bossHp * 0.05));
                                this.dealBossDamage(bossDmg);
                                this.spawnFloatingText(target.x, target.y - 30, `🚓 ОМОН: -${CONFIG.formatNumber(bossDmg)} HP!`, "#38bdf8");
                            } else if (chan.id === 2) { // КРИПТО-ПАМП
                                this.cryptoBonusTimer = 25;
                                this.cryptoBonusUntil = Date.now() + 25000;
                                this.addMotivation(500);
                                this.spawnFloatingText(target.x, target.y - 30, "📈 КРИПТО-БУСТ +50%!", "#ffd700");
                            } else if (chan.id === 3) { // СТРИМ АЛЬТУШКИ
                                this.stamina = this.maxStamina;
                                this.feverCharge = Math.min(100, this.feverCharge + 25);
                                this.spawnFloatingText(target.x, target.y - 30, "🎀 100% ДЫХАЛКА + ХАЙП!", "#ec4899");
                            } else if (chan.id === 4) { // МАГАЗИН НА ДИВАНЕ
                                const itemKeys = ['beer', 'script', 'energy', 'bomb', 'magnet'];
                                const giftedItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                                this.items[giftedItem] = (this.items[giftedItem] || 0) + 1;
                                this.ui.updateConsumables(this.items);
                                this.spawnFloatingText(target.x, target.y - 30, `🎁 +1 ${giftedItem.toUpperCase()} С ДИВАНА!`, "#a855f7");
                            }
                        }
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

        if (this.tapBonusTimer > 0 || (this.tapBonusUntil && Date.now() < this.tapBonusUntil)) {
            damage *= 1.5;
        }

        return {
            damage: Math.max(1, Math.floor(damage)),
            isCrit,
            critChance,
            critMultiplier
        };
    }

    spawnMergeWave(
        x,
        y,
        color,
        tier
    ) {
        if (!this.fxEnabled) {
            return;
        }

        if (this.mergeWaves.length >= 24) {
            this.mergeWaves.splice(
                0,
                this.mergeWaves.length - 23
            );
        }

        this.mergeWaves.push({
            x,
            y,

            radius: 8,

            maxRadius:
                46 +
                tier * 7,

            speed:
                3.4 +
                tier * 0.28,

            alpha: 0.85,

            decay: 0.045,

            color,

            width:
                tier >= 7
                    ? 3.5
                    : 2.2
        });

        if (tier >= 8) {
            this.mergeWaves.push({
                x,
                y,

                radius: 3,

                maxRadius:
                    72 +
                    tier * 5,

                speed: 2.5,

                alpha: 0.48,

                decay: 0.028,

                color,

                width: 1.5
            });
        }
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
            this.syncConsumableSelectionVisual();
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
                    this.syncConsumableSelectionVisual();
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
        if (bodyA.mergeHandled || bodyB.mergeHandled) return;

        bodyA.mergeHandled = true;
        bodyB.mergeHandled = true;
        bodyA.isDead = true;
        bodyB.isDead = true;
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

        // Блок 3: Цепные комбо (Chain Combos)
        const nowWall = Date.now();
        if (nowWall - this.lastMergeTime < 700) {
            this.chainComboCount++;
        } else {
            this.chainComboCount = 1;
        }
        this.lastMergeTime = nowWall;

        let chainMultiplier = 1.0;
        if (this.chainComboCount >= 2) {
            chainMultiplier = 1 + (this.chainComboCount - 1) * 0.4;
            AudioCtrl.playComboChain(this.chainComboCount);
            this.spawnFloatingText(midX, midY - 32, `🔥 ЦЕПЬ x${this.chainComboCount}!`, "#f97316");
        }

        // Начисление заряда Хайпа (Fever): требует цепочек слияний и мастерства
        this.addFeverCharge(3.0 + Math.min(8, tier * 0.8 + this.combo * 0.5));

        // Награда Мотивации
        const tierConfig = CONFIG.TIERS[tier] || CONFIG.TIERS[1];
        const feverScoreMult =
            this.isFeverActive
                ? this.getFeverScoreMultiplier()
                : 1;
        
        let mondayMult = (this.activeDailyMod?.id === 'monday_grind') ? 2.0 : 1.0;
        let reward = tierConfig.score * Math.max(1, this.combo * 0.4) * this.comboMultiplier * this.globalIncomeMultiplier * feverScoreMult * chainMultiplier * mondayMult;
        
        if (this.hasGoldenCat && tier === 1) reward += 1500;
        this.addMotivation(reward);

        // Урон по боссу от слияния:
        let bossDmg = tierConfig.score * 2.2 * Math.max(1, this.combo * 0.3) * chainMultiplier;
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
        this.spawnMergeWave(
            midX,
            midY,
            tierConfig.glow ||
                tierConfig.color ||
                "#00e5ff",
            tier
        );

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
        let blastRadius = this.hasChainBlast && tier >= 5 ? 170 : (tier >= 4 ? 95 : 50);
        if (this.activeDailyMod?.id === 'thursday_clean') {
            blastRadius = Math.floor(blastRadius * 1.5);
        }
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

        // Трекинг комбо-квеста
        this.dailyQuests?.forEach(q => {
            if (
                q.type === 'combo' &&
                !q.claimed
            ) {
                q.progress =
                    Math.max(
                        q.progress || 0,
                        this.combo
                    );
            }
        });

        // Создание новой мысли следующего тира
        if (nextTier <= 10) {
            this.tierCreatedCounts[nextTier] = (this.tierCreatedCounts[nextTier] || 0) + 1;
            if (nextTier === 5) this.trackQuestProgress('tier_5', 1);
            if (nextTier === 7) this.trackQuestProgress('tier_7', 1);
            if (nextTier === 8) this.trackQuestProgress('tier_8', 1);
            if (nextTier === 9) this.trackQuestProgress('tier_9', 1);

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
            // Максимальный уровень (Гигачад + Гигачад): Трансценденция Гигачадов
            AudioCtrl.playEndorphinFanfare();
            const gigachadBonus = 250000;
            const gigachadBossDmg = 500000 * bossHunterBonus;
            this.addMotivation(gigachadBonus);
            this.dealBossDamage(gigachadBossDmg);
            this.roomRenderer.triggerEndorphinFlash();
            this.ui.triggerScreenShake();
            this.ui.setQuote("«ТРАНСЦЕНДЕНЦИЯ ГИГАЧАДОВ: База пробила космос!»");
            this.spawnFloatingText(midX, midY, `ТРАНСЦЕНДЕНЦИЯ ГИГАЧАДОВ! 🌌 +${CONFIG.formatNumber(gigachadBonus)}`, "#ff2a85");
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

    getBossMaxHp(day = this.day) {
        const bossIndex = Math.max(1, Math.min(this.maxDays, day));
        const baseBoss = CONFIG.BOSSES[bossIndex] || CONFIG.BOSSES[1];
        const hpMultiplier = day > 20 ? Math.pow(1.3, day - 20) : 1.0;
        return Math.floor(baseBoss.hp * hpMultiplier);
    }

    dealBossDamage(amount) {
        if (this.bossBreakTimer > 0) return; // Во время передышки босс неуязвим/отсутствует
        this.bossHp = Math.max(0, this.bossHp - amount);
        const boss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[1];
        this.ui.updateBoss(boss, this.bossHp, this.day, this.maxDays, this.getBossMaxHp(this.day));

        if (this.bossHp <= 0) {
            this.onBossDefeated();
        }
    }

    damageBoss(amount) {
        this.dealBossDamage(amount);
    }

    onBossDefeated() {
        this.bossesDefeated++;
        this.runBossesDefeated++;
        this.trackQuestProgress('boss', 1);
        AudioCtrl.playEndorphinFanfare();
        this.ui.triggerScreenShake();

        // Запуск фазы передышки / кулдауна перед следующим боссом (очередь боссов)
        this.bossBreakTimer = 3.5;
        this.saveGame({
            cloudFlush: true
        });

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

                // Межстраничная реклама после победы над боссом (с защитой кулдауна 180с)
                window.YandexBridge?.showFullscreenAdv();
            });
        } else {
            // Если реликвий нет в пуле
            window.YandexBridge?.showFullscreenAdv();
        }
    }

    advanceDay() {
        this.day++;
        this.currentBossIndex = Math.min(this.maxDays, this.day);
        const nextBoss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[20];
        
        const maxHp = this.getBossMaxHp(this.day);
        this.bossHp = maxHp;
        this.rentTimer = this.rentTimeMax;

        // Обновление фазы окружения
        const phaseIndex = Math.min(5, Math.ceil(this.day / 4));
        const phase = CONFIG.PHASES[phaseIndex] || CONFIG.PHASES[1];
        this.roomRenderer.updateRoomStage(phase.roomStage);

        this.ui.updateRent(this.day, this.rentTimer, phase.bgTitle);
        this.ui.updateBoss(nextBoss, this.bossHp, this.day, this.maxDays, maxHp);
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
            this.updateHUD(true);
            this.saveGame({ cloudFlush: true });
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

    triggerPrestige(withSuperBonus = false) {
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
        this.hasRevivedThisRun = false;

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

        this.motivation = withSuperBonus ? 50000 : 0;
        if (withSuperBonus) {
            this.items.beer = (this.items.beer || 0) + 2;
            this.items.script = (this.items.script || 0) + 2;
            this.items.energy = (this.items.energy || 0) + 2;
            this.items.bomb = (this.items.bomb || 0) + 2;
            this.items.magnet = (this.items.magnet || 0) + 2;
            this.ui.updateConsumables(this.items);
        }

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
        this.syncConsumableSelectionVisual();

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
            this.maxDays,
            this.getBossMaxHp(1)
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

        this.saveGame({ cloudFlush: true });

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

    claimQuest(id, doubleReward = false) {
        const q = this.dailyQuests.find(item => item.id === id);
        if (!q || q.claimed || (q.progress || 0) < q.goal) return;

        q.claimed = true;
        const finalReward = doubleReward ? q.reward * 2 : q.reward;
        this.addMotivation(finalReward);
        if (q.rewardItem && this.items[q.rewardItem] !== undefined) {
            const count = doubleReward ? 2 : 1;
            this.items[q.rewardItem] += count;
            this.ui.updateConsumables(this.items);
        }
        if (doubleReward) {
            this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 35, `🎁 2X НАГРАДА: +${CONFIG.formatNumber(finalReward)}!`, "#ffd700");
        }
        this.saveGame();
    }

    // --- МОНЕТИЗАЦИЯ & REWARDED МЕХАНИКИ ---

    revivePlayer() {
        this.hasRevivedThisRun = true;
        this.isGameOver = false;
        this.dangerTimer = 0;
        this.stamina = Math.max(this.stamina, this.maxStamina * 0.5);
        this.isExhausted = false;
        this.rentTimer = Math.max(this.rentTimer, 45); // Даем 45с на спасение
        
        // Очистка опасных мыслей сверху
        this.physics.cleanseAllGarbage();
        this.physics.removeUpperThoughts(0.35);
        
        this.ui.hideGameOver();
        this.resume('gameover');
        this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 35, "🔥 ВТОРОЕ ДЫХАНИЕ! ЗАБЕГ ПРОДОЛЖАЕТСЯ!", "#00e5ff");
        AudioCtrl.playLevelUp();
        this.saveGame({ cloudFlush: true });
    }

    claimOfflineIncome(isDouble = false) {
        const base = this.pendingOfflineAmount || 0;
        const finalAmount = isDouble ? base * 2 : base;
        if (finalAmount > 0) {
            this.addMotivation(finalAmount);
            if (isDouble) {
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 35, `💰 2X ОФФЛАЙН: +${CONFIG.formatNumber(finalAmount)}!`, "#ffd700");
            }
            AudioCtrl.playEndorphinFanfare();
        }
        this.pendingOfflineAmount = 0;
        this.saveGame({ cloudFlush: true });
    }

    claimShopAid() {
        this.items.beer = (this.items.beer || 0) + 1;
        this.items.script = (this.items.script || 0) + 1;
        this.items.energy = (this.items.energy || 0) + 1;
        this.items.bomb = (this.items.bomb || 0) + 1;
        this.items.magnet = (this.items.magnet || 0) + 1;
        this.ui.updateConsumables(this.items);
        this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 35, "📦 ГУМАНИТАРНАЯ ПОМОЩЬ: +1 ВСЕХ РАСХОДНИКОВ!", "#4ade80");
        AudioCtrl.playLevelUp();
        this.saveGame();
    }

    applyBossFreeze() {
        this.rentTimer = Math.min(this.rentTimeMax + 60, this.rentTimer + 35);
        this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 35, "⏳ ЗАМОРОЗКА: +35с АРЕНДЫ!", "#00e5ff");
        AudioCtrl.playUpgrade();
    }

    applyBossNuke() {
        const dmg = Math.max(10, Math.floor(this.getBossMaxHp(this.day) * 0.15));
        this.damageBoss(dmg);
        this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 35, `💥 ТАКТИЧЕСКИЙ УДАР: -${CONFIG.formatNumber(dmg)} HP!`, "#ef4444");
        AudioCtrl.playBossDamage();
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
        if (this.floatingTexts.length >= 40) {
            this.floatingTexts.splice(
                0,
                this.floatingTexts.length - 39
            );
        }
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
    triggerFeverMode(durationOverride = null) {
        const wasAlreadyActive =
            this.isFeverActive;

        this.isFeverActive = true;

        this.feverTimer =
            durationOverride ??
            (
                CONFIG.UPGRADES.brain[8]?.bought
                    ? 14
                    : 8.5
            );

        this.feverCharge = 100;

        this.updateDropCooldownFromState();

        if (!wasAlreadyActive) {
            this.trackQuestProgress(
                'fever',
                1
            );
        }

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
                this.triggerFeverMode(16);

                this.stamina =
                    this.maxStamina;

                this.isExhausted = false;
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
                const nukeDamage = Math.max(200, Math.floor(this.getBossMaxHp(this.day) * 0.28));
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
            const wallNow = Date.now();

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

                if (this.magnetActiveUntil > wallNow) {
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
            if (
                this.flashActiveUntil > 0 &&
                wallNow >= this.flashActiveUntil
            ) {
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
            let currentPassive = this.passiveIncome;
            if (this.cryptoBonusTimer > 0 || (this.cryptoBonusUntil && wallNow < this.cryptoBonusUntil)) {
                currentPassive *= 1.5;
            }
            if (this.cryptoBonusTimer > 0) {
                this.cryptoBonusTimer = Math.max(0, this.cryptoBonusTimer - dt);
            }
            if (this.tapBonusTimer > 0) {
                this.tapBonusTimer = Math.max(0, this.tapBonusTimer - dt);
            }
            if (this.passiveIncome > 0) {
                this.addMotivation(currentPassive * dt);
            }
            if (this.eventPassiveBonusTimer > 0) {
                this.eventPassiveBonusTimer -= dt;
                if (this.eventPassiveBonusAmount > 0) {
                    this.addMotivation(this.eventPassiveBonusAmount * dt);
                }
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
                const auraDmg = Math.max(1, Math.floor(this.getBossMaxHp(this.day) * 0.005 * dt));
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

            // Блок 1: Активные атаки босса
            if (this.bossBreakTimer <= 0 && !this.isGameOver) {
                this.bossAttackTimer -= dt;
                if (this.bossAttackTimer <= 0) {
                    this.executeBossAttack();
                }
            }

            // Блок 3: Анти-застревание предметов
            this.physics.checkStuckBodies(dt);

            // Передышка между боссами (Очередь боссов с кулдауном)
            if (this.bossBreakTimer > 0) {
                this.bossBreakTimer -= dt;
                if (this.bossBreakTimer <= 0) {
                    this.bossBreakTimer = 0;
                    this.advanceDay();
                }
            }

            // Периодические проверки (квесты, достижения, соперник) раз в секунду
            this.periodicCheckTimer = (this.periodicCheckTimer || 0) + dt;
            if (this.periodicCheckTimer >= 1.0) {
                this.periodicCheckTimer = 0;
                this.checkDailyQuestsDate();
                this.checkAchievements();
                this.updateRivalGhostSystem();
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
                const autoDropInterval = (this.activeDailyMod?.id === 'tuesday_fever') ? 0.9 : 1.4;
                if (this.autoDropTimer >= autoDropInterval && this.dropCooldown <= 0) {
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
        const bodies = Matter.Composite.allBodies(this.physics.world).filter(
            b => !b.isStatic && !b.isDead
        );
        let inDanger = false;
        const now = performance.now();

        for (const b of bodies) {
            const age = b.spawnedAt ? (now - b.spawnedAt) : 9999;
            if (age < 900) continue;

            const radius = b.circleRadius || 20;
            const topY = b.position.y - radius;

            const isSettled =
                Math.abs(b.velocity.y) < 0.45 &&
                Math.abs(b.velocity.x) < 1.2;

            if (topY < this.dangerLineY && isSettled) {
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

    // --- БЛОК 5: ЕЖЕДНЕВНЫЕ МОДИФИКАТОРЫ ---
    initDailyModifier() {
        const dayOfWeek = new Date().getDay(); // 0 = Воскресенье, 1 = Понедельник...
        this.activeDailyMod = (CONFIG.DAILY_MODIFIERS && (CONFIG.DAILY_MODIFIERS[dayOfWeek] || CONFIG.DAILY_MODIFIERS[1])) || null;
        if (this.ui && this.activeDailyMod) {
            this.ui.updateDailyModifier(this.activeDailyMod);
        }
    }

    // --- БЛОК 1: АКТИВНЫЕ АТАКИ БОССА ---
    executeBossAttack() {
        const boss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[1];
        const attackTypes = ['earthquake', 'garbage_drop', 'corrupt_thought'];
        const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];

        const bossBar = document.getElementById('boss-progress-bar') || document.getElementById('boss-bar');
        if (bossBar) {
            bossBar.classList.add('boss-attack-flash');
            setTimeout(() => bossBar.classList.remove('boss-attack-flash'), 1000);
        }

        AudioCtrl.playBossAttack();
        this.ui.triggerScreenShake();

        if (attackType === 'earthquake') {
            const intensity = 1.0 + Math.min(1.5, this.day * 0.05);
            this.physics.triggerEarthquake(intensity);
            this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `⚠️ ${boss.name}: ЗЕМЛЕТРЯСЕНИЕ!`, "#ef4444");
            this.ui.setQuote(`«${boss.name} сотрясает реальность! Мысли перемешались!»`);
        } else if (attackType === 'garbage_drop') {
            const dropCount = this.day >= 10 ? 2 : 1;
            for (let i = 0; i < dropCount; i++) {
                const rx = this.canvas.width * 0.3 + Math.random() * (this.canvas.width * 0.4);
                this.physics.spawnGarbageItem(rx, this.dropY - 10, 'boss_trash');
            }
            this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `⚠️ ${boss.name}: ВБРОС МУСОРА!`, "#f59e0b");
            this.ui.setQuote(`«${boss.name} закидывает тебя бытовыми проблемами!»`);
        } else if (attackType === 'corrupt_thought') {
            const corrupted = this.physics.convertRandomToGarbage(1);
            if (corrupted && corrupted.length > 0) {
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `⚠️ ${boss.name}: ЗАРАЖЕНИЕ МЫСЛИ!`, "#a855f7");
                this.ui.setQuote(`«${boss.name} осквернил твою светлую мысль!»`);
            } else {
                this.physics.triggerEarthquake(1.2);
                this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, `⚠️ ${boss.name}: УДАР ПО СТАКАНУ!`, "#ef4444");
            }
        }

        // Перезапуск таймера атаки
        let baseCooldown = Math.max(9, 17 - this.day * 0.35) + Math.random() * 4;
        if (this.activeDailyMod?.id === 'monday_grind') {
            baseCooldown *= 0.75; // Боссы чаще атакуют в понедельник
        }
        this.bossAttackTimer = baseCooldown;
    }

    // --- БЛОК 3: УЛЬТИМЕЙТ МЕГА-ГИГАЧАДА ---
    triggerMegaChadShockwave(midX, midY) {
        AudioCtrl.playMegaChad();
        this.roomRenderer.triggerEndorphinFlash();
        this.ui.triggerScreenShake();

        // Очищаем весь мусор на поле
        const cleansedCount = this.physics.cleanseAllGarbage();

        // Наносим колоссальный сокрушительный урон боссу
        const bossDmg = Math.max(300000, Math.floor(this.getBossMaxHp(this.day) * 0.40));
        this.dealBossDamage(bossDmg);

        this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 45, "👑 УЛЬТИМЕЙТ ГИГАЧАДА!", "#ffd700");
        if (cleansedCount > 0) {
            this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 70, `✨ ОЧИЩЕНО МУСОРА: ${cleansedCount}!`, "#00f0ff");
        }
        this.ui.setQuote("«ГИГАЧАД ПРОБУЖДЁН! Полная ясность разума и сокрушение босса!»");
        this.spawnParticles(midX, midY, "#ffd700", 35);
    }

    // --- БЛОК 6: АВТО-СБРОС МЫСЛЕЙ ---
    toggleAutoDrop() {
        this.autoDropEnabled = !this.autoDropEnabled;
        if (this.ui) {
            this.ui.updateAutoDrop(this.autoDropEnabled);
        }
        if (this.autoDropEnabled) {
            this.ui.setQuote("🤖 Авто-сброс мыслей включён! Синапсы работают сами.");
        } else {
            this.ui.setQuote("🛑 Авто-сброс отключён. Ручное управление.");
        }
        this.saveGame();
    }

    // --- БЛОК 5: ПРИЗРАК СОПЕРНИКА В ЛИДЕРБОРДЕ ---
    updateRivalGhostSystem() {
        if (!this.ui) return;
        const myScore = Math.floor(this.totalMotivationEarned);
        const rivals = [
            { name: "Скуф-Новичок", score: 5000 },
            { name: "Пивной Магистр", score: 25000 },
            { name: "Тайный Донатер", score: 75000 },
            { name: "Скуф 2077", score: 200000 },
            { name: "Кибер-Майнер", score: 600000 },
            { name: "Альтушка из Топа", score: 1500000 },
            { name: "Сверх-Сигма", score: 5000000 },
            { name: "Истинный Гигачад", score: 15000000 }
        ];

        let nextRival = rivals.find(r => r.score > myScore);
        if (nextRival) {
            const diff = nextRival.score - myScore;
            this.ui.updateRivalGhost(nextRival.name, diff);
        } else {
            this.ui.updateRivalGhost("Легенда #1", 0);
        }
    }
    
    // --- ОТРИСОВКА СТАКАНА МЫСЛЕЙ (КИБЕР-КОЛБА) ---
    drawCup(ctx, w, h) {
        const bounds =
            this.physics.getCupBounds();

        const {
            leftX,
            rightX,
            width,
            topY,
            bottomY
        } = bounds;

        const cornerR = 16;

        ctx.save();

        const traceCup = () => {
            ctx.beginPath();

            ctx.moveTo(
                leftX,
                topY
            );

            ctx.lineTo(
                leftX,
                bottomY - cornerR
            );

            ctx.quadraticCurveTo(
                leftX,
                bottomY,
                leftX + cornerR,
                bottomY
            );

            ctx.lineTo(
                rightX - cornerR,
                bottomY
            );

            ctx.quadraticCurveTo(
                rightX,
                bottomY,
                rightX,
                bottomY - cornerR
            );

            ctx.lineTo(
                rightX,
                topY
            );

            ctx.closePath();
        };

        const railOffset = 18;
        const railWidth = 8;

        const drawRail = (x) => {
            const railGradient =
                ctx.createLinearGradient(
                    x,
                    0,
                    x + railWidth,
                    0
                );

            railGradient.addColorStop(
                0,
                "rgba(5,10,20,0.15)"
            );

            railGradient.addColorStop(
                0.5,
                "rgba(28,40,60,0.75)"
            );

            railGradient.addColorStop(
                1,
                "rgba(0,229,255,0.10)"
            );

            ctx.fillStyle =
                railGradient;

            ctx.fillRect(
                x,
                topY + 8,
                railWidth,
                bottomY - topY - 16
            );

            for (let i = 1; i <= 4; i++) {
                const ledY =
                    topY +
                    (
                        bottomY -
                        topY
                    ) *
                    (
                        i / 5
                    );

                ctx.fillStyle =
                    "rgba(0,229,255,0.35)";

                ctx.beginPath();

                ctx.arc(
                    x + railWidth / 2,
                    ledY,
                    1.5,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }
        };

        drawRail(
            leftX -
            railOffset
        );

        drawRail(
            rightX +
            railOffset -
            railWidth
        );

        // -----------------------------
        // ОСНОВНОЙ ФОН КОЛБЫ
        // -----------------------------

        const background =
            ctx.createLinearGradient(
                0,
                topY,
                0,
                bottomY
            );

        background.addColorStop(
            0,
            "rgba(11, 21, 42, 0.50)"
        );

        background.addColorStop(
            0.55,
            "rgba(7, 13, 28, 0.76)"
        );

        background.addColorStop(
            1,
            "rgba(3, 7, 17, 0.96)"
        );

        traceCup();

        ctx.fillStyle =
            background;

        ctx.fill();

        // -----------------------------
        // ВНУТРЕННИЙ CYBER BACKGROUND
        // -----------------------------

        ctx.save();

        traceCup();
        ctx.clip();

        // Центральная подсветка

        const centerGlow =
            ctx.createRadialGradient(
                w / 2,
                topY +
                    (bottomY - topY) * 0.48,
                10,

                w / 2,
                topY +
                    (bottomY - topY) * 0.48,
                width * 0.65
            );

        centerGlow.addColorStop(
            0,
            "rgba(0, 229, 255, 0.055)"
        );

        centerGlow.addColorStop(
            0.55,
            "rgba(92, 67, 255, 0.025)"
        );

        centerGlow.addColorStop(
            1,
            "rgba(0, 0, 0, 0)"
        );

        ctx.fillStyle =
            centerGlow;

        ctx.fillRect(
            leftX,
            topY,
            width,
            bottomY - topY
        );

        // Слабая технологическая сетка

        ctx.strokeStyle =
            "rgba(120, 180, 255, 0.035)";

        ctx.lineWidth = 1;

        for (
            let x = leftX + 20;
            x < rightX;
            x += 28
        ) {
            ctx.beginPath();

            ctx.moveTo(
                x,
                topY
            );

            ctx.lineTo(
                x,
                bottomY
            );

            ctx.stroke();
        }

        for (
            let y = topY + 24;
            y < bottomY;
            y += 28
        ) {
            ctx.beginPath();

            ctx.moveTo(
                leftX,
                y
            );

            ctx.lineTo(
                rightX,
                y
            );

            ctx.stroke();
        }

        // Стеклянный блик слева

        const glassHighlight =
            ctx.createLinearGradient(
                leftX,
                0,
                leftX + width * 0.28,
                0
            );

        glassHighlight.addColorStop(
            0,
            "rgba(255,255,255,0.08)"
        );

        glassHighlight.addColorStop(
            0.35,
            "rgba(255,255,255,0.018)"
        );

        glassHighlight.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        ctx.fillStyle =
            glassHighlight;

        ctx.fillRect(
            leftX,
            topY,
            width * 0.35,
            bottomY - topY
        );

        ctx.restore();

        // -----------------------------
        // СТЕНКИ
        // -----------------------------

        ctx.shadowColor =
            "rgba(0, 229, 255, 0.38)";

        ctx.shadowBlur = 6;

        ctx.strokeStyle =
            "rgba(0, 229, 255, 0.42)";

        ctx.lineWidth = 2;

        traceCup();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // -----------------------------
        // ВНУТРЕННЯЯ РАМКА
        // -----------------------------

        ctx.strokeStyle =
            "rgba(255,255,255,0.07)";

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(
            leftX + 5,
            topY + 2
        );

        ctx.lineTo(
            leftX + 5,
            bottomY - 17
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.moveTo(
            rightX - 5,
            topY + 2
        );

        ctx.lineTo(
            rightX - 5,
            bottomY - 17
        );

        ctx.stroke();

        // -----------------------------
        // МЕРНЫЕ ЗАСЕЧКИ
        // -----------------------------

        const cupH =
            bottomY - topY;

        for (
            const pct of [
                0.25,
                0.5,
                0.75
            ]
        ) {
            const markY =
                bottomY -
                cupH * pct;

            ctx.strokeStyle =
                "rgba(255,255,255,0.09)";

            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(
                leftX + 5,
                markY
            );

            ctx.lineTo(
                leftX + 14,
                markY
            );

            ctx.moveTo(
                rightX - 14,
                markY
            );

            ctx.lineTo(
                rightX - 5,
                markY
            );

            ctx.stroke();
        }

        // -----------------------------
        // НИЖНЯЯ БАЗА
        // -----------------------------

        const baseGradient =
            ctx.createLinearGradient(
                0,
                bottomY,
                0,
                bottomY + 8
            );

        baseGradient.addColorStop(
            0,
            "#15223c"
        );

        baseGradient.addColorStop(
            1,
            "#070c18"
        );

        ctx.fillStyle =
            baseGradient;

        ctx.strokeStyle =
            "rgba(0,229,255,0.35)";

        ctx.lineWidth = 1;

        ctx.beginPath();

        if (ctx.roundRect) {
            ctx.roundRect(
                leftX - 4,
                bottomY,
                width + 8,
                7,
                [0, 0, 5, 5]
            );
        } else {
            ctx.rect(
                leftX - 4,
                bottomY,
                width + 8,
                7
            );
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

    syncConsumableSelectionVisual() {
        document
            .querySelectorAll(
                ".item-slot"
            )
            .forEach(el => {
                el.classList.remove(
                    "selected"
                );
            });

        if (
            this.activeConsumableMode
        ) {
            document
                .getElementById(
                    `slot-${
                        this
                            .activeConsumableMode
                    }`
                )
                ?.classList
                .add("selected");
        }
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

        // -----------------------------------------
        // DANGER ZONE
        // -----------------------------------------

        const bounds =
            this.physics.getCupBounds();

        const isDangerous =
            this.dangerTimer > 0;

        const dangerProgress =
            Math.min(
                1,
                this.dangerTimer /
                this.dangerLimit
            );

        this.ctx.save();

        // Слабая зона всегда видна,
        // при опасности усиливается.

        const zoneGradient =
            this.ctx.createLinearGradient(
                0,
                bounds.topY,
                0,
                this.dangerLineY
            );

        if (isDangerous) {
            zoneGradient.addColorStop(
                0,
                `rgba(239,68,68,${
                    0.05 +
                    dangerProgress * 0.13
                })`
            );

            zoneGradient.addColorStop(
                1,
                `rgba(239,68,68,${
                    0.02 +
                    dangerProgress * 0.06
                })`
            );
        } else {
            zoneGradient.addColorStop(
                0,
                "rgba(239,68,68,0.025)"
            );

            zoneGradient.addColorStop(
                1,
                "rgba(239,68,68,0.008)"
            );
        }

        this.ctx.fillStyle =
            zoneGradient;

        this.ctx.fillRect(
            bounds.leftX + 3,
            bounds.topY + 2,
            bounds.width - 6,
            Math.max(
                0,
                this.dangerLineY -
                bounds.topY - 2
            )
        );

        // Красная линия

        const pulse =
            0.5 +
            Math.sin(
                performance.now() *
                0.012
            ) * 0.5;

        this.ctx.strokeStyle =
            isDangerous
                ? `rgba(
                    255,
                    70,
                    85,
                    ${0.65 + pulse * 0.35}
                )`
                : "rgba(239,68,68,0.30)";

        this.ctx.lineWidth =
            isDangerous
                ? 2.8
                : 1.3;

        this.ctx.setLineDash(
            isDangerous
                ? [10, 5]
                : [7, 7]
        );

        if (isDangerous) {
            this.ctx.shadowColor =
                "#ef4444";

            this.ctx.shadowBlur =
                10 +
                dangerProgress * 12;
        }

        this.ctx.beginPath();

        this.ctx.moveTo(
            bounds.leftX + 3,
            this.dangerLineY
        );

        this.ctx.lineTo(
            bounds.rightX - 3,
            this.dangerLineY
        );

        this.ctx.stroke();

        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([]);

        // Текст появляется только
        // когда действительно опасно.

        if (isDangerous) {
            const remaining =
                Math.max(
                    0,
                    this.dangerLimit -
                    this.dangerTimer
                );

            this.ctx.font =
                "900 10px 'Segoe UI', sans-serif";

            this.ctx.textAlign =
                "center";

            this.ctx.fillStyle =
                "#ff5b68";

            this.ctx.shadowColor =
                "rgba(239,68,68,0.8)";

            this.ctx.shadowBlur = 6;

            this.ctx.fillText(
                `⚠ ПЕРЕГРУЗКА ${remaining.toFixed(1)}с`,
                this.canvas.width / 2,
                this.dangerLineY - 8
            );
        }

        this.ctx.restore();

        // 3. Линия прицеливания и текущая мысль
        if (this.dropCooldown <= 0) {
            const aimAlpha = this.isAiming ? 0.38 : 0.10;
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(0, 240, 255, ${aimAlpha})`;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.aimX, this.dropY);
            this.ctx.lineTo(this.aimX, bounds.bottomY - 6);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.restore();

            // Превью мысли на прицеле с Aspect-Ratio Cover
            const previewRadius =
                this.physics.getTierRadius(
                    this.nextTier
                );

            // -----------------------------------------
            // GHOST LANDING PREVIEW
            // -----------------------------------------

            const ghostY =
                bounds.bottomY -
                previewRadius -
                7;

            this.ctx.save();

            this.ctx.globalAlpha = this.isAiming ? 0.35 : 0.06;

            this.ctx.strokeStyle =
                CONFIG.TIERS[
                    this.nextTier
                ]?.glow ||
                "#00e5ff";

            this.ctx.lineWidth = 1.5;

            this.ctx.setLineDash([
                4,
                4
            ]);

            this.ctx.beginPath();

            this.ctx.arc(
                this.aimX,
                ghostY,
                previewRadius * 0.86,
                0,
                Math.PI * 2
            );

            this.ctx.stroke();

            this.ctx.setLineDash([]);

            // Тень на полу

            this.ctx.fillStyle =
                this.isAiming ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.12)";

            this.ctx.beginPath();

            this.ctx.ellipse(
                this.aimX,
                bounds.bottomY - 3,
                previewRadius * 0.7,
                4,
                0,
                0,
                Math.PI * 2
            );

            this.ctx.fill();

            this.ctx.restore();

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
            if (
                typeof b.visualScale ===
                    "number" &&
                b.visualScale < 0.999
            ) {
                b.visualScale +=
                    (
                        1 -
                        b.visualScale
                    ) * 0.22;

                if (
                    b.visualScale > 0.995
                ) {
                    b.visualScale = 1;
                }
            }

            const visualRadius =
                r *
                (
                    b.visualScale ??
                    1
                );

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
                this.drawThoughtBall(
                    this.ctx,
                    0,
                    0,
                    visualRadius,
                    b.tier,
                    false
                );
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
        this.progressResetAt =
            window.YandexBridge?.now?.() ??
            Date.now();

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

        this.hasRevivedThisRun = false;
        this.pendingOfflineAmount = 0;
        this.eventPassiveBonusTimer = 0;
        this.eventPassiveBonusAmount = 0;
        this.tapBonusTimer = 0;
        this.cryptoBonusTimer = 0;
        this.tapBonusUntil = 0;
        this.cryptoBonusUntil = 0;
        this.tapBonusRemaining = 0;
        this.cryptoBonusRemaining = 0;

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
        this.syncConsumableSelectionVisual();
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
        this.ui.updateBoss(boss, boss.hp, 1, this.maxDays, boss.hp);
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

        this.saveGame({ cloudFlush: true });

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
        this.hasRevivedThisRun = false;
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
        this.syncConsumableSelectionVisual();

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
            this.maxDays,
            this.getBossMaxHp(1)
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
    saveGame(
        {
            cloudFlush = false
        } = {}
    ) {
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

            bossBreakTimer:
                this.bossBreakTimer,

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

            dangerTimer:
                this.dangerTimer,

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

            progressResetAt:
                this.progressResetAt || 0,

            hasRevivedThisRun:
                !!this.hasRevivedThisRun,

            bossAttackTimer:
                this.bossAttackTimer,

            shakeCooldown:
                this.shakeCooldown,

            roomInteractionReadyAt: {
                ...this.roomInteractionReadyAt
            },

            pendingOfflineAmount:
                this.pendingOfflineAmount,

            eventPassiveBonusTimer:
                this.eventPassiveBonusTimer,

            eventPassiveBonusAmount:
                this.eventPassiveBonusAmount,

            tapBonusTimer:
                this.tapBonusTimer,

            cryptoBonusTimer:
                this.cryptoBonusTimer,

            combo:
                this.combo,

            comboTimer:
                this.comboTimer,

            isFeverActive:
                this.isFeverActive,

            feverTimer:
                this.feverTimer,

            lastSavedTime:
                window.YandexBridge
                    ?.now?.() ??
                Date.now()
        };

        try {
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.SAVE,
                JSON.stringify(data)
            );
            // Блок 6: Облачные сохранения Яндекс Игр
            window.YandexBridge
                ?.queueCloudSave?.(
                    data,
                    {
                        flush: cloudFlush
                    }
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

    loadGame(initialSaveData = null) {
        try {
            const raw =
                initialSaveData
                    ? JSON.stringify(
                        initialSaveData
                    )
                    : (
                        localStorage.getItem(
                            CONFIG.STORAGE_KEYS.SAVE
                        ) ||
                        localStorage.getItem(
                            CONFIG.STORAGE_KEYS
                                .LEGACY_SAVE_V2
                        ) ||
                        localStorage.getItem(
                            CONFIG.STORAGE_KEYS
                                .LEGACY_SAVE_V1
                        )
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

            this.dangerTimer =
                data.dangerTimer ?? 0;

            this.bossBreakTimer =
                data.bossBreakTimer ??
                (
                    this.bossHp <= 0
                        ? 0.5
                        : 0
                );

            this.rentTimer =
                data.rentTimer ??
                this.rentTimeMax;

            // Stamina окончательно ограничим
            // после recalculatePassives()
            const savedStamina =
                data.stamina;

            this.isExhausted =
                !!data.isExhausted;

            this.progressResetAt =
                data.progressResetAt ?? 0;

            this.hasRevivedThisRun =
                !!data.hasRevivedThisRun;

            this.bossAttackTimer =
                Math.max(
                    0,
                    Number(
                        data.bossAttackTimer ??
                        14
                    )
                );

            this.shakeCooldown =
                Math.max(
                    0,
                    Number(
                        data.shakeCooldown ??
                        0
                    )
                );

            const savedRoomCooldowns =
                data.roomInteractionReadyAt;

            this.roomInteractionReadyAt =
                savedRoomCooldowns &&
                typeof savedRoomCooldowns === 'object'
                    ? Object.fromEntries(
                        Object.entries(
                            savedRoomCooldowns
                        ).filter(
                            ([, readyAt]) =>
                                Number(readyAt) >
                                Date.now()
                        )
                    )
                    : Object.create(null);

            this.pendingOfflineAmount =
                Math.max(
                    0,
                    Number(
                        data.pendingOfflineAmount ??
                        0
                    )
                );

            this.eventPassiveBonusTimer =
                Math.max(
                    0,
                    Number(
                        data.eventPassiveBonusTimer ??
                        0
                    )
                );

            this.eventPassiveBonusAmount =
                Math.max(
                    0,
                    Number(
                        data.eventPassiveBonusAmount ??
                        0
                    )
                );

            this.tapBonusTimer =
                Math.max(
                    0,
                    Number(
                        data.tapBonusTimer ??
                        0
                    )
                );

            this.cryptoBonusTimer =
                Math.max(
                    0,
                    Number(
                        data.cryptoBonusTimer ??
                        0
                    )
                );

            const wallNow =
                Date.now();

            this.tapBonusUntil =
                this.tapBonusTimer > 0
                    ? wallNow +
                        this.tapBonusTimer * 1000
                    : 0;

            this.cryptoBonusUntil =
                this.cryptoBonusTimer > 0
                    ? wallNow +
                        this.cryptoBonusTimer * 1000
                    : 0;

            this.tapBonusRemaining = 0;
            this.cryptoBonusRemaining = 0;

            this.combo =
                Math.max(
                    0,
                    Number(
                        data.combo ??
                        0
                    )
                );

            this.comboTimer =
                Math.max(
                    0,
                    Number(
                        data.comboTimer ??
                        0
                    )
                );

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
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            data.feverCharge ??
                            0
                        )
                    )
                );

            this.isFeverActive =
                !!data.isFeverActive;

            this.feverTimer =
                Math.max(
                    0,
                    Number(
                        data.feverTimer ??
                        0
                    )
                );

            if (
                this.feverTimer <= 0
            ) {
                this.isFeverActive = false;
            }

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

            let offlineDisplaySeconds = 0;

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
                        Math.floor(cappedSeconds *
                        this.passiveIncome *
                        offlineRate);

                    this.pendingOfflineAmount += offlineEarned;
                    offlineDisplaySeconds =
                        cappedSeconds;
                }
            }

            if (
                this.pendingOfflineAmount >
                0
            ) {
                this.ui.showOfflineIncome(
                    offlineDisplaySeconds,
                    this.pendingOfflineAmount
                );
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
                this.maxDays,
                this.getBossMaxHp(this.day)
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
                this.isFeverActive,
                this.feverTimer,
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

function readLocalSaveForBoot() {
    const keys = [
        CONFIG.STORAGE_KEYS.SAVE,
        CONFIG.STORAGE_KEYS
            .LEGACY_SAVE_V2,
        CONFIG.STORAGE_KEYS
            .LEGACY_SAVE_V1
    ];

    for (const key of keys) {
        try {
            const raw =
                localStorage.getItem(
                    key
                );

            if (!raw) continue;

            const data =
                JSON.parse(raw);

            if (
                data &&
                typeof data === 'object'
            ) {
                return data;
            }

        } catch (e) {
            console.warn(
                'Local save parse error:',
                e
            );
        }
    }

    return null;
}

function compareSaveProgress(
    a,
    b
) {
    if (!a && !b) return 0;
    if (a && !b) return 1;
    if (!a && b) return -1;

    // Если один прогресс был сознательно
    // сброшен позднее — уважать reset.
    const resetA =
        Number(
            a.progressResetAt || 0
        );

    const resetB =
        Number(
            b.progressResetAt || 0
        );

    if (resetA !== resetB) {
        return resetA - resetB;
    }

    const vectorA = [
        Number(
            a.prestigeLevel || 0
        ),
        Number(
            a.bossesDefeated || 0
        ),
        Number(
            a.highestTierUnlocked || 1
        ),
        Number(
            a.totalMotivationEarned || 0
        ),
        Number(
            a.day || 1
        )
    ];

    const vectorB = [
        Number(
            b.prestigeLevel || 0
        ),
        Number(
            b.bossesDefeated || 0
        ),
        Number(
            b.highestTierUnlocked || 1
        ),
        Number(
            b.totalMotivationEarned || 0
        ),
        Number(
            b.day || 1
        )
    ];

    for (
        let i = 0;
        i < vectorA.length;
        i++
    ) {
        if (
            vectorA[i] !==
            vectorB[i]
        ) {
            return (
                vectorA[i] -
                vectorB[i]
            );
        }
    }

    return (
        Number(
            a.lastSavedTime || 0
        ) -
        Number(
            b.lastSavedTime || 0
        )
    );
}

async function initGame() {
    if (window.gameInstance) {
        return;
    }

    const startButton =
        document.getElementById(
            'btn-start-game'
        );

    const guideButton =
        document.getElementById(
            'btn-open-guide'
        );

    if (startButton) {
        startButton.disabled = true;
        startButton.textContent =
            'СИНХРОНИЗАЦИЯ...';
    }

    if (guideButton) {
        guideButton.disabled = true;
    }

    // -----------------------------------------
    // WAIT YANDEX SDK
    // -----------------------------------------

    await window.YandexBridge
        ?.whenReady?.();

    const cloudPayload =
        await window.YandexBridge
            ?.loadCloudData?.();

    const cloudSave =
        cloudPayload?.data ||
        null;

    const localSave =
        readLocalSaveForBoot();

    let initialSave =
        localSave;

    if (
        compareSaveProgress(
            cloudSave,
            localSave
        ) > 0
    ) {
        initialSave =
            cloudSave;
    }

    // -----------------------------------------
    // CREATE GAME
    // -----------------------------------------

    window.gameInstance =
        new SkufLifeGame(
            initialSave
        );

    if (
        window.YandexBridge
            ?.platformPaused
    ) {
        window.gameInstance.pause(
            'yandex-platform',
            {
                skipSdk: true
            }
        );
    }

    if (startButton) {
        startButton.disabled = false;
        startButton.textContent =
            'ВЫЙТИ ИЗ СПЯЧКИ';
    }

    if (guideButton) {
        guideButton.disabled = false;
    }

    // Menu + save + Canvas are now ready.
    window.YandexBridge
        ?.markGameReady?.();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
