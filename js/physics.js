/**
 * BrainPhysics - физический движок стакана мыслей на базе Matter.js
 * Реализует структуру createPhysicsWorld, collisionStart + collisionActive,
 * limitVelocity, enableSleeping: true, positionIterations: 10, velocityIterations: 8.
 */
class BrainPhysics {
    constructor(canvas, onMerge, onGarbageDestroyed) {
        this.canvas = canvas;
        this.onMerge = onMerge;
        this.onGarbageDestroyed = onGarbageDestroyed;
        this.mergeQueue = [];
        this.cupWidthOffset = 0;
        this.cupTopY = 180;
        this.maxSpeed = 22; // Защита от туннелирования шаров на высокой скорости
        this.radiusScale = 1;

        const { Engine } = Matter;
        this.engine = Engine.create({ 
            enableSleeping: true,
            gravity: { x: 0, y: 0.48, scale: 0.00065 },
            positionIterations: 10,
            velocityIterations: 8
        });
        this.world = this.engine.world;
        
        this.walls = [];
        this.leftWall = null;
        this.rightWall = null;
        this.floorBody = null;

        this.buildCupWalls();
        this.setupCollisionEvents();
    }

    setDimensions(roomHeight) {
        this.cupTopY = roomHeight + 16;
        this.buildCupWalls();
    }

    getCupBounds() {
        const w = this.canvas.width || 360;
        const h = this.canvas.height || 640;
        const baseMargin = 14;
        const maxExpand = Math.max(0, baseMargin - 4);
        const expansion = Math.min(maxExpand, Math.max(0, (this.cupWidthOffset || 0) * 0.5));
        
        let leftX = Math.max(8, baseMargin - expansion);
        let rightX = Math.min(w - 8, w - (baseMargin - expansion));

        // На широких экранах центрируем стакан
        const maxCupW = 600 + (this.cupWidthOffset || 0);
        if (w > maxCupW + 40) {
            const extra = Math.floor((w - maxCupW) / 2);
            leftX = extra;
            rightX = w - extra;
        }

        return {
            leftX,
            rightX,
            width: rightX - leftX,
            topY: this.cupTopY,
            bottomY: h - 6
        };
    }

    getTierRadius(tier) {
        const conf =
            CONFIG.TIERS[tier] ||
            CONFIG.TIERS[1];

        return conf.radius *
            this.radiusScale;
    }

    setRadiusScale(scale) {
        const nextScale =
            Math.max(
                0.52,
                Math.min(
                    1,
                    scale
                )
            );

        const oldScale =
            this.radiusScale || 1;

        if (
            Math.abs(
                nextScale - oldScale
            ) < 0.01
        ) {
            return;
        }

        const ratio =
            nextScale /
            oldScale;

        this.radiusScale =
            nextScale;

        const bodies =
            Matter.Composite
                .allBodies(this.world)
                .filter(
                    b =>
                        !b.isStatic &&
                        !b.isDead
                );

        bodies.forEach(body => {
            Matter.Body.scale(
                body,
                ratio,
                ratio
            );
        });

        this.keepBodiesInBounds();
    }

    clearAllBodies() {
        const bodies = Matter.Composite.allBodies(this.world);
        bodies.forEach(b => {
            if (!b.isStatic) {
                b.isDead = true;
                Matter.World.remove(this.world, b);
            }
        });
        this.mergeQueue = [];
    }

    serializeDynamicBodies() {
        const bounds =
            this.getCupBounds();

        const cupHeight =
            Math.max(
                1,
                bounds.bottomY - bounds.topY
            );

        return Matter.Composite
            .allBodies(this.world)
            .filter(
                body =>
                    !body.isStatic &&
                    !body.isDead
            )
            .map(body => ({
                kind:
                    body.isGarbage
                        ? 'garbage'
                        : 'thought',

                tier:
                    body.tier || null,

                garbageId:
                    body.garbageId || null,

                // Сохраняем относительно размеров стакана
                nx:
                    (body.position.x -
                        bounds.leftX) /
                    bounds.width,

                ny:
                    (body.position.y -
                        bounds.topY) /
                    cupHeight,

                vx:
                    body.velocity.x,

                vy:
                    body.velocity.y,

                angle:
                    body.angle,

                angularVelocity:
                    body.angularVelocity
            }));
    }

