import { Assets, Sprite, Graphics } from 'pixi.js';
import { app, tower } from './main.js';
import { gameInfo } from './constants';

export let bow: Sprite;
export let hover = false;
export const ellipse = new Graphics();

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export async function createTower() {
  const towerContainer = new Sprite();
  const bowContainer = new Sprite();
  const towerTexture = await Assets.load('Sprites/Towers/Archer/archer_level_1.png');
  const bowTexture = await Assets.load('Sprites/Towers/Archer/bow_animation(1).png');
  towerContainer.texture = towerTexture;
  bowContainer.texture = bowTexture;
  bowContainer.setSize(27, 37);
  bowContainer.anchor.set(0.5, 0.5);
  bowContainer.x = towerContainer.width / 2 - 80;
  bowContainer.y = towerContainer.height / 2 - 112;
  towerContainer.addChild(bowContainer);
  bow = bowContainer;

  towerContainer.width = 130;
  towerContainer.height = 166;
  towerContainer.anchor.set(0.5, 0.5);
  towerContainer.x = gameInfo.blocks[17][0] + 5;
  towerContainer.y = gameInfo.blocks[17][1] + 120;
  towerContainer.interactive = true;

  let scaleAnimating = false;
  const baseScale = 1;
  const targetScale = 1.1;
  let t = 0;
  const duration = 15;

  function animateScale() {
    if (!scaleAnimating) return;
    if (hover) {
      if (t < 1) t += 1 / duration;
      else t = 1;
    } else {
      if (t > 0) t -= 1 / duration;
      else t = 0;
    }

    const eased = easeInOutCubic(t);
    const scale = baseScale + (targetScale - baseScale) * eased;
    towerContainer.scale.set(scale);

    if ((hover && t < 1) || (!hover && t > 0)) {
      requestAnimationFrame(animateScale);
    } else {
      scaleAnimating = false;
    }
  }

  towerContainer
    .on('pointerover', () => {
      if(!gameInfo.isGameEnded) {
        ellipse
          .clear()
          .ellipse(tower.x + tower.width / 2 - 65, tower.y + tower.height / 2 - 44, gameInfo.radiusX, gameInfo.radiusY)
          .stroke({ width: 4, color: "white" });
        ellipse.alpha = 0
         app.stage.addChild(ellipse);
        let startTime = performance.now();
        let duration = 300;
        const animateEllipse = () => {
          const elapsed = performance.now() - startTime;
          let t = Math.min(elapsed / duration, 1);
          t = easeInOutCubic(t);
          ellipse.alpha = t
          if (t >= 1) {
            app.ticker.remove(animateEllipse);
          }
        }
        app.ticker.add(animateEllipse);
        hover = true;
        if (!scaleAnimating) {
          scaleAnimating = true;
          requestAnimationFrame(animateScale);
        }
      }
    })
    .on('pointerout', () => {
      if(!gameInfo.isGameEnded) {
        let startTime = performance.now();
        let duration = 50;
        const animateEllipse = () => {
          const elapsed = performance.now() - startTime;
          let t = Math.min(elapsed / duration, 1);
          t = easeInOutCubic(t);
          ellipse.alpha = 1 - t
          if (ellipse.alpha <= 0) {
            app.ticker.remove(animateEllipse);
            app.stage.removeChild(ellipse);
          }
        }
        app.ticker.add(animateEllipse);
        hover = false;
        if (!scaleAnimating) {
          scaleAnimating = true;
          requestAnimationFrame(animateScale);
        }
      }
    });
  app.stage.addChild(towerContainer);
  return towerContainer;
}

