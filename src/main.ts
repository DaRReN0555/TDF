import {
  Application,
  Assets,
  Sprite,
  AnimatedSprite,
  Graphics,
  Ticker,
  Container,
  TextStyle,
  Text,
  Point,
} from "pixi.js";
import { createMap } from "./createMap.js";
import { createTower, bow } from "./createTower.js";
import {
  spawnEnemies,
  cube,
} from "./spawnEnemies.js";
import { startEnemyMovement } from "./enemiesMoving.js";
import { gameInfo } from "./constants.js";
import { restartScreen } from "./restartGame.js";
import { changeSkinAnim } from "./changeTowerSkinAnim";
import { func } from "./createShader.js";

export const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: 0x1099bb,
});
document.body.appendChild(app.canvas);
app.stage.sortableChildren = true;

func();

await createMap();
export let tower = await createTower();
startEnemyMovement();

app.stage.sortableChildren = true;
tower.zIndex = 1000;

const towerSkin1 = await Assets.load(
  "Sprites/Towers/Archer/archer_level_1.png",
);
const towerSkin2 = await Assets.load(
  "Sprites/Towers/Archer/archer_level_2.png",
);
const towerSkin3 = await Assets.load(
  "Sprites/Towers/Archer/archer_level_3.png",
);

const settingsIconTexture = await Assets.load("Sprites/gear.png",)

app.ticker.add(() => {
  if (!gameInfo.isGameEnded) {
    const towerBottom = tower.y + tower.height * (1 - tower.anchor.y);

    for (const enemy of gameInfo.enemies) {
      const enemyBottom = enemy.y + enemy.height * enemy.anchor.y;

      if (enemyBottom < towerBottom) {
        enemy.zIndex = tower.zIndex - 1;
      } else {
        enemy.zIndex = tower.zIndex + 1;
      }
    }
  } else return;
});

const arrowTexture = await Assets.load("Sprites/Towers/Archer/arrow.png");
const heart = await Assets.load("Sprites/heart.png");
const coin = await Assets.load("Sprites/coin.png");

let towerCooldown = 0;
let ARROW_SPEED = 10;

interface EnemyWithHp extends Sprite {
  hp: number;
  isTargeted?: boolean;
}

app.ticker.add((delta: Ticker) => {
  if (!gameInfo.isGameEnded) towerAttack(delta.deltaMS);
  else return;
});

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function towerAttack(deltaMS: number) {
  towerCooldown -= deltaMS;
  if (towerCooldown > 0) return;

  const target = gameInfo.enemies.find(
    (enemy) =>
      isInsideTowerEllipse(
        enemy.x,
        enemy.y,
        tower.x + tower.width / 2 - 65,
        tower.y + tower.height / 2 - 44,
        gameInfo.radiusX,
        gameInfo.radiusY,
      ) && !(enemy as EnemyWithHp).isTargeted,
  ) as EnemyWithHp | undefined;

  if (!target) return;

  if (target.hp === undefined) target.hp = gameInfo.enemiesHp;
  target.isTargeted = true;

  shootArrow(target, gameInfo.damage, ARROW_SPEED);
  towerCooldown = gameInfo.TOWER_FIRE_RATE;
}

function shootArrow(enemy: EnemyWithHp, damage: number, arrowSpeed: number) {
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
    bow.y = tower.height / 2 + orbitY - 120;
    bow.rotation = angle + Math.PI;

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
  arrowSprite.y = bow.y + tower.y;
  arrowSprite.zIndex = tower.zIndex + 2;
  app.stage.addChild(arrowSprite);

  const moveArrow = (delta: Ticker) => {
    if (!enemy.parent) {
      app.stage.removeChild(arrowSprite);
      app.ticker.remove(moveArrow);
      return;
    }

    const dx = enemy.x - arrowSprite.x;
    let dy = enemy.y - 20 - arrowSprite.y;
    if (enemy instanceof AnimatedSprite && enemy.textures === cube) {
      dy = enemy.y - 30 - arrowSprite.y;
    }
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

          spawnParticles(deathX, deathY, "#e4e4e4ff");
          spawnCoins(deathX, deathY);
        }

        enemy.isTargeted = false;
        app.stage.removeChild(arrowSprite);
        app.ticker.remove(moveArrow);
      

      enemy.isTargeted = false;
      app.stage.removeChild(arrowSprite);
      app.ticker.remove(moveArrow);
      return;
    }

    arrowSprite.x += (dx / dist) * arrowSpeed * delta.deltaTime;
    arrowSprite.y += (dy / dist) * arrowSpeed * delta.deltaTime;
    arrowSprite.rotation = Math.atan2(dy, dx) + Math.PI / 2;

    if (
      arrowSprite.x < 0 ||
      arrowSprite.x > app.screen.width ||
      arrowSprite.y < 0 ||
      arrowSprite.y > app.screen.height
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
  radiusY: number,
): boolean {
  const dx = enemyX - towerX;
  const dy = enemyY - towerY;
  return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
}

