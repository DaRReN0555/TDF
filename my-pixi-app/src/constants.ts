import { Sprite, Assets, Texture, AnimatedSprite } from 'pixi.js';
import { app } from './main.js';
export const gameInfo: {
    blocks: Array<Array<number>>,
    damage: number,
    money: number,
    hp: number,
    wave: number,
    enemiesHp: number,
    radiusX: number,
    radiusY: number,
    enemiesLeft: number,
    enemiesKilled: number,
    enemiesOnWave: number,
    enemies: Array<Sprite>
} = {
    blocks: [],
    damage: 5,
    money: 0,
    hp: 20,
    wave: 1,
    enemiesHp: 5,
    radiusX: 350,
    radiusY: 200,
    enemiesLeft: 0,
    enemiesKilled: 0,
    enemiesOnWave: 4,
    enemies: [],
}

export const enemySize = {
    x: 32,
    y: 40
}
export const bossSize = {
    x: 64,
    y: 80
}

const walkFrames: Texture[] = await Promise.all(
  [1,2,3,4,5,6,5,4,3,2,1].map(i => Assets.load(`Sprites/Animations/UFO(1)Walk${i}.png`))
);

export async function walkAnimation(entity: Sprite) {
    return new Promise((resolve) => {
        const anim = new AnimatedSprite(walkFrames);
        anim.x = entity.x;
        anim.y = entity.y;
        anim.anchor.set(0.5, 1);
        anim.setSize(32, 40);
        anim.animationSpeed = 1;
        anim.loop = false;

        app.stage.addChild(anim);
        anim.play();

        anim.onComplete = () => resolve(anim);
        app.stage.removeChild(anim);
    });
}