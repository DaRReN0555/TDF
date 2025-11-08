import { Assets, Sprite, AnimatedSprite, Texture } from 'pixi.js';
import { gameInfo, enemySize, bossSize} from './constants';
import { app } from './main.js';

const crushingFrames: Texture[] = await Promise.all(
  [1,2,3,4,5,6,7].map(i => Assets.load(`Sprites/Animations/${i}.png`))
);
const crushingReverseFrames: Texture[] = await Promise.all(
  [7,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/${i}.png`))
);
const spawnFrames: Texture[] = await Promise.all(
  [1,2,3,4,5,6,7,8,9,10,11].map(i => Assets.load(`Sprites/Animations/UFO(1)${i}.png`))
);
export async function spawnEnemies () {

    let spritePng = "Sprites/UFO/UFO(1).png";
    if (gameInfo.wave <= 5) {
        spritePng = "Sprites/UFO/UFO(1).png";
    }
    if (gameInfo.wave > 5) {
        spritePng = "Sprites/UFO/UFO(2).png";
    }
    if (gameInfo.wave > 10) {
        spritePng = "Sprites/UFO/UFO(3).png";
    }
    if (gameInfo.wave > 15) {
        spritePng = "Sprites/UFO/UFO(4).png";
    }
    if (gameInfo.wave > 20) {
        spritePng = "Sprites/UFO/UFO(5).png";
    }
    if (gameInfo.wave > 25) {
        spritePng = "Sprites/UFO/UFO(6).png";
    }
    if (gameInfo.wave > 30) {
        spritePng = "Sprites/UFO/UFO(7).png";
    }

    let sizeAnimPromises: Promise<void>[] = [];

for(let k = 0; k < gameInfo.enemiesOnWave; k++) {
    const sprite = await Assets.load(spritePng);
    const entity = new Sprite(sprite);

    pickSpawnPos(entity);
    gameInfo.enemies.push(entity);
    gameInfo.enemiesLeft += 1;
    entity.setSize(0, 0);
    entity.anchor.set(0.5, 1);
    app.stage.addChild(entity);

    const animPromise = (async () => {
    const crushAnim = await crushingAnimation(entity.x, entity.y);
    await sizeAnimation(entity);
    if (crushAnim) app.stage.removeChild(crushAnim);
    await crushingReverseAnimation(entity);
    })();

    sizeAnimPromises.push(animPromise);
}

await Promise.all(sizeAnimPromises);
}

function pickSpawnPos(entity: Sprite) {
    let positions = [
        { "x": gameInfo.blocks[0][0] + 110, "y": gameInfo.blocks[0][1] + 50}, 
        { "x": gameInfo.blocks[3][0] + 110, "y": gameInfo.blocks[3][1] + 50 },
        { "x": gameInfo.blocks[6][0] + 110, "y": gameInfo.blocks[6][1] + 50 },
        { "x": gameInfo.blocks[21][0] + 110, "y": gameInfo.blocks[21][1] + 50 }, 
        { "x": gameInfo.blocks[27][0] + 110, "y": gameInfo.blocks[27][1] + 50 },
        { "x": gameInfo.blocks[42][0] + 110, "y": gameInfo.blocks[42][1] + 50 },
        { "x": gameInfo.blocks[45][0] + 110, "y": gameInfo.blocks[45][1] + 50 },
        { "x": gameInfo.blocks[48][0] + 110, "y": gameInfo.blocks[48][1] + 50 },
    ]

    let random: number = Math.floor(Math.random() * positions.length)
    let rangeX: number = (Math.random() - 0.5) * 20
    let rangeY: number = (Math.random() - 0.5) * 20
    let x: number = positions[random].x + rangeX
    let y: number = positions[random].y + rangeY
    entity.x = x
    entity.y = y
}

async function crushingAnimation(x: number, y: number): Promise<AnimatedSprite> {
    return new Promise((resolve) => {
        const anim = new AnimatedSprite(crushingFrames);
        anim.x = x;
        anim.y = y;
        anim.anchor.set(0.5);
        anim.setSize(50, 30);
        anim.animationSpeed = 0.1;
        anim.loop = false;

        app.stage.addChild(anim);
        anim.play();

        anim.onComplete = () => resolve(anim);
    });
}

async function sizeAnimation(entity: Sprite): Promise<void> {
    return new Promise((resolve) => {
        const anim = new AnimatedSprite(spawnFrames);
        anim.x = entity.x;
        anim.y = entity.y;
        anim.anchor.set(0.5, 1);
        anim.setSize(enemySize.x, enemySize.y);
        anim.loop = false;

        app.stage.addChild(anim);

        const totalFrames = anim.totalFrames;
        const duration = 500;
        const startTime = performance.now();

        const tickerCallback = () => {
            const elapsed = performance.now() - startTime;
            let t = Math.min(elapsed / duration, 1);
            t = easeInOutCubic(t);

            const frame = Math.floor(t * (totalFrames - 1));
            anim.gotoAndStop(frame);

            if (t >= 1) {
                app.ticker.remove(tickerCallback);
                app.stage.removeChild(anim);
                entity.setSize(enemySize.x, enemySize.y);
                resolve();
            }
        };

        app.ticker.add(tickerCallback);
    });
}


async function crushingReverseAnimation(entity: Sprite): Promise<void> {
    return new Promise((resolve) => {
        const anim = new AnimatedSprite(crushingReverseFrames);
        anim.x = entity.x;
        anim.y = entity.y;
        anim.anchor.set(0.5);
        anim.setSize(50, 30);
        anim.animationSpeed = 0.1;
        anim.loop = false;

        app.stage.addChildAt(anim, app.stage.getChildIndex(entity));
        const totalFrames = anim.totalFrames;
        const duration = 500;
        const startTime = performance.now();

        const tickerCallback = () => {
            const elapsed = performance.now() - startTime;
            let t = Math.min(elapsed / duration, 1);
            t = easeInOutCubic(t);

            const frame = Math.floor(t * (totalFrames - 1));
            anim.gotoAndStop(frame);

            if (t >= 1) {
                app.ticker.remove(tickerCallback);
                app.stage.removeChild(anim);
                resolve();
            }
        };

        app.ticker.add(tickerCallback);
    });
}

function easeInOutCubic(x: number): number {
return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}