import { Application, Graphics, Container, Text, Sprite, AnimatedSprite } from 'pixi.js';
import { gameInfo } from './constants.js';
import { startWaveProgress } from './main.js';

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
}

export function restartScreen(app: Application, spawnEnemies: () => void, startEnemyMovement: () => void, createTower: () => Promise<Sprite>) {
    const restartContainer = new Container();
    restartContainer.x = 0;
    restartContainer.y = 0;
    restartContainer.zIndex = 10000
    app.stage.addChild(restartContainer);

    const restartBg = new Graphics();
    restartBg.rect(0, 0, window.innerWidth, window.innerHeight);
    restartBg.fill("#201820ff")
    restartContainer.addChild(restartBg);

    const restartBg2 = new Graphics();
    restartBg2.rect(0, 0 - window.innerHeight, window.innerWidth, window.innerHeight);
    restartBg2.fill("#201820ff")
    restartContainer.addChild(restartBg2);

        const restartButtonBg = new Graphics();
    restartButtonBg.roundRect(0, 0, 300, 100, 40);
    restartButtonBg.fill("#b6a12eff")
    restartButtonBg.x = window.innerWidth / 2 - restartButtonBg.width / 2
    restartButtonBg.y = window.innerHeight / 2 - restartButtonBg.height / 2 - 20
    restartContainer.addChild(restartButtonBg);

    const restartButton = new Graphics();
    restartButton.roundRect(0, 0, 300, 100, 40);
    restartButton.fill("#d6be35ff")
    restartButton.x = window.innerWidth / 2 - restartButton.width / 2
    restartButton.y = window.innerHeight / 2 - restartButton.height / 2 - 40
    restartContainer.addChild(restartButton);

    const restartText = new Text({
        text: 'RESTART',
        style: {
            fontFamily: 'Arial',
            fontSize: 50,
            fontWeight: 'bold',
            fill: "#50493cff",
        }  
    })
    restartText.anchor.set(0.5)
    restartText.x = window.innerWidth / 2
    restartText.y = window.innerHeight / 2 - restartText.height / 2 - 10
    restartContainer.addChild(restartText);

    restartButton.interactive = true;
    restartButton.on('pointerdown', () => {
        let startTime = performance.now()
        let duration = 100
        let startPos = window.innerHeight / 2 - restartButton.height / 2 - 40
        let targetPos = window.innerHeight / 2 - restartButton.height / 2 - 20
        let startPos2 = window.innerHeight / 2 - restartText.height / 2 - 10
        let targetPos2 = window.innerHeight / 2 - 20
        function update2() {
            let elapsed = performance.now() - startTime
            let t = elapsed / duration
            t = easeInOutCubic(t)
            restartButton.y = startPos + (targetPos - startPos) * t
            restartText.y = startPos2 + (targetPos2 - startPos2) * t
            if (t >= 1) {
                app.ticker.remove(update2)
            }
        }
        app.ticker.add(update2)
        restartGame()
    })

    restartButton.on('pointerup', () => {
        let startTime = performance.now()
        let duration = 100
        let startPos = restartButton.y
        let targetPos = window.innerHeight / 2 - restartButton.height / 2 - 40
        let startPos2 = restartText.y
        let targetPos2 = window.innerHeight / 2 - restartText.height / 2 - 10
        function update2() {
            let elapsed = performance.now() - startTime
            let t = elapsed / duration
            t = easeInOutCubic(t)
            restartButton.y = startPos + (targetPos - startPos) * t
            restartText.y = startPos2 + (targetPos2 - startPos2) * t
            if (t >= 1) {
                app.ticker.remove(update2)
            }
        }
        app.ticker.add(update2)
    })

    let startTime = performance.now()
    let startPos1 = window.innerHeight
    let targetPos1 = window.innerHeight / 2
    let startPos2 = 0
    let targetPos2 = window.innerHeight / 2
    let startAlpha = 0
    let targetAlpha = 1
    let duration = 1000

    function update() {
        let elapsed = performance.now() - startTime
        let t = elapsed / duration
        t = easeInOutCubic(t)
        restartBg.y = startPos1 + (targetPos1 - startPos1) * t
        restartBg2.y = startPos2 + (targetPos2 - startPos2) * t
        restartText.alpha = startAlpha + (targetAlpha - startAlpha) * t
        restartButton.alpha = startAlpha + (targetAlpha - startAlpha) * t
        restartButtonBg.alpha = startAlpha + (targetAlpha - startAlpha) * t
        if (t >= 1) {
            app.ticker.remove(update)
        }
    }
    app.ticker.add(update)

    async function restartGame() {
        clearEnemies(app)
        gameInfo.isGameEnded = false
        gameInfo.damage = 5
        gameInfo.money = 0
        gameInfo.moneyPerKill = 5
        gameInfo.hp = 20
        gameInfo.maxHp = 20
        gameInfo.wave = 1
        gameInfo.radiusX = 350
        gameInfo.radiusY = 200
        gameInfo.enemiesLeft = 0
        gameInfo.enemiesKilled = 0
        gameInfo.enemiesOnWave = gameInfo.wave * 2 + 2;
        gameInfo.enemiesHp = gameInfo.wave * 2 + 5;
        gameInfo.enemiesDamage = 4
        gameInfo.enemies = []
        gameInfo.shopHp = 20
        gameInfo.shopRange = 20
        gameInfo.shopMoneyWave = 20
        gameInfo.enemies = [];
        gameInfo.anims = [];
        gameInfo.shadows = [];
        spawnEnemies()
        startEnemyMovement()
        startWaveProgress()

        let startTime = performance.now()
        let startPos1 = window.innerHeight / 2
        let targetPos1 = window.innerHeight
        let startPos2 = window.innerHeight / 2
        let targetPos2 = 0
        let startAlpha = 1
        let targetAlpha = 0
        let duration = 1000

        function update() {
            if(gameInfo.isGameEnded) clearEnemies(app)
            let elapsed = performance.now() - startTime
            let t = elapsed / duration
            t = easeInOutCubic(t)
            restartBg.y = startPos1 + (targetPos1 - startPos1) * t
            restartBg2.y = startPos2 + (targetPos2 - startPos2) * t
            restartText.alpha = startAlpha + (targetAlpha - startAlpha) * t
            restartButton.alpha = startAlpha + (targetAlpha - startAlpha) * t
            restartButtonBg.alpha = startAlpha + (targetAlpha - startAlpha) * t
            if (t >= 1) {
                app.ticker.remove(update)
            }
        }
        app.ticker.add(update)
    }
}

function clearEnemies(app: Application) {
    for (const entity of gameInfo.enemies) {
        app.stage.removeChild(entity);
    }
    gameInfo.enemies = [];
    for (const shadow of gameInfo.shadows) {
        app.stage.removeChild(shadow);
    }
    gameInfo.shadows = [];
    for (const anim of gameInfo.anims) {
        app.stage.removeChild(anim);
    }
    gameInfo.anims = [];
}