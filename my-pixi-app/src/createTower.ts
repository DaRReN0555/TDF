import { Assets, Sprite } from 'pixi.js';
import { app } from './main.js';
import { gameInfo } from './constants';

export async function createTower() {

  const towerContainer = new Sprite();
  const towerTexture = await Assets.load('Sprites/Towers/Archer/archer_level_1.png');
  towerContainer.texture = towerTexture;
    towerContainer.width = 130;
    towerContainer.height = 166;
    towerContainer.x = gameInfo.blocks[17][0] - 60
    towerContainer.y = gameInfo.blocks[17][1] + 30
    app.stage.addChild(towerContainer);
}