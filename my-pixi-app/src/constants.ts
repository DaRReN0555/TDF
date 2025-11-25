import { Sprite, Graphics } from 'pixi.js';

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
    spawnSpeed: number,
    isGameEnded: boolean,
    SPAWN_INTERVAL: number,
    ENEMY_SPEED: number,
    TOWER_FIRE_RATE: number,
    shadows: Array<Graphics>,
    anims: Array<Sprite>
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
    spawnSpeed: 1, 
    isGameEnded: false,
    SPAWN_INTERVAL: 500,
    ENEMY_SPEED: 1.5,
    TOWER_FIRE_RATE: 250,
    shadows: [],
    anims: []
}

export const enemySize = {
    x: 32,
    y: 40
}

