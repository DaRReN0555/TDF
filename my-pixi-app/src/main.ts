import { Application, Assets, Sprite, Container, Graphics, Ticker } from 'pixi.js';
import {createMap} from "./createMap.js";
import {createTower} from "./createTower.js";
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

app.ticker.add((delta: Ticker) => {
    towerAttack(delta.deltaMS);
});

export function towerAttack(deltaMS: number) {
    towerCooldown -= deltaMS;
    if (towerCooldown > 0) return;

    const target = gameInfo.enemies.find(enemy =>
        isInsideTowerEllipse(
            enemy.x,
            enemy.y,
            tower.x + tower.width / 2,
            tower.y + tower.height / 2,
            gameInfo.radiusX,
            gameInfo.radiusY
        )
    );

    if (target) {
        shootArrow(target);
        towerCooldown = TOWER_FIRE_RATE;
    }
}

function shootArrow(enemy: Sprite) {
    if (!enemy.parent) return;

    const arrowSprite = new Sprite(arrowTexture);
    arrowSprite.anchor.set(0.5, 0.5);
    arrowSprite.width = 21;
    arrowSprite.height = 35;
    arrowSprite.x = tower.x + tower.width / 2;
    arrowSprite.y = tower.y + tower.height / 2 - 50;
    app.stage.addChild(arrowSprite);

    const moveArrow = (delta: Ticker) => {
        if (!enemy.parent) {
            app.stage.removeChild(arrowSprite);
            app.ticker.remove(moveArrow);
            return;
        }

        const dx = enemy.x - arrowSprite.x;
        const dy = enemy.y - arrowSprite.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 5) {
            app.stage.removeChild(arrowSprite);
            app.stage.removeChild(enemy);
            const index = gameInfo.enemies.indexOf(enemy);
            if (index !== -1) gameInfo.enemies.splice(index, 1);
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



const ellipse = new Graphics();
ellipse
    .ellipse(tower.x + tower.width / 2, tower.y + tower.height / 2, gameInfo.radiusX, gameInfo.radiusY)
    .stroke({ width: 4, color: "red" });
app.stage.addChild(ellipse);