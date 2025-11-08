import { Ticker } from "pixi.js";
import { app } from "./main.js";
import { gameInfo } from "./constants.js";
import { tower } from "./main.js";

const ENEMY_SPEED = 1.5;

export function startEnemyMovement() {
    app.ticker.add(updateEnemies);
}

function updateEnemies(deltaTime: Ticker): void {
    const delta = deltaTime.deltaTime;
    for (let i = 0; i < gameInfo.enemies.length; i++) {
        const enemy = gameInfo.enemies[i];

        if (!enemy || !enemy.x || !enemy.y) continue;

        let dx = tower.x + 65 - enemy.x;
        let dy = tower.y + 120 - enemy.y;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {
            continue;
        }

        dx /= dist;
        dy /= dist;

        enemy.x += dx * ENEMY_SPEED * delta;
        enemy.y += dy * ENEMY_SPEED * delta;


    }
}