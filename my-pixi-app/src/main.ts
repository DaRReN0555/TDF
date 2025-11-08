import { Application, Assets, Sprite, Container } from 'pixi.js';
import {createMap} from "./createMap.js";
import {createTower} from "./createTower.js";
import {spawnEnemies} from "./spawnEnemies.js";

export const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: 0x1099bb
});
document.body.appendChild(app.canvas);

await createMap();
await createTower()
await spawnEnemies()