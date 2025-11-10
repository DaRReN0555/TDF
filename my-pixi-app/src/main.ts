import { Application, Assets, Sprite, Graphics, Ticker, Container, TextStyle, Text } from 'pixi.js';
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
const heart = await Assets.load('Sprites/heart.png')
const coin = await Assets.load('Sprites/coin.png')

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

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
}

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
                const deathX = enemy.x;
                const deathY = enemy.y;
                if (enemy.parent) enemy.parent.removeChild(enemy);
                gameInfo.enemiesKilled++;

                const index = gameInfo.enemies.indexOf(enemy);
                if (index !== -1) gameInfo.enemies.splice(index, 1);

                spawnParticles(deathX, deathY);
                spawnCoins(deathX, deathY);
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

interface Particle extends Graphics {
  vx: number;
  vy: number;
}

function spawnParticles(x: number, y: number) {
    const particles: Graphics[] = [];
    const count = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < count; i++) {
        const p = new Graphics() as Particle;;
        const size = 3 + Math.random() * 3;
        p.beginFill("e8ebea");
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



const waveContainer = new Container();
waveContainer.x = window.innerWidth - 250;
waveContainer.y = 50;
app.stage.addChild(waveContainer);

const bg = new Graphics();
bg.beginFill(0xffffff);
bg.drawRoundedRect(0, 0, 200, 40, 20);
bg.endFill();
waveContainer.addChild(bg);
const bg2 = new Graphics();
bg2.beginFill(0xffffff);
bg2.drawRoundedRect(-5, -5, 210, 50, 25);
bg2.endFill();
bg2.alpha = 0.5;
waveContainer.addChild(bg2);
const fill = new Graphics();
fill.beginFill(0x8cc63f);
fill.drawRoundedRect(0, 0, 200, 40, 20);
fill.endFill();
waveContainer.addChild(fill);
const mask = new Graphics();
mask.beginFill(0xffffff);
mask.drawRoundedRect(0, 0, 200, 40, 0);
mask.endFill();
fill.mask = mask;
waveContainer.addChild(mask);

const textStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'bold',
    fill: 0x000000,
});
const textStyle2 = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'bold',
    fill: 0x000000,
});
const text = new Text('WAVE', textStyle);
text.x = 64;
text.y = 11;
waveContainer.addChild(text);
const text2 = new Text('', textStyle2);
text2.x = 115;
text2.y = 4;
waveContainer.addChild(text2);

let startTime = 0;
let totalEnemies = 0;
let displayedProgress = 0;
let previousProgress = 0;
let targetProgress = 0;
let animStart = 0;
let animDuration = 400;
let animating = false;

function startWaveProgress() {
    startTime = performance.now();
    totalEnemies = gameInfo.enemiesOnWave;
    displayedProgress = 0;
    previousProgress = 0;
    targetProgress = 0;
    animating = false;
    mask.scale.x = 0;
}

startWaveProgress();

const healthContainer = new Container();
healthContainer.x = tower.x - 80;
healthContainer.y = tower.y - 50;
app.stage.addChild(healthContainer);

const healthBg = new Graphics();
healthBg.beginFill("#c70000");
healthBg.drawRoundedRect(0, 0, 40, 40, 30);
healthBg.endFill();
healthBg.zIndex = tower.zIndex + 2;
healthContainer.addChild(healthBg);

const healthBg2 = new Graphics();
healthBg2.beginFill("#ff3333");
healthBg2.drawRoundedRect(-5, -5, 50, 50, 30);
healthBg2.endFill();
healthBg2.alpha = 0.5;
healthBg2.zIndex = tower.zIndex + 2;
healthContainer.addChild(healthBg2);

const heartSprite = new Sprite(heart);
heartSprite.x = 8;
heartSprite.y = 10;
heartSprite.width = 24;
heartSprite.height = 22;
heartSprite.zIndex = tower.zIndex + 2;
heartSprite.alpha = 0.8;
healthContainer.addChild(heartSprite);

const textStyle3 = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: 'bold',
    fill: "#d82929ff",
});
const textStyle4 = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    fill: "#d82929ff",
});

const healthText = new Text('', textStyle3);
healthText.x = 55;
healthText.y = 18;
healthText.zIndex = tower.zIndex + 2;
healthContainer.addChild(healthText);

const healthText2 = new Text("HEALTH", textStyle4);
healthText2.x = 55;
healthText2.y = 0;
healthText2.zIndex = tower.zIndex + 2;
healthContainer.addChild(healthText2);

const moneyContainer = new Container();
moneyContainer.x = window.innerWidth - 310;
moneyContainer.y = 50;
app.stage.addChild(moneyContainer);

