// Безопасные полифилы для CanvasRenderingContext2D (гарантируют работу во всех версиях браузеров)
if (typeof CanvasRenderingContext2D !== 'undefined') {
    if (!CanvasRenderingContext2D.prototype.ellipse) {
        CanvasRenderingContext2D.prototype.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
            this.save();
            this.translate(x, y);
            this.rotate(rotation || 0);
            this.scale(radiusX, radiusY);
            this.arc(0, 0, 1, startAngle || 0, endAngle !== undefined ? endAngle : Math.PI * 2, counterclockwise || false);
            this.restore();
        };
    }
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
            let r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] || 0 : 0);
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.moveTo(x + r, y);
            this.lineTo(x + w - r, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r);
            this.lineTo(x + w, y + h - r);
            this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            this.lineTo(x + r, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r);
            this.lineTo(x, y + r);
            this.quadraticCurveTo(x, y, x + r, y);
            this.closePath();
        };
    }
}

class RoomRenderer {
    constructor() {
        this.skufBounce = 1.0;
        this.endorphinFlash = 0.0;
        this.ambientTime = 0;
        this.roomStage = 0;

        // Частицы пыли в луче света
        this.dustParticles = Array.from({ length: 22 }, () => ({
            x: 30 + Math.random() * 160,
            y: 30 + Math.random() * 120,
            radius: Math.random() * 1.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: -Math.random() * 0.3 - 0.05,
            alpha: Math.random() * 0.7 + 0.2
        }));

        // Звезды в окне
        this.stars = Array.from({ length: 18 }, () => ({
            x: 24 + Math.random() * 70,
            y: 20 + Math.random() * 55,
            size: Math.random() * 1.6 + 0.6,
            phase: Math.random() * Math.PI * 2
        }));

        // Космические звезды и туманности для поздних фаз
        this.cosmicStars = Array.from({ length: 90 }, () => ({
            x: Math.random() * 600,
            y: Math.random() * 250,
            size: Math.random() * 2.2 + 0.4,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.6 + 0.2,
            color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#67e8f9' : '#f472b6')
        }));

        // Неоновые летающие машины для Пентхауса
        this.cyberCars = Array.from({ length: 5 }, () => ({
            x: Math.random() * 500,
            y: 30 + Math.random() * 70,
            speed: Math.random() * 1.2 + 0.8,
            color: Math.random() > 0.5 ? '#00f0ff' : '#ff2a85',
            trail: Math.random() * 20 + 15
        }));

        this.zzzParticles = [];
        this.idleTimer = 0;
        this.currentChannel = 0;
        this.catPurrTimer = 0;
        this.catBounce = 1.0;
    }

    updateRoomStage(stage) {
        this.roomStage = Math.max(0, Math.min(4, stage));
    }

    triggerSkufBounce() {
        this.skufBounce = 1.35;
        this.idleTimer = 0;
    }

    triggerCatPet() {
        this.catPurrTimer = 2.5;
        this.catBounce = 1.35;
    }

    switchChannel() {
        if (!CONFIG.TV_CHANNELS || CONFIG.TV_CHANNELS.length === 0) return null;
        this.currentChannel = (this.currentChannel + 1) % CONFIG.TV_CHANNELS.length;
        return CONFIG.TV_CHANNELS[this.currentChannel];
    }

    getInteractiveTargets(width, roomHeight) {
        const floorY = roomHeight - 28;
        const centerX = width / 2;
        const hasPC = CONFIG.UPGRADES.room[1]?.bought;
        const hasBrewery = CONFIG.UPGRADES.room[2]?.bought;
        const hasMining = CONFIG.UPGRADES.room[3]?.bought;
        const hasSmartHome = CONFIG.UPGRADES.room[4]?.bought;

        const targets = [
            // Котик на подлокотнике
            { id: 'cat', x: centerX - 71, y: floorY - 33, radius: 24, name: 'Кот' },
            // Телевизор
            { id: 'tv', x: Math.max(16, centerX - 128) + 20, y: floorY - 32 + 14, radius: 24, name: 'Телевизор' },
            // Скуф на диване
            {
                id: 'skuf',
                x: centerX,
                y: floorY - 26,
                radius: 43,
                name: 'Скуф'
            }
        ];

        if (hasPC) {
            targets.push({ id: 'pc', x: width - 60, y: floorY - 24, radius: 24, name: 'ПК' });
        }
        if (hasBrewery) {
            targets.push({ id: 'brewery', x: width - 42 + 14, y: floorY + 4, radius: 20, name: 'Пивоварня' });
        }
        if (hasMining) {
            targets.push({ id: 'mining', x: 46, y: floorY - 25, radius: 25, name: 'Ферма' });
        }
        if (hasSmartHome) {
            const vacX = centerX + 80 + Math.sin(this.ambientTime * 1.5) * 20;
            targets.push({ id: 'vacuum', x: vacX, y: floorY + 10, radius: 18, name: 'Пылесос' });
        }

        return targets;
    }

    triggerEndorphinFlash() {
        this.endorphinFlash = 1.0;
    }

    drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    draw(ctx, width, roomHeight, game) {
        this.ambientTime += 0.025;
        this.idleTimer += 1 / 60;
        const floorY = roomHeight - 28;
        const centerX = width / 2;
        
        // Проверяем купленные апгрейды
        const hasCleaned = CONFIG.UPGRADES.room[0]?.bought;
        const hasPC = CONFIG.UPGRADES.room[1]?.bought;
        const hasBrewery = CONFIG.UPGRADES.room[2]?.bought;
        const hasMining = CONFIG.UPGRADES.room[3]?.bought;
        const hasSmartHome = CONFIG.UPGRADES.room[4]?.bought;
        const hasDumbbells = CONFIG.UPGRADES.hero[0]?.bought;
        const hasGigachadAura = CONFIG.UPGRADES.hero[6]?.bought;

        // 1. Окружение и задний план в зависимости от стадии комнаты
        if (this.roomStage === 4) {
            // Космос / Орбита
            ctx.fillStyle = "#030208";
            ctx.fillRect(0, 0, width, roomHeight);
            
            // Земля на горизонте
            const earthGrad = ctx.createRadialGradient(centerX, roomHeight + 200, 150, centerX, roomHeight + 200, 320);
            earthGrad.addColorStop(0, "#082f49");
            earthGrad.addColorStop(0.5, "#0284c7");
            earthGrad.addColorStop(0.8, "#38bdf8");
            earthGrad.addColorStop(1, "transparent");
            ctx.fillStyle = earthGrad;
            ctx.beginPath();
            ctx.arc(centerX, roomHeight + 200, 320, 0, Math.PI * 2);
            ctx.fill();

            // Мерцающие звезды
            this.cosmicStars.forEach(s => {
                s.twinkle += s.speed * 0.03;
                const alpha = (Math.sin(s.twinkle) + 1) * 0.4 + 0.2;
                ctx.fillStyle = s.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(s.x % width, s.y % (roomHeight - 20), s.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        } else if (this.roomStage === 3) {
            // Пентхаус с панорамным видом на кибер-город
            const skyGrad = ctx.createLinearGradient(0, 0, 0, roomHeight);
            skyGrad.addColorStop(0, "#090514");
            skyGrad.addColorStop(0.7, "#1e0b36");
            skyGrad.addColorStop(1, "#3b0764");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, width, roomHeight);

            // Небоскребы вдали
            ctx.fillStyle = "#0c071a";
            for (let bx = 10; bx < width; bx += 36) {
                const bh = 50 + ((bx * 17) % 65);
                ctx.fillRect(bx, floorY - bh, 28, bh);
                // Окошки небоскребов
                ctx.fillStyle = "rgba(255, 215, 0, 0.4)";
                for (let wy = floorY - bh + 6; wy < floorY - 6; wy += 10) {
                    ctx.fillRect(bx + 4, wy, 4, 4);
                    ctx.fillRect(bx + 14, wy, 4, 4);
                }
                ctx.fillStyle = "#0c071a";
            }

            // Летающие машины
            this.cyberCars.forEach(c => {
                c.x = (c.x + c.speed) % (width + 60);
                ctx.strokeStyle = c.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(c.x, c.y);
                ctx.lineTo(c.x - c.trail, c.y);
                ctx.stroke();
            });
        } else if (this.roomStage === 2) {
            // Офис с неоном
            const wallGrad = ctx.createLinearGradient(0, 0, 0, roomHeight);
            wallGrad.addColorStop(0, "#0f172a");
            wallGrad.addColorStop(1, "#1e293b");
            ctx.fillStyle = wallGrad;
            ctx.fillRect(0, 0, width, roomHeight);

            // Неоновая вывеска "BASE"
            ctx.font = "bold 14px 'Segoe UI', sans-serif";
            ctx.fillStyle = "#00f0ff";
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 10;
            ctx.fillText("⚡ CYBER-BASE 2026 ⚡", centerX, 24);
            ctx.shadowBlur = 0;
        } else {
            // Хрущёвка / Евроремонт
            const wallGrad = ctx.createLinearGradient(0, 0, 0, roomHeight);
            wallGrad.addColorStop(0, this.roomStage === 1 ? "#1a162b" : "#17101c");
            wallGrad.addColorStop(1, this.roomStage === 1 ? "#120e20" : "#110b14");
            ctx.fillStyle = wallGrad;
            ctx.fillRect(0, 0, width, roomHeight);

            // Обои в полоску
            ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
            for (let x = 10; x < width; x += 22) {
                ctx.fillRect(x, 0, 8, floorY);
            }
        }

        // 2. Окно хрущёвки (только на ранних стадиях)
        if (this.roomStage <= 1) {
            const winX = 20, winY = 16, winW = 68, winH = Math.min(80, roomHeight - 55);
            ctx.fillStyle = "#060913";
            this.drawRoundedRect(ctx, winX, winY, winW, winH, 5);
            ctx.fill();

            // Звезды в окне
            this.stars.forEach(st => {
                const twinkle = (Math.sin(this.ambientTime * 2 + st.phase) + 1) * 0.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`;
                ctx.fillRect(st.x, Math.min(winY + winH - 6, st.y), st.size, st.size);
            });

            // Луна
            ctx.fillStyle = "#fef08a";
            ctx.beginPath();
            ctx.arc(winX + 48, winY + 24, 7.5, 0, Math.PI * 2);
            ctx.fill();

            // Рама
            ctx.strokeStyle = "#3e2316";
            ctx.lineWidth = 3;
            this.drawRoundedRect(ctx, winX, winY, winW, winH, 5);
            ctx.stroke();

            // Луч света на пол
            const lightBeam = ctx.createLinearGradient(winX + 30, winY + 20, winX + 140, floorY + 10);
            lightBeam.addColorStop(0, "rgba(180, 220, 255, 0.12)");
            lightBeam.addColorStop(1, "rgba(180, 220, 255, 0.0)");
            ctx.fillStyle = lightBeam;
            ctx.beginPath();
            ctx.moveTo(winX + winW, winY + 10);
            ctx.lineTo(winX + 150, floorY + 15);
            ctx.lineTo(winX + 40, floorY + 15);
            ctx.lineTo(winX, winY + winH);
            ctx.closePath();
            ctx.fill();

            // Пылинки в луче
            this.dustParticles.forEach(dp => {
                dp.x += dp.speedX;
                dp.y += dp.speedY;
                if (dp.y < winY + 6) dp.y = floorY + 6;
                if (dp.x < winX + 6) dp.x = winX + 130;
                if (dp.x > winX + 150) dp.x = winX + 15;
                ctx.fillStyle = `rgba(220, 240, 255, ${dp.alpha * 0.75})`;
                ctx.beginPath();
                ctx.arc(dp.x, dp.y, dp.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // 3. Пол
        const floorGrad = ctx.createLinearGradient(0, floorY, 0, roomHeight);
        if (this.roomStage === 4) {
            floorGrad.addColorStop(0, "#1e293b");
            floorGrad.addColorStop(1, "#0f172a");
        } else if (this.roomStage === 3) {
            floorGrad.addColorStop(0, "#27272a");
            floorGrad.addColorStop(1, "#18181b");
        } else {
            floorGrad.addColorStop(0, "#2c1810");
            floorGrad.addColorStop(1, "#180c08");
        }
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, floorY, width, roomHeight - floorY);

        // Плинтус
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(width, floorY);
        ctx.stroke();

        // 4. Ковер (на ранних стадиях) - Детализированный винтажный ковер с орнаментом
        if (this.roomStage < 3) {
            ctx.save();
            ctx.translate(centerX, floorY + 11);
            
            // Ворсистый край / бахрома ковра
            ctx.fillStyle = "rgba(180, 140, 70, 0.4)";
            ctx.beginPath();
            ctx.ellipse(0, 0, 114, 21, 0, 0, Math.PI * 2);
            ctx.fill();

            // Основное полотно ковра
            const rugGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 108);
            rugGrad.addColorStop(0, "#5b1d28");
            rugGrad.addColorStop(0.65, "#3b111b");
            rugGrad.addColorStop(1, "#230911");
            ctx.fillStyle = rugGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 108, 19, 0, 0, Math.PI * 2);
            ctx.fill();

            // Золотой геометрический орнамент ковра
            ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(0, 0, 94, 15, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Внутренний бордюр
            ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 72, 11, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        // 5. Размещение улучшений в комнате (Материальная графика вместо голых эмодзи!)

        // Мусор до уборки: картонная коробка из-под пиццы и мятая банка
        if (!hasCleaned && this.roomStage === 0) {
            this.drawTrashMaterials(ctx, centerX - 128, floorY + 14);
        }

        // Гантели: литые чугунные шестигранные гантели с хромированным рифленым грифом
        if (hasDumbbells) {
            this.drawDumbbellsMaterial(ctx, 36, floorY + 6);
        }

        // Игровой ПК с RGB подсветкой
        if (hasPC) {
            const pcX = width - 90, pcY = floorY - 30;
            // Стол с текстурой карбона
            ctx.fillStyle = "#1e293b";
            this.drawRoundedRect(ctx, pcX - 6, pcY + 6, 68, 6, 2);
            ctx.fill();
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(pcX - 2, pcY + 12, 4, 16);
            ctx.fillRect(pcX + 54, pcY + 12, 4, 16);

            // Тонкорамочный ультраширокий монитор
            ctx.fillStyle = "#090d16";
            this.drawRoundedRect(ctx, pcX + 4, pcY - 24, 46, 28, 4);
            ctx.fill();

            // RGB подсветка экрана и обои рабочего стола
            const hue = (this.ambientTime * 40) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // График на экране монитора
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pcX + 8, pcY - 6);
            ctx.lineTo(pcX + 20, pcY - 14);
            ctx.lineTo(pcX + 32, pcY - 10);
            ctx.lineTo(pcX + 44, pcY - 20);
            ctx.stroke();

            // Механическая клавиатура с индивидуальной подсветкой
            ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
            ctx.fillRect(pcX + 8, pcY + 1, 24, 3);
        }

        // Майнинг-ферма со светящимися диодами
        if (hasMining) {
            const mX = 26, mY = floorY - 50;
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(mX, mY, 40, 50);
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 1;
            ctx.strokeRect(mX, mY, 40, 50);

            // Диоды и вентиляторы
            for (let i = 0; i < 4; i++) {
                const ledHue = (this.ambientTime * 120 + i * 60) % 360;
                ctx.fillStyle = `hsl(${ledHue}, 100%, 50%)`;
                ctx.fillRect(mX + 4, mY + 6 + i * 11, 32, 5);
            }
        }

        // Мини-пивоварня: стальной блестящий кег с латунным краном и манометром
        if (hasBrewery) {
            this.drawBreweryMaterial(ctx, width - 42, floorY + 4);
        }

        // Робот-пылесос с сенсорной панелью
        if (hasSmartHome) {
            const vacX = centerX + 80 + Math.sin(this.ambientTime * 1.5) * 20;
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.beginPath();
            ctx.ellipse(vacX, floorY + 14, 15, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            const vacGrad = ctx.createLinearGradient(vacX - 14, floorY, vacX + 14, floorY + 12);
            vacGrad.addColorStop(0, "#e2e8f0");
            vacGrad.addColorStop(0.5, "#94a3b8");
            vacGrad.addColorStop(1, "#475569");
            ctx.fillStyle = vacGrad;
            ctx.beginPath();
            ctx.ellipse(vacX, floorY + 10, 14, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Светящееся неоновое кольцо лидара
            ctx.fillStyle = "#00f0ff";
            ctx.beginPath();
            ctx.arc(vacX, floorY + 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Телевизор в комнате (Интерактивный, кликабельный)
        const tvX = Math.max(16, centerX - 128);
        const tvY = floorY - 32;
        this.drawRetroTV(ctx, tvX, tvY);

        // 6. Диван и Скуф (Центрированы)
        ctx.save();
        ctx.translate(centerX, floorY - 4);

        // Тень дивана
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(0, 6, 80, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Спинка дивана
        const backGrad = ctx.createLinearGradient(0, -50, 0, -10);
        if (this.roomStage >= 3) {
            backGrad.addColorStop(0, "#1e1b4b");
            backGrad.addColorStop(1, "#0f172a");
        } else {
            backGrad.addColorStop(0, "#5a3a28");
            backGrad.addColorStop(1, "#3c2518");
        }
        ctx.fillStyle = backGrad;
        this.drawRoundedRect(ctx, -68, -50, 136, 40, 12);
        ctx.fill();

        // Сиденье дивана
        const seatGrad = ctx.createLinearGradient(0, -18, 0, 4);
        if (this.roomStage >= 3) {
            seatGrad.addColorStop(0, "#312e81");
            seatGrad.addColorStop(1, "#1e1b4b");
        } else {
            seatGrad.addColorStop(0, "#734932");
            seatGrad.addColorStop(1, "#4d2f1f");
        }
        ctx.fillStyle = seatGrad;
        this.drawRoundedRect(ctx, -70, -18, 66, 22, 7);
        ctx.fill();
        this.drawRoundedRect(ctx, 4, -18, 66, 22, 7);
        ctx.fill();

        // Подлокотники
        ctx.fillStyle = this.roomStage >= 3 ? "#1e1b4b" : "#5d3824";
        this.drawRoundedRect(ctx, -78, -30, 16, 34, 8);
        ctx.fill();
        this.drawRoundedRect(ctx, 62, -30, 16, 34, 8);
        ctx.fill();

        // Спящий пушистый рыжий котейка на подлокотнике (Материальная графика!)
        this.drawSleepingCat(ctx, -71, -33);

        // 7. Скуф (Дыхание, покачивание и реакция на усталость)
        const skufBreath = Math.sin(this.ambientTime * 1.6) * 0.03;
        this.skufBounce = Math.max(1.0, this.skufBounce - 0.025);
        
        const skufGlow =
            ctx.createRadialGradient(
                0,
                -24,
                8,
                0,
                -24,
                52
            );

        skufGlow.addColorStop(
            0,
            "rgba(0,229,255,0.075)"
        );

        skufGlow.addColorStop(
            1,
            "rgba(0,229,255,0)"
        );

        ctx.fillStyle =
            skufGlow;

        ctx.beginPath();

        ctx.arc(
            0,
            -24,
            52,
            0,
            Math.PI * 2
        );

        ctx.fill();
        ctx.save();
        ctx.translate(0, -18);
        const skufVisualScale =
            width < 380
                ? 1.08
                : 1.16;

        ctx.scale(
            skufVisualScale *
                (1 - skufBreath * 0.5) *
                this.skufBounce,

            skufVisualScale *
                (1 + skufBreath) *
                this.skufBounce
        );
        ctx.translate(0, 18);

        // Золотая аура Гигачада
        if (hasGigachadAura) {
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 24;
            ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, -22, 38, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Процедурный каноничный Скуф на диване (Векторная графика!)
        this.drawSkufSitting(ctx, {
            isExhausted: game.isExhausted,
            isIdle: this.idleTimer > 2.5,
            bounce: this.skufBounce,
            hasGigachad: hasGigachadAura,
            stage: this.roomStage,
            ambientTime: this.ambientTime
        });

        // Индикатор одышки
        if (game.isExhausted) {
            ctx.font = "16px Arial";
            ctx.fillText("💦", 22, -48);
        }
        ctx.restore();

        // Частицы храпа Zzz при простое
        if (this.idleTimer > 2.5 && !game.isExhausted) {
            if (Math.random() < 0.035) {
                this.zzzParticles.push({
                    x: 6, y: -46,
                    vx: Math.random() * 0.3 + 0.2,
                    vy: -0.55,
                    alpha: 1.0,
                    size: 11
                });
            }
        }

        this.zzzParticles.forEach((zp, idx) => {
            zp.x += zp.vx;
            zp.y += zp.vy;
            zp.alpha -= 0.016;
            ctx.font = `bold ${zp.size}px 'Segoe UI', sans-serif`;
            ctx.fillStyle = `rgba(186, 230, 253, ${zp.alpha})`;
            ctx.fillText("z", zp.x, zp.y);
            if (zp.alpha <= 0) this.zzzParticles.splice(idx, 1);
        });

        ctx.restore(); // Конец блока дивана

        // 8. Вспышка эндорфинов
        if (this.endorphinFlash > 0) {
            ctx.fillStyle = `rgba(255, 215, 0, ${this.endorphinFlash * 0.35})`;
            ctx.fillRect(0, 0, width, roomHeight);
            this.endorphinFlash = Math.max(0, this.endorphinFlash - 0.035);
        }

        // 9. Неоновый разделитель (Переход в стакан мыслей)
        ctx.fillStyle = "#080711";
        ctx.fillRect(0, roomHeight, width, 24);
        const divY = roomHeight + 5;

        // Неоновая светящаяся линия
        ctx.strokeStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(14, divY);
        ctx.lineTo(width - 14, divY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Плашка "Чертоги разума" опущена НИЖЕ синей линии
        const badgeW = 146;
        const badgeH = 15;
        const badgeY = divY + 6;
        ctx.fillStyle = "rgba(8, 12, 24, 0.92)";
        this.drawRoundedRect(ctx, centerX - badgeW / 2, badgeY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "bold 8.5px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#67e8f9";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🧠 ЧЕРТОГИ РАЗУМА 🧠", centerX, badgeY + badgeH / 2 + 0.5);
    }

    // --- МАТЕРИАЛЬНЫЕ ОТРИСОВКИ ПРЕДМЕТОВ КОМНАТЫ (ВМЕСТО ЭМОДЗИ) ---

    // 1. Литые чугунные гантели из реальных материалов
    drawDumbbellsMaterial(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Прорезиненный спортивный коврик под снаряды
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        this.drawRoundedRect(ctx, -6, -6, 52, 24, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Задняя гантель (под легким углом)
        ctx.save();
        ctx.translate(12, -2);
        ctx.rotate(-0.15);
        // Задний гриф
        ctx.fillStyle = "#64748b";
        ctx.fillRect(5, 3, 18, 3);
        // Задние диски
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, 6, 9);
        ctx.fillRect(21, 0, 6, 9);
        ctx.restore();

        // Передняя основная чугунная гантель
        // Тень
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.ellipse(20, 13, 20, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Хромированный рифленый гриф со стальным градиентом
        const barGrad = ctx.createLinearGradient(0, 2, 0, 9);
        barGrad.addColorStop(0, "#cbd5e1");
        barGrad.addColorStop(0.5, "#ffffff");
        barGrad.addColorStop(1, "#475569");
        ctx.fillStyle = barGrad;
        ctx.fillRect(6, 4, 20, 4);

        // Насечка на грифе
        ctx.strokeStyle = "rgba(30, 41, 59, 0.6)";
        ctx.lineWidth = 0.8;
        for (let gx = 9; gx <= 23; gx += 3) {
            ctx.beginPath();
            ctx.moveTo(gx, 4);
            ctx.lineTo(gx, 8);
            ctx.stroke();
        }

        // Левый шестигранный чугунный диск
        this.drawHexPlate(ctx, 0, 0, 8, 13);
        // Правый шестигранный чугунный диск
        this.drawHexPlate(ctx, 24, 0, 8, 13);

        // Аккуратная плашка с весом под ковриком
        ctx.fillStyle = "rgba(2, 6, 23, 0.9)";
        this.drawRoundedRect(ctx, 6, 11, 20, 6.5, 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Четкая надпись веса
        ctx.font = "bold 5.5px 'Segoe UI', system-ui, sans-serif";
        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("16 KG", 16, 14.5);

        ctx.restore();
    }

    // Шестигранный диск гантели с металлической фаской
    drawHexPlate(ctx, px, py, pw, ph) {
        const plateGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
        plateGrad.addColorStop(0, "#334155");
        plateGrad.addColorStop(0.4, "#1e293b");
        plateGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = plateGrad;
        this.drawRoundedRect(ctx, px, py, pw, ph, 2);
        ctx.fill();

        // Металлическая фаска / блик по верхнему контуру
        ctx.strokeStyle = "rgba(203, 213, 225, 0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 2. Стальная мини-пивоварня / блестящий кег
    drawBreweryMaterial(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Тень под кегом
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.ellipse(14, 15, 15, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Корпус кега из матовой нержавеющей стали с вертикальным зеркальным градиентом
        const steelGrad = ctx.createLinearGradient(0, -18, 26, -18);
        steelGrad.addColorStop(0, "#334155");
        steelGrad.addColorStop(0.2, "#94a3b8");
        steelGrad.addColorStop(0.45, "#f8fafc");
        steelGrad.addColorStop(0.7, "#64748b");
        steelGrad.addColorStop(1, "#1e293b");
        ctx.fillStyle = steelGrad;
        this.drawRoundedRect(ctx, 2, -18, 24, 31, 3);
        ctx.fill();

        // Ребра жесткости кега
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(3, -9); ctx.lineTo(25, -9);
        ctx.moveTo(3, 3); ctx.lineTo(25, 3);
        ctx.stroke();

        ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
        ctx.beginPath();
        ctx.moveTo(3, -8); ctx.lineTo(25, -8);
        ctx.moveTo(3, 4); ctx.lineTo(25, 4);
        ctx.stroke();

        // Латунный пивной кран
        const brassGrad = ctx.createLinearGradient(16, -14, 34, -8);
        brassGrad.addColorStop(0, "#f59e0b");
        brassGrad.addColorStop(0.5, "#fef08a");
        brassGrad.addColorStop(1, "#b45309");
        ctx.fillStyle = brassGrad;
        // Носик крана
        ctx.fillRect(23, -11, 8, 3);
        ctx.fillRect(28, -8, 3, 5);

        // Ручка крана из темного дерева
        ctx.fillStyle = "#78350f";
        this.drawRoundedRect(ctx, 25, -20, 4, 10, 1.5);
        ctx.fill();

        // Манометр давления
        ctx.beginPath();
        ctx.arc(8, -10, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Красная стрелка манометра
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, -10);
        ctx.lineTo(10.5, -12);
        ctx.stroke();

        // Поддон для сбора капель внизу
        ctx.fillStyle = "#0f172a";
        this.drawRoundedRect(ctx, 20, 9, 11, 4, 1);
        ctx.fill();

        ctx.restore();
    }

    // 3. Мусор до уборки: картонная коробка из-под пиццы и алюминиевая банка
    drawTrashMaterials(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Тень мусора
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(14, 6, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Коробка для пиццы из гофрированного крафт-картона
        ctx.save();
        ctx.rotate(-0.06);
        ctx.fillStyle = "#b45309";
        this.drawRoundedRect(ctx, 0, -4, 24, 8, 1.5);
        ctx.fill();
        // Крышка коробки
        ctx.fillStyle = "#d97706";
        this.drawRoundedRect(ctx, 0, -6, 24, 3, 1);
        ctx.fill();

        // Жирное пятно от пиццы на коробке
        ctx.fillStyle = "rgba(180, 83, 9, 0.45)";
        ctx.beginPath();
        ctx.arc(12, -2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Ретро-надпись на коробке
        ctx.font = "bold 5px system-ui, sans-serif";
        ctx.fillStyle = "#dc2626";
        ctx.fillText("PIZZA", 4, -1);
        ctx.restore();

        // Мятая алюминиевая банка газировки рядом
        ctx.save();
        ctx.translate(26, -2);
        ctx.rotate(0.35);
        const canGrad = ctx.createLinearGradient(0, 0, 8, 12);
        canGrad.addColorStop(0, "#ef4444");
        canGrad.addColorStop(0.4, "#fca5a5");
        canGrad.addColorStop(0.7, "#dc2626");
        canGrad.addColorStop(1, "#991b1b");
        ctx.fillStyle = canGrad;
        this.drawRoundedRect(ctx, 0, 0, 7, 10, 1.5);
        ctx.fill();

        // Серебристый ободок и ключ банки
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(0, 0, 7, 1.5);
        ctx.fillRect(0, 9, 7, 1);
        ctx.restore();

        ctx.restore();
    }

    // 4. Интерактивный ретро-телевизор с переключением каналов
    drawRetroTV(ctx, tvX, tvY) {
        ctx.save();
        ctx.translate(tvX, tvY);

        // Тень тумбы
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(20, 35, 18, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ножки тумбочки
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, 28); ctx.lineTo(3, 34);
        ctx.moveTo(34, 28); ctx.lineTo(37, 34);
        ctx.stroke();

        // Деревянный корпус телевизора
        const tvGrad = ctx.createLinearGradient(0, 0, 0, 28);
        tvGrad.addColorStop(0, "#78350f");
        tvGrad.addColorStop(1, "#451a03");
        ctx.fillStyle = tvGrad;
        this.drawRoundedRect(ctx, 0, 0, 40, 28, 4);
        ctx.fill();
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Антенна-усы на крыше
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(18, 0); ctx.lineTo(10, -8);
        ctx.moveTo(22, 0); ctx.lineTo(30, -8);
        ctx.stroke();

        // Экран кинескопа
        const screenGrad = ctx.createLinearGradient(3, 3, 27, 24);
        screenGrad.addColorStop(0, "#0f172a");
        screenGrad.addColorStop(0.5, "#1e293b");
        screenGrad.addColorStop(1, "#020617");
        ctx.fillStyle = screenGrad;
        this.drawRoundedRect(ctx, 3, 3, 25, 22, 3);
        ctx.fill();

        // Картинка текущего канала на экране
        const channels = CONFIG.TV_CHANNELS || [];
        const chan = channels.length > 0 ? channels[this.currentChannel % channels.length] : null;
        if (chan) {
            ctx.font = "11px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(chan.icon, 15, 14);

            // Бегающая полоса CRT сканирования
            const scanY = 4 + (this.ambientTime * 18) % 19;
            ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
            ctx.fillRect(3, scanY, 25, 1.5);
        }

        // Правая панель с ручками громкости/каналов
        ctx.fillStyle = "#292524";
        this.drawRoundedRect(ctx, 30, 4, 7, 20, 2);
        ctx.fill();

        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(33.5, 9, 2, 0, Math.PI * 2);
        ctx.arc(33.5, 16, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // 5. Спящий пушистый рыжий котейка на подлокотнике
    drawSleepingCat(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        if (this.catPurrTimer > 0) {
            this.catPurrTimer = Math.max(0, this.catPurrTimer - 0.025);
            this.catBounce = Math.max(1.0, this.catBounce - 0.025);
            ctx.scale(this.catBounce, this.catBounce);
            // Floating heart
            const heartOffset = (2.5 - this.catPurrTimer) * 12;
            const heartAlpha = Math.min(1, this.catPurrTimer);
            ctx.font = "10px system-ui";
            ctx.fillStyle = `rgba(244, 114, 182, ${heartAlpha})`;
            ctx.textAlign = "center";
            ctx.fillText("❤️", 2, -12 - heartOffset);
        }

        // Мягкая тень кота
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.ellipse(0, 4, 11, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Пушистое свернувшееся тельце (градиент рыжей шерсти)
        const catGrad = ctx.createRadialGradient(-1, -1, 2, 0, 0, 11);
        catGrad.addColorStop(0, "#fb923c");
        catGrad.addColorStop(0.6, "#f97316");
        catGrad.addColorStop(1, "#c2410c");
        ctx.fillStyle = catGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 6.5, -0.05, 0, Math.PI * 2);
        ctx.fill();

        // Полоски шерсти (табби)
        ctx.strokeStyle = "rgba(154, 52, 18, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, -4); ctx.lineTo(-4, -1);
        ctx.moveTo(-1, -5); ctx.lineTo(-1, -2);
        ctx.moveTo(3, -4); ctx.lineTo(2, -1);
        ctx.stroke();

        // Пушистый свернувшийся хвостик с белым кончиком
        ctx.strokeStyle = "#ea580c";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(-4, 2, 5, 0.5, Math.PI * 0.9);
        ctx.stroke();

        // Белый кончик хвоста
        ctx.strokeStyle = "#ffedd5";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-4, 2, 5, 0.5, 0.9);
        ctx.stroke();

        // Голова кота
        ctx.fillStyle = "#fb923c";
        ctx.beginPath();
        ctx.arc(5, -2, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Ушки
        ctx.fillStyle = "#ea580c";
        ctx.beginPath();
        ctx.moveTo(3, -6); ctx.lineTo(5, -8.5); ctx.lineTo(6.5, -5.5); ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(6.5, -5.5); ctx.lineTo(8.5, -7.5); ctx.lineTo(9.5, -4.5); ctx.closePath();
        ctx.fill();
        // Розовые серединки ушек
        ctx.fillStyle = "#fda4af";
        ctx.beginPath();
        ctx.moveTo(4, -6); ctx.lineTo(5, -7.5); ctx.lineTo(5.8, -5.8); ctx.closePath();
        ctx.fill();

        // Мордочка и закрытые спящие глазки-полумесяцы
        ctx.strokeStyle = "#7c2d12";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(4.5, -2, 1.2, 0.2, Math.PI * 0.8);
        ctx.arc(7.2, -2, 1.2, 0.2, Math.PI * 0.8);
        ctx.stroke();

        // Розовый носик
        ctx.fillStyle = "#fb7185";
        ctx.beginPath();
        ctx.arc(5.8, -0.8, 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Мягкое мерцающее Zzz над котом
        const zAlpha = (Math.sin(this.ambientTime * 3) + 1) * 0.35 + 0.3;
        ctx.font = "bold 8px system-ui, sans-serif";
        ctx.fillStyle = `rgba(186, 230, 253, ${zAlpha})`;
        ctx.fillText("z", 8, -9);

        ctx.restore();
    }

    // 6. Процедурный каноничный Скуф на диване
    drawSkufSitting(ctx, options = {}) {
        const isExhausted = !!options.isExhausted;
        const isIdle = !!options.isIdle;
        const bounce = options.bounce || 1.0;
        const hasGigachad = !!options.hasGigachad;
        const stage = options.stage || 0;
        const ambientTime = options.ambientTime || 0;

        ctx.save();

        // 1. Ноги в домашних синих трениках / шортах
        ctx.fillStyle = stage >= 3 ? "#1e293b" : "#1d4ed8";
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-24, -4, 20, 16, 6);
            ctx.roundRect(4, -4, 20, 16, 6);
        } else {
            ctx.rect(-24, -4, 20, 16);
            ctx.rect(4, -4, 20, 16);
        }
        ctx.fill();

        // Домашние тапочки
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.ellipse(-14, 11, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.ellipse(14, 11, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Тело и пивное пузико
        ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
        ctx.beginPath();
        ctx.ellipse(0, -14, 26, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Майка-алкоголичка (или золотой халат при хай-ранге)
        const shirtGrad = ctx.createLinearGradient(0, -38, 0, -2);
        if (stage >= 3 || hasGigachad) {
            shirtGrad.addColorStop(0, "#fbbf24");
            shirtGrad.addColorStop(1, "#b45309");
        } else {
            shirtGrad.addColorStop(0, "#f8fafc");
            shirtGrad.addColorStop(0.7, "#e2e8f0");
            shirtGrad.addColorStop(1, "#cbd5e1");
        }
        ctx.fillStyle = shirtGrad;
        
        // Торс (округлый силуэт с пузом)
        ctx.beginPath();
        ctx.ellipse(0, -18, 23, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Складка на пузе
        ctx.strokeStyle = stage >= 3 ? "rgba(255, 255, 255, 0.35)" : "rgba(148, 163, 184, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -14, 14, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Вырез майки
        ctx.strokeStyle = stage >= 3 ? "#ffd700" : "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -32, 11, 0, Math.PI);
        ctx.stroke();

        // Шея и грудь
        ctx.fillStyle = "#fed7aa";
        ctx.beginPath();
        ctx.arc(0, -32, 10, 0, Math.PI);
        ctx.fill();

        // Золотая цепочка (при гигачаде или престиже)
        if (hasGigachad || stage >= 2) {
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -29, 9, 0.2, Math.PI - 0.2);
            ctx.stroke();
            // Медальон
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.arc(0, -20, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Руки Скуфа
        // Левая рука с пультом от телевизора
        ctx.fillStyle = "#fed7aa";
        ctx.beginPath();
        ctx.ellipse(-24, -18, 7, 14, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Черный пульт
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-35, -22, 13, 7.5);
        // Красный диод пульта (мигает)
        ctx.fillStyle = Math.sin(ambientTime * 6) > 0 ? "#ef4444" : "#991b1b";
        ctx.beginPath();
        ctx.arc(-34, -18.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Правая рука держит холодную баночку напитка
        ctx.fillStyle = "#fed7aa";
        ctx.beginPath();
        ctx.ellipse(24, -18, 7, 14, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Баночка с золотой этикеткой
        const canGrad = ctx.createLinearGradient(23, -27, 33, -27);
        canGrad.addColorStop(0, "#eab308");
        canGrad.addColorStop(0.5, "#fef08a");
        canGrad.addColorStop(1, "#ca8a04");
        ctx.fillStyle = canGrad;
        ctx.fillRect(23, -27, 10, 15);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(23, -29, 10, 2.5);

        // 4. Голова и лицо Скуфа
        const headY = -42;
        // Двойной подбородок
        ctx.fillStyle = "#fdba74";
        ctx.beginPath();
        ctx.ellipse(0, headY + 12, 15, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Круглая голова
        const skinGrad = ctx.createRadialGradient(-3, headY - 4, 4, 0, headY, 20);
        skinGrad.addColorStop(0, "#ffedd5");
        skinGrad.addColorStop(0.8, "#fed7aa");
        skinGrad.addColorStop(1, "#fdba74");
        ctx.fillStyle = skinGrad;
        ctx.beginPath();
        ctx.ellipse(0, headY, 18, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3-дневная щетина / бородка
        ctx.fillStyle = "rgba(100, 116, 139, 0.35)";
        ctx.beginPath();
        ctx.arc(0, headY + 5, 13, 0.1, Math.PI - 0.1);
        ctx.fill();

        // Волосы: редеющие по бокам с залысиной по центру
        ctx.fillStyle = "#451a03";
        ctx.beginPath();
        ctx.ellipse(-16, headY - 8, 4, 10, -0.3, 0, Math.PI * 2);
        ctx.ellipse(16, headY - 8, 4, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Зачес на залысине
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(-4, headY - 14, 10, -0.8, 0.6);
        ctx.stroke();

        // Корона Гигачада на голове (если открыт Гигачад или стадия 4)
        if (hasGigachad || stage >= 4) {
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.moveTo(-12, headY - 16);
            ctx.lineTo(-14, headY - 26);
            ctx.lineTo(-6, headY - 21);
            ctx.lineTo(0, headY - 29);
            ctx.lineTo(6, headY - 21);
            ctx.lineTo(14, headY - 26);
            ctx.lineTo(12, headY - 16);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#b45309";
            ctx.lineWidth = 1;
            ctx.stroke();
            // Рубин
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(0, headY - 20, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Брови
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        if (isExhausted) {
            ctx.moveTo(-11, headY - 6);
            ctx.lineTo(-3, headY - 8);
            ctx.moveTo(3, headY - 8);
            ctx.lineTo(11, headY - 6);
        } else if (bounce > 1.1) {
            ctx.moveTo(-11, headY - 10);
            ctx.lineTo(-3, headY - 9);
            ctx.moveTo(3, headY - 9);
            ctx.lineTo(11, headY - 10);
        } else {
            ctx.moveTo(-11, headY - 7);
            ctx.lineTo(-3, headY - 7);
            ctx.moveTo(3, headY - 7);
            ctx.lineTo(11, headY - 7);
        }
        ctx.stroke();

        // Глаза
        if (isIdle && !isExhausted) {
            // Закрытые спящие глаза
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(-7, headY - 3, 4, 0.2, Math.PI - 0.2);
            ctx.arc(7, headY - 3, 4, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else if (isExhausted) {
            // Прищуренные уставшие глаза
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-10, headY - 3);
            ctx.lineTo(-4, headY - 3);
            ctx.moveTo(4, headY - 3);
            ctx.lineTo(10, headY - 3);
            ctx.stroke();
        } else {
            // Открытые глаза с белками и зрачками
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(-7, headY - 3, 4.5, 3.5, 0, 0, Math.PI * 2);
            ctx.ellipse(7, headY - 3, 4.5, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Зрачки (смотрят в сторону экрана ТВ)
            ctx.fillStyle = "#1e293b";
            ctx.beginPath();
            ctx.arc(-8.5, headY - 3, 2, 0, Math.PI * 2);
            ctx.arc(5.5, headY - 3, 2, 0, Math.PI * 2);
            ctx.fill();

            // Блики в глазах
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-9, headY - 4, 0.8, 0, Math.PI * 2);
            ctx.arc(5, headY - 4, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Нос картошкой
        ctx.fillStyle = "#fca5a5";
        ctx.beginPath();
        ctx.ellipse(0, headY + 1, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(225, 29, 72, 0.35)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Рот
        ctx.strokeStyle = "#7f1d1d";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (bounce > 1.1) {
            ctx.fillStyle = "#991b1b";
            ctx.arc(0, headY + 6, 5, 0, Math.PI);
            ctx.fill();
            ctx.stroke();
        } else if (isExhausted) {
            ctx.fillStyle = "#991b1b";
            ctx.ellipse(0, headY + 7, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.arc(0, headY + 5, 5, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