    restoreDynamicBodies(
        savedBodies = []
    ) {
        this.clearAllBodies();

        if (
            !Array.isArray(savedBodies) ||
            savedBodies.length === 0
        ) {
            return;
        }

        const bounds =
            this.getCupBounds();

        const cupHeight =
            Math.max(
                1,
                bounds.bottomY - bounds.topY
            );

        for (const saved of savedBodies) {
            const x =
                bounds.leftX +
                Math.max(
                    0.02,
                    Math.min(
                        0.98,
                        saved.nx ?? 0.5
                    )
                ) *
                bounds.width;

            const y =
                bounds.topY +
                Math.max(
                    0,
                    Math.min(
                        1,
                        saved.ny ?? 0.1
                    )
                ) *
                cupHeight;

            let body = null;

            if (
                saved.kind ===
                'garbage'
            ) {
                const garbage =
                    CONFIG.GARBAGE_TYPES.find(
                        item =>
                            item.id ===
                            saved.garbageId
                    );

                if (!garbage) continue;

                body =
                    this.createGarbage(
                        x,
                        y,
                        garbage
                    );

            } else {
                const tier =
                    Math.max(
                        1,
                        Math.min(
                            10,
                            saved.tier || 1
                        )
                    );

                body =
                    this.createThought(
                        x,
                        y,
                        tier
                    );
            }

            if (!body) continue;

            Matter.Body.setVelocity(
                body,
                {
                    x: saved.vx || 0,
                    y: saved.vy || 0
                }
            );

            Matter.Body.setAngle(
                body,
                saved.angle || 0
            );

            Matter.Body.setAngularVelocity(
                body,
                saved.angularVelocity || 0
            );

            body.visualScale = 1;
        }
    }

    buildCupWalls() {
        const { Bodies, World } = Matter;
        
        if (this.walls && this.walls.length > 0) {
            World.remove(this.world, this.walls);
            this.walls = [];
        }
        
        const w = this.canvas.width || 360;
        const h = this.canvas.height || 640;
        const bounds = this.getCupBounds();
        const topY = bounds.topY;
        const thick = 90; // Утолщенные стены исключают вылет шаров за пределы колбы
        
        const leftX = bounds.leftX;
        const rightX = bounds.rightX;
        const wallH = Math.max(120, h - topY + 80);
        const floorY = bounds.bottomY;

        this.floorBody = Bodies.rectangle(w / 2, floorY + thick / 2, w + 300, thick, { 
            isStatic: true, 
            friction: 0.38,
            restitution: 0.28
        });

        this.leftWall = Bodies.rectangle(leftX - thick / 2, topY + wallH / 2 - 10, thick, wallH, { 
            isStatic: true, 
            friction: 0.20,
            restitution: 0.32
        });

        this.rightWall = Bodies.rectangle(rightX + thick / 2, topY + wallH / 2 - 10, thick, wallH, { 
            isStatic: true, 
            friction: 0.20,
            restitution: 0.32
        });

        this.walls = [this.floorBody, this.leftWall, this.rightWall];
        World.add(this.world, this.walls);
    }

    expandSkull(amount = 24) {
        this.cupWidthOffset = amount;
        this.buildCupWalls();
    }

    setupCollisionEvents() {
        const handlePairs = (pairs) => {
            if (!pairs) return;
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                const a = pair.bodyA;
                const b = pair.bodyB;
                
                if (a && b && a.tier && b.tier && a.tier === b.tier && !a.isDead && !b.isDead) {
                    a.isDead = true;
                    b.isDead = true;
                    this.mergeQueue.push({ a, b });
                }
            }
        };

        // Подписка на collisionStart и collisionActive в точном соответствии с физической спецификацией
        Matter.Events.on(this.engine, 'collisionStart', (evt) => handlePairs(evt.pairs));
        Matter.Events.on(this.engine, 'collisionActive', (evt) => handlePairs(evt.pairs));
        
