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
        this.roomHeight = 175;
        this.brainTopY = 195;
        this.dropY = 215;
        this.dangerLineY = 245;

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

            // Адаптивная высота комнаты Скуфа:
            // Чтобы при прокачивании экрана/предметов стакан мыслей не сжимался
            const maxRoomAllowed = Math.floor(h * 0.30);
            this.roomHeight = Math.max(105, Math.min(160, maxRoomAllowed));
            this.brainTopY = this.roomHeight + 14;
            this.dropY = this.brainTopY + 18;
            this.dangerLineY = this.brainTopY + 44;

            this.physics.setDimensions(this.roomHeight);
            if (!this.aimX || this.aimX <= 0 || this.aimX > w) {
                this.aimX = w / 2;
            } else {
                this.aimX = Math.max(30, Math.min(w - 30, this.aimX));
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
                // Клик по Скуфу / Комнате
                this.handleSkufTap(clientX, clientY);
            } else {
                // Прицеливание и сброс в стакан
                this.aimX = Math.max(26, Math.min(this.canvas.width - 26, x));
                
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
                this.aimX = Math.max(26, Math.min(this.canvas.width - 26, x));
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
        if (heroUpgs[0]?.bought) baseDamage *= 2;
        if (heroUpgs[1]?.bought) baseDamage *= 5;
        if (heroUpgs[3]?.bought) baseDamage *= 15;
        if (heroUpgs[4]?.bought) baseDamage *= 50;
        if (heroUpgs[5]?.bought) baseDamage *= 150;
        if (heroUpgs[6]?.bought) baseDamage *= 600;

        // Шанс крита
        let isCrit = false;
        if (heroUpgs[1]?.bought && Math.random() < 0.15) {
            baseDamage *= 10;
            isCrit = true;
        }

        baseDamage *= this.bossDamageMultiplier;
        const finalDamage = Math.max(1, Math.floor(baseDamage));

        this.dealBossDamage(finalDamage);
        this.addMotivation(Math.max(1, Math.floor(finalDamage * 0.5)));

        this.roomRenderer.triggerSkufBounce();
        AudioCtrl.playSkufGrunt(isCrit);

        this.trackQuestProgress('taps', 1);

        // Всплывающий текст урона
        this.spawnFloatingText(
            this.canvas.width / 2 + (Math.random() - 0.5) * 60,
            this.roomHeight - 35,
            isCrit ? `КРИТ -${finalDamage}! 💥` : `-${finalDamage}`,
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
        let reward = tierConfig.score * Math.max(1, this.combo * 0.5) * this.comboMultiplier * this.globalIncomeMultiplier;
        if (this.isFeverActive) reward *= 3; // В режиме Fever x3 очков!
        
        if (this.hasGoldenCat && tier === 1) reward += 500;
        this.addMotivation(reward);

        // Урон по боссу от слияния
        let bossDmg = tierConfig.score * 2.5 * Math.max(1, this.combo * 0.4);
        if (CONFIG.UPGRADES.brain[6]?.bought) bossDmg *= 2; // Третий глаз
        if (this.isFeverActive) bossDmg *= 3; // В режиме Fever x3 урона!
        bossDmg *= this.bossDamageMultiplier;
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
        const blastRadius = this.hasChainBlast && tier >= 5 ? 160 : (tier >= 4 ? 90 : 45);
        this.physics.cleanseNearbyGarbage(midX, midY, blastRadius);

        // Пивной щит: Скуф сжигает весь мусор
        if (this.hasBeerShield && tier === 8) {
            this.physics.cleanseNearbyGarbage(this.canvas.width / 2, this.canvas.height / 2, 800);
            this.ui.setQuote("🍺 ПИВНОЙ ЩИТ: Весь мусор сожжён!");
        }

        // Создание новой мысли следующего тира
        if (nextTier <= 10) {
            this.physics.createThought(midX, midY, nextTier);
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
            this.addMotivation(10000);
            this.dealBossDamage(15000);
            this.roomRenderer.triggerEndorphinFlash();
            this.spawnFloatingText(midX, midY, `+${CONFIG.formatNumber(10000)} БАЗЫ! 🌌`, "#ff2a85");
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

        if (roomUpgs[0]?.bought) income += 5;
        if (roomUpgs[1]?.bought) income += 25;
        if (roomUpgs[2]?.bought) income += 90;
        if (roomUpgs[3]?.bought) income += 350;
        if (roomUpgs[4]?.bought) income += 1400;
        if (roomUpgs[5]?.bought) income += 6500;
        if (roomUpgs[6]?.bought) income += 30000;
        if (roomUpgs[7]?.bought) income += 150000;

        if (careerUpgs[0]?.bought) income += 15;
        if (careerUpgs[1]?.bought) income += 75;
        if (careerUpgs[2]?.bought) income += 300;
        if (careerUpgs[3]?.bought) income += 1200;
        if (careerUpgs[4]?.bought) income += 5000;
        if (careerUpgs[5]?.bought) income += 22000;
        if (careerUpgs[6]?.bought) income += 100000;

        // Апгрейды мозга
        if (CONFIG.UPGRADES.brain[0]?.bought) this.physics.expandSkull(18);
        if (CONFIG.UPGRADES.brain[1]?.bought) this.dropCooldownMs = 260;
        if (CONFIG.UPGRADES.brain[2]?.bought) this.shakeCooldownMax = 6;
        if (CONFIG.UPGRADES.brain[4]?.bought) this.physics.expandSkull(42);

        this.passiveIncome = income;
    }

    // --- ПРЕСТИЖ / САНСАРА ---
    calculatePrestigeGain() {
        const base = Math.floor(Math.sqrt(this.totalMotivationEarned / 1200));
        const bossBonus = this.bossesDefeated * 2;
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
        this.feverTimer = this.feverDuration;
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

        // Восстановление дыхалки
        if (this.stamina < this.maxStamina) {
            let recovery = this.staminaRecoveryRate;
            if (CONFIG.UPGRADES.hero[2]?.bought) recovery *= 1.8;
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

        requestAnimationFrame(this.gameLoop.bind(this));
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

    // --- ОТРИСОВКА МЫСЛИ С ДИНАМИЧЕСКИМ РАЗМЕРОМ ФОТО И ОПТИМИЗАЦИЕЙ FX ---
    drawThoughtBall(ctx, x, y, radius, tier, isAim = false) {
        const conf = CONFIG.TIERS[tier] || CONFIG.TIERS[1];
        ctx.save();
        ctx.translate(x, y);

        const fx = this.fxEnabled;

        // 1. Свечение (только при включенном FX для исключения просадок FPS на слабых устройствах)
        if (fx && (tier >= 6 || isAim)) {
            ctx.shadowColor = conf.glow || '#3b82f6';
            ctx.shadowBlur = isAim ? 10 : 8;
        }

        // 2. Базовый цветной круг предмета
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = conf.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        const img = this.charImages[tier];
        if (img && img.complete && img.naturalWidth > 0) {
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;

            // Динамический расчет размера под каждое фото:
            // Нормирование по диагонали гарантирует, что любое фото (квадратное,
            // вертикальное или горизонтальное) любого исходного разрешения полностью
            // помещается внутрь круга, имеет одинаковый визуальный размер и аккуратный отступ!
            const photoDiag = Math.sqrt(nw * nw + nh * nh) || 1;
            // Коэффициент 1.54 гарантирует, что расстояние от центра до ЛЮБОГО угла фото
            // составляет 0.77 * radius. Фото полностью помещается в круг с 23% цветной рамкой!
            const targetDiag = radius * 1.54;
            const scale = targetDiag / photoDiag;
            const dw = nw * scale;
            const dh = nh * scale;
            const cornerR = Math.max(3, Math.min(dw, dh) * 0.16);

            // Отрисовка фото со скругленными уголками целиком внутри круга
            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(-dw / 2, -dh / 2, dw, dh, cornerR);
            } else {
                ctx.rect(-dw / 2, -dh / 2, dw, dh);
            }
            ctx.clip();
            ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
            ctx.restore();

            // Тонкая аккуратная окантовка вокруг фото
            if (fx) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(-dw / 2, -dh / 2, dw, dh, cornerR);
                } else {
                    ctx.rect(-dw / 2, -dh / 2, dw, dh);
                }
                ctx.stroke();
                ctx.restore();
            }
        } else {
            ctx.font = `${Math.floor(radius * 0.92)}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(conf.emoji, 0, 1);
        }

        // 3. Объемный сферический блик для 3D-глубины (включается только при FX)
        if (fx) {
            const shine = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, 1, 0, 0, radius);
            shine.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
            shine.addColorStop(0.3, 'rgba(255, 255, 255, 0.06)');
            shine.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
            shine.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = shine;
            ctx.fill();
        }

        // 4. Окантовка круга
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.lineWidth = isAim ? 2.5 : 1.6;
        ctx.strokeStyle = isAim ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.45)';
        ctx.stroke();

        // 5. Мини-бейдж с номером тира
        if (radius >= 18) {
            const badgeR = Math.max(7, Math.floor(radius * 0.28));
            const bx = radius * 0.6;
            const by = radius * 0.6;
            ctx.beginPath();
            ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(15, 10, 30, 0.88)';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ffd700';
            ctx.stroke();

            ctx.font = `bold ${Math.max(8, Math.floor(badgeR * 1.1))}px system-ui, sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tier.toString(), bx, by);
        }

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
        const isDangerous = this.dangerTimer > 0;
        this.ctx.save();
        this.ctx.strokeStyle = isDangerous ? `rgba(239, 68, 68, ${0.5 + Math.sin(performance.now() * 0.015) * 0.5})` : 'rgba(239, 68, 68, 0.3)';
        this.ctx.lineWidth = isDangerous ? 3 : 1.5;
        this.ctx.setLineDash([8, 6]);
        this.ctx.beginPath();
        this.ctx.moveTo(18, this.dangerLineY);
        this.ctx.lineTo(w - 18, this.dangerLineY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        if (isDangerous) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = "bold 9.5px 'Segoe UI', sans-serif";
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`ОПАСНОСТЬ: ${(this.dangerLimit - this.dangerTimer).toFixed(1)}с`, w - 24, this.dangerLineY - 6);
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
