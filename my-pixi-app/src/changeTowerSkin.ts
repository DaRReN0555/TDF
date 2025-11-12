import { Assets, Sprite, Container } from 'pixi.js';
import { gameInfo } from './constants.js';
import { tower } from './main.js';

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
}

export function changeSkin(tower: Sprite, blocks: Array<Array<number>>) {
    const skin = gameInfo.skin;
    tower.texture = Assets.get(`Sprites/Towers/Tower${skin}.png`);

    
}