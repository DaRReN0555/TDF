import { Assets, Sprite, Container, Graphics } from 'pixi.js';
import { app } from './main.js';
import { gameInfo } from './constants.js';

export async function createMap() {
  const mapContainer = new Container();
  app.stage.addChild(mapContainer);

  const blockTexture = await Assets.load('Sprites/Landscape tiles/grass.png');

  const width = 7;
  const height = 7;
  const totalBlocks = width * height;

  const stepX = 120;
  const stepY = -74;

  let firstPos = { x: window.innerWidth / 2.2, y: window.innerHeight / 16 };
  let pos = { ...firstPos };

    for (let k = 0; k < totalBlocks; k++) {
    const block = new Sprite(blockTexture);
    block.width = 250;
    block.height = 250;

    block.x = pos.x;
    block.y = pos.y;

    const mask = new Graphics()
    mask.beginFill(0xffffff)
    mask.lineTo(0, -100)
    mask.lineTo(0, 109)
    mask.lineTo(125, 186)
    mask.lineTo(250, 109)
    mask.lineTo(250, -100)
    mask.closePath()
    mask.endFill()
    
    mask.x = block.x
    mask.y = block.y

    mapContainer.addChild(mask)
    block.mask = mask

    mapContainer.addChild(block);

    gameInfo.blocks.push([block.x, block.y]);
    gameInfo.blocksSprites.push(block)
   
    pos.x += stepX;
    pos.y -= stepY;

    if ((k + 1) % width === 0) {
      pos.x = firstPos.x - 120;
      pos.y = firstPos.y + 74;

      firstPos.x -= 120;
      firstPos.y += 74;

      pos = { ...firstPos };
    }
  }
  return mapContainer
}