const moneyBg = new Graphics();
moneyBg.beginFill(0xffffff);
moneyBg.drawRoundedRect(-20, -10, 60, 60, 30);
moneyBg.endFill();
moneyBg.zIndex = tower.zIndex + 2;
moneyContainer.addChild(moneyBg);

const moneyBg2 = new Graphics();
moneyBg2.beginFill(0xffffff);
moneyBg2.drawRoundedRect(-25, -15, 70, 70, 50);
moneyBg2.endFill();
moneyBg2.alpha = 0.5;
moneyBg2.zIndex = tower.zIndex + 2;
moneyContainer.addChild(moneyBg2);

const coinShadow = new Graphics() 
coinShadow.beginFill(0x000000);
coinShadow.drawRoundedRect(-20, -13, 20, 20, 30);
coinShadow.endFill();
coinShadow.alpha = 0.2;
moneyContainer.addChild(coinShadow);

const coinIcon = new Sprite(coin);
coinIcon.x = -20;
coinIcon.y = -15
coinIcon.width = 20;
coinIcon.height = 20;
coinIcon.zIndex = tower.zIndex + 2;
coinIcon.alpha = 0.8;
moneyContainer.addChild(coinIcon);

coinShadow.zIndex = coinIcon.zIndex;

const textStyle5 = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 26,
    fontWeight: 'bold',
    fill: "#d82929ff",
});

const coinText = new Text('', textStyle5);
coinText.anchor.set(0.5);
coinText.x = 10
coinText.y = 18;
coinText.zIndex = tower.zIndex + 2;
moneyContainer.addChild(coinText);

function spawnCoins(x: number, y: number) {
    const coinsCount = gameInfo.moneyPerKill;
    for (let i = 0; i < coinsCount; i++) {
        const coinSprite = new Sprite(coin);
        coinSprite.anchor.set(0.5);
        coinSprite.scale.set(0.02);
        coinSprite.x = x + (Math.random() - 0.5) * 20;
        coinSprite.y = y + (Math.random() - 0.5) * 20;
        coinSprite.zIndex = tower.zIndex + 5;
        coinSprite.alpha = 0;
        app.stage.addChild(coinSprite);
        const appearTime = performance.now();
        const appearDuration = 300;
        const appear = (time: number) => {
            const t = Math.min((time - appearTime) / appearDuration, 1);
            coinSprite.alpha = t;
            if (t < 1) requestAnimationFrame(appear);
        };
        requestAnimationFrame(appear);
        const start = { x: coinSprite.x, y: coinSprite.y };
        const end = {
            x: moneyContainer.x + coinIcon.x + 10,
            y: moneyContainer.y + coinIcon.y + 10,
        };
        const startTime = performance.now() + Math.random() * 200;
        const duration = 1000 + Math.random() * 300;
        const animate = (time: number) => {
            const t = Math.min((time - startTime) / duration, 1);
            if (t < 0) {
                requestAnimationFrame(animate);
                return;
            }
            const ease = easeInOutCubic(t);
            coinSprite.x = start.x + (end.x - start.x) * ease;
            coinSprite.y = start.y + (end.y - start.y) * ease;
            const scale = 0.02 - 0.01 * ease;
            coinSprite.scale.set(scale);
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                gameInfo.money += 2;
                app.stage.removeChild(coinSprite);
            }
        };
        requestAnimationFrame(animate);
    }
}

const textStyleShop1 = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 35,
    fontWeight: 'bold',
    fill: "#d6be35ff",
});

const textStyleShop2 = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 65,
    fontWeight: 'bold',
    fill: "#ffffffff",
});

const textStyleShop3 = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 26,
    fontWeight: 'bold',
    fill: "#d82929ff",
});

const shopMenu = new Container();
shopMenu.x = tower.x - 650;
shopMenu.y = window.innerHeight - 300;
app.stage.addChild(shopMenu);

const shopMenuBg = new Graphics();
shopMenuBg.beginFill("#3c7c6cff");
shopMenuBg.drawRoundedRect(0, 0, 1300, 400, 20);
shopMenuBg.endFill();
shopMenuBg.alpha = 0.5;
shopMenuBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(shopMenuBg);

const damageButton = new Graphics()
damageButton.beginFill("#2f685aff");
damageButton.drawRoundedRect(30, 30, 287.5, 300, 20);
damageButton.endFill();
damageButton.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageButton);

const damageText  = new Text('DAMAGE', textStyleShop1);
damageText.x = 96;
damageText.y = 50;
damageText.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageText);

const damageText2  = new Text('', textStyleShop2);
damageText2.anchor.set(0.5);
damageText2.x = 492;
damageText2.y = 140;
damageText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageText2);

