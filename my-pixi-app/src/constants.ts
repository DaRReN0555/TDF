import { Sprite } from 'pixi.js';

export interface GameInfo {
    blocks: Array<Array<number>>,
    blocksSprites: Array<Sprite>,
    damage: number,
    money: number,
    moneyPerKill: number,
    hp: number,
    maxHp: number,
    wave: number,
    enemiesHp: number,
    radiusX: number,
    radiusY: number,
    respawnDuration: number,
    enemiesLeft: number,
    enemiesKilled: number,
    enemiesOnWave: number,
    enemiesDamage: number,
    enemies: Array<Sprite>
    shopHp: number,
    shopRange: number,
    shopMoneyWave: number,
    isGameEnded: boolean
}

export const gameInfo: GameInfo = {
    blocks: [],
    blocksSprites: [],
    damage: 5,
    money: 0,
    moneyPerKill: 5,
    hp: 20,
    maxHp: 20,
    wave: 1,
    enemiesHp: 5,
    radiusX: 350,
    radiusY: 200,
    respawnDuration: 500,
    enemiesLeft: 0,
    enemiesKilled: 0,
    enemiesOnWave: 4,
    enemiesDamage: 4,
    enemies: [],
    shopHp: 20,
    shopRange: 20,
    shopMoneyWave: 20,
    isGameEnded: false
}

export const enemySize = {
    x: 32,
    y: 40
}