interface Particle extends Graphics {
  vx: number;
  vy: number;
}

function spawnParticles(x: number, y: number, color: string) {
  const particles: Graphics[] = [];
  const count = Math.floor(Math.random() * 5) + 3;

  for (let i = 0; i < count; i++) {
    const p = new Graphics() as Particle;
    const size = 3 + Math.random() * 3;
    p.beginFill(`${color}`);
    p.drawRect(-size / 2, -size / 2, size, size);
    p.endFill();
    p.x = x;
    p.y = y;
    p.vx = Math.random() - 0.5;
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
  fontFamily: "Arial",
  fontSize: 16,
  fontWeight: "bold",
  fill: 0x000000,
});
const textStyle2 = new TextStyle({
  fontFamily: "Arial",
  fontSize: 24,
  fontWeight: "bold",
  fill: 0x000000,
});
const text = new Text("WAVE", textStyle);
text.x = 64;
text.y = 11;
waveContainer.addChild(text);
const text2 = new Text("", textStyle2);
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

spawnEnemies();

export function startWaveProgress() {
  gameInfo.enemiesLeft = 1
  startTime = performance.now();
  totalEnemies = gameInfo.enemiesOnWave;
  displayedProgress = 0;
  previousProgress = 0;
  targetProgress = 0;
  animating = false;
  mask.scale.x = 0;
}

export function updateWaveProgress() {
  totalEnemies = gameInfo.enemiesLeft;
  animating = true
  mask.scale.x = displayedProgress
}

startWaveProgress();

const healthContainer = new Container();
healthContainer.x = tower.x - 80;
healthContainer.y = tower.y - 135;
healthContainer.zIndex = 10000;
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
  fontFamily: "Arial",
  fontSize: 20,
  fontWeight: "bold",
  fill: "#d82929ff",
});
const textStyle4 = new TextStyle({
  fontFamily: "Arial",
  fontSize: 18,
  fontWeight: "bold",
  fill: "#d82929ff",
});

const healthText = new Text("", textStyle3);
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

const coinShadow = new Graphics();
coinShadow.beginFill(0x000000);
coinShadow.drawRoundedRect(-20, -13, 20, 20, 30);
coinShadow.endFill();
coinShadow.alpha = 0.2;
moneyContainer.addChild(coinShadow);

const coinIcon = new Sprite(coin);
coinIcon.x = -20;
coinIcon.y = -15;
coinIcon.width = 20;
coinIcon.height = 20;
coinIcon.zIndex = tower.zIndex + 2;
coinIcon.alpha = 1;
moneyContainer.addChild(coinIcon);

coinShadow.zIndex = coinIcon.zIndex;

const textStyle5 = new TextStyle({
  fontFamily: "Arial",
  fontSize: 26,
  fontWeight: "bold",
  fill: "#d82929ff",
});

const coinText = new Text("", textStyle5);
coinText.anchor.set(0.5);
coinText.x = 10;
coinText.y = 18;
coinText.zIndex = tower.zIndex + 2;
moneyContainer.addChild(coinText);

function spawnCoins(x: number, y: number) {
  const coinsCount = gameInfo.moneyPerKill > 5 ? 5 : gameInfo.moneyPerKill;
  for (let i = 0; i < coinsCount; i++) {
    const coinSprite = new Sprite(coin);
    coinSprite.anchor.set(0.5);
    coinSprite.scale.set(0.05);
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
      const scale = 0.05 - 0.03 * ease;
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
  fontFamily: "Arial",
  fontSize: 35,
  fontWeight: "bold",
  fill: "#d6be35ff",
});

const textStyleShop2 = new TextStyle({
  fontFamily: "Arial",
  fontSize: 65,
  fontWeight: "bold",
  fill: "#ffffffff",
});

