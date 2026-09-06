class SkufLifeGame {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-wrapper');

        this.isGameStarted = false;
        this.lastFrameTime = performance.now();

        this.eventTimer = 75.0;
        this.gravitySway = 0.0;

        this.motivation = 0;
        this.passiveIncome = 0;
        this.clickPower = 1;
        this.comboMultiplier = 1.0;
        this.comboGrowthRate = 1.0;
        this.cleansingRadiusMultiplier = 1.0;
        this.chainReactionRadius = 0;
        this.dropCooldownMs = 360;
        this.shakeCooldownMax = 12;
        this.shakeCooldown = 0;
        this.luckyDropBonus = 0;

        this.currentCombo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboDecayTime = 3.0;

        this.items = { beer: 1, script: 1, energy: 1 };
        this.activeTool = null;

        this.relics = [];
        this.hasBeerShield = false;
        this.hasMagnetRelic = false;

        this.stamina = 100.0;
        this.staminaRecoveryRate = 12.0;
        this.isExhausted = false;
        this.exhaustedTimer = 0;

        this.currentDay = 1;
        this.currentPhase = 1;
        this.rentTimeLeft = 120.0; 
        this.currentBoss = CONFIG.BOSSES[1];
        this.bossMaxHp = this.currentBoss.hp;
        this.bossHp = this.bossMaxHp;
        this.dropsCount = 0;
        this.isPausedForDraft = false;

        this.totalMerges = 0;
        this.gigachadsCreated = 0;
        this.trashDestroyed = 0;
        this.bossesDefeated = 0;
        this.maxDays = 1;

        this.loadMetaProgress();

        this.currentItem = null;
        this.nextItem = null;
        this.canDrop = true;
        this.isGameOver = false;
        this.aimX = 260; // Центр экрана (520 / 2)
        this.dangerClock = 0;
        this.endorphins = [];
        this.floaters = [];
        this.comboParticles = [];

        // Безопасная загрузка 10 спрайтов (fallback на эмодзи при ошибке)
        this.charImages = {};
        for (let i = 1; i <= 10; i++) {
            const img = new Image();
            img.onerror = () => { this.charImages[i] = null; };
            img.src = `char_${i}.png`;
            this.charImages[i] = img;
        }

        this.room = new RoomRenderer();
        this.physics = new BrainPhysics(
            this.canvas,
            (a, b) => this.handleMerge(a, b),
            (x, y, name) => this.handleGarbagePopped(x, y, name)
        );

        this.ui = new UIManager({
            onGameStart: () => {
                this.isGameStarted = true;
                this.lastFrameTime = performance.now();
                AudioCtrl.init();
            },
            onShake: () => this.handleShake(),
            onBuyUpgrade: (cat, id) => this.handleBuyUpgrade(cat, id)
        });

        window.addEventListener('load', () => this.resizeCanvas());
        window.addEventListener('resize', () => this.resizeCanvas());

        this.currentItem = this.rollNextItem();
        this.nextItem = this.rollNextItem();
        this.ui.updateNextThought(this.nextItem);
        
        this.updateBossUI();
        this.updateConsumablesUI();
        this.updatePhaseUI();

        this.setupInputs();
        this.setupConsumableButtons();

        // Пассивный доход
        setInterval(() => {
            if (this.isGameStarted && this.passiveIncome > 0 && !this.isGameOver && !this.isPausedForDraft && !this.isExhausted) {
                this.motivation += this.passiveIncome;
                this.ui.updateMotivation(this.motivation, this.passiveIncome);
            }
        }, 1000);

        requestAnimationFrame((t) => this.loop(t));
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        if (this.canvas.width !== rect.width || this.canvas.height !== rect.height) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            if (this.physics) this.physics.buildCupWalls();
            this.aimX = this.canvas.width / 2;
        }
    }

    loadMetaProgress() {
        const saved = localStorage.getItem('skuf_meta');
        if (saved) {
            const data = JSON.parse(saved);
            this.achievements = data.achievements || [];
        } else {
            this.achievements = [];
        }
    }

    saveMetaProgress() {
        localStorage.setItem('skuf_meta', JSON.stringify({ achievements: this.achievements }));
    }

    rollNextItem() {
        this.dropsCount++;
        // Влияние прокачки осознанности на мусор
        const garbageFreq = CONFIG.UPGRADES.brain.find(u => u.id === 'b4').bought ? 20 : 10;
        const phaseMod = CONFIG.PHASES[this.currentPhase].trashMod;
        
        if (this.dropsCount % Math.floor(garbageFreq / phaseMod) === 0) {
            const availableTrash = CONFIG.GARBAGE_TYPES;
            const gData = availableTrash[Math.floor(Math.random() * availableTrash.length)];
            return { isGarbage: true, data: gData };
        }
        
        const roll = Math.random();
        let tier = 1;
        if (roll < 0.65) tier = 1;
        else if (roll < 0.93) tier = 2;
        else tier = 3;
        
        return { isGarbage: false, tier };
    }

    advanceQueue() {
        this.currentItem = this.nextItem;
        this.nextItem = this.rollNextItem();
        this.ui.updateNextThought(this.nextItem);
    }

    handleShake() {
        if (this.shakeCooldown > 0 || this.isPausedForDraft || !this.isGameStarted) return;
        this.shakeCooldown = this.shakeCooldownMax;
        AudioCtrl.playShake();
        this.physics.shakeBrain();
        this.room.triggerSkufBounce();
        this.ui.setQuote("«Ох, мозги перевернулись...»");
    }

    handleBuyUpgrade(cat, id) {
        const item = CONFIG.UPGRADES[cat].find(u => u.id === id);
        if (item && this.motivation >= item.cost && !item.bought) {
            this.motivation -= item.cost;
            item.bought = true;
            
            // Тело
            if (id === "h1") this.clickPower = 2;
            if (id === "h2") this.clickPower = 5;
            if (id === "h3") this.clickPower = 15;
            if (id === "h4") this.clickPower = 50;
            if (id === "h5") { this.clickPower = 200; this.ui.setQuote("«Я ЕСТЬ ГИГАЧАД!»"); }
            
            // Берлога
            if (id === "r1") this.passiveIncome += 5;
            if (id === "r2") this.passiveIncome += 30;
            if (id === "r3") this.passiveIncome += 120;
            if (id === "r4") this.passiveIncome += 500;
            if (id === "r5") this.passiveIncome += 2500;
            
            // Мозг
            if (id === "b1") this.physics.expandSkull(24);
            if (id === "b2") this.shakeCooldownMax = 7;
            if (id === "b3") this.shakeCooldownMax = 4;
            
            AudioCtrl.playUpgrade();
            this.ui.updateMotivation(this.motivation, this.passiveIncome);
            this.ui.renderShop();
            this.room.triggerSkufBounce();
        }
    }

    handleMerge(a, b) {
        const midX = (a.position.x + b.position.x) / 2;
        const midY = (a.position.y + b.position.y) / 2;
        const currentLevel = a.tier;
        
        Matter.World.remove(this.physics.world, [a, b]);
        
        this.currentCombo++;
        this.comboTimer = this.comboDecayTime;
        if (this.currentCombo > this.maxCombo) this.maxCombo = this.currentCombo;
        
        const comboBonus = 1 + (this.currentCombo * 0.1 * this.comboGrowthRate);
        const cleanseRadius = 95 * this.cleansingRadiusMultiplier;
        
        this.physics.cleanseNearbyGarbage(midX, midY, cleanseRadius);
        
        // Пивной щит
        if (currentLevel === 8 && this.hasBeerShield) {
            this.physics.cleanseNearbyGarbage(midX, midY, 999);
            this.spawnFloater(midX, midY - 40, "🍺 ПИВНОЙ ЩИТ ОЧИСТИЛ ВСЁ!", "#ffd700");
        }
        
        // Гигачад
        if (currentLevel === 9) {
            this.gigachadsCreated++;
            this.triggerGigachadEndorphinBurst(midX, midY);
            return;
        }
        
        const nextLevel = currentLevel + 1;
        const baseGain = CONFIG.TIERS[nextLevel].score;
        const gain = Math.floor(baseGain * this.comboMultiplier * comboBonus);
        
        this.motivation += gain;
        this.damageBoss(gain);
        this.totalMerges++;
        
        this.ui.updateMotivation(this.motivation, this.passiveIncome);
        this.spawnFloater(midX, midY, `+${gain} 🗿`);
        this.spawnBurstParticles(midX, midY, CONFIG.TIERS[currentLevel].color);
        AudioCtrl.playMerge(nextLevel);
        
        const upgraded = this.physics.createThought(midX, midY, nextLevel);
        Matter.Body.setVelocity(upgraded, { x: (Math.random() - 0.5) * 3, y: -3 });
    }

    damageBoss(amount) {
        if (this.bossHp <= 0) return;
        this.bossHp = Math.max(0, this.bossHp - amount);
        this.updateBossUI();
        
        if (this.bossHp <= 0) {
            AudioCtrl.playEndorphinFanfare();
            this.bossesDefeated++;
            this.currentDay++;
            
            // Смена фаз комнаты
            if ((this.currentDay - 1) % 3 === 0 && this.currentDay > 1) {
                this.currentPhase = Math.min(5, Math.ceil(this.currentDay / 3));
                this.updatePhaseUI();
                this.room.updateRoomStage(CONFIG.PHASES[this.currentPhase].roomStage);
            }
            
            this.triggerPerkDraft();
        }
    }

    updateBossUI() {
        const fill = document.getElementById("boss-hp-fill");
        const text = document.getElementById("boss-hp-text");
        const name = document.getElementById("boss-name");
        if (name) name.textContent = `БОСС: ${this.currentBoss.name}`;
        if (text) text.textContent = `${this.bossHp} / ${this.bossMaxHp} HP`;
        if (fill) fill.style.width = `${(this.bossHp / this.bossMaxHp) * 100}%`;
    }

    updatePhaseUI() {
        const badge = document.getElementById("crisis-badge");
        if (badge) badge.textContent = CONFIG.PHASES[this.currentPhase].name;
    }

    handleGarbagePopped(x, y, name) {
        AudioCtrl.playGarbagePopped();
        this.spawnFloater(x, y, `СЖЁГ: ${name}! ✨`, "#38bdf8");
        this.spawnBurstParticles(x, y, "#94a3b8");
        this.motivation += 30;
        this.damageBoss(40);
        this.trashDestroyed++;
        this.ui.updateMotivation(this.motivation, this.passiveIncome);
    }

    triggerGigachadEndorphinBurst(x, y) {
        AudioCtrl.playEndorphinFanfare();
        this.room.triggerSkufBounce();
        this.room.triggerEndorphinFlash();
        this.physics.cleanseNearbyGarbage(x, y, 999);
        
        const megaGain = 3000;
        this.motivation += megaGain;
        this.damageBoss(megaGain);
        this.ui.updateMotivation(this.motivation, this.passiveIncome);
        
        this.spawnFloater(x, y, `РОДИЛСЯ ГИГАЧАД! +${megaGain} 🗿`, "#ffd700");
        this.ui.setQuote("«ЭТО АБСОЛЮТНЫЙ ГИГАЧАД! БОСС В НОКАУТЕ!»");
    }

    setupConsumableButtons() {
        document.getElementById("slot-beer").addEventListener("click", () => {
            if (this.items.beer > 0) {
                this.activeTool = (this.activeTool === "beer") ? null : "beer";
                document.getElementById("slot-beer").classList.toggle("active-tool", this.activeTool === "beer");
            }
        });
        
        document.getElementById("slot-script").addEventListener("click", () => {
            if (this.items.script <= 0) return;
            const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => b.tier && !b.isDead);
            for (let i = 0; i < bodies.length; i++) {
                for (let j = i + 1; j < bodies.length; j++) {
                    if (bodies[i].tier === bodies[j].tier) {
                        this.items.script--;
                        const midX = (bodies[i].position.x + bodies[j].position.x) / 2;
                        const midY = (bodies[i].position.y + bodies[j].position.y) / 2;
                        Matter.Body.setPosition(bodies[i], { x: midX - 5, y: midY });
                        Matter.Body.setPosition(bodies[j], { x: midX + 5, y: midY });
                        AudioCtrl.playUpgrade();
                        this.updateConsumablesUI();
                        return;
                    }
                }
            }
        });
        
        document.getElementById("slot-energy").addEventListener("click", () => {
            if (this.items.energy <= 0) return;
            this.items.energy--;
            this.physics.engine.gravity.y = 0.35;
            this.spawnFloater(this.canvas.width / 2, 350, "ВРЕМЯ ЗАМЕДЛЕНО! ⚡", "#ffd700");
            AudioCtrl.playUpgrade();
            
            setTimeout(() => {
                this.physics.engine.gravity.y = 1.35 * CONFIG.PHASES[this.currentPhase].gravityMod;
            }, 10000);
            this.updateConsumablesUI();
        });
    }

    updateConsumablesUI() {
        document.getElementById("count-beer").textContent = `x${this.items.beer}`;
        document.getElementById("count-script").textContent = `x${this.items.script}`;
        document.getElementById("count-energy").textContent = `x${this.items.energy}`;
        document.getElementById("slot-beer").classList.toggle("active-tool", this.activeTool === "beer");
    }

    triggerPerkDraft() {
        this.isPausedForDraft = true;
        
        // Отсеиваем уже купленные реликвии
        const unowned = CONFIG.RELICS_POOL.filter(r => !this.relics.some(owned => owned.id === r.id));
        
        // Если все реликвии скуплены - выдаем бонус
        if (unowned.length === 0) {
            this.spawnFloater(this.canvas.width / 2, 350, "ВСЕ РЕЛИКВИИ ВАШИ! +10000 БАЗЫ", "#ffd700");
            this.motivation += 10000;
            this.ui.updateMotivation(this.motivation, this.passiveIncome);
            this.startNextDay();
            return;
        }

        const shuffled = [...unowned].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(3, shuffled.length));
        
        this.ui.showPerkDraft(selected, (chosenPerk) => {
            this.relics.push(chosenPerk);
            chosenPerk.apply(this);
            this.ui.renderRelics(this.relics);
            
            // Награда за босса
            this.items.beer++;
            this.items.script++;
            this.items.energy++;
            this.updateConsumablesUI();
            
            this.startNextDay();
        });
    }

    startNextDay() {
        const bossIndex = Math.min(this.currentDay, 10);
        this.currentBoss = CONFIG.BOSSES[bossIndex];
        
        // Экспоненциальный рост HP на случай бесконечного режима
        const multiplier = this.currentDay > 10 ? Math.pow(1.5, this.currentDay - 10) : 1;
        this.bossMaxHp = Math.floor(this.currentBoss.hp * multiplier);
        this.bossHp = this.bossMaxHp;
        
        this.rentTimeLeft = Math.min(240.0, 120.0 + (this.currentDay * 8));
        this.updateBossUI();
        this.isPausedForDraft = false;
    }

    triggerEviction() {
        this.isGameOver = true;
        this.ui.showGameOver(this.currentDay - 1, `Босс ${this.currentBoss.name} выселил Скуфа за неуплату!`);
    }

    drop() {
        if (!this.canDrop || this.isGameOver || this.isPausedForDraft || !this.isGameStarted) return;
        this.canDrop = false;
        
        if (this.currentItem.isGarbage) {
            this.physics.createGarbage(this.aimX, CONFIG.DROP_Y, this.currentItem.data);
        } else {
            this.physics.createThought(this.aimX, CONFIG.DROP_Y, this.currentItem.tier);
        }
        AudioCtrl.playDrop();
        this.advanceQueue();
        
        setTimeout(() => { this.canDrop = true; }, this.dropCooldownMs);
    }

    setupInputs() {
        const updateAim = (clientX) => {
            const rect = this.canvas.getBoundingClientRect();
            const r = this.currentItem.isGarbage ? this.currentItem.data.radius : CONFIG.TIERS[this.currentItem.tier].radius;
            this.aimX = Math.max(25 + r, Math.min(this.canvas.width - 25 - r, clientX - rect.left));
        };
        
        const handleTouchClick = (clientX, clientY) => {
            if (!this.isGameStarted || this.isPausedForDraft || this.isGameOver) return;
            const rect = this.canvas.getBoundingClientRect();
            const touchX = clientX - rect.left;
            const touchY = clientY - rect.top;
            
            // Использование Балтики
            if (this.activeTool === "beer") {
                const bodies = Matter.Composite.allBodies(this.physics.world).filter(b => !b.isStatic);
                for (let b of bodies) {
                    if (Math.hypot(b.position.x - touchX, b.position.y - touchY) < 35) {
                        this.items.beer--;
                        this.activeTool = null;
                        b.isDead = true;
                        Matter.World.remove(this.physics.world, b);
                        AudioCtrl.playGarbagePopped();
                        this.updateConsumablesUI();
                        return;
                    }
                }
                return;
            }
            
            // Клик по комнате (Фарм Базы)
            if (touchY < CONFIG.ROOM_HEIGHT) {
                if (this.isExhausted) {
                    AudioCtrl.playExhausted();
                    return;
                }
                this.stamina = Math.max(0, this.stamina - 15.0);
                if (this.stamina <= 0) {
                    this.isExhausted = true;
                    this.exhaustedTimer = 3.5;
                }
                this.motivation += this.clickPower;
                this.damageBoss(this.clickPower);
                this.ui.updateMotivation(this.motivation, this.passiveIncome);
                this.room.triggerSkufBounce();
                AudioCtrl.playSkufGrunt();
                this.spawnFloater(touchX, touchY, `+${this.clickPower}`);
                return;
            }
            
            this.drop();
        };
        
        this.canvas.addEventListener('mousemove', (e) => updateAim(e.clientX));
        this.canvas.addEventListener('click', (e) => handleTouchClick(e.clientX, e.clientY));
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); updateAim(e.touches[0].clientX); }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); handleTouchClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
    }

    spawnBurstParticles(x, y, color) {
        for (let i = 0; i < 14; i++) {
            this.endorphins.push({
                x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, alpha: 1.0, color
            });
        }
    }

    spawnFloater(x, y, text, color = "#ffd700") {
        this.floaters.push({ x, y, text, color, alpha: 1.0 });
    }

    drawItemToken(x, y, radius, item, angle = 0) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        // Цветной фон круга
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = item.isGarbage ? (item.garbageColor || (item.data && item.data.color) || "#334155") : (CONFIG.TIERS[item.tier] ? CONFIG.TIERS[item.tier].color : "#2b2844");
        this.ctx.fill();
        this.ctx.clip(); // Обрезаем все, что выходит за круг
        
        if (item.isGarbage) {
            const rawName = item.garbageName || (item.data && item.data.name) || "⚠️";
            const match = rawName.match(/[\p{Extended_Pictographic}\u2600-\u27bf]/u);
            const icon = match ? match[0] : "⚠️";

            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = `${Math.floor(radius * 0.9)}px Arial, sans-serif`;
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(icon, 0, 1);
        } else {
            const conf = CONFIG.TIERS[item.tier];
            const imgIndex = conf ? conf.mappedImg : null;
            const img = imgIndex ? this.charImages[imgIndex] : null;
            
            // Если картинка есть — отрисовываем с сохранением пропорций (Aspect Ratio)
            if (img && img.complete && img.naturalWidth > 0) {
                const fitRadius = radius * 0.82; // Зазор до краев
                const aspect = img.naturalWidth / img.naturalHeight;
                let drawW, drawH;
                if (aspect >= 1) {
                    drawW = fitRadius * 2;
                    drawH = (fitRadius * 2) / aspect;
                } else {
                    drawH = fitRadius * 2;
                    drawW = (fitRadius * 2) * aspect;
                }
                this.ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            } else if (conf) {
                this.ctx.font = `${Math.floor(radius * 0.8)}px Arial`;
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.fillText(conf.emoji, 0, 1);
            }
        }
        this.ctx.restore();
        
        // Обводка
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeStyle = item.isGarbage ? "#ef4444" : (CONFIG.TIERS[item.tier] ? CONFIG.TIERS[item.tier].color : "#fff");
        this.ctx.stroke();
        this.ctx.restore();
    }

    loop(currentTime) {
        // Честный таймер (Delta-time)
        const now = currentTime || performance.now();
        const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = now;

        if (this.isGameStarted && !this.isPausedForDraft && !this.isGameOver) {
            this.rentTimeLeft -= delta;
            const mins = Math.max(0, Math.floor(this.rentTimeLeft / 60));
            const secs = Math.max(0, Math.floor(this.rentTimeLeft % 60));
            
            const timerEl = document.getElementById("rent-timer-display");
            if (timerEl) {
                timerEl.textContent = `⏳ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                timerEl.classList.toggle('panic', this.rentTimeLeft < 20);
            }
            
            const dayLabel = document.getElementById("rent-day-label");
            if (dayLabel) {
                dayLabel.textContent = `ДЕНЬ ${this.currentDay}`;
            }

            if (this.rentTimeLeft <= 0) {
                this.triggerEviction();
            }

            if (this.isExhausted) {
                this.exhaustedTimer -= delta;
                if (this.exhaustedTimer <= 0) {
                    this.isExhausted = false;
                    this.stamina = 30.0;
                }
            } else {
                this.stamina = Math.min(100.0, this.stamina + this.staminaRecoveryRate * delta);
            }
            this.ui.updateStamina(this.stamina, this.isExhausted);

            if (this.shakeCooldown > 0) this.shakeCooldown -= delta;
            this.ui.updateShake(this.shakeCooldown);

            this.physics.update();
        }

        // Отрисовка сцены
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.room.draw(this.ctx, this.canvas.width, this);

        // Линия опасности
        this.ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 6]);
        this.ctx.beginPath();
        this.ctx.moveTo(15, CONFIG.DANGER_LINE_Y);
        this.ctx.lineTo(this.canvas.width - 15, CONFIG.DANGER_LINE_Y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Прицел
        if (this.isGameStarted && this.canDrop && !this.isGameOver && !this.isPausedForDraft) {
            this.ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(this.aimX, CONFIG.DROP_Y);
            this.ctx.lineTo(this.aimX, this.canvas.height);
            this.ctx.stroke();
            
            const r = this.currentItem.isGarbage ? this.currentItem.data.radius : CONFIG.TIERS[this.currentItem.tier].radius;
            this.drawItemToken(this.aimX, CONFIG.DROP_Y, r, this.currentItem);
        }
        
        let isOverfilled = false;
        const bodies = Matter.Composite.allBodies(this.physics.world);
        
        bodies.forEach(b => {
            if ((b.tier || b.isGarbage) && !b.isDead) {
                const r = b.isGarbage ? b.circleRadius : CONFIG.TIERS[b.tier].radius;
                this.drawItemToken(b.position.x, b.position.y, r, b, b.angle);
                if (b.position.y - r < CONFIG.DANGER_LINE_Y && Math.abs(b.velocity.y) < 0.25) {
                    isOverfilled = true;
                }
            }
        });
        
        if (this.isGameStarted && isOverfilled && !this.isPausedForDraft) {
            this.dangerClock += delta;
            if (this.dangerClock >= 2.2 && !this.isGameOver) {
                this.isGameOver = true;
                this.ui.showGameOver(this.currentDay, "Мозг переполнился хаосом нерешённых проблем!");
            }
        } else {
            this.dangerClock = Math.max(0, this.dangerClock - delta);
        }
        
        // Анимация всплывающего текста
        this.floaters.forEach((f, i) => {
            f.y -= 1.2;
            f.alpha -= 0.025;
            this.ctx.font = "bold 13px 'Segoe UI', sans-serif";
            this.ctx.fillStyle = f.color;
            this.ctx.globalAlpha = Math.max(0, f.alpha);
            this.ctx.textAlign = "center";
            this.ctx.fillText(f.text, f.x, f.y);
            this.ctx.globalAlpha = 1.0;
            if (f.alpha <= 0) this.floaters.splice(i, 1);
        });

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Запуск игры
window.addEventListener('DOMContentLoaded', () => {
    new SkufLifeGame();
});