import { Assets, Sprite, AnimatedSprite, Texture, Graphics } from 'pixi.js';
import { gameInfo, enemySize } from './constants';
import { app, tower } from './main.js';

const crushingFrame = await Assets.load(`Sprites/Animations/Ellipse 5.png`)

const walkFrames1: Texture[] = await Promise.all(
  [1,2,3,4,5,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/UFO(1)Walk${i}.png`))
);
const walkFrames2: Texture[] = await Promise.all(
  [1,2,3,4,5,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/UFO(2)Walk${i}.png`))
);
const walkFrames3: Texture[] = await Promise.all(
  [1,2,3,4,5,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/UFO(3)Walk${i}.png`))
);
const walkFrames4: Texture[] = await Promise.all(
  [1,2,3,4,5,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/UFO(4)Walk${i}.png`))
);
const walkFrames5: Texture[] = await Promise.all(
  [1,2,3,4,5,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/UFO(5)Walk${i}.png`))
);
const walkFrames6: Texture[] = await Promise.all(
  [1,2,3,4,5,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/UFO(6)Walk${i}.png`))
);
const walkFrames7: Texture[] = await Promise.all(
  [1,2,3,4,5,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/UFO(7)Walk${i}.png`))
);

export const batFly: Texture[] = await Promise.all(
  [1,2,3,4].map(i => Assets.load(`Sprites/Bat/fly${i}.png`))
)
const batDeath: Texture[] = await Promise.all(
  [1,2,3,4,5,6,7,8,9].map(i => Assets.load(`Sprites/Bat/death${i}.png`))
)

export const golemWalkFrames: Texture[] = await Promise.all(
  [1,2,3,4,5,6,7,8,9,10].map(i => Assets.load(`Sprites/Golem/Golem_walk${i}.png`))
);
export const golemAttackFrames: Texture[] = await Promise.all(
  [1,2,3,4,5,6,7,8,9,10,11].map(i => Assets.load(`Sprites/Golem/Golem_attack${i}.png`))
);
const golemDieFrames: Texture[] = await Promise.all(
  [1,2,3,4,5,6,7,8,9,10,11,12].map(i => Assets.load(`Sprites/Golem/Golem_die${i}.png`))
);

let walkFrames: Texture[]

export async function spawnEnemies() {
    if (gameInfo.wave <= 5) {
        walkFrames = walkFrames1;
    }
    else if (gameInfo.wave >= 5) {
        walkFrames = walkFrames2;
        gameInfo.enemiesHp += 10;
        gameInfo.moneyPerKill += 10
    }
    else if (gameInfo.wave >= 10) {
        walkFrames = walkFrames3;
        gameInfo.enemiesHp += 10;
        gameInfo.moneyPerKill += 10
    }
    else if (gameInfo.wave >= 15) {
        walkFrames = walkFrames4;
        gameInfo.enemiesHp += 10;
        gameInfo.moneyPerKill += 10
    }
    else if (gameInfo.wave >= 20) {
        walkFrames = walkFrames5;
        gameInfo.enemiesHp += 10;
        gameInfo.moneyPerKill += 10
    }
    else if (gameInfo.wave >= 25) {
        walkFrames = walkFrames6;
        gameInfo.enemiesHp += 10;
        gameInfo.moneyPerKill += 10
    }
    else if (gameInfo.wave >= 30) {
        walkFrames = walkFrames7;
        gameInfo.enemiesHp += 10;
        gameInfo.moneyPerKill += 10
    }

    if (gameInfo.wave % 5 !== 0) {
      gameInfo.enemiesOnWave = gameInfo.wave * 2 + 2;
      gameInfo.enemiesHp = gameInfo.wave * 2 + 5;
        for (let k = 0; k < gameInfo.enemiesOnWave; k++) {
            const batChance = 0.25;
            if (Math.random() < batChance) {
                await spawnBat();
                await new Promise(res => setTimeout(res, gameInfo.SPAWN_INTERVAL));
                continue;
            }
            let random = Math.floor(Math.random() * 7) + 1;
            switch (random) {
                case 1: walkFrames = walkFrames1; break;
                case 2: walkFrames = walkFrames2; break;
                case 3: walkFrames = walkFrames3; break;
                case 4: walkFrames = walkFrames4; break;
                case 5: walkFrames = walkFrames5; break;
                case 6: walkFrames = walkFrames6; break;
                case 7: walkFrames = walkFrames7; break;
            }
            const sprite = await Assets.load(`Sprites/UFO/UFO(${random}).png`);
            const entity = new Sprite(sprite);

            pickSpawnPos(entity);
            entity.setSize(0, 0);
            entity.anchor.set(0.5, 1);
            app.stage.addChild(entity);

            const crushAnim = await crushingAnimation(entity.x, entity.y);
            await sizeAnimation(entity);
            if (crushAnim) app.stage.removeChild(crushAnim);
            await crushingReverseAnimation(entity);

            const walkAnim = new AnimatedSprite(walkFrames);
            walkAnim.x = entity.x;
            walkAnim.y = entity.y;
            walkAnim.anchor.set(0.5, 1);
            walkAnim.width = enemySize.x;
            walkAnim.height = enemySize.y;
            walkAnim.animationSpeed = 0.5;
            walkAnim.loop = true;
            walkAnim.play();

            let index = app.stage.children.indexOf(entity);
            if (index === -1) index = app.stage.children.length;
            app.stage.removeChild(entity);
            app.stage.addChildAt(walkAnim, index);

            gameInfo.enemies.push(walkAnim);
            gameInfo.enemiesLeft += 1;

            await new Promise(res => setTimeout(res, gameInfo.SPAWN_INTERVAL));
        }
    } else {
        gameInfo.enemiesOnWave = 1
        gameInfo.enemiesHp += 100
        await spawnGolem();
    }
}

function pickSpawnPos(entity: Sprite) {
    const positions = [
        {x: gameInfo.blocks[0][0] + 110, y: gameInfo.blocks[0][1] + 50}, 
        {x: gameInfo.blocks[3][0] + 110, y: gameInfo.blocks[3][1] + 50},
        {x: gameInfo.blocks[6][0] + 110, y: gameInfo.blocks[6][1] + 50},
        {x: gameInfo.blocks[21][0] + 110, y: gameInfo.blocks[21][1] + 50}, 
        {x: gameInfo.blocks[27][0] + 110, y: gameInfo.blocks[27][1] + 50},
        {x: gameInfo.blocks[42][0] + 110, y: gameInfo.blocks[42][1] + 50},
        {x: gameInfo.blocks[45][0] + 110, y: gameInfo.blocks[45][1] + 50},
        {x: gameInfo.blocks[48][0] + 110, y: gameInfo.blocks[48][1] + 50},
    ];
    const random = Math.floor(Math.random() * positions.length);
    const rangeX = (Math.random() - 0.5) * 20;
    const rangeY = (Math.random() - 0.5) * 20;
    entity.x = positions[random].x + rangeX;
    entity.y = positions[random].y + rangeY;
}

async function crushingAnimation(x: number, y: number): Promise<Sprite> {
    return new Promise(resolve => {
        const sprite = new Sprite(crushingFrame);
        sprite.x = x;
        sprite.y = y;
        sprite.anchor.set(0.5);
        sprite.scale.set(1);
        app.stage.addChild(sprite);

        const duration = gameInfo.respawnDuration / gameInfo.spawnSpeed;
        const startTime = performance.now();
        const startScale = 0.01;
        const endScale = 1;

        const tickerCallback = () => {
            const elapsed = performance.now() - startTime;
            let t = Math.min(elapsed / duration, 1);
            t = easeInOutCubic(t);

            sprite.scale.set(startScale + (endScale - startScale) * t);

            if (t >= 1) {
                app.ticker.remove(tickerCallback);
                resolve(sprite);
            }
        };

        app.ticker.add(tickerCallback);
    });
}


async function sizeAnimation(entity: Sprite): Promise<void> {
  return new Promise(resolve => {
    const mask = new Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(
      -enemySize.x / 2,
      -enemySize.y,
      enemySize.x,
      enemySize.y
    );
    mask.endFill();
    mask.x = entity.x;
    mask.y = entity.y;
    app.stage.addChild(mask);

    entity.anchor.set(0.5, 1);
    entity.zIndex = 1
    entity.width  = enemySize.x;
    entity.height = enemySize.y;
    entity.mask = mask;

    const startY = entity.y + enemySize.y;
    const endY   = entity.y;
    entity.y = startY;

    const duration = gameInfo.respawnDuration / gameInfo.spawnSpeed;
    const startTime = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTime;
      let t = Math.min(elapsed / duration, 1);
      t = easeInOutCubic(t);

      entity.y = startY + (endY - startY) * t;

      if (t >= 1) {
        app.ticker.remove(tick);
        entity.mask = null;
        app.stage.removeChild(mask);
        resolve();
      }
    };
    app.ticker.add(tick);
  });
}


async function crushingReverseAnimation(entity: Sprite): Promise<void> {
    return new Promise(resolve => {
        const anim = new Sprite(crushingFrame);
        anim.x = entity.x;
        anim.y = entity.y;
        anim.anchor.set(0.5);
        anim.scale.set(2);

        let index = app.stage.children.indexOf(entity);
        if (index === -1) index = app.stage.children.length;
        app.stage.addChildAt(anim, index);

        const duration = gameInfo.respawnDuration / gameInfo.spawnSpeed;
        const startTime = performance.now();
        const startScale = 1;
        const endScale = 0.01;

        const tickerCallback = () => {
            const elapsed = performance.now() - startTime;
            let t = Math.min(elapsed / duration, 1);
            t = easeInOutCubic(t);

            anim.scale.set(startScale + (endScale - startScale) * t);

            if (t >= 1) {
                app.ticker.remove(tickerCallback);
                app.stage.removeChild(anim);
                resolve();
            }
        };

        app.ticker.add(tickerCallback);
    });
}

async function spawnBat() {
    const bat = new AnimatedSprite(batFly);
    bat.anchor.set(0.5, 1);
    bat.animationSpeed = 0.25;
    bat.loop = true;
    bat.play();

    bat.width = enemySize.x * 4;
    bat.height = enemySize.y * 3;

    const positions = [ 
        {x: gameInfo.blocks[3][0] + 110, y: gameInfo.blocks[3][1] + 50},
        {x: gameInfo.blocks[6][0] + 110, y: gameInfo.blocks[6][1] + 50},
        {x: gameInfo.blocks[21][0] + 110, y: gameInfo.blocks[21][1] + 50}, 
        {x: gameInfo.blocks[27][0] + 110, y: gameInfo.blocks[27][1] + 50},
        {x: gameInfo.blocks[42][0] + 110, y: gameInfo.blocks[42][1] + 50},
        {x: gameInfo.blocks[45][0] + 110, y: gameInfo.blocks[45][1] + 50},
    ];
    const random = Math.floor(Math.random() * positions.length);
    const rangeX = (Math.random() - 0.5) * 20;
    const rangeY = (Math.random() - 0.5) * 20;
    bat.x = positions[random].x + rangeX;
    bat.y = positions[random].y + rangeY;

    if(bat.x < tower.x) bat.scale.set(1,1);
    else(bat.scale.set(-1,1));

    app.stage.addChild(bat);

    gameInfo.enemies.push(bat);
    gameInfo.enemiesLeft += 1;

    return bat;
}

export async function killBat(bat: AnimatedSprite) {
    bat.stop();

    const deathAnim = new AnimatedSprite(batDeath);
    deathAnim.x = bat.x;
    deathAnim.y = bat.y;
    deathAnim.anchor.set(0.5, 1);
    deathAnim.width = bat.width;
    deathAnim.height = bat.height;
    deathAnim.animationSpeed = 0.3;
    deathAnim.loop = false;

    let index = app.stage.children.indexOf(bat);
    if (index === -1) index = app.stage.children.length;

    app.stage.removeChild(bat);
    app.stage.addChildAt(deathAnim, index);

    deathAnim.play();

    await new Promise<void>(res => {
        deathAnim.onComplete = res;
    });

    app.stage.removeChild(deathAnim);

    const i = gameInfo.enemies.indexOf(bat);
    if (i !== -1) gameInfo.enemies.splice(i, 1);

    gameInfo.enemiesLeft -= 1;
}

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
}

export async function spawnGolem() {
    const golem = new AnimatedSprite(golemWalkFrames);
    golem.anchor.set(0.5, 1);
    golem.width = 250
    golem.height = 200
    golem.animationSpeed = 0.15;
    golem.loop = true;
    golem.play();

        const positions = [ 
        {x: gameInfo.blocks[3][0] + 110, y: gameInfo.blocks[3][1] + 50},
        {x: gameInfo.blocks[6][0] + 110, y: gameInfo.blocks[6][1] + 50},
        {x: gameInfo.blocks[21][0] + 110, y: gameInfo.blocks[21][1] + 50}, 
        {x: gameInfo.blocks[27][0] + 110, y: gameInfo.blocks[27][1] + 50},
        {x: gameInfo.blocks[42][0] + 110, y: gameInfo.blocks[42][1] + 50},
        {x: gameInfo.blocks[45][0] + 110, y: gameInfo.blocks[45][1] + 50},
    ];
    const random = Math.floor(Math.random() * positions.length);
    const rangeX = (Math.random() - 0.5) * 20;
    const rangeY = (Math.random() - 0.5) * 20;
    golem.x = positions[random].x + rangeX;
    golem.y = positions[random].y + rangeY;

    if(golem.x < tower.x) golem.scale.set(1,1);
    else(golem.scale.set(-1,1));

    app.stage.addChild(golem);

    gameInfo.enemies.push(golem);
    gameInfo.enemiesLeft += 1;

    return golem;
}

export async function killGolem(golem: AnimatedSprite) {
    golem.stop();

    const deathAnim = new AnimatedSprite(golemDieFrames);
    deathAnim.x = golem.x;
    deathAnim.y = golem.y;
    deathAnim.anchor.set(0.5, 1);
    deathAnim.width = golem.width;
    deathAnim.height = golem.height;
    deathAnim.animationSpeed = 0.3;
    deathAnim.loop = false;

    let index = app.stage.children.indexOf(golem);
    if (index === -1) index = app.stage.children.length;

    app.stage.removeChild(golem);
    app.stage.addChildAt(deathAnim, index);

    if(deathAnim.x < tower.x) deathAnim.scale.set(1,1);
    else(deathAnim.scale.set(-1,1));

    deathAnim.play();

    await new Promise<void>(res => {
        deathAnim.onComplete = res;
    });

    app.stage.removeChild(deathAnim);

    const i = gameInfo.enemies.indexOf(golem);
    if (i !== -1) gameInfo.enemies.splice(i, 1);

    gameInfo.enemiesLeft -= 1;
}

export async function attackGolem(golem: AnimatedSprite) {
    golem.stop();

    golem.textures = golemAttackFrames;
    golem.animationSpeed = 0.3;
    golem.loop = true;
    golem.play();

    if (golem.x < tower.x) golem.scale.set(1,1);
    else golem.scale.set(-1,1);
}
