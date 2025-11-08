import { Application, Assets, Sprite, Graphics, Ticker } from 'pixi.js';
import {createMap} from "./createMap.js";
import {createTower, bow} from "./createTower.js";
import {spawnEnemies} from "./spawnEnemies.js";
import {startEnemyMovement} from "./enemiesMoving.js";
import {gameInfo} from "./constants.js";

export const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: 0x1099bb
});
document.body.appendChild(app.canvas);
app.stage.sortableChildren = true;

await createMap();
export let tower = await createTower()
spawnEnemies()
startEnemyMovement()

app.stage.sortableChildren = true;
tower.zIndex = 1000;

app.ticker.add(() => {
    const towerBottom = tower.y + tower.height * (1 - tower.anchor.y);

    for (const enemy of gameInfo.enemies) {
        const enemyBottom = enemy.y + enemy.height * (enemy.anchor.y);

        if (enemyBottom < towerBottom) {
            enemy.zIndex = tower.zIndex - 1;
        } else {
            enemy.zIndex = tower.zIndex + 1;
        }
    }
});

const arrowTexture = await Assets.load('Sprites/Towers/Archer/arrow.png');

let towerCooldown = 0;
const TOWER_FIRE_RATE = 500;
const ARROW_SPEED = 5;

interface EnemyWithHp extends Sprite {
    hp: number;
    isTargeted?: boolean;
}

app.ticker.add((delta: Ticker) => {
    towerAttack(delta.deltaMS)
});

export function towerAttack(deltaMS: number) {
    towerCooldown -= deltaMS;
    if (towerCooldown > 0) return;

    const target = gameInfo.enemies.find((enemy) =>
        isInsideTowerEllipse(
            enemy.x, enemy.y,
            tower.x + tower.width / 2 - 65,
            tower.y + tower.height / 2 + 35,
            gameInfo.radiusX,
            gameInfo.radiusY
        ) && !(enemy as EnemyWithHp).isTargeted
    ) as EnemyWithHp | undefined;

    if (!target) return;

    if (target.hp === undefined) target.hp = gameInfo.enemiesHp;
    target.isTargeted = true;

    shootArrow(target, gameInfo.damage);
    towerCooldown = TOWER_FIRE_RATE;
}

function shootArrow(enemy: EnemyWithHp, damage: number) {
    if (!enemy.parent) return;
    if (bow) {
        const towerCenterX = tower.x + tower.width / 2;
        const towerCenterY = tower.y + tower.height / 2;
        const dx = enemy.x - towerCenterX;
        const dy = enemy.y - towerCenterY;
        const angle = Math.atan2(dy, dx);

        const orbitRadius = 25;
        const orbitX = Math.cos(angle) * orbitRadius;
        const orbitY = Math.sin(angle) * orbitRadius;

        bow.x = tower.width / 2 + orbitX - 65;
        bow.y = tower.height / 2 + orbitY - 40;
        bow.rotation = angle + Math.PI

        const recoilDist = 8;
        const recoilX = Math.cos(angle) * recoilDist;
        const recoilY = Math.sin(angle) * recoilDist;

        const startX = bow.x;
        const startY = bow.y;
        const targetX = startX - recoilX;
        const targetY = startY - recoilY;

        const startTime = performance.now();
        const duration = 150;

        const animateRecoil = (time: number) => {
            const t = Math.min((time - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);

            bow.x = targetX + (startX - targetX) * (1 - ease);
            bow.y = targetY + (startY - targetY) * (1 - ease);

            if (t < 1) requestAnimationFrame(animateRecoil);
            else {
                bow.x = startX;
                bow.y = startY;
            }
        };
        requestAnimationFrame(animateRecoil);
    }

    const arrowSprite = new Sprite(arrowTexture);
    arrowSprite.anchor.set(0.5, 0);
    arrowSprite.width = 21;
    arrowSprite.height = 35;
    
    arrowSprite.x = bow.x + tower.x;
    arrowSprite.y = bow.y + tower.y
    arrowSprite.zIndex = tower.zIndex + 1;
    app.stage.addChild(arrowSprite);

    const moveArrow = (delta: Ticker) => {
        if (!enemy.parent) {
            app.stage.removeChild(arrowSprite);
            app.ticker.remove(moveArrow);
            return;
        }

        const dx = enemy.x - arrowSprite.x;
        const dy = enemy.y - 20 - arrowSprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
            enemy.hp -= damage;
            if (enemy.hp <= 0) {
                if (enemy.parent) enemy.parent.removeChild(enemy);
                const index = gameInfo.enemies.indexOf(enemy);
                if (index !== -1) gameInfo.enemies.splice(index, 1);
            }

            enemy.isTargeted = false;
            app.stage.removeChild(arrowSprite);
            app.ticker.remove(moveArrow);
            return;
        }

        arrowSprite.x += (dx / dist) * ARROW_SPEED * delta.deltaTime;
        arrowSprite.y += (dy / dist) * ARROW_SPEED * delta.deltaTime;
        arrowSprite.rotation = Math.atan2(dy, dx) + Math.PI / 2;

        if (
            arrowSprite.x < 0 || arrowSprite.x > app.screen.width ||
            arrowSprite.y < 0 || arrowSprite.y > app.screen.height
        ) {
            app.stage.removeChild(arrowSprite);
            enemy.isTargeted = false;
            app.ticker.remove(moveArrow);
        }
    };

    app.ticker.add(moveArrow);
}

function isInsideTowerEllipse(
    enemyX: number, 
    enemyY: number, 
    towerX: number, 
    towerY: number, 
    radiusX: number,
    radiusY: number
): boolean {
    const dx = enemyX - towerX;
    const dy = enemyY - towerY;
    return (dx*dx) / (radiusX*radiusX) + (dy*dy) / (radiusY*radiusY) <= 1;
}

