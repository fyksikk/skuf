class BrainPhysics {
    constructor(canvas, onMerge, onGarbageDestroyed) {
        this.canvas = canvas;
        this.onMerge = onMerge;
        this.onGarbageDestroyed = onGarbageDestroyed;
        this.mergeQueue = [];
        this.cupWidthOffset = 0;
        this.cupTopY = 180;
        
        const { Engine } = Matter;
        this.engine = Engine.create({ 
            gravity: { x: 0, y: 1.25 },
            positionIterations: 8,
            velocityIterations: 8
        });
        this.world = this.engine.world;
        
        this.walls = [];
        this.buildCupWalls();
        this.setupCollisionEvents();
    }

    setDimensions(roomHeight) {
        this.cupTopY = roomHeight + 16;
        this.buildCupWalls();
    }

    getCupBounds() {
        const w = this.canvas.width;
        // Базовый комфортный отступ стакана от краев экрана
        const baseMargin = 28;
        // Максимальное расширение оставляет не менее 6px безопасного отступа от краев холста
        const maxExpand = Math.max(0, baseMargin - 6);
        // Масштабируем offset так, чтобы даже большие значения перков не вылезали за экран
        const expansion = Math.min(maxExpand, Math.max(0, (this.cupWidthOffset || 0) * 0.5));
        
        const leftX = Math.max(6, baseMargin - expansion);
        const rightX = Math.min(w - 6, w - (baseMargin - expansion));

        return {
            leftX,
            rightX,
            width: rightX - leftX,
            topY: this.cupTopY,
            bottomY: this.canvas.height - 6
        };
    }

    buildCupWalls() {
        const { Bodies, World } = Matter;
        
        if (this.walls.length > 0) {
            World.remove(this.world, this.walls);
            this.walls = [];
        }
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        const bounds = this.getCupBounds();
        const topY = bounds.topY;
        const thick = 80; // Утолщенные надежные стены, чтобы шары никогда не проскакивали
        
        const leftX = bounds.leftX;
        const rightX = bounds.rightX;
        const wallH = Math.max(100, h - topY + 60);
        
        this.walls = [
            // Пол стакана
            Bodies.rectangle(w / 2, h + thick / 2 - 4, w + 200, thick, { 
                isStatic: true, 
                friction: 0.6,
                restitution: 0.1
            }),
            // Левая стена
            Bodies.rectangle(leftX - thick / 2, topY + wallH / 2 - 10, thick, wallH, { 
                isStatic: true, 
                friction: 0.25,
                restitution: 0.2
            }),
            // Правая стена
            Bodies.rectangle(rightX + thick / 2, topY + wallH / 2 - 10, thick, wallH, { 
                isStatic: true, 
                friction: 0.25,
                restitution: 0.2
            })
        ];
        
        World.add(this.world, this.walls);
    }

    expandSkull(amount = 24) {
        this.cupWidthOffset = amount;
        this.buildCupWalls();
    }

    setupCollisionEvents() {
        Matter.Events.on(this.engine, 'collisionStart', (evt) => {
            evt.pairs.forEach(pair => {
                const a = pair.bodyA;
                const b = pair.bodyB;
                
                if (a.tier && b.tier && a.tier === b.tier && !a.isDead && !b.isDead) {
                    a.isDead = true;
                    b.isDead = true;
                    this.mergeQueue.push({ a, b });
                }
            });
        });
        
        Matter.Events.on(this.engine, 'afterUpdate', () => {
            while (this.mergeQueue.length > 0) {
                const pair = this.mergeQueue.shift();
                this.onMerge(pair.a, pair.b);
            }
        });
    }

    createThought(x, y, tier) {
        const conf = CONFIG.TIERS[tier] || CONFIG.TIERS[1];
        
        const body = Matter.Bodies.circle(x, y, conf.radius, {
            restitution: 0.18,
            friction: 0.4,
            frictionAir: 0.008,
            density: 0.003 + (tier * 0.0004)
        });
        
        body.tier = tier;
        body.isDead = false;
        
        Matter.World.add(this.world, body);
        return body;
    }

    createGarbage(x, y, garbageData) {
        const body = Matter.Bodies.circle(x, y, garbageData.radius, {
            restitution: 0.12,
            friction: 0.55,
            density: 0.005
        });
        
        body.isGarbage = true;
        body.garbageName = garbageData.name;
        body.garbageColor = garbageData.color;
        body.isDead = false;
        
        Matter.World.add(this.world, body);
        return body;
    }

    cleanseNearbyGarbage(midX, midY, radius = 100) {
        const bodies = Matter.Composite.allBodies(this.world);
        
        bodies.forEach(b => {
            if (b.isGarbage && !b.isDead) {
                const dist = Math.hypot(b.position.x - midX, b.position.y - midY);
                
                if (dist < radius) {
                    b.isDead = true;
                    Matter.World.remove(this.world, b);
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
                    
                    if (dist > 15 && dist < 220) {
                        const force = 0.0025;
                        
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

    shakeBrain() {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        
        bodies.forEach(b => {
            Matter.Body.applyForce(b, b.position, {
                x: (Math.random() - 0.5) * 0.14,
                y: -0.18 - Math.random() * 0.1
            });
        });
    }

    explode(centerX, centerY, radius = 140, power = 0.22) {
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic && !b.isDead);
        const destroyed = [];

        bodies.forEach(b => {
            const dx = b.position.x - centerX;
            const dy = b.position.y - centerY;
            const dist = Math.hypot(dx, dy);

            if (dist < radius) {
                if (b.isGarbage) {
                    b.isDead = true;
                    Matter.World.remove(this.world, b);
                    this.onGarbageDestroyed(b.position.x, b.position.y, b.garbageName);
                    destroyed.push(b);
                } else if (dist < radius * 0.55 && b.tier && b.tier <= 2) {
                    // Мелкие шары в эпицентре взрываются в энергию
                    b.isDead = true;
                    Matter.World.remove(this.world, b);
                    destroyed.push(b);
                } else {
                    // Остальные шары мощно отбрасывает ударной волной
                    const normDist = Math.max(15, dist);
                    const force = power * (1 - dist / radius);
                    Matter.Body.applyForce(b, b.position, {
                        x: (dx / normDist) * force + (Math.random() - 0.5) * 0.05,
                        y: (dy / normDist) * force - 0.12
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

                    if (dist > 10 && dist < 350) {
                        const force = 0.008;
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

    update() {
        Matter.Engine.update(this.engine, 1000 / 60);
        this.keepBodiesInBounds();
    }
}