const textStyleShop3 = new TextStyle({
  fontFamily: "Arial",
  fontSize: 35,
  fontWeight: "bold",
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

const damageBg = new Graphics();
damageBg.beginFill("#2f685aff");
damageBg.drawRoundedRect(30, 30, 287.5, 300, 20);
damageBg.endFill();
damageBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageBg);

const damageText = new Text("DAMAGE", textStyleShop1);
damageText.x = 96;
damageText.y = 50;
damageText.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageText);

const damageText2 = new Text("", textStyleShop2);
damageText2.anchor.set(0.5);
damageText2.x = 173;
damageText2.y = 140;
damageText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(damageText2);

const hpBg = new Graphics();
hpBg.beginFill("#2f685aff");
hpBg.drawRoundedRect(347.5, 30, 287.5, 300, 20);
hpBg.endFill();
hpBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(hpBg);

const hpText = new Text("HEALTH", textStyleShop1);
hpText.x = 422;
hpText.y = 50;
hpText.zIndex = tower.zIndex + 2;
shopMenu.addChild(hpText);

const hpText2 = new Text("", textStyleShop2);
hpText2.anchor.set(0.5);
hpText2.x = 492;
hpText2.y = 140;
hpText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(hpText2);

const rangeBg = new Graphics();
rangeBg.beginFill("#2f685aff");
rangeBg.drawRoundedRect(665, 30, 287.5, 300, 20);
rangeBg.endFill();
rangeBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeBg);

const rangeText = new Text("RANGE", textStyleShop1);
rangeText.x = 745;
rangeText.y = 50;
rangeText.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeText);

const rangeText2 = new Text("1", textStyleShop2);
rangeText2.anchor.set(0.5);
rangeText2.x = 805;
rangeText2.y = 140;
rangeText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(rangeText2);

const moneyWaveBg = new Graphics();
moneyWaveBg.beginFill("#2f685aff");
moneyWaveBg.drawRoundedRect(982.5, 30, 287.5, 300, 20);
moneyWaveBg.endFill();
moneyWaveBg.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveBg);

const moneyWaveText = new Text("MONEYWAVE", textStyleShop1);
moneyWaveText.x = 1013;
moneyWaveText.y = 50;
moneyWaveText.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveText);

const moneyWaveText2 = new Text("1", textStyleShop2);
moneyWaveText2.anchor.set(0.5);
moneyWaveText2.x = 1126;
moneyWaveText2.y = 140;
moneyWaveText2.zIndex = tower.zIndex + 2;
shopMenu.addChild(moneyWaveText2);

interface UpgradeButton {
  button: Graphics;
  buttonBg: Graphics;
  buttonText: Text;
  cost: number;
  upgradeFunc: () => void;
  hovered: boolean;
}

const buttons = new Container();
buttons.x = 75;
buttons.y = 200;
buttons.zIndex = tower.zIndex + 3;
shopMenu.addChild(buttons);

