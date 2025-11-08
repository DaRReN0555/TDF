import { Sprite } from 'pixi.js';
export const gameInfo: {
    blocks: Array<Array<number>>,
    money: number,
    hp: number,
    wave: number,
    enemiesLeft: number,
    enemiesKilled: number,
    enemiesOnWave: number,
    enemies: Array<Sprite>
} = {
    blocks: [],
    money: 0,
    hp: 20,
    wave: 1,
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