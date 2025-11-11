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
coinIcon.alpha = 1;
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
                gameInfo.money += gameInfo.moneyPerKill / coinsCount;
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
    fontSize: 35,
    fontWeight: 'bold',
    fill: "#2b2b2bff",
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

const damageBg = new Graphics()
damageBg.beginFill("#2f685aff");
damageBg.drawRoundedRect(30, 30, 287.5, 300, 20);
damageBg.endFill();
damageBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageBg);

const damageText  = new Text('DAMAGE', textStyleShop1);
damageText.x = 96;
damageText.y = 50;
damageText.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageText);

const damageText2  = new Text('', textStyleShop2);
damageText2.anchor.set(0.5);
damageText2.x = 173;
damageText2.y = 140;
damageText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageText2);

const hpBg = new Graphics()
hpBg.beginFill("#2f685aff");
hpBg.drawRoundedRect(347.5, 30, 287.5, 300, 20);
hpBg.endFill();
hpBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(hpBg);

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

const rangeBg = new Graphics()
rangeBg.beginFill("#2f685aff");
rangeBg.drawRoundedRect(665, 30, 287.5, 300, 20);
rangeBg.endFill();
rangeBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeBg);

const rangeText  = new Text('RANGE', textStyleShop1);
rangeText.x = 745;
rangeText.y = 50;
rangeText.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeText);

const rangeText2  = new Text('1', textStyleShop2);
rangeText2.anchor.set(0.5);
rangeText2.x = 805;
rangeText2.y = 140;
rangeText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeText2);

const moneyWaveBg = new Graphics()
moneyWaveBg.beginFill("#2f685aff");
moneyWaveBg.drawRoundedRect(982.5, 30, 287.5, 300, 20);
moneyWaveBg.endFill();
moneyWaveBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveBg);

const moneyWaveText  = new Text('MONEYWAVE', textStyleShop1);
moneyWaveText.x = 1013;
moneyWaveText.y = 50;
moneyWaveText.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveText);

const moneyWaveText2  = new Text('1', textStyleShop2);
moneyWaveText2.anchor.set(0.5);
moneyWaveText2.x = 1126;
moneyWaveText2.y = 140;
moneyWaveText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveText2);

const buttons = new Container()
buttons.x = 75;
buttons.y = 200;
buttons.zIndex = tower.zIndex + 3;
shopMenu.addChild(buttons);

const button1 = new Graphics();
button1.beginFill("#d6be35ff");
button1.drawRoundedRect(0, 0, 200, 60, 20);
button1.endFill();
buttons.addChild(button1);

const button1Bg = new Graphics();
button1Bg.beginFill("#3c7c6cff");
button1Bg.drawRoundedRect(-10, -10, 220, 80, 20);
button1Bg.endFill();
button1Bg.alpha = 0.5;
button1.addChild(button1Bg);

const button1Text  = new Text('', textStyleShop3);
button1Text.anchor.set(0.5);
button1Text.x = 100;
button1Text.y = 30;
button1Text.zIndex = tower.zIndex + 2;
button1Text.alpha = 0.6
button1.addChild(button1Text);

const coinShadow1 = new Graphics() 
coinShadow1.beginFill(0x000000);
coinShadow1.drawRoundedRect(-15, -8, 30, 30, 30);
coinShadow1.endFill();
coinShadow1.alpha = 0.2;
buttons.addChild(coinShadow1);

const coinIcon1 = new Sprite(coin);
coinIcon1.x = -15;
coinIcon1.y = -12
coinIcon1.width = 30;
coinIcon1.height = 30;
coinIcon1.zIndex = tower.zIndex + 2;
coinIcon1.alpha = 1;
buttons.addChild(coinIcon1);

const button2 = new Graphics();
button2.beginFill("#d6be35ff");
button2.drawRoundedRect(320, 0, 200, 60, 20);
button2.endFill();
buttons.addChild(button2);

const button2Bg = new Graphics();
button2Bg.beginFill("#3c7c6cff");
button2Bg.drawRoundedRect(310, -10, 220, 80, 20);
button2Bg.endFill();
button2Bg.alpha = 0.5;
button2.addChild(button2Bg);

const coinShadow2 = new Graphics() 
coinShadow2.beginFill(0x000000);
coinShadow2.drawRoundedRect(305, -8, 30, 30, 30);
coinShadow2.endFill();
coinShadow2.alpha = 0.2;
buttons.addChild(coinShadow2);

const coinIcon2 = new Sprite(coin);
coinIcon2.x = 305;
coinIcon2.y = -12
coinIcon2.width = 30;
coinIcon2.height = 30;
coinIcon2.zIndex = tower.zIndex + 2;
coinIcon2.alpha = 1;
buttons.addChild(coinIcon2);

const button2Text  = new Text('', textStyleShop3);
button2Text.anchor.set(0.5);
button2Text.x = 420;
button2Text.y = 30;
button2Text.zIndex = tower.zIndex + 2;
button2Text.alpha = 0.6
button2.addChild(button2Text);

const button3 = new Graphics();
button3.beginFill("#d6be35ff");
button3.drawRoundedRect(635, 0, 200, 60, 20);
button3.endFill();
buttons.addChild(button3);