function createUpgradeButton(x: number, cost: number): UpgradeButton {
  const container = new Container();
  container.x = x;
  container.y = 0;
  buttons.addChild(container);

  const buttonBg = new Graphics();
  buttonBg.beginFill(0x3c7c6c);
  buttonBg.drawRoundedRect(-10, -10, 220, 80, 30);
  buttonBg.endFill();
  buttonBg.pivot.set(100, 30);
  buttonBg.alpha = 0.5;
  buttonBg.x = 100;
  buttonBg.y = 30;
  container.addChild(buttonBg);

  const button = new Graphics();
  button.beginFill(0xd6be35);
  button.drawRoundedRect(0, 0, 200, 60, 20);
  button.endFill();
  button.pivot.set(100, 30);
  button.x = 100;
  button.y = 30;
  container.addChild(button);

  const buttonText = new Text(cost.toString(), textStyleShop3);
  buttonText.anchor.set(0.5);
  buttonText.x = 100;
  buttonText.y = 30;
  container.addChild(buttonText);
  const coinIcon = new Sprite(coin);
  coinIcon.anchor.set(0.5);
  coinIcon.x = -10;
  coinIcon.y = 0;
  coinIcon.width = 30;
  coinIcon.height = 30;
  coinIcon.zIndex = tower.zIndex + 2;
  container.addChild(coinIcon);
  const coinShadow = new Graphics();
  coinShadow.beginFill(0x000000);
  coinShadow.drawRoundedRect(-15, 0, 30, 30, 15);
  coinShadow.endFill();
  coinShadow.alpha = 0.2;
  coinShadow.x = coinIcon.x;
  coinShadow.y = coinIcon.y + 6;
  container.addChild(coinShadow);
  container.interactive = true;
  (container as any).buttonMode = true;

  const btnData: UpgradeButton = {
    button,
    buttonBg,
    buttonText,
    cost,
    upgradeFunc: () => {},
    hovered: false,
  };

  container.on("pointerover", () => (btnData.hovered = true));
  container.on("pointerout", () => {
    btnData.hovered = false;
    btnData.button.tint = 0xffffff;
    btnData.buttonBg.tint = 0xffffff;
  });
  container.on("pointerdown", () => {
    if (gameInfo.money >= btnData.cost) {
      gameInfo.money -= btnData.cost;
      btnData.cost = Math.floor(btnData.cost * 1.35);
      btnData.upgradeFunc();
    }
  });
  app.ticker.add(() => {
    if (!gameInfo.isGameEnded) {
      const targetScale = btnData.hovered ? 1.1 : 1.0;
      button.scale.x += (targetScale - button.scale.x) * 0.2;
      button.scale.y += (targetScale - button.scale.y) * 0.2;
      buttonBg.scale.x += (targetScale - buttonBg.scale.x) * 0.2;
      buttonBg.scale.y += (targetScale - buttonBg.scale.y) * 0.2;
      coinIcon.x = -10 * button.scale.x;
      coinIcon.y = 0 * button.scale.y;
      coinShadow.x = coinIcon.x;
      coinShadow.y = coinIcon.y - 12 * button.scale.y;
    }
    if (gameInfo.isGameEnded) btnData.cost = 10;
    else return;
  });

  return btnData;
}

const upgradeButtons: UpgradeButton[] = [
  createUpgradeButton(0, 10),
  createUpgradeButton(316, 10),
  createUpgradeButton(633, 50),
  createUpgradeButton(952, 10),
];
upgradeButtons[0].upgradeFunc = () => {
  gameInfo.damage = Math.floor(gameInfo.damage * 1.3);
};
upgradeButtons[1].upgradeFunc = () => {
  gameInfo.shopHp = Math.floor(gameInfo.maxHp * 1.3);
  gameInfo.maxHp = gameInfo.shopHp;
  gameInfo.hp = gameInfo.shopHp;
};
upgradeButtons[2].upgradeFunc = () => {
  gameInfo.radiusX += 10;
  gameInfo.radiusY += 10;
  gameInfo.shopRange += 1;
};
upgradeButtons[3].upgradeFunc = () => {
  gameInfo.shopMoneyWave += 20;
};

const changeGameSpeedContainer = new Container();
changeGameSpeedContainer.x = 50;
changeGameSpeedContainer.y = 50;
app.stage.addChild(changeGameSpeedContainer);
const changeGameSpeedButton = new Graphics();
changeGameSpeedButton.interactive = true;
changeGameSpeedButton.beginFill("#6b6a6aff");
changeGameSpeedButton.drawRoundedRect(0, 0, 100, 40, 15);
changeGameSpeedButton.endFill();
changeGameSpeedButton.alpha = 1;
changeGameSpeedButton.x = 0;
changeGameSpeedButton.y = 0;
changeGameSpeedContainer.addChild(changeGameSpeedButton);

const changeGameSpeedButtonBg = new Graphics();
changeGameSpeedButtonBg.beginFill("#504f4fff");
changeGameSpeedButtonBg.drawRoundedRect(-5, -5, 110, 50, 20);
changeGameSpeedButtonBg.endFill();
changeGameSpeedButtonBg.alpha = 0.5;
changeGameSpeedButtonBg.x = 0;
changeGameSpeedButtonBg.y = 0;
changeGameSpeedContainer.addChild(changeGameSpeedButtonBg);

const changeGameSpeedSign = new Graphics();
changeGameSpeedSign.beginFill("#ffffffff");
changeGameSpeedSign.drawRoundedRect(7.5, 7.5, 25, 25, 30);
changeGameSpeedSign.endFill();
changeGameSpeedSign.alpha = 1;
changeGameSpeedSign.x = 0;
changeGameSpeedSign.y = 0;
changeGameSpeedContainer.addChild(changeGameSpeedSign);