        Matter.Events.on(this.engine, 'afterUpdate', () => {
            while (this.mergeQueue.length > 0) {
                const pair = this.mergeQueue.shift();
                if (pair.a && pair.b) {
                    this.onMerge(pair.a, pair.b);
                }
            }
        });
    }

    createThought(x, y, tier) {
        const conf = CONFIG.TIERS[tier] || CONFIG.TIERS[1];
        const bounds = this.getCupBounds();
        const r = this.getTierRadius(tier);
        const clampedX = Math.max(bounds.leftX + r + 2, Math.min(bounds.rightX - r - 2, x));
        const clampedY = Math.min(y, bounds.bottomY - r);

        // Создание сферического тела с оптимизацией сна (sleepThreshold: 45) и высокой упругостью/пружинистостью
        const body = Matter.Bodies.circle(clampedX, clampedY, r, {
            restitution: 0.35,
            friction: 0.28,
            frictionAir: 0.016,
            density: 0.0020 + (tier * 0.00015),
            sleepThreshold: 45
        });
        
        body.tier = tier;
        body.isDead = false;
        body.visualScale = 0.72;
        body.spawnedAt = performance.now();
        Matter.Composite.add(this.world, body);
        return body;
    }

    createGarbage(x, y, garbageData) {
        const bounds = this.getCupBounds();
        const r =
            (garbageData.radius || 21) *
            this.radiusScale;
        const clampedX = Math.max(bounds.leftX + r + 2, Math.min(bounds.rightX - r - 2, x));
        const clampedY = Math.min(y, bounds.bottomY - r);

        const body = Matter.Bodies.circle(clampedX, clampedY, r, {
            restitution: 0.26,
            friction: 0.32,
            frictionAir: 0.016,
            density: 0.0030,
            sleepThreshold: 45
        });
        
        body.isGarbage = true;
        body.garbageName = garbageData.name;
        body.garbageColor = garbageData.color;
        body.garbageId = garbageData.id || garbageData.name;
        body.garbageIndex = CONFIG.GARBAGE_TYPES.findIndex(g => g.name === garbageData.name || g.id === garbageData.id);
        if (body.garbageIndex === -1) body.garbageIndex = 0;
        body.isDead = false;
        body.spawnedAt = performance.now();
        
        Matter.Composite.add(this.world, body);
        return body;
    }

    spawnGarbageItem(x, y, garbageTypeOrId = null) {
        let garbageData = null;
        if (typeof garbageTypeOrId === 'string') {
            garbageData = CONFIG.GARBAGE_TYPES.find(g => g.id === garbageTypeOrId || g.name === garbageTypeOrId);
        } else if (typeof garbageTypeOrId === 'object' && garbageTypeOrId !== null) {
            garbageData = garbageTypeOrId;
        }

        if (!garbageData) {
            const types = CONFIG.GARBAGE_TYPES || [];
            garbageData = types[Math.floor(Math.random() * types.length)] || {
                id: 'procrastination',
                name: 'Прокрастинация',
                color: '#172554',
                radius: 21
            };
        }

        return this.createGarbage(x, y, garbageData);
    }

    addBody(body) {
        Matter.Composite.add(this.world, body);
    }

    removeBody(body) {
        body.isDead = true;
        Matter.Composite.remove(this.world, body);
    }

    setVelocity(body, x, y) {
        Matter.Body.setVelocity(body, { x, y });
    }

    setPosition(body, x, y) {
        Matter.Body.setPosition(body, { x, y });
    }

    setAngle(body, angle) {
        Matter.Body.setAngle(body, angle);
    }

    limitVelocity(body, maxSpeed = this.maxSpeed) {
        if (!body || body.speed <= maxSpeed) return;
        const ratio = maxSpeed / (body.speed || 1);
        Matter.Body.setVelocity(body, {
            x: body.velocity.x * ratio,
            y: body.velocity.y * ratio
        });
    }

    cleanseNearbyGarbage(midX, midY, radius = 100) {
        const bodies = Matter.Composite.allBodies(this.world);
        
        bodies.forEach(b => {
            if (b.isGarbage && !b.isDead) {
                const dist = Math.hypot(b.position.x - midX, b.position.y - midY);
                
                if (dist < radius) {
                    b.isDead = true;
                    Matter.Composite.remove(this.world, b);
                    this.onGarbageDestroyed(b.position.x, b.position.y, b.garbageName);
                }
            }
        });
    }

    applyMagneticAttraction() {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => b.tier && b.tier <= 3 && !b.isDead);
        
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                if (bodies[i].tier === bodies[j].tier) {
                    const bA = bodies[i];
                    const bB = bodies[j];
                    
                    const dx = bB.position.x - bA.position.x;
                    const dy = bB.position.y - bA.position.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist > 12 && dist < 240) {
                        const force = 0.003;
                        Matter.Sleeping.set(bA, false);
                        Matter.Sleeping.set(bB, false);
                        
                        Matter.Body.applyForce(bA, bA.position, { 
                            x: (dx / dist) * force, 
                            y: (dy / dist) * force 
                        });
                        
                        Matter.Body.applyForce(bB, bB.position, { 
                            x: (-dx / dist) * force, 
                            y: (-dy / dist) * force 
                        });
                    }
                }
            }
        }
    }

    // Блок 1: Землетрясение от активного босса
    triggerEarthquake(intensity = 1.0) {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        bodies.forEach(b => {
            Matter.Sleeping.set(b, false);
            const impulseX = (Math.random() - 0.5) * 0.22 * intensity;
            const impulseY = (-0.18 - Math.random() * 0.25) * intensity;
            Matter.Body.applyForce(b, b.position, {
                x: impulseX,
                y: impulseY
            });
        });
    }

    // Блок 1: Заражение мыслей / Превращение мыслей в мусор
    convertRandomToGarbage(count = 1) {
        const thoughts = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead && !b.isGarbage && b.tier && b.tier <= 4);
        if (thoughts.length === 0) return [];
        
        const converted = [];
        // Перемешиваем массив мыслей
        const shuffled = [...thoughts].sort(() => Math.random() - 0.5);
        const toConvert = shuffled.slice(0, Math.min(count, shuffled.length));

        toConvert.forEach(body => {
            const posX = body.position.x;
            const posY = body.position.y;
            const velX = body.velocity.x;
            const velY = body.velocity.y;

            // Удаляем старое тело
            body.isDead = true;
            Matter.Composite.remove(this.world, body);

            // Случайный тип мусора
            const garbageTypes = CONFIG.GARBAGE_TYPES || [];
            const randomType = garbageTypes[Math.floor(Math.random() * garbageTypes.length)] || { name: 'Тревога', color: '#2e1065', radius: 21 };
            
            const garbageBody = this.createGarbage(posX, posY, randomType);
            if (garbageBody) {
                Matter.Body.setVelocity(garbageBody, { x: velX, y: velY });
                converted.push({ x: posX, y: posY, name: randomType.name });
            }
        });

        return converted;
    }

    // Блок 2: Кот убирает 1 случайный мусор со стакана
    removeRandomGarbage(count = 1) {
        const garbageList = Matter.Composite.allBodies(this.world).filter(b => b.isGarbage && !b.isDead);
        if (garbageList.length === 0) return null;

        const target = garbageList[Math.floor(Math.random() * garbageList.length)];
        target.isDead = true;
        Matter.Composite.remove(this.world, target);
        this.onGarbageDestroyed(target.position.x, target.position.y, target.garbageName || 'Мусор');
        return { x: target.position.x, y: target.position.y, name: target.garbageName };
    }

    // Блок 3: Полная очистка мусора для Ульты Мега-Чада и Возрождения
    cleanseAllGarbage() {
        const garbageList = Matter.Composite.allBodies(this.world).filter(b => b.isGarbage && !b.isDead);
        const count = garbageList.length;
        garbageList.forEach(b => {
            b.isDead = true;
            Matter.Composite.remove(this.world, b);
            this.onGarbageDestroyed(b.position.x, b.position.y, b.garbageName || 'Мусор');
        });
        return count;
    }

    // Очистка верхней части мыслей (для Второго Дыхания / Revive)
    removeUpperThoughts(fraction = 0.40) {
        const bounds = this.getCupBounds();
        const thresholdY = bounds.topY + (bounds.bottomY - bounds.topY) * fraction;
        const dynamicBodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        let removed = 0;
        dynamicBodies.forEach(b => {
            if (b.position.y <= thresholdY) {
                b.isDead = true;
                Matter.Composite.remove(this.world, b);
                removed++;
            }
        });
        return removed;
    }

    // Блок 3: Anti-stuck логика — выявление застрявших неподвижных тел
    checkStuckBodies(dt = 0.1) {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        const bounds = this.getCupBounds();

        for (const b of bodies) {
            const speed = Math.hypot(b.velocity.x, b.velocity.y);
            if (speed < 0.08 && b.position.y < bounds.bottomY - 40) {
                b.stuckTimer = (b.stuckTimer || 0) + dt;
                if (b.stuckTimer >= 4.5) {
                    b.stuckTimer = 0;
                    Matter.Sleeping.set(b, false);
                    // Мягкий микро-толчок для освобождения заклинивания
                    const nudgeX = (Math.random() - 0.5) * 0.04;
                    const nudgeY = -0.05 - Math.random() * 0.04;
                    Matter.Body.applyForce(b, b.position, { x: nudgeX, y: nudgeY });
                }
            } else {
                b.stuckTimer = Math.max(0, (b.stuckTimer || 0) - dt * 2);
            }
        }
    }

    shakeBrain() {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        
        bodies.forEach(b => {
            Matter.Sleeping.set(b, false);
            Matter.Body.applyForce(b, b.position, {
                x: (Math.random() - 0.5) * 0.16,
                y: -0.22 - Math.random() * 0.12
            });
        });
    }

    explode(centerX, centerY, radius = 150, power = 0.26) {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        const destroyed = [];

        bodies.forEach(b => {
            Matter.Sleeping.set(b, false);
            const dx = b.position.x - centerX;
            const dy = b.position.y - centerY;
            const dist = Math.hypot(dx, dy);

            if (dist < radius) {
                if (b.isGarbage) {
                    b.isDead = true;
                    Matter.Composite.remove(this.world, b);
                    this.onGarbageDestroyed(b.position.x, b.position.y, b.garbageName);
                    destroyed.push(b);
                } else if (dist < radius * 0.55 && b.tier && b.tier <= 2) {
                    b.isDead = true;
                    Matter.Composite.remove(this.world, b);
                    destroyed.push(b);
                } else {
                    const normDist = Math.max(15, dist);
                    const force = power * (1 - dist / radius);
                    Matter.Body.applyForce(b, b.position, {
                        x: (dx / normDist) * force + (Math.random() - 0.5) * 0.06,
                        y: (dy / normDist) * force - 0.14
                    });
                }
            }
        });

        return destroyed;
    }

    applySuperMagneticAttraction() {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => b.tier && !b.isDead);
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                if (bodies[i].tier === bodies[j].tier) {
                    const bA = bodies[i];
                    const bB = bodies[j];
                    const dx = bB.position.x - bA.position.x;
                    const dy = bB.position.y - bA.position.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist > 10 && dist < 380) {
                        const force = 0.009;
                        Matter.Sleeping.set(bA, false);
                        Matter.Sleeping.set(bB, false);
                        Matter.Body.applyForce(bA, bA.position, {
                            x: (dx / dist) * force,
                            y: (dy / dist) * force
                        });
                        Matter.Body.applyForce(bB, bB.position, {
                            x: (-dx / dist) * force,
                            y: (-dy / dist) * force
                        });
                    }
                }
            }
        }
    }

    keepBodiesInBounds() {
        const bounds = this.getCupBounds();
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        const minX = bounds.leftX;
        const maxX = bounds.rightX;
        const maxY = bounds.bottomY;

        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            
            // Ограничение максимальной скорости во избежание артефактов
            this.limitVelocity(b, this.maxSpeed);

            const r = b.circleRadius || 18;
            let corrected = false;
            let nx = b.position.x;
            let ny = b.position.y;

            if (nx - r < minX) {
                nx = minX + r;
                corrected = true;
                if (b.velocity.x < 0) {
                    Matter.Body.setVelocity(b, { x: 0, y: b.velocity.y });
                }
            } else if (nx + r > maxX) {
                nx = maxX - r;
                corrected = true;
                if (b.velocity.x > 0) {
                    Matter.Body.setVelocity(b, { x: 0, y: b.velocity.y });
                }
            }

            if (ny + r > maxY) {
                ny = maxY - r;
                corrected = true;
                if (b.velocity.y > 0) {
                    Matter.Body.setVelocity(b, { x: b.velocity.x, y: 0 });
                }
            }

            if (corrected) {
                Matter.Body.setPosition(b, { x: nx, y: ny });
            }
        }
    }

    setGravityTilt(tiltX) {
        const clamped = Math.max(-0.65, Math.min(0.65, tiltX));
        this.engine.gravity.x = clamped;

        if (Math.abs(clamped) > 0.05) {
            const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
            bodies.forEach(b => {
                Matter.Sleeping.set(b, false);
                Matter.Body.applyForce(b, b.position, {
                    x: clamped * 0.00045 * (b.mass || 1),
                    y: -0.00015 * (b.mass || 1)
                });
            });
        }
    }

    microBounce(centerX) {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        bodies.forEach(b => {
            Matter.Sleeping.set(b, false);
            const dx = (centerX - b.position.x) * 0.00004;
            const forceY = -0.01 * (b.mass || 1);
            Matter.Body.applyForce(b, b.position, { x: dx, y: forceY });
        });
    }

    stepPhysics(dt) {
        Matter.Engine.update(this.engine, dt || (1000 / 60));
        this.keepBodiesInBounds();
    }

    update() {
        this.stepPhysics(1000 / 60);
    }
}
