import { Assets, Sprite } from 'pixi.js';
import { app } from './main.js';
import { gameInfo } from './constants';

export async function createTower() {
  const towerContainer = new Sprite();
  const bowContainer = new Sprite();
  const towerTexture = await Assets.load('Sprites/Towers/Archer/archer_level_1.png');
  const bowTexture = await Assets.load('Sprites/Towers/Archer/bow_animation(1).png');

  towerContainer.texture = towerTexture;
  bowContainer.texture = bowTexture;
  bowContainer.setSize(27, 37);
  bowContainer.anchor.set(0.5, 0.5);
  bowContainer.x = towerContainer.width / 2 - 20;
  bowContainer.y = towerContainer.height / 2 - 22;
  towerContainer.addChild(bowContainer);

  towerContainer.width = 130;
  towerContainer.height = 166;
  towerContainer.anchor.set(0, 0);
  towerContainer.x = gameInfo.blocks[17][0] - 60
  towerContainer.y = gameInfo.blocks[17][1] + 30
  app.stage.addChild(towerContainer);
  return towerContainer
}

