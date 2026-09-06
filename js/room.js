class RoomRenderer {
    constructor() {
        this.skufBounce = 1.0;
        this.endorphinFlash = 0.0;
        this.ambientTime = 0;
        this.roomStage = 0;

        this.dustParticles = Array.from({length: 20}, () => ({
            x: 40 + Math.random() * 140,
            y: 40 + Math.random() * 140,
            radius: Math.random() * 1.6 + 0.6,
            speedX: (Math.random() - 0.5) * 0.25,
            speedY: -Math.random() * 0.25 - 0.05,
            alpha: Math.random() * 0.7 + 0.2
        }));

        this.stars = Array.from({length: 14}, () => ({
            x: 32 + Math.random() * 60,
            y: 34 + Math.random() * 50,
            size: Math.random() * 1.5 + 0.8,
            phase: Math.random() * Math.PI * 2
        }));

        this.cosmicStars = Array.from({length: 80}, () => ({
            x: Math.random() * 520,
            y: Math.random() * 215,
            size: Math.random() * 2 + 0.5,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.5 + 0.2
        }));

        this.zzzParticles = [];
        this.idleTimer = 0;
    }

    updateRoomStage(stage) {
        this.roomStage = stage;
    }

    triggerSkufBounce() {
        this.skufBounce = 1.35;
        this.idleTimer = 0;
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

    draw(ctx, width, game) {
        this.ambientTime += 0.025;
        this.idleTimer += 1 / 60;
        const roomH = CONFIG.ROOM_HEIGHT;
        const floorY = roomH - 38;
        const centerX = width / 2;
        
        // Проверяем покупки улучшений
        const hasCleaned = CONFIG.UPGRADES.room.find(u => u.id === 'r1').bought;
        const hasPC = CONFIG.UPGRADES.room.find(u => u.id === 'r2').bought;
        const hasMining = CONFIG.UPGRADES.room.find(u => u.id === 'r3').bought;
        const hasDumbbells = CONFIG.UPGRADES.hero.find(u => u.id === 'h1').bought;

        // 1. Окружение (стены/космос)
        if (this.roomStage === 4) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, roomH);
            this.cosmicStars.forEach(s => {
                s.twinkle += s.speed * 0.02;
                ctx.fillStyle = `rgba(255, 255, 255, ${(Math.sin(s.twinkle) + 1) * 0.4 + 0.2})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
        } else {
            const wallGrad = ctx.createLinearGradient(0, 0, 0, roomH);
            wallGrad.addColorStop(0, "#18121d");
            wallGrad.addColorStop(1, "#17101b");
            ctx.fillStyle = wallGrad;
            ctx.fillRect(0, 0, width, roomH);

            ctx.fillStyle = "rgba(255, 255, 255, 0.016)";
            for (let x = 12; x < width; x += 24) {
                ctx.fillRect(x, 0, 8, floorY);
            }
        }

        // 2. Пол
        if (this.roomStage < 4) {
            const floorGrad = ctx.createLinearGradient(0, floorY, 0, roomH);
            floorGrad.addColorStop(0, "#2c1a12");
            floorGrad.addColorStop(1, "#160d08");
            ctx.fillStyle = floorGrad;
            ctx.fillRect(0, floorY, width, 38);

            ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, floorY + 18);
            ctx.lineTo(width, floorY + 18);
            ctx.stroke();
        }

        // 3. Окно и свет (Хрущёвка)
        if (this.roomStage === 0) {
            const winX = 26, winY = 26, winW = 74, winH = 86;
            ctx.fillStyle = "#060a14";
            this.drawRoundedRect(ctx, winX, winY, winW, winH, 6);
            ctx.fill();

            this.stars.forEach(st => {
                const twinkle = (Math.sin(this.ambientTime * 2 + st.phase) + 1) * 0.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + twinkle * 0.7})`;
                ctx.fillRect(st.x, st.y, st.size, st.size);
            });

            // Луна
            ctx.fillStyle = "#fffdf0";
            ctx.beginPath();
            ctx.arc(winX + 54, winY + 28, 8.5, 0, Math.PI * 2);
            ctx.fill();

            // Рама
            ctx.strokeStyle = "#43281c";
            ctx.lineWidth = 4;
            this.drawRoundedRect(ctx, winX, winY, winW, winH, 6);
            ctx.stroke();

            // Луч света
            const lightBeam = ctx.createLinearGradient(winX + 30, winY + 35, winX + 170, floorY + 20);
            lightBeam.addColorStop(0, "rgba(180, 220, 255, 0.13)");
            lightBeam.addColorStop(1, "rgba(180, 220, 255, 0.0)");
            ctx.fillStyle = lightBeam;
            ctx.beginPath();
            ctx.moveTo(winX + winW, winY + 14);
            ctx.lineTo(winX + 175, floorY + 25);
            ctx.lineTo(winX + 55, floorY + 25);
            ctx.lineTo(winX, winY + winH);
            ctx.closePath();
            ctx.fill();

            // Пылинки
            this.dustParticles.forEach(dp => {
                dp.x += dp.speedX;
                dp.y += dp.speedY;
                if (dp.y < winY + 10) dp.y = floorY + 15;
                if (dp.x < winX + 10) dp.x = winX + 140;
                if (dp.x > winX + 160) dp.x = winX + 20;
                ctx.fillStyle = `rgba(220, 240, 255, ${dp.alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(dp.x, dp.y, dp.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // 4. Ковер (Центрирован)
        if (this.roomStage < 3) {
            ctx.save();
            ctx.translate(centerX, floorY + 14);
            const rugGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 110);
            rugGrad.addColorStop(0, "#4a1e28");
            rugGrad.addColorStop(0.7, "#35141c");
            rugGrad.addColorStop(1, "#240b12");
            ctx.fillStyle = rugGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 115, 22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 215, 0, 0.22)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        // 5. Визуализация улучшений в комнате
        if (this.roomStage === 0 && !hasCleaned) {
            ctx.font = "20px Arial";
            ctx.fillText("🍕", centerX - 130, floorY + 18);
            ctx.fillText("🥫", centerX - 110, floorY + 22);
            ctx.fillText("📦", centerX - 155, floorY + 25);
        }

        if (hasDumbbells) {
            ctx.fillStyle = "#1e2430";
            this.drawRoundedRect(ctx, 40, floorY + 10, 40, 16, 4);
            ctx.fill();
            ctx.font = "20px Arial";
            ctx.fillText("🏋️", 48, floorY + 25);
        }

        if (hasPC) {
            const dx = width - 100, dy = floorY - 35;
            ctx.fillStyle = "#1c202a";
            this.drawRoundedRect(ctx, dx, dy, 70, 8, 3);
            ctx.fill();
            
            ctx.fillStyle = "#11141c";
            ctx.fillRect(dx + 5, dy + 8, 6, 28);
            ctx.fillRect(dx + 59, dy + 8, 6, 28);
            
            ctx.fillStyle = "#0a0d14";
            this.drawRoundedRect(ctx, dx + 10, dy - 30, 50, 32, 5);
            ctx.fill();
            
            const hue = (this.ambientTime * 35) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 55%)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.fillStyle = `hsl(${hue}, 90%, 75%)`;
            ctx.fillRect(dx + 15, dy - 20, 25, 2);
            ctx.fillRect(dx + 15, dy - 12, 15, 2);
        }

        if (hasMining) {
            const rx = 30, ry = floorY - 60;
            ctx.fillStyle = "#111";
            ctx.fillRect(rx, ry, 45, 60);
            const hue = (this.ambientTime * 150) % 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(rx + 5, ry + 8 + i * 12, 35, 6);
            }
        }

        // 6. Диван и Скуф (Центрированы)
        ctx.save();
        ctx.translate(centerX, floorY - 6);

        // Тень под диваном
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(0, 8, 85, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const couchW = 160;
        ctx.fillStyle = "#1c1109";
        ctx.fillRect(-65, 2, 10, 8);
        ctx.fillRect(55, 2, 10, 8);

        const backGrad = ctx.createLinearGradient(0, -56, 0, -14);
        backGrad.addColorStop(0, "#5a3a2a");
        backGrad.addColorStop(1, "#3c251a");
        ctx.fillStyle = backGrad;
        this.drawRoundedRect(ctx, -70, -56, 140, 44, 14);
        ctx.fill();

        const seatGrad = ctx.createLinearGradient(0, -22, 0, 4);
        seatGrad.addColorStop(0, "#734a36");
        seatGrad.addColorStop(1, "#4d3022");
        ctx.fillStyle = seatGrad;
        this.drawRoundedRect(ctx, -72, -20, 68, 24, 8);
        ctx.fill();
        this.drawRoundedRect(ctx, 4, -20, 68, 24, 8);
        ctx.fill();

        ctx.fillStyle = "#633f2d";
        this.drawRoundedRect(ctx, -82, -34, 18, 38, 9);
        ctx.fill();
        this.drawRoundedRect(ctx, 64, -34, 18, 38, 9);
        ctx.fill();

        // Спящий кот на подлокотнике
        ctx.save();
        ctx.translate(-76, -38);
        ctx.fillStyle = "#88d49e";
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "8px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText("💤", 4, -8);
        ctx.restore();

        // 7. Скуф (Замедленное дыхание и правильный пульс)
        const skufBreath = Math.sin(this.ambientTime * 1.5) * 0.025;
        this.skufBounce = Math.max(1.0, this.skufBounce - 0.02);
        
        ctx.save();
        ctx.translate(0, -20);
        ctx.scale((1 - skufBreath * 0.5) * this.skufBounce, (1 + skufBreath) * this.skufBounce);
        ctx.translate(0, 20);

        const skufImg = (game.charImages && game.charImages[8]) ? game.charImages[8] : null;
        if (skufImg && skufImg.complete && skufImg.naturalWidth > 0) {
            ctx.drawImage(skufImg, -35, -55, 70, 70);
        } else {
            ctx.font = "46px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🛋️", 0, -22);
        }

        if (game.isExhausted) {
            ctx.font = "16px Arial";
            ctx.fillText("💦", 20, -45);
        }
        ctx.restore();

        // Храп Zzz
        if (this.idleTimer > 3.0 && !game.isExhausted) {
            if (Math.random() < 0.03) {
                this.zzzParticles.push({
                    x: 8, y: -50,
                    vx: Math.random() * 0.4 + 0.2,
                    vy: -0.6,
                    alpha: 1.0,
                    size: 12
                });
            }
        }

        this.zzzParticles.forEach((zp, idx) => {
            zp.x += zp.vx;
            zp.y += zp.vy;
            zp.alpha -= 0.015;
            ctx.font = `bold ${zp.size}px 'Segoe UI', sans-serif`;
            ctx.fillStyle = `rgba(186, 230, 253, ${zp.alpha})`;
            ctx.fillText("z", zp.x, zp.y);
            if (zp.alpha <= 0) this.zzzParticles.splice(idx, 1);
        });

        ctx.restore(); // Конец блока дивана

        // 8. Вспышка эндорфинов
        if (this.endorphinFlash > 0) {
            ctx.fillStyle = `rgba(255, 215, 0, ${this.endorphinFlash * 0.35})`;
            ctx.fillRect(0, 0, width, roomH);
            this.endorphinFlash = Math.max(0, this.endorphinFlash - 0.03);
        }

        // 9. Электро-шлюз
        ctx.fillStyle = "#090810";
        ctx.fillRect(0, roomH, width, CONFIG.BRAIN_TOP_Y - roomH);
        const dividerY = CONFIG.BRAIN_TOP_Y - 2;

        ctx.strokeStyle = "rgba(0, 240, 255, 0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, dividerY);
        ctx.lineTo(width - 12, dividerY);
        ctx.stroke();

        ctx.font = "bold 9px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#64d8ff";
        ctx.textAlign = "center";
        ctx.fillText("🧠 ЧЕРТОГИ РАЗУМА (МЫСЛИ СКУФА) 🧠", width / 2, dividerY - 4);
    }
}