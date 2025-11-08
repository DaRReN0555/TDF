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

interface EnemyWithHp extends Sprite {
    hp: number;
    isTargeted?: boolean;
}

app.ticker.add((delta: Ticker) => towerAttack(delta.deltaMS));

export function towerAttack(deltaMS: number) {
    towerCooldown -= deltaMS;
    if (towerCooldown > 0) return;

    const target = gameInfo.enemies.find((enemy) =>
        isInsideTowerEllipse(
            enemy.x, enemy.y,
            tower.x + tower.width / 2,
            tower.y + tower.height / 2,
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

    const arrow = new Sprite(arrowTexture);
    arrow.anchor.set(0.5, 0);
    arrow.width = 21;
    arrow.height = 35;
    arrow.x = tower.x + tower.width / 2;
    arrow.y = tower.y + tower.height / 2 - 50;
    app.stage.addChild(arrow);

    const moveArrow = (delta: Ticker) => {
        if (!enemy.parent) return removeArrow();

        const dx = enemy.x - arrow.x;
        const dy = (enemy.y - 20) - arrow.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 5) {
            enemy.hp -= damage;
            if (enemy.hp <= 0) removeEnemy(enemy);
            enemy.isTargeted = false;
            removeArrow();
            return;
        }

        arrow.x += (dx / dist) * ARROW_SPEED * delta.deltaTime;
        arrow.y += (dy / dist) * ARROW_SPEED * delta.deltaTime;
        arrow.rotation = Math.atan2(dy, dx) + Math.PI / 2;

        if (arrow.x < 0 || arrow.x > app.screen.width || arrow.y < 0 || arrow.y > app.screen.height) {
            enemy.isTargeted = false;
            removeArrow();
        }
    };

    const removeArrow = () => {
        if (arrow.parent) arrow.parent.removeChild(arrow);
        app.ticker.remove(moveArrow);
    };

    const removeEnemy = (enemy: EnemyWithHp) => {
        if (enemy.parent) enemy.parent.removeChild(enemy);
        const index = gameInfo.enemies.indexOf(enemy);
        if (index !== -1) gameInfo.enemies.splice(index, 1);
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