const hpButton2 = new Graphics()
hpButton2.beginFill("#2f685aff");
hpButton2.drawRoundedRect(347.5, 30, 287.5, 300, 20);
hpButton2.endFill();
hpButton2.zIndex = tower.zIndex + 2;
shopMenu.addChild(hpButton2);

const hpText  = new Text('HEALTH', textStyleShop1);
hpText.x = 422;
hpText.y = 50;
hpText.zIndex = tower.zIndex + 2;
shopMenu.addChild(hpText);

const hpText2  = new Text('', textStyleShop2);
hpText2.anchor.set(0.5);
hpText2.x = 492;
hpText2.y = 140;
hpText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(hpText2);

const rangeButton3 = new Graphics()
rangeButton3.beginFill("#2f685aff");
rangeButton3.drawRoundedRect(665, 30, 287.5, 300, 20);
rangeButton3.endFill();
rangeButton3.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeButton3);

const rangeText  = new Text('RANGE', textStyleShop1);
rangeText.x = 745;
rangeText.y = 50;
rangeText.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeText);

const rangeText2  = new Text('', textStyleShop2);
rangeText2.anchor.set(0.5);
rangeText2.x = 492;
rangeText2.y = 140;
rangeText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeText2);

const moneyWaveButton4 = new Graphics()
moneyWaveButton4.beginFill("#2f685aff");
moneyWaveButton4.drawRoundedRect(982.5, 30, 287.5, 300, 20);
moneyWaveButton4.endFill();
moneyWaveButton4.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveButton4);

const moneyWaveText  = new Text('MONEYWAVE', textStyleShop1);
moneyWaveText.x = 1013;
moneyWaveText.y = 50;
moneyWaveText.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveText);

const moneyWaveText2  = new Text('', textStyleShop2);
moneyWaveText2.anchor.set(0.5);
moneyWaveText2.x = 492;
moneyWaveText2.y = 140;
moneyWaveText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveText2);

const shopHiddenY = window.innerHeight;
const shopVisibleY = window.innerHeight - 300;
shopMenu.y = shopHiddenY;

let shopTargetY = shopHiddenY;
let shopStartY = shopHiddenY;
let shopAnimStart = 0;
let shopAnimDuration = 600;
let shopAnimating = false;

app.ticker.add(() => {
    const mousePos = app.renderer.events.pointer.global;
    const isHovered =
        mousePos.x > tower.x - 640 &&
        mousePos.x < tower.x + 640 &&
        mousePos.y > window.innerHeight - 300;

    const newTargetY = isHovered ? shopVisibleY : shopHiddenY;
    if (newTargetY !== shopTargetY) {
        shopStartY = shopMenu.y;
        shopTargetY = newTargetY;
        shopAnimStart = performance.now();
        shopAnimating = true;
    }

    if (shopAnimating) {
        const elapsed = performance.now() - shopAnimStart;
        let t = Math.min(elapsed / shopAnimDuration, 1);
        t = easeInOutCubic(t);

        shopMenu.y = shopStartY + (shopTargetY - shopStartY) * t;

        if (t >= 1) {
            shopAnimating = false;
        }
    }

    hpText2.text = gameInfo.shopHp.toString();
    if(gameInfo.money >= 1000) {
        let num = gameInfo.money / 1000
        let rounded = Number(num.toFixed(1))
        coinText.text = `${rounded}K`;
    }
    if(gameInfo.hp <= 0) {
        gameInfo.hp = 0;
    }
    healthText.text = gameInfo.hp.toString();
    text2.text = gameInfo.wave.toString();
    coinText.text = gameInfo.money.toString();

    const killed = gameInfo.enemiesKilled;
    const total = totalEnemies || 1;
    const newTarget = Math.min(killed / total, 1);

    if (newTarget !== targetProgress) {
        previousProgress = displayedProgress;
        targetProgress = newTarget;
        animStart = performance.now();
        animating = true;
    }

    if (animating) {
        const elapsed = performance.now() - animStart;
        let t = Math.min(elapsed / animDuration, 1);
        t = easeInOutCubic(t);
        displayedProgress = previousProgress + (targetProgress - previousProgress) * t;

        if (t >= 1) animating = false;
    }

    mask.scale.x = displayedProgress;

    if (targetProgress >= 1 && !animating) {
        gameInfo.enemiesHp += 2;
        gameInfo.wave++;
        gameInfo.enemiesKilled = 0;
        gameInfo.enemies = [];
        gameInfo.enemiesOnWave += 2;
        gameInfo.respawnDuration = Math.max(200, gameInfo.respawnDuration - 20);

        spawnEnemies();
        startWaveProgress();
    }
});