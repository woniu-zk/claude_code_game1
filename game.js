// 游戏主循环和状态管理

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.player = null;
        this.enemies = [];
        this.spawner = null;

        this.lastTime = 0;
        this.isRunning = false;
        this.isPaused = false;

        // 背景
        this.backgroundImg = null;
        this.cameraX = 0;

        // 绑定 UI 元素
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.healthDisplay = document.getElementById('health-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.finalScoreDisplay = document.getElementById('final-score');

        // 绑定按钮
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());

        // 加载背景
        this.loadBackground();
    }

    async loadBackground() {
        const bgPath = 'Legacy-Fantasy - High Forest 2.3/Background/Background.png';
        this.backgroundImg = new Image();
        this.backgroundImg.src = bgPath;

        // 等待背景加载
        await new Promise((resolve) => {
            this.backgroundImg.onload = resolve;
        });
    }

    async start() {
        // 重置游戏状态
        this.player = new Player(this);
        this.enemies = [];
        this.spawner = new EnemySpawner(this);
        this.isRunning = true;
        this.isPaused = false;
        this.cameraX = 0;

        // 加载玩家资源
        await this.player.loadAssets();

        // 隐藏 UI 屏幕
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        // 更新 UI
        this.updateUI();

        // 启动游戏循环
        this.lastTime = performance.now();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    gameOver() {
        this.isRunning = false;
        this.finalScoreDisplay.textContent = `得分：${this.player.score}`;
        this.gameOverScreen.classList.remove('hidden');
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(deltaTime) {
        input.update();

        // 更新玩家
        this.player.update(deltaTime);

        // 更新敌人生成器
        this.spawner.update(deltaTime);

        // 更新敌人
        for (const enemy of this.enemies) {
            enemy.update(deltaTime, this.player);
        }

        // 碰撞检测
        this.checkCollisions();

        // 更新摄像机（跟随玩家）
        this.cameraX = Math.max(0, this.player.x - this.width / 3);
    }

    checkCollisions() {
        // 玩家攻击检测
        if (this.player.attackBox.active) {
            for (const enemy of this.enemies) {
                if (!enemy.isDead && this.checkAttackCollision(enemy)) {
                    enemy.takeDamage(1);
                }
            }
        }

        // 敌人接触检测
        for (const enemy of this.enemies) {
            if (!enemy.isDead && !enemy.attackCooldown && enemy.collidesWith(this.player)) {
                this.player.takeDamage(1);
                enemy.attackCooldown = 1000;

                // 击退玩家
                const pushDir = this.player.x < enemy.x ? -1 : 1;
                this.player.x += pushDir * 50;
                this.player.vy = -5;
            }
        }
    }

    checkAttackCollision(enemy) {
        const attackBox = this.player.attackBox;
        const enemyBounds = enemy.getBounds();

        return attackBox.x < enemyBounds.x + enemyBounds.width &&
               attackBox.x + attackBox.width > enemyBounds.x &&
               attackBox.y < enemyBounds.y + enemyBounds.height &&
               attackBox.y + attackBox.height > enemyBounds.y;
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 绘制背景
        this.drawBackground();

        // 绘制地面
        this.drawGround();

        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        // 绘制玩家
        this.player.draw(this.ctx);

        // 绘制敌人
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        this.ctx.restore();
    }

    drawBackground() {
        if (!this.backgroundImg) return;

        // 视差滚动背景（缓慢移动）
        const parallaxX = this.cameraX * 0.3;

        // 绘制两次实现无缝滚动
        for (let i = 0; i < 2; i++) {
            const x = -parallaxX + i * this.backgroundImg.width;
            this.ctx.drawImage(this.backgroundImg, x, 0);
        }
    }

    drawGround() {
        const groundY = this.height - 100;

        // 地面
        this.ctx.fillStyle = '#3d2817';
        this.ctx.fillRect(0, groundY, this.width, 100);

        // 草地
        this.ctx.fillStyle = '#4a7c23';
        this.ctx.fillRect(0, groundY, this.width, 15);

        // 草的细节
        this.ctx.fillStyle = '#5a8c33';
        for (let i = 0; i < this.width; i += 20) {
            this.ctx.fillRect(i, groundY - 5, 10, 5);
        }
    }

    updateUI() {
        // 更新生命值显示 - 重装战士 5 点血
        let hearts = '';
        for (let i = 0; i < this.player.maxHealth; i++) {
            hearts += i < this.player.health ? '❤️' : '🖤';
        }
        this.healthDisplay.textContent = hearts;

        // 更新分数
        this.scoreDisplay.textContent = `得分：${this.player.score}`;
    }
}

// 启动游戏实例
const game = new Game();
