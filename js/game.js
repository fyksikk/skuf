class SkufLifeGame {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-wrapper');

        this.ui = new UIManager(this);
        this.roomRenderer = new RoomRenderer();

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
        this.bossHp = 600;
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
        this.playTimeSeconds = 0;
        this.unlockedAchievements = [];

        // Расходники
        this.items = { beer: 1, script: 1, energy: 1, bomb: 1, magnet: 1 };
        this.activeRelics = [];
        this.activeConsumableMode = null; // 'beer' | 'bomb'
        this.flashActiveUntil = 0;
        this.flashDuration = 12000;
        this.magnetActiveUntil = 0;

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

        // Квесты
        this.dailyQuests = JSON.parse(JSON.stringify(CONFIG.DAILY_QUESTS));

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

        // Загрузка спрайтов
        this.charImages = {};
        for (let i = 1; i <= 10; i++) {
            const img = new Image();
            img.src = `char_${i}.png`;
            this.charImages[i] = img;
        }

        // Физика
        this.physics = new BrainPhysics(
            this.canvas,
            this.handleMerge.bind(this),
            this.handleGarbageDestroyed.bind(this)
        );

        this.isRunning = false;
        this.setupInputHandlers();
        this.loadGame();
        this.applyFxState();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        if (window.ResizeObserver && this.container) {
            new ResizeObserver(() => this.resizeCanvas()).observe(this.container);
        }

        // Запуск игрового цикла сразу при инициализации
        this.start();

        // Если при старте стакан пустой, добавляем две начальные мысли
        setTimeout(() => {
            if (this.physics && this.physics.world) {
                const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => !b.isStatic);
                if (bodies.length === 0) {
                    const bounds = this.physics.getCupBounds();
                    this.physics.createThought(bounds.leftX + bounds.width * 0.38, this.dropY + 45, 1);
                    this.physics.createThought(bounds.leftX + bounds.width * 0.62, this.dropY + 45, 1);
                }
            }
        }, 350);

        // Авто-сохранение каждые 4 секунды
        setInterval(() => this.saveGame(), 4000);
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        const w = Math.round(rect.width || this.container.clientWidth || window.innerWidth || 360);
        const h = Math.round(rect.height || this.container.clientHeight || (window.innerHeight - 160) || 540);

        if (w > 0 && h > 0) {
            this.canvas.width = w;
            this.canvas.height = h;

            // Определение ориентации (горизонтальная/пейзаж при перевороте телефона или на широком экране)
            const isLandscape = (w > h) || (w / h > 1.12) || (h <= 500);

            if (isLandscape) {
                // На широком экране/ПК комната Скуфа увеличена вниз, чтобы персонаж и комната были отлично видны
                const targetRoomH = Math.floor(h * 0.35);
                this.roomHeight = Math.max(190, Math.min(265, targetRoomH));
                this.brainTopY = this.roomHeight + 24;
                this.dropY = this.brainTopY + 22;
                this.dangerLineY = this.brainTopY + 48;
            } else {
                // Портретный режим
                const maxRoomAllowed = Math.floor(h * 0.28);
                this.roomHeight = Math.max(120, Math.min(170, maxRoomAllowed));
                this.brainTopY = this.roomHeight + 20;
                this.dropY = this.brainTopY + 20;
                this.dangerLineY = this.brainTopY + 44;
            }

            this.physics.setDimensions(this.roomHeight);
            const bounds = this.physics.getCupBounds();

            if (!this.aimX || this.aimX <= 0 || this.aimX > w) {
                this.aimX = w / 2;
            } else {
                this.aimX = Math.max(bounds.leftX + 16, Math.min(bounds.rightX - 16, this.aimX));
            }
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isGameOver = false;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    restart() {
        this.day = 1;
        this.currentBossIndex = 1;
        const boss = CONFIG.BOSSES[1];
        this.bossHp = boss.hp;
        this.rentTimer = this.rentTimeMax;
        this.motivation = Math.max(50, this.motivation * 0.5);
        this.stamina = this.maxStamina;
        this.isExhausted = false;
        this.isGameOver = false;

        // Очистка стакана
        const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => !b.isStatic);
        bodies.forEach(b => Matter.World.remove(this.physics.world, b));

        this.rollNextTier();
        this.updateHUD();
        this.isRunning = false;
        this.start();
    }

    // --- ОБРАБОТКА ВВОДА ---
    setupInputHandlers() {
        // Тапы / Клики
        const handlePointer = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            if (y < this.roomHeight) {
                // Интерактивный клик по предметам комнаты (Кот, ТВ, ПК, Пивоварня, Майнинг, Скуф)
                this.handleRoomInteraction(x, y, clientX, clientY);
            } else {
                // Проверка на двойной быстрый тап (подброс мыслей в стакане)
                const now = performance.now();
                if (now - this.lastTapTime < 280 && Math.hypot(x - this.lastTapPos.x, y - this.lastTapPos.y) < 45) {
                    this.physics.microBounce(this.canvas.width / 2);
                    AudioCtrl.playShake();
                    this.ui.triggerScreenShake();
                    this.spawnFloatingText(x, y - 20, "💫 ПОДБРОС!", "#00f0ff");
                    this.lastTapTime = 0;
                    return;
                }
                this.lastTapTime = now;
                this.lastTapPos = { x, y };

                // Прицеливание и сброс в стакан
                const bounds = this.physics.getCupBounds();
                this.aimX = Math.max(bounds.leftX + 16, Math.min(bounds.rightX - 16, x));
                
                if (this.activeConsumableMode) {
                    this.handleConsumableClick(x, y);
                } else {
                    this.dropThought();
                }
            }
        };

        this.canvas.addEventListener('pointerdown', (e) => {
            handlePointer(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (y >= this.roomHeight) {
                const bounds = this.physics.getCupBounds();
                this.aimX = Math.max(bounds.leftX + 16, Math.min(bounds.rightX - 16, x));
            }
        });

        // Кнопка Встряски
        document.getElementById('btn-brain-shake')?.addEventListener('click', () => {
            if (this.shakeCooldown <= 0) {
                this.physics.shakeBrain();
                AudioCtrl.playShake();
                this.ui.triggerScreenShake();
                this.shakeCooldown = this.shakeCooldownMax;
                this.ui.updateShake(this.shakeCooldown);
                this.ui.setQuote("«Мозги встали на место!»");
            }
        });

        // Кнопки Наклона (Тилт стакана влево/вправо)
        document.getElementById('btn-tilt-left')?.addEventListener('click', () => {
            this.physics.setGravityTilt(-0.5);
            this.tiltTimer = 1.2;
            AudioCtrl.playTilt();
            this.spawnFloatingText(this.canvas.width * 0.35, this.roomHeight + 35, "⤹ НАКЛОН ВЛЕВО", "#00f0ff");
        });

        document.getElementById('btn-tilt-right')?.addEventListener('click', () => {
            this.physics.setGravityTilt(0.5);
            this.tiltTimer = 1.2;
            AudioCtrl.playTilt();
            this.spawnFloatingText(this.canvas.width * 0.65, this.roomHeight + 35, "НАКЛОН ВПРАВО ⤸", "#00f0ff");
        });

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
                    if (chan) {
                        this.ui.setQuote(chan.quote);
                        this.spawnFloatingText(target.x, target.y - 15, `${chan.title} 📺`, "#00f0ff");
                        this.addMotivation(150);
                        this.feverCharge = Math.min(100, this.feverCharge + 8);
                    }
                    return;
                }
                if (target.id === 'pc') {
                    AudioCtrl.playJackpot();
                    this.addMotivation(600);
                    this.ui.setQuote("«Майнинг на ПК приносит прибыль: +600 Мотивации!»");
                    this.spawnFloatingText(target.x, target.y - 15, "+600 💰", "#ffd700");
                    this.spawnParticles(target.x, target.y, "#ffd700", 10);
                    return;
                }
                if (target.id === 'brewery') {
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
                    AudioCtrl.playJackpot();
                    this.addMotivation(1200);
                    this.ui.setQuote("«Ферма разогнана! +1,200 Мотивации!»");
                    this.spawnFloatingText(target.x, target.y - 15, "+1,200 💎", "#8b5cf6");
                    this.spawnParticles(target.x, target.y, "#8b5cf6", 15);
                    return;
                }
                if (target.id === 'vacuum') {
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
        this.gyroEnabled = !this.gyroEnabled;
        const btn = document.getElementById('btn-toggle-gyro');
        if (btn) {
            btn.classList.toggle('active', this.gyroEnabled);
        }
        if (this.gyroEnabled) {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(state => {
                    if (state === 'granted') {
                        window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
                    }
                }).catch(() => {});
            } else {
                window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
            }
            this.ui.setQuote("🧭 Гироскоп включен! Наклоняйте телефон влево/вправо!");
            this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, "🧭 ГИРОСКОП АКТИВЕН", "#00f0ff");
        } else {
            window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
            this.physics.setGravityTilt(0);
            this.ui.setQuote("🧭 Гироскоп выключен.");
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

    handleSkufTap(screenX, screenY) {
        if (this.stamina < 8 || this.isExhausted) {
            AudioCtrl.playExhausted();
            this.ui.setQuote("«Хух... Дыхалка на нуле, дай полежать...»");
            return;
        }

        this.stamina = Math.max(0, this.stamina - 12);
        if (this.stamina <= 0) {
            this.isExhausted = true;
            AudioCtrl.playExhausted();
        }

        // Расчет урона тапа
        let baseDamage = 1;
        const heroUpgs = CONFIG.UPGRADES.hero;
        if (heroUpgs[0]?.bought) baseDamage *= 3;
        if (heroUpgs[1]?.bought) baseDamage *= 5;
        if (heroUpgs[3]?.bought) baseDamage *= 15;
        if (heroUpgs[4]?.bought) baseDamage *= 40;
        if (heroUpgs[5]?.bought) baseDamage *= 120;
        if (heroUpgs[6]?.bought) baseDamage *= 450;
        if (heroUpgs[7]?.bought) baseDamage *= 1800;
        if (heroUpgs[8]?.bought) baseDamage *= 8000;

        // Шанс крита и множитель
        let isCrit = false;
        const critChance = heroUpgs[8]?.bought ? 0.40 : (heroUpgs[6]?.bought ? 0.30 : (heroUpgs[1]?.bought ? 0.15 : 0));
        const critMult = heroUpgs[8]?.bought ? 50 : (heroUpgs[3]?.bought ? 15 : 8);
        if (critChance > 0 && Math.random() < critChance) {
            baseDamage *= critMult;
            isCrit = true;
        }

        const bossHunterBonus = 1.0 + (CONFIG.PRESTIGE_PERKS[6]?.level || 0) * 0.5;
        baseDamage *= this.bossDamageMultiplier * bossHunterBonus;
        const finalDamage = Math.max(1, Math.floor(baseDamage));

        this.dealBossDamage(finalDamage);
        this.addMotivation(Math.max(1, Math.floor(finalDamage * 0.4)));

        this.roomRenderer.triggerSkufBounce();
        AudioCtrl.playSkufGrunt(isCrit);

        this.trackQuestProgress('taps', 1);

        // Всплывающий текст урона
        this.spawnFloatingText(
            this.canvas.width / 2 + (Math.random() - 0.5) * 60,
            this.roomHeight - 35,
            isCrit ? `КРИТ -${CONFIG.formatNumber(finalDamage)}! 💥` : `-${CONFIG.formatNumber(finalDamage)}`,
            isCrit ? '#ff2a85' : '#ffd700'
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
        const chance = (0.05 + this.day * 0.008) * (hasZen ? 0.5 : 1.0);
        
        if (Math.random() < chance) {
            const garbageList = CONFIG.GARBAGE_TYPES;
            const garbage = garbageList[Math.floor(Math.random() * garbageList.length)];
            const spawnX = 30 + Math.random() * (this.canvas.width - 60);
            this.physics.createGarbage(spawnX, this.dropY, garbage);
            this.ui.setQuote(`«В голову лезет: ${garbage.name}»`);
        }
    }

    rollNextTier() {
        const maxStartTier = CONFIG.PRESTIGE_PERKS[1]?.level > 0 ? 3 : 2;
        this.nextTier = Math.floor(Math.random() * maxStartTier) + 1;
        this.ui.updateNextThought(this.nextTier);
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
        this.comboTimer = 2.8 + (CONFIG.UPGRADES.brain[5]?.bought ? 3.0 : 0);
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.ui.showCombo(this.combo);

        // Начисление заряда Хайпа (Fever)
        this.addFeverCharge(8 + this.combo * 1.5);

        // Награда Мотивации
        const tierConfig = CONFIG.TIERS[tier] || CONFIG.TIERS[1];
        const feverMult = this.isFeverActive ? (CONFIG.UPGRADES.brain[8]?.bought ? 5 : 3) : 1;
        let reward = tierConfig.score * Math.max(1, this.combo * 0.4) * this.comboMultiplier * this.globalIncomeMultiplier * feverMult;
        
        if (this.hasGoldenCat && tier === 1) reward += 1500;
        this.addMotivation(reward);

        // Урон по боссу от слияния
        let bossDmg = tierConfig.score * 2.5 * Math.max(1, this.combo * 0.35);
        if (CONFIG.UPGRADES.brain[6]?.bought) bossDmg *= 3; // Третий глаз Сигмы: x3 урон
        bossDmg *= feverMult;
        
        const bossHunterBonus = 1.0 + (CONFIG.PRESTIGE_PERKS[6]?.level || 0) * 0.5;
        bossDmg *= this.bossDamageMultiplier * bossHunterBonus;
        this.dealBossDamage(Math.floor(bossDmg));
        this.spawnFloatingText(midX, midY + 16, `-${CONFIG.formatNumber(bossDmg)} HP ⚔️`, '#f43f5e');

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
        this.bossHp = Math.max(0, this.bossHp - amount);
        const boss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[1];
        this.ui.updateBoss(boss, this.bossHp, this.day, this.maxDays);

        if (this.bossHp <= 0) {
            this.onBossDefeated();
        }
    }

    onBossDefeated() {
        this.bossesDefeated++;
        this.trackQuestProgress('boss', 1);
        AudioCtrl.playEndorphinFanfare();
        this.ui.triggerScreenShake();

        // Награда за босса
        const jackpot = this.day * 1500;
        this.addMotivation(jackpot);
        this.items.beer += 1;
        this.items.script += 1;
        this.items.energy += 1;
        this.items.bomb = (this.items.bomb || 0) + 1;
        this.items.magnet = (this.items.magnet || 0) + 1;
        
        // Сбалансированный шанс колеса фортуны (35% шанс или каждый 3-й босс)
        if (Math.random() < 0.35 || this.bossesDefeated % 3 === 0) {
            this.freeSpinsAvailable++;
            this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 35, "🎡 +1 СПИН РУЛЕТКИ!", "#f59e0b");
        }
        this.ui.updateConsumables(this.items);
        this.ui.updateRouletteTimer(this.rouletteTimer, this.freeSpinsAvailable);

        // Выбор реликвии (драфт 3 случайных)
        const pool = CONFIG.RELICS_POOL.filter(r => !this.activeRelics.some(ar => ar.id === r.id));
        if (pool.length > 0) {
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            const choices = shuffled.slice(0, 3);
            this.ui.showPerkDraft(choices, (pickedRelic) => {
                this.activeRelics.push(pickedRelic);
                pickedRelic.apply(this);
                this.ui.updateRelics(this.activeRelics);
                this.advanceDay();
            });
        } else {
            this.advanceDay();
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

        // Случайное событие / дилемма каждые 3 дня
        if (this.day % 3 === 0) {
            const events = CONFIG.EVENTS_POOL;
            const ev = events[Math.floor(Math.random() * events.length)];
            setTimeout(() => this.ui.showEventModal(ev), 1000);
        }
    }

    addMotivation(amount) {
        const geneBonus = 1.0 + (CONFIG.PRESTIGE_PERKS[0]?.level * 0.3);
        const finalAmount = amount * geneBonus;
        this.motivation += finalAmount;
        this.totalMotivationEarned += finalAmount;
        this.updateHUD();
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
        let income = 0;
        const roomUpgs = CONFIG.UPGRADES.room;
        const careerUpgs = CONFIG.UPGRADES.career;

        // Пассивный доход комнаты
        if (roomUpgs[0]?.bought) income += 12;
        if (roomUpgs[1]?.bought) income += 65;
        if (roomUpgs[2]?.bought) income += 320;
        if (roomUpgs[3]?.bought) income += 1600;
        if (roomUpgs[4]?.bought) income += 8500;
        if (roomUpgs[5]?.bought) income += 45000;
        if (roomUpgs[6]?.bought) income += 250000;
        if (roomUpgs[7]?.bought) income += 1500000;
        if (roomUpgs[8]?.bought) income += 12000000;

        // Пассивный доход карьеры
        if (careerUpgs[0]?.bought) income += 25;
        if (careerUpgs[1]?.bought) income += 180;
        if (careerUpgs[2]?.bought) income += 950;
        if (careerUpgs[3]?.bought) income += 5000;
        if (careerUpgs[4]?.bought) income += 30000;
        if (careerUpgs[5]?.bought) income += 180000;
        if (careerUpgs[6]?.bought) income += 1100000;
        if (careerUpgs[7]?.bought) income += 7500000;
        if (careerUpgs[8]?.bought) income += 55000000;

        // Апгрейды мозга
        let skullExpand = 0;
        if (CONFIG.UPGRADES.brain[0]?.bought) skullExpand += 18;
        if (CONFIG.UPGRADES.brain[4]?.bought) skullExpand += 26;
        if (CONFIG.PRESTIGE_PERKS[5]?.level > 0) skullExpand += 25 * CONFIG.PRESTIGE_PERKS[5].level;
        this.physics.expandSkull(skullExpand);

        this.dropCooldownMs = CONFIG.UPGRADES.brain[1]?.bought ? 240 : 380;
        this.shakeCooldownMax = CONFIG.UPGRADES.brain[2]?.bought ? 5 : 12;

        this.passiveIncome = income;
    }

    // --- ПРЕСТИЖ / САНСАРА ---
    calculatePrestigeGain() {
        const base = Math.floor(Math.sqrt(this.totalMotivationEarned / 40000));
        const bossBonus = this.bossesDefeated * 3;
        return Math.max(1, base + bossBonus);
    }

    triggerPrestige() {
        const gain = this.calculatePrestigeGain();
        this.prestigeCouches += gain;
        this.prestigeLevel++;

        // Сброс обычных апгрейдов и забега
        Object.values(CONFIG.UPGRADES).forEach(cat => cat.forEach(u => u.bought = false));
        this.activeRelics = [];
        this.motivation = 0;
        this.day = 1;
        this.currentBossIndex = 1;
        this.bossHp = CONFIG.BOSSES[1].hp;
        this.rentTimer = this.rentTimeMax;

        // Применение престижных бонусов
        if (CONFIG.PRESTIGE_PERKS[2]?.level > 0) {
            this.maxStamina = 100 * (1 + CONFIG.PRESTIGE_PERKS[2].level);
            this.stamina = this.maxStamina;
        }
        if (CONFIG.PRESTIGE_PERKS[4]?.level > 0) {
            this.autoDropEnabled = true;
            this.ui.updateAutoDropBadge(true);
        }

        // Очистка поля
        const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => !b.isStatic);
        bodies.forEach(b => Matter.World.remove(this.physics.world, b));

        this.recalculatePassives();
        this.saveGame();
        this.ui.prestigeOverlay.classList.remove('active');
        this.ui.setQuote("«САНСАРА СОВЕРШЕНА! Скуф родился заново с новыми силами!»");
        this.updateHUD();
    }

    buyPrestigePerk(id) {
        const perk = CONFIG.PRESTIGE_PERKS.find(p => p.id === id);
        if (!perk || perk.level >= perk.max) return false;

        if (this.prestigeCouches >= perk.cost) {
            this.prestigeCouches -= perk.cost;
            perk.level++;
            
            if (id === 'p5') {
                this.autoDropEnabled = true;
                this.ui.updateAutoDropBadge(true);
            }
            if (id === 'p6') {
                this.physics.expandSkull(30 * perk.level);
            }

            this.saveGame();
            return true;
        }
        return false;
    }

    // --- КВЕСТЫ ---
    trackQuestProgress(type, count = 1) {
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
        this.feverTimer = CONFIG.UPGRADES.brain[8]?.bought ? 22 : 12;
        this.feverCharge = 100;
        AudioCtrl.playFever();
        this.ui.triggerScreenShake();
        this.spawnFloatingText(this.canvas.width / 2, this.roomHeight + 40, "🔥 ЛИХОРАДКА! ХАЙП x3!", "#ec4899");
        this.spawnParticles(this.canvas.width / 2, this.roomHeight + 40, "#ec4899", 35);
        this.ui.setQuote("«ХАЙП ПОШЁЛ! СКУФ НА ПИКЕ ФОРМЫ!»");
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

    // --- ЦИКЛ ИГРЫ ---
    gameLoop(now) {
        if (this.isGameOver) return;

        try {
            const dt = Math.min(0.1, (now - this.lastTime) / 1000);
            this.lastTime = now;
            this.playTimeSeconds += dt;

            // Обновление физики
            this.physics.update();
            if (this.hasMagnetRelic) {
                this.physics.applyMagneticAttraction();
            }

            // Действие Сигма-Магнита
            if (this.magnetActiveUntil > now) {
                this.physics.applySuperMagneticAttraction();
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
                this.dropCooldownMs = 120; // Турбо-скорость спама мыслей!
                if (this.feverTimer <= 0) {
                    this.isFeverActive = false;
                    this.feverCharge = 0;
                    this.dropCooldownMs = 380;
                    this.ui.setQuote("«Хайп утих... Но синапсы горят!»");
                }
            } else {
                // Медленное остывание хайпа если нет слияний
                this.feverCharge = Math.max(0, this.feverCharge - dt * 2.5);
            }
            this.ui.updateFever(this.feverCharge, this.isFeverActive, this.feverTimer);

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
            this.ui.updateRouletteTimer(this.rouletteTimer, this.freeSpinsAvailable);

            // Обновление Ранга
            this.updateRankSystem();

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
            this.ui.updateStamina(this.stamina, this.maxStamina, this.isExhausted);

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
            this.ui.updateRent(this.day, Math.max(0, this.rentTimer), phase.bgTitle);

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
            requestAnimationFrame(this.gameLoop.bind(this));
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
        this.isGameOver = true;
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
            const conf = CONFIG.TIERS[this.nextTier] || CONFIG.TIERS[1];
            this.drawThoughtBall(this.ctx, this.aimX, this.dropY, conf.radius, this.nextTier, true);
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

                this.ctx.fillStyle = b.garbageColor || '#334155';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, r, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = '#ef4444';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();

                this.ctx.font = "bold 9px 'Segoe UI', sans-serif";
                this.ctx.fillStyle = '#ffffff';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(b.garbageName || 'Мусор', 0, 0);
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

    updateHUD() {
        this.ui.updateMotivation(this.motivation, this.passiveIncome);
        this.ui.updateConsumables(this.items);
        this.ui.updateSideDashboard(this);
    }

    getClickDamage() {
        let baseDamage = 15;
        const heroUpgs = CONFIG.UPGRADES?.hero || [];
        if (heroUpgs[0]?.bought) baseDamage *= 2;
        if (heroUpgs[1]?.bought) baseDamage *= 5;
        if (heroUpgs[3]?.bought) baseDamage *= 15;
        if (heroUpgs[4]?.bought) baseDamage *= 50;
        if (heroUpgs[5]?.bought) baseDamage *= 150;
        if (heroUpgs[6]?.bought) baseDamage *= 600;
        return Math.max(1, Math.floor(baseDamage * (this.bossDamageMultiplier || 1)));
    }

    // --- ПОЛНЫЙ СБРОС СТАТИСТИКИ И ПРОГРЕССА (СТАРТ С ЧИСТОГО НУЛЯ) ---
    resetGame(manual = true) {
        try {
            localStorage.removeItem('skuf_save_v2');
            localStorage.removeItem('skuf_save_v1');
            localStorage.removeItem('skuf_stats_v1');
        } catch (e) {
            console.warn("Error clearing storage", e);
        }

        // Обнуление всех числовых и игровых показателей
        this.motivation = 0;
        this.totalMotivationEarned = 0;
        this.passiveIncome = 0;
        this.day = 1;
        this.currentBossIndex = 1;
        this.bossHp = CONFIG.BOSSES[1].hp;
        this.rentTimer = 120;
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
        this.dailyQuests = this.initDailyQuests ? this.initDailyQuests() : [];

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
            const bounds = this.physics.getCupBounds();
            setTimeout(() => {
                this.physics.createThought(bounds.leftX + bounds.width * 0.38, this.dropY + 40, 1);
                this.physics.createThought(bounds.leftX + bounds.width * 0.62, this.dropY + 40, 1);
            }, 120);
        }

        this.recalculatePassives();

        // Обновление всех элементов интерфейса
        const boss = CONFIG.BOSSES[1];
        this.ui.updateMotivation(0, 0);
        this.ui.updateStamina(100, 100, false);
        this.ui.updateBoss(boss, boss.hp, 1, this.maxDays);
        this.ui.updateRent(1, 120, CONFIG.PHASES[1].bgTitle);
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

    // --- СОХРАНЕНИЕ И ЗАГРУЗКА ---
    saveGame() {
        const data = {
            version: 2,
            motivation: this.motivation,
            totalMotivationEarned: this.totalMotivationEarned,
            day: this.day,
            currentBossIndex: this.currentBossIndex,
            bossHp: this.bossHp,
            prestigeCouches: this.prestigeCouches,
            prestigeLevel: this.prestigeLevel,
            autoDropEnabled: this.autoDropEnabled,
            freeSpinsAvailable: this.freeSpinsAvailable,
            items: this.items,
            totalMerges: this.totalMerges,
            gigachadsCreated: this.gigachadsCreated,
            bossesDefeated: this.bossesDefeated,
            trashDestroyed: this.trashDestroyed,
            maxCombo: this.maxCombo,
            playTimeSeconds: this.playTimeSeconds,
            unlockedAchievements: this.unlockedAchievements,
            dailyQuests: this.dailyQuests,
            upgrades: {
                hero: CONFIG.UPGRADES.hero.map(u => ({ id: u.id, bought: u.bought })),
                room: CONFIG.UPGRADES.room.map(u => ({ id: u.id, bought: u.bought })),
                brain: CONFIG.UPGRADES.brain.map(u => ({ id: u.id, bought: u.bought })),
                career: CONFIG.UPGRADES.career.map(u => ({ id: u.id, bought: u.bought }))
            },
            prestigePerks: CONFIG.PRESTIGE_PERKS.map(p => ({ id: p.id, level: p.level })),
            lastSavedTime: Date.now()
        };

        try {
            localStorage.setItem('skuf_save_v2', JSON.stringify(data));
        } catch (e) {
            console.warn("Storage full or unavailable", e);
        }
    }

    loadGame() {
        try {
            // Проверка сброса статистики по запросу игрока (старт с нуля)
            const cleanStartFlag = 'skuf_reset_to_zero_v5';
            if (localStorage.getItem(cleanStartFlag) !== 'done') {
                localStorage.setItem(cleanStartFlag, 'done');
                this.resetGame(false);
                return;
            }

            const raw = localStorage.getItem('skuf_save_v2');
            if (!raw) {
                this.rollNextTier();
                return;
            }

            const data = JSON.parse(raw);
            this.motivation = data.motivation || 0;
            this.totalMotivationEarned = data.totalMotivationEarned || 0;
            this.day = data.day || 1;
            this.currentBossIndex = data.currentBossIndex || 1;
            this.bossHp = data.bossHp || CONFIG.BOSSES[1].hp;
            this.prestigeCouches = data.prestigeCouches || 0;
            this.prestigeLevel = data.prestigeLevel || 0;
            this.autoDropEnabled = !!data.autoDropEnabled;
            this.freeSpinsAvailable = data.freeSpinsAvailable !== undefined ? data.freeSpinsAvailable : 1;
            this.items = Object.assign({ beer: 1, script: 1, energy: 1, bomb: 1, magnet: 1 }, data.items || {});
            this.totalMerges = data.totalMerges || 0;
            this.gigachadsCreated = data.gigachadsCreated || 0;
            this.bossesDefeated = data.bossesDefeated || 0;
            this.trashDestroyed = data.trashDestroyed || 0;
            this.maxCombo = data.maxCombo || 0;
            this.playTimeSeconds = data.playTimeSeconds || 0;
            this.unlockedAchievements = data.unlockedAchievements || [];

            if (data.dailyQuests) this.dailyQuests = data.dailyQuests;

            // Восстановление апгрейдов
            if (data.upgrades) {
                Object.keys(data.upgrades).forEach(cat => {
                    if (CONFIG.UPGRADES[cat]) {
                        data.upgrades[cat].forEach(savedUpg => {
                            const found = CONFIG.UPGRADES[cat].find(u => u.id === savedUpg.id);
                            if (found) found.bought = savedUpg.bought;
                        });
                    }
                });
            }

            // Восстановление престиж-перков
            if (data.prestigePerks) {
                data.prestigePerks.forEach(sp => {
                    const found = CONFIG.PRESTIGE_PERKS.find(p => p.id === sp.id);
                    if (found) found.level = sp.level;
                });
            }

            this.recalculatePassives();

            // Расчет оффлайн дохода
            if (data.lastSavedTime) {
                const now = Date.now();
                const offlineSeconds = Math.floor((now - data.lastSavedTime) / 1000);
                const maxOfflineHours = 8 + (CONFIG.PRESTIGE_PERKS[3]?.level * 4); // до 24 часов
                const cappedSeconds = Math.min(maxOfflineHours * 3600, offlineSeconds);

                if (cappedSeconds > 60 && this.passiveIncome > 0) {
                    const offlineRate = 0.8 + (CONFIG.PRESTIGE_PERKS[3]?.level * 0.05);
                    const offlineEarned = cappedSeconds * this.passiveIncome * offlineRate;
                    this.addMotivation(offlineEarned);
                    this.ui.showOfflineIncome(cappedSeconds, offlineEarned);
                }
            }

            const boss = CONFIG.BOSSES[this.currentBossIndex] || CONFIG.BOSSES[1];
            this.ui.updateBoss(boss, this.bossHp, this.day, this.maxDays);
            this.ui.updateAutoDropBadge(this.autoDropEnabled);
            this.rollNextTier();
            this.updateHUD();

            const phaseIndex = Math.min(5, Math.ceil(this.day / 4));
            const phase = CONFIG.PHASES[phaseIndex] || CONFIG.PHASES[1];
            if (this.roomRenderer && phase) {
                this.roomRenderer.updateRoomStage(phase.roomStage);
            }
            if (this.ui && phase) {
                this.ui.updateRent(this.day, Math.max(0, this.rentTimer), phase.bgTitle);
            }
        } catch (e) {
            console.error("Failed to load save", e);
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