const changeGameSpeedSignBg = new Graphics();
changeGameSpeedSignBg.beginFill("#ffffffff");
changeGameSpeedSignBg.drawRoundedRect(5, 5, 30, 30, 30);
changeGameSpeedSignBg.endFill();
changeGameSpeedSignBg.alpha = 0.5;
changeGameSpeedSignBg.x = 0;
changeGameSpeedSignBg.y = 0;
changeGameSpeedContainer.addChild(changeGameSpeedSignBg);

export let isButtonClicked = false;
let startX = 0;
let targetX = 0;

changeGameSpeedButton.on("pointerdown", () => {
  isButtonClicked = !isButtonClicked;

  if (isButtonClicked) {
    gameInfo.respawnDuration = 250;
    gameInfo.spawnSpeed = 2;
    gameInfo.SPAWN_INTERVAL = 100;
    gameInfo.ENEMY_SPEED = 2.5;
    gameInfo.TOWER_FIRE_RATE = 250;
  } else {
    gameInfo.respawnDuration = 500;
    gameInfo.spawnSpeed = 1;
    gameInfo.SPAWN_INTERVAL = 500;
    gameInfo.ENEMY_SPEED = 1.5;
    gameInfo.TOWER_FIRE_RATE = 500;
  }

  changeGameSpeedButton.clear();
  changeGameSpeedButton.beginFill(isButtonClicked ? "#4be653ff" : "#6b6a6aff");
  changeGameSpeedButton.drawRoundedRect(0, 0, 100, 40, 15);
  changeGameSpeedButton.endFill();

  startX = changeGameSpeedSign.x;
  targetX = isButtonClicked ? 60 : 0;

  let startTime = performance.now();
  let duration = 200;

  function update() {
    let elapsed = performance.now() - startTime;
    let t = elapsed / duration;
    if (t > 1) t = 1;
    let eased = easeInOutCubic(t);
    let x = startX + (targetX - startX) * eased;
    changeGameSpeedSign.x = x;
    changeGameSpeedSignBg.x = x;
    if (t === 1) {
      app.ticker.remove(update);
    }
  }
  app.ticker.add(update);
});

const triangle = new Graphics();
triangle.beginFill("#ffffffff");
triangle.drawPolygon([
  new Point(changeGameSpeedContainer.x + 15, changeGameSpeedContainer.y + 10),
  new Point(changeGameSpeedContainer.x + 25, changeGameSpeedContainer.y + 20),
  new Point(changeGameSpeedContainer.x + 15, changeGameSpeedContainer.y + 30),
]);
triangle.endFill();
triangle.alpha = 0.5;
app.stage.addChild(triangle);

const triangle2 = new Graphics();
triangle2.beginFill("#ffffffff");
triangle2.drawPolygon([
  new Point(changeGameSpeedContainer.x + 78, changeGameSpeedContainer.y + 10),
  new Point(changeGameSpeedContainer.x + 88, changeGameSpeedContainer.y + 20),
  new Point(changeGameSpeedContainer.x + 78, changeGameSpeedContainer.y + 30),
]);
triangle2.endFill();
triangle2.alpha = 0.5;
app.stage.addChild(triangle2);

const triangle3 = new Graphics();
triangle3.beginFill("#ffffffff");
triangle3.drawPolygon([
  new Point(changeGameSpeedContainer.x + 70, changeGameSpeedContainer.y + 10),
  new Point(changeGameSpeedContainer.x + 80, changeGameSpeedContainer.y + 20),
  new Point(changeGameSpeedContainer.x + 70, changeGameSpeedContainer.y + 30),
]);
triangle3.endFill();
triangle3.alpha = 0.5;
app.stage.addChild(triangle3);

