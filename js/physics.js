class BrainPhysics {
    constructor(canvas, onMerge, onGarbageDestroyed) {
        this.canvas = canvas;
        this.onMerge = onMerge;
        this.onGarbageDestroyed = onGarbageDestroyed;
        this.mergeQueue = [];
        this.cupWidthOffset = 0;
        
        const { Engine, World } = Matter;
        this.engine = Engine.create({ gravity: { x: 0, y: 1.35 } });
        this.world = this.engine.world;
        
        this.walls = [];
        this.buildCupWalls();
        this.setupCollisionEvents();
    }

    buildCupWalls() {
        const { Bodies, World } = Matter;
        
        if (this.walls.length > 0) {
            World.remove(this.world, this.walls);
            this.walls = [];
        }
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        const topY = CONFIG.BRAIN_TOP_Y;
        const thick = 50; // Утолщенные стены для предотвращения вылета шаров
        
        const leftX = 14 - this.cupWidthOffset;
        const rightX = w - 14 + this.cupWidthOffset;
        
        this.walls = [
            // Пол стакана
            Bodies.rectangle(w / 2, h + thick / 2 - 8, w, thick, { isStatic: true, friction: 0.5 }),
            // Левая стена
            Bodies.rectangle(leftX - thick / 2, (topY + h) / 2, thick, h - topY, { isStatic: true, friction: 0.2 }),
            // Правая стена
            Bodies.rectangle(rightX + thick / 2, (topY + h) / 2, thick, h - topY, { isStatic: true, friction: 0.2 })
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
            restitution: 0.16,
            friction: 0.45,
            density: 0.003
        });
        
        body.tier = tier;
        body.isDead = false;
        
        Matter.World.add(this.world, body);
        return body;
    }

    createGarbage(x, y, garbageData) {
        const body = Matter.Bodies.circle(x, y, garbageData.radius, {
            restitution: 0.1,
            friction: 0.6,
            density: 0.005
        });
        
        body.isGarbage = true;
        body.garbageName = garbageData.name;
        body.garbageColor = garbageData.color;
        body.isDead = false;
        
        Matter.World.add(this.world, body);
        return body;
    }

    cleanseNearbyGarbage(midX, midY, radius = 95) {
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
        const bodies = Matter.Composite.allBodies(this.world).filter(b => b.tier && b.tier <= 2 && !b.isDead);
        
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                if (bodies[i].tier === bodies[j].tier) {
                    const bA = bodies[i];
                    const bB = bodies[j];
                    
                    const dx = bB.position.x - bA.position.x;
                    const dy = bB.position.y - bA.position.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist > 15 && dist < 180) {
                        const force = 0.002;
                        
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
        const bodies = Matter.Composite.allBodies(this.world).filter(b => !b.isStatic);
        
        bodies.forEach(b => {
            Matter.Body.applyForce(b, b.position, {
                x: (Math.random() - 0.5) * 0.12,
                y: -0.16 - Math.random() * 0.08
            });
        });
    }

    update() {
        Matter.Engine.update(this.engine, 1000 / 60);
    }
}