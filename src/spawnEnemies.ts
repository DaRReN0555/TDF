import { Assets, Sprite, AnimatedSprite, Texture, Graphics, Ticker } from 'pixi.js';
import { gameInfo, enemySize } from './constants';
import { app, tower,} from './main.js';
import { updateWaveProgress } from './main.js';

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

export const cube: Texture[] = await Promise.all(
  [1,2,3,4].map(i => Assets.load(`Sprites/UFO/cube${i}.png`))
)

export const golemWalkFrames: Texture[] = await Promise.all(
  [1,2,3,4,5,6,7,8,9,10].map(i => Assets.load(`Sprites/Golem/Golem_walk${i}.png`))
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


        for (let k = 0; k < gameInfo.enemiesOnWave; k++) {
            updateWaveProgress()
            if(gameInfo.isGameEnded) return
            const cubeChance = 0.25;
            if (Math.random() < cubeChance) {
                await spawnCube();
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
            gameInfo.anims.push(crushAnim);

            await new Promise(res => setTimeout(res, gameInfo.SPAWN_INTERVAL));
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
        gameInfo.anims.push(sprite);

        const duration = gameInfo.respawnDuration / gameInfo.spawnSpeed;
        const startTime = performance.now();
        const startScale = 0.01;
        const endScale = 1;

        const tickerCallback = () => {
            if(gameInfo.isGameEnded) app.ticker.remove(tickerCallback)
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
    gameInfo.shadows.push(mask);
    gameInfo.anims.push(entity);

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
      if(gameInfo.isGameEnded) app.ticker.remove(tick)
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
        gameInfo.anims.push(anim);

        const duration = gameInfo.respawnDuration / gameInfo.spawnSpeed;
        const startTime = performance.now();
        const startScale = 1;
        const endScale = 0.01;

        const tickerCallback = () => {
            if(gameInfo.isGameEnded) app.ticker.remove(tickerCallback)
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

async function spawnCube() {
    const anim = new AnimatedSprite(cube);
    anim.anchor.set(0.5, 1);
    anim.animationSpeed = 0.15;
    anim.loop = true;
    anim.width = 60
    anim.height = 60
    anim.play();

    const shadowEllipse = new Graphics();
    shadowEllipse.beginFill("#000000");
    shadowEllipse.drawEllipse(anim.x, anim.y, 18, 13);
    shadowEllipse.endFill();
    shadowEllipse.alpha = 0.3;

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
    anim.x = positions[random].x + rangeX;
    anim.y = positions[random].y + rangeY;

    if(anim.x < tower.x) anim.scale.set(1,1);
    else(anim.scale.set(-1,1));

    app.stage.addChild(anim);
    app.stage.addChild(shadowEllipse);

    gameInfo.enemies.push(anim);
    gameInfo.shadows.push(shadowEllipse);
    gameInfo.enemiesLeft += 1;

    let y = anim.y;
    let ticker = (d: Ticker) => {
      if(gameInfo.isGameEnded) app.ticker.remove(ticker)
      if (!gameInfo.enemies.includes(anim)) {
        app.stage.removeChild(shadowEllipse);
        return;
      }
    
      let dx = tower.x - anim.x;
      let dy = tower.y - y + 25;
      const dist = Math.sqrt(dx * dx + dy * dy)
      dy /= dist;
      y += dy * gameInfo.ENEMY_SPEED * d.deltaMS / 20;
    
      const sin = Math.sin(performance.now() / 200) * 10;
      anim.y = y + sin;
    
      shadowEllipse.x = anim.x;
      shadowEllipse.y = y + 10;
      shadowEllipse.scale.set(1 + (anim.y - shadowEllipse.y) / 60)
    }

    app.ticker.add(ticker);
    return anim;
}

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
}

