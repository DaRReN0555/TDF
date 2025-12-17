import { Sprite } from 'pixi.js';
import type { GameInfo } from './constants.js';
import { tower } from './main.js';

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function changeSkinAnim(gameInfo: GameInfo) {
  const blocksSprites: Sprite[] = gameInfo.blocksSprites;
  const blocks: number[][] = gameInfo.blocks;

  if (!blocksSprites?.length || !blocks?.length) return;

  const center = {
    x: gameInfo.blocks[24][0],
    y: gameInfo.blocks[24][1],
  };

  const distances = blocks.map(([bx, by], i) => ({
    index: i,
    dist: Math.sqrt((center.x - bx) ** 2 + (center.y - by) ** 2),
  }));

  distances.sort((a, b) => a.dist - b.dist);

  const rings: number[][] = [];
  const threshold = 100;
  let currentRing: number[] = [];
  let currentDist = distances[0].dist;

  for (const { index, dist } of distances) {
    if (dist - currentDist > threshold) {
      rings.push(currentRing);
      currentRing = [];
      currentDist = dist;
    }
    currentRing.push(index);
  }
  if (currentRing.length > 0) rings.push(currentRing);

  const amplitude = 20;
  const duration = 400;
  const delayBetweenRings = 120;

  const towerStartY = tower.y;
  const towerAmplitude = amplitude * 1.5;
  const towerDuration = duration * 1.8;

  const animateTower = () => {
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / towerDuration, 1);
      const eased = easeInOutCubic(t);
      const offset = Math.sin(eased * Math.PI) * towerAmplitude;
      tower.y = towerStartY - offset;

      if (t < 1) requestAnimationFrame(animate);
      else tower.y = towerStartY;
    };
    requestAnimationFrame(animate);
  };

  animateTower();

  rings.forEach((ring, ringIndex) => {
    const delay = ringIndex * delayBetweenRings;
    setTimeout(() => {
      for (const blockIndex of ring) {
        const sprite = blocksSprites[blockIndex];
        if (!sprite) continue;
        const startY = sprite.y;
        const startTime = performance.now();

        const animate = () => {
          const elapsed = performance.now() - startTime;
          let t = Math.min(elapsed / duration, 1);
          const eased = easeInOutCubic(t);

          const offset = Math.sin(eased * Math.PI) * amplitude;
          sprite.y = startY - offset;

          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            sprite.y = startY;
          }
        };

        requestAnimationFrame(animate);
      }
    }, delay);
  });
}