const button3Bg = new Graphics();
button3Bg.beginFill("#3c7c6cff");
button3Bg.drawRoundedRect(625, -10, 220, 80, 20);
button3Bg.endFill();
button3Bg.alpha = 0.5;
button3.addChild(button3Bg);

const coinShadow3 = new Graphics() 
coinShadow3.beginFill(0x000000);
coinShadow3.drawRoundedRect(620, -8, 30, 30, 30);
coinShadow3.endFill();
coinShadow3.alpha = 0.2;
buttons.addChild(coinShadow3);

const coinIcon3 = new Sprite(coin);
coinIcon3.x = 620;
coinIcon3.y = -12
coinIcon3.width = 30;
coinIcon3.height = 30;
coinIcon3.zIndex = tower.zIndex + 2;
coinIcon3.alpha = 1;
buttons.addChild(coinIcon3);

const button3Text  = new Text('', textStyleShop3);
button3Text.anchor.set(0.5);
button3Text.x = 735;
button3Text.y = 30;
button3Text.zIndex = tower.zIndex + 2;
button3Text.alpha = 0.6
button3.addChild(button3Text);

const button4 = new Graphics();
button4.beginFill("#d6be35ff");
button4.drawRoundedRect(952, 0, 200, 60, 20);
button4.endFill();
buttons.addChild(button4);

const button4Bg = new Graphics();
button4Bg.beginFill("#3c7c6cff");
button4Bg.drawRoundedRect(942, -10, 220, 80, 20);
button4Bg.endFill();
button4Bg.alpha = 0.5;
button4.addChild(button4Bg);

const coinShadow4 = new Graphics() 
coinShadow4.beginFill(0x000000);
coinShadow4.drawRoundedRect(937, -8, 30, 30, 30);
coinShadow4.endFill();
coinShadow4.alpha = 0.2;
buttons.addChild(coinShadow4);

const coinIcon4 = new Sprite(coin);
coinIcon4.x = 937;
coinIcon4.y = -12
coinIcon4.width = 30;
coinIcon4.height = 30;
coinIcon4.zIndex = tower.zIndex + 2;
coinIcon4.alpha = 1;
buttons.addChild(coinIcon4);

const button4Text  = new Text('', textStyleShop3);
button4Text.anchor.set(0.5);
button4Text.x = 1054;
button4Text.y = 30;
button4Text.zIndex = tower.zIndex + 2;
button4Text.alpha = 0.6
button4.addChild(button4Text);

interface UpgradeButton {
    button: Graphics;
    buttonBg: Graphics;
    buttonText: Text;
    cost: number;
    upgradeFunc: () => void;
    hovered: boolean;
}

const upgradeButtons: UpgradeButton[] = [
    { button: button1, buttonBg: button1Bg, buttonText: button1Text, cost: 10, upgradeFunc: () => { gameInfo.damage = Math.floor(gameInfo.damage * 1.3); }, hovered: false },
    { button: button2, buttonBg: button2Bg, buttonText: button2Text, cost: 10, upgradeFunc: () => { gameInfo.shopHp = Math.floor(gameInfo.hp * 1.3); gameInfo.hp = gameInfo.shopHp; }, hovered: false },
    { button: button3, buttonBg: button3Bg, buttonText: button3Text, cost: 50, upgradeFunc: () => { gameInfo.radiusX += 10, gameInfo.radiusY += 10 }, hovered: false },
    { button: button4, buttonBg: button4Bg, buttonText: button4Text, cost: 10, upgradeFunc: () => { gameInfo.shopMoneyWave += 20 }, hovered: false },
];

for (const btn of upgradeButtons) {
    btn.button.interactive = true;
    (btn.button as any).buttonMode = true;

    btn.button.on('pointerover', () => {
        btn.hovered = true;
    });
    btn.button.on('pointerout', () => {
        btn.hovered = false;
        btn.button.tint = 0xffffff;
        btn.buttonBg.tint = 0xffffff;
    });
    btn.button.on('pointerdown', () => {
        if (gameInfo.money >= btn.cost) {
            gameInfo.money -= btn.cost;
            if(btn.button == button3) btn.cost = Math.floor(btn.cost * 1.6)
            else btn.cost = Math.floor(btn.cost * 1.35)
            btn.upgradeFunc();
        }
    });
}

app.ticker.add(() => {
    for (const btn of upgradeButtons) {
        btn.buttonText.text = btn.cost.toString();
        if (btn.hovered) {
            if (gameInfo.money >= btn.cost) {
                btn.button.tint = 0x00ff00;
                btn.buttonBg.tint = 0x00ff00;
            } else {
                btn.button.tint = 0xff0000;
                btn.buttonBg.tint = 0xff0000;
            }
        }
    }
});



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
    damageText2.text = gameInfo.damage.toString();
    rangeText2.text = gameInfo.shopRange.toString();
    moneyWaveText2.text = gameInfo.shopMoneyWave.toString();
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
        gameInfo.money += gameInfo.shopMoneyWave;

        spawnEnemies();
        startWaveProgress();
    }
});