app.ticker.add(() => {
  if (!gameInfo.isGameEnded) {
    for (const btn of upgradeButtons) {
      if (gameInfo.money >= btn.cost) {
        btn.button.tint = 0x00ff00;
        btn.buttonBg.tint = 0x00ff00;
      } else {
        btn.button.tint = 0xff0000;
        btn.buttonBg.tint = 0xff0000;
      }

      btn.buttonText.text = btn.cost.toString();

      const targetScale = btn.hovered ? 1.1 : 1.0;
      btn.button.scale.x += (targetScale - btn.button.scale.x) * 0.2;
      btn.button.scale.y += (targetScale - btn.button.scale.y) * 0.2;
      btn.buttonBg.scale.x += (targetScale - btn.buttonBg.scale.x) * 0.2;
      btn.buttonBg.scale.y += (targetScale - btn.buttonBg.scale.y) * 0.2;
    }
  } else return;
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
  if (gameInfo.isGameEnded) return;

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
  coinText.text = Math.floor(gameInfo.money).toString();
  if (gameInfo.money >= 1000) {
    let num = gameInfo.money / 1000;
    let rounded = Number(num.toFixed(1));
    coinText.text = `${rounded}K`;
  }
  if (gameInfo.hp <= 0) {
    gameInfo.isGameEnded = true;
    restartScreen(app, spawnEnemies, startEnemyMovement, createTower);
    gameInfo.hp = 0;
  }
  healthText.text = gameInfo.hp.toString();
  text2.text = gameInfo.wave.toString();

  const killed = gameInfo.enemiesKilled;
  const alive = gameInfo.enemies.length;
  const total = killed + alive || 1;
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
    displayedProgress =
      previousProgress + (targetProgress - previousProgress) * t;

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

let lastSkin = 1;

app.ticker.add(() => {
  if (gameInfo.hp <= 0 || gameInfo.isGameEnded) {
    app.stage.children.forEach((child) => {
      if (child.zIndex == 999 || child.zIndex == 1001) {
        app.stage.removeChild(child);
      }
    });
  }

  let currentSkin = 1;
  if (gameInfo.wave >= 15 && gameInfo.wave < 30) currentSkin = 2;
  if (gameInfo.wave >= 30) currentSkin = 3;

  if (currentSkin !== lastSkin) {
    lastSkin = currentSkin;

    switch (currentSkin) {
      case 1:
        tower.texture = towerSkin1;
        break;
      case 2:
        tower.texture = towerSkin2;
        break;
      case 3:
        tower.texture = towerSkin3;
        break;
    }

    changeSkinAnim(gameInfo);
  }
});

const settingsContainer = new Container()
settingsContainer.x = 170;
settingsContainer.y = 40;
settingsContainer.zIndex = tower.zIndex + 3;
app.stage.addChild(settingsContainer);

const settingsBg = new Graphics()
settingsBg.beginFill("#464646ff");
settingsBg.drawRoundedRect(0, 0, 60, 60, 20);
settingsBg.endFill();
settingsBg.alpha = 0.5;
settingsContainer.addChild(settingsBg);

const settings = new Graphics()
settings.beginFill("#5e5e5eff");
settings.drawRoundedRect(5, 5, 50, 50, 15);
settings.endFill();
settings.alpha = 1;
settingsContainer.addChild(settings);

settings.interactive = true

const settingsIcon = new Sprite(settingsIconTexture);
settingsIcon.anchor.set(0.5);
settingsIcon.width = 40;
settingsIcon.height = 40;
settingsIcon.x = 30;
settingsIcon.y = 30;
settingsContainer.addChild(settingsIcon);

settings.on("pointerover", () => {
  let startTime = performance.now();
  let duration = 100
  function update() {
    let elapsed = performance.now() - startTime
    let t = elapsed / duration
    t = easeInOutCubic(t)
    settingsIcon.width = 40 + (50 - 40) * t
    settingsIcon.height = 40 + (50 - 40) * t
    if (t >= 1) {
      app.ticker.remove(update)
    }
  }
  app.ticker.add(update)
});

settings.on("pointerout", () => {
  let startTime = performance.now();
  let duration = 100
  function update() {
    let elapsed = performance.now() - startTime
    let t = elapsed / duration
    t = easeInOutCubic(t)
    settingsIcon.width = 50 - (50 - 40) * t
    settingsIcon.height = 50 - (50 - 40) * t
    if (t >= 1) {
      app.ticker.remove(update)
    }
  }
  app.ticker.add(update)
});

let isSettingsClicked = false

settings.on("pointerdown", () => {
  isSettingsClicked = !isSettingsClicked;
  isSettingsClicked ? spawnEnemyButton.interactive = true : spawnEnemyButton.interactive = false

  let startX = settingsMenuContainer.x;
  let startY = settingsMenuContainer.y;

  let endX = isSettingsClicked ? 45 : 200;
  let endY = isSettingsClicked ? 110 : 60;

  let startW = settingsMenuContainer.width;
  let startH = settingsMenuContainer.height;

  let endW = isSettingsClicked ? 184 : 0;
  let endH = isSettingsClicked ? 115 : 0;

  let startTime = performance.now();
  let duration = 200;

  function update() {
    let elapsed = performance.now() - startTime;
    let t = elapsed / duration;
    if (t > 1) t = 1;
    let e = easeInOutCubic(t);

    settingsMenuContainer.x = startX + (endX - startX) * e;
    settingsMenuContainer.y = startY + (endY - startY) * e;

    settingsMenuContainer.width  = startW + (endW - startW) * e;
    settingsMenuContainer.height = startH + (endH - startH) * e;

    if (t === 1) {
      app.ticker.remove(update);
    }
  }
  app.ticker.add(update);
});



const settingsMenuContainer = new Container()
settingsMenuContainer.x = 200;
settingsMenuContainer.y = 60;
settingsMenuContainer.scale.set(0);
settingsMenuContainer.zIndex = tower.zIndex + 3;
app.stage.addChild(settingsMenuContainer);

const settingsMenu = new Graphics()
settingsMenu.beginFill("#464646ff");
settingsMenu.drawRoundedRect(0, 0, 184, 115, 20);
settingsMenu.endFill();
settingsMenu.x = 0;
settingsMenu.y = 0;
settingsMenu.alpha = 0.5;
settingsMenu.zIndex = tower.zIndex + 3;
settingsMenuContainer.addChild(settingsMenu);

const settingsMenuBg = new Graphics()
settingsMenuBg.beginFill("#585858ff");
settingsMenuBg.drawRoundedRect(5, 5, 174, 105, 15);
settingsMenuBg.endFill();
settingsMenuBg.x = 0;
settingsMenuBg.y = 0;
settingsMenuBg.zIndex = tower.zIndex + 3;
settingsMenuContainer.addChild(settingsMenuBg);

const spawnEnemyButtonBg = new Graphics()
spawnEnemyButtonBg.beginFill("#a5a346ff");
spawnEnemyButtonBg.drawRoundedRect(17, 25, 150, 70, 20);
spawnEnemyButtonBg.endFill();
spawnEnemyButtonBg.x = 0;
spawnEnemyButtonBg.y = 0;
spawnEnemyButtonBg.zIndex = tower.zIndex + 3;
settingsMenuContainer.addChild(spawnEnemyButtonBg);

const spawnEnemyButton = new Graphics()
spawnEnemyButton.beginFill("#bebc52ff");
spawnEnemyButton.drawRoundedRect(17, 16, 150, 70, 20);
spawnEnemyButton.endFill();
spawnEnemyButton.x = 0;
spawnEnemyButton.y = 0;
spawnEnemyButton.zIndex = tower.zIndex + 3;
settingsMenuContainer.addChild(spawnEnemyButton);

spawnEnemyButton.interactive = true

spawnEnemyButton.on("pointerdown", () => {
  spawnEnemies()
  let startTime = performance.now();
  let duration = 100
  function update() {
    let elapsed = performance.now() - startTime
    let t = elapsed / duration
    t = easeInOutCubic(t)
    spawnEnemyButton.y = 0 + 10 * t
    spawnText.y = 40 + (40 - 30) * t
    if (t >= 1) {
      app.ticker.remove(update)
    }
  }
  app.ticker.add(update)
});

spawnEnemyButton.on("pointerup", () => {
  let startTime = performance.now();
  let duration = 100
  function update() {
    let elapsed = performance.now() - startTime
    let t = elapsed / duration
    t = easeInOutCubic(t)
    spawnEnemyButton.y = 10 - (10 - 0) * t
    spawnText.y = 50 - (50 - 40) * t
    if (t >= 1) {
      app.ticker.remove(update)
    }
  }
  app.ticker.add(update)
});

const spawnTextStyle = new TextStyle({
  fontFamily: "Arial",
  fontSize: 20,
  fontWeight: "bold",
  fill: "#000000ff",
  align: "center",
});

const spawnText = new Text("SPAWN", spawnTextStyle);
spawnText.x = 55
spawnText.y = 40
spawnText.zIndex = tower.zIndex + 3;
settingsMenuContainer.addChild(spawnText);
