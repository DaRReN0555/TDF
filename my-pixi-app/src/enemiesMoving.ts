import { Ticker, Graphics, AnimatedSprite } from "pixi.js";
import { app } from "./main.js";
import { gameInfo} from "./constants.js";
import { tower } from "./main.js";
import { golemWalkFrames, } from "./spawnEnemies.js";

let k = 0

export let movementTicker: ((delta: Ticker) => void) | null = null;

export function startEnemyMovement() {
    if (movementTicker) app.ticker.remove(movementTicker);

    movementTicker = (delta: Ticker) => {
        if (!gameInfo.isGameEnded) updateEnemies(delta);
    };

    app.ticker.add(movementTicker);
}

function updateEnemies(deltaTime: Ticker): void {
    const delta = deltaTime.deltaTime;
    for (let i = 0; i < gameInfo.enemies.length; i++) {
        const enemy = gameInfo.enemies[i];

        if (!enemy || !enemy.x || !enemy.y) continue;

        let dx = tower.x - enemy.x;
        let dy = tower.y - enemy.y + 25;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {
            k++
            if(k > 100) k = 0;
            if(k == 100) {
                spawnParticles(tower.x, tower.y + 20)
                gameInfo.hp -= gameInfo.enemiesDamage;
            }
            continue;
        }

        dx /= dist;
        dy /= dist;
        if(enemy instanceof AnimatedSprite && enemy.textures === golemWalkFrames) {
            enemy.x += dx * gameInfo.ENEMY_SPEED * delta / 2;
            enemy.y += dy * gameInfo.ENEMY_SPEED * delta / 2;
        }
        else {
            enemy.x += dx * gameInfo.ENEMY_SPEED * delta;
            enemy.y += dy * gameInfo.ENEMY_SPEED * delta;

        }
    }
}

interface Particle extends Graphics {
  vx: number;
  vy: number;
}

function spawnParticles(x: number, y: number) {
    const particles: Graphics[] = [];
    const count = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < count; i++) {
        const p = new Graphics() as Particle;;
        p.zIndex = tower.zIndex + 2;
        const size = 15 + Math.random() * 3;
        p.beginFill("gray");
        p.drawRect(-size / 2, -size / 2, size, size);
        p.endFill();
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5);
        p.vy = -Math.random() * 5;
        app.stage.addChild(p);
        particles.push(p);
    }

    const gravity = 0.2;

    const animate = (delta: Ticker) => {
        for (const p of particles as Particle[]) {
            p.vy += gravity;
            p.x += p.vx * delta.deltaTime;
            p.y += p.vy * delta.deltaTime;
            p.alpha -= 0.02 * delta.deltaTime;

            if (p.y > y + 20) p.vy *= -0.3;
            if (p.alpha <= 0) {
                app.stage.removeChild(p);
                particles.splice(particles.indexOf(p), 1);
            }
        }

        if (!particles.length) app.ticker.remove(animate);
    };

    app.ticker.add(animate);
}

