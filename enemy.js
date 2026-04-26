// 敌人系统

class Enemy {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // 'snail', 'boar', 'bee'
        this.scale = 3;
        this.facingRight = true;
        this.isDead = false;
        this.health = 1;
        this.attackCooldown = 0;
        this.animator = new Animator();
        this.currentAnimName = null;

        // 根据类型设置属性
        this.setupType();
    }

    setupType() {
        switch (this.type) {
            case 'snail':
                this.width = 48 * this.scale;
                this.height = 32 * this.scale;
                this.speed = 1;
                this.health = 1;
                this.scoreValue = 10;
                this.hideTimer = 0;
                this.isHiding = false;
                break;

            case 'boar':
                this.width = 40 * this.scale;
                this.height = 28 * this.scale;
                this.speed = 2.5;
                this.health = 3; // 野猪需要更多攻击
                this.scoreValue = 20;
                break;

            case 'bee':
                this.width = 24 * this.scale;
                this.height = 20 * this.scale;
                this.speed = 1.5;
                this.health = 1;
                this.scoreValue = 15;
                this.baseY = this.y;
                this.flyTimer = 0;
                break;
        }
    }

    async loadAssets() {
        const mobPath = 'Legacy-Fantasy - High Forest 2.3/Mob';
        const anim = this.animator;

        if (this.type === 'snail') {
            await animator.loadAnimation('snail_walk', `${mobPath}/Snail/walk-Sheet.png`, 8, 48, 32);
            await animator.loadAnimation('snail_dead', `${mobPath}/Snail/Dead-Sheet.png`, 8, 48, 32);
            await animator.loadAnimation('snail_hide', `${mobPath}/Snail/Hide-Sheet.png`, 8, 48, 32);
        } else if (this.type === 'boar') {
            await anim.loadAnimation('boar_idle', `${mobPath}/Boar/Idle/Idle-Sheet.png`, 4, 40, 28, 0, 4);
            await anim.loadAnimation('boar_run', `${mobPath}/Boar/Run/Run-Sheet.png`, 6, 40, 28, 0, 4);
        } else if (this.type === 'bee') {
            await anim.loadAnimation('bee_fly', `${mobPath}/Small Bee/Fly/Fly-Sheet.png`, 4, 24, 20);
        }
    }

    update(deltaTime, player) {
        // 攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // 根据类型更新行为
        if (!this.isDead) {
            switch (this.type) {
                case 'snail':
                    this.updateSnail(deltaTime, player);
                    break;
                case 'boar':
                    this.updateBoar(deltaTime, player);
                    break;
                case 'bee':
                    this.updateBee(deltaTime, player);
                    break;
            }

            // 更新动画
            this.updateAnimation();
        }

        this.animator.update(deltaTime);
    }

    updateSnail(deltaTime, player) {
        const distToPlayer = Math.abs(player.x - this.x);

        if (this.isHiding) {
            this.hideTimer -= deltaTime;
            if (this.hideTimer <= 0) {
                this.isHiding = false;
            }
            // 如果死亡，立即退出隐藏状态
            if (this.isDead) {
                this.isHiding = false;
            }
            return;
        }

        // 玩家靠近时躲藏
        if (distToPlayer < 150 && this.attackCooldown <= 0) {
            this.isHiding = true;
            this.hideTimer = 1500;
            this.attackCooldown = 2000;
            return;
        }

        // 缓慢向玩家移动
        if (player.x > this.x) {
            this.x += this.speed;
            this.facingRight = true;
        } else {
            this.x -= this.speed;
            this.facingRight = false;
        }
    }

    updateBoar(deltaTime, player) {
        const distToPlayer = Math.abs(player.x - this.x);
        const yDist = Math.abs(player.y - this.y);

        // 野猪会冲向玩家
        if (distToPlayer < 300 && yDist < 100) {
            // 冲向玩家
            if (player.x > this.x) {
                this.x += this.speed * 1.5;
                this.facingRight = true;
            } else {
                this.x -= this.speed * 1.5;
                this.facingRight = false;
            }
        } else {
            // 待机缓慢移动
            if (this.facingRight) {
                this.x += this.speed * 0.5;
            } else {
                this.x -= this.speed * 0.5;
            }

            // 随机改变方向
            if (Math.random() < 0.01) {
                this.facingRight = !this.facingRight;
            }
        }
    }

    updateBee(deltaTime, player) {
        // 蜜蜂悬浮飞行，缓慢追踪玩家
        this.flyTimer += deltaTime;

        // 上下浮动
        this.y = this.baseY + Math.sin(this.flyTimer / 500) * 30;

        // 向玩家水平移动
        if (player.x > this.x) {
            this.x += this.speed;
            this.facingRight = true;
        } else {
            this.x -= this.speed;
            this.facingRight = false;
        }
    }

    updateAnimation() {
        const anim = this.animator;
        let targetAnim;

        if (this.type === 'snail' && this.isHiding && !this.isDead) {
            targetAnim = 'snail_hide';
        } else if (this.type === 'boar' && !this.isDead) {
            targetAnim = Math.abs(this.game.player.x - this.x) < 300 ? 'boar_run' : 'boar_idle';
        } else if (!this.isDead) {
            targetAnim = `${this.type}_${this.getCurrentAnimState()}`;
        } else {
            targetAnim = `${this.type}_dead`;
        }

        // 只在动画改变时播放新动画，避免帧重置闪烁
        if (this.currentAnimName !== targetAnim) {
            this.currentAnimName = targetAnim;
            const fps = targetAnim.includes('dead') ? 6
                : (targetAnim === 'snail_hide' ? 6
                : (this.type === 'snail' ? 8 : (this.type === 'bee' ? 10 : 8)));
            const loop = !targetAnim.includes('dead') && targetAnim !== 'snail_hide';
            anim.play(targetAnim, fps, loop);
        }
    }

    getCurrentAnimState() {
        if (this.isDead) return 'dead';
        return 'walk';
    }

    draw(ctx) {
        if (this.isDead && this.animator.isAnimationComplete()) return;

        const anim = this.animator.getCurrentFrame();
        if (!anim) return;

        ctx.save();

        if (this.facingRight) {
            ctx.drawImage(
                anim.image,
                anim.sx, anim.sy, anim.sw, anim.sh,
                this.x, this.y,
                anim.sw * this.scale, anim.sh * this.scale
            );
        } else {
            ctx.translate(this.x + anim.sw * this.scale, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                anim.image,
                anim.sx, anim.sy, anim.sw, anim.sh,
                0, 0,
                anim.sw * this.scale, anim.sh * this.scale
            );
        }

        ctx.restore();
    }

    takeDamage(amount) {
        if (this.isDead || (this.type === 'snail' && this.isHiding)) return;

        this.health -= amount;

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.game.player.score += this.scoreValue;
        this.game.updateUI();

        // 播放死亡动画
        const deathAnim = `${this.type}_dead`;
        if (this.animator.animations[deathAnim]) {
            this.animator.play(deathAnim, 6, false);
        }

        // 动画结束后移除敌人
        setTimeout(() => {
            this.game.removeEnemy(this);
        }, 600);
    }

    getBounds() {
        const padding = 4 * this.scale;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }

    collidesWith(other) {
        const a = this.getBounds();
        const b = other.getBounds();

        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
}

// 敌人生成器
class EnemySpawner {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.spawnInterval = 3000; // 3 秒生成一个
        this.minSpawnInterval = 1500;
        this.maxSpawnInterval = 5000;
    }

    update(deltaTime) {
        this.spawnTimer -= deltaTime;

        if (this.spawnTimer <= 0 && this.game.enemies.length < 5) {
            this.spawn();
            this.spawnTimer = this.minSpawnInterval +
                Math.random() * (this.maxSpawnInterval - this.minSpawnInterval);
        }
    }

    spawn() {
        // 随机选择生成位置（屏幕右侧外）
        const x = this.game.width + 50;

        // 随机选择敌人类型
        const types = ['snail', 'boar', 'bee'];
        const type = types[Math.floor(Math.random() * types.length)];

        // 根据类型设置 Y 位置
        let y;
        if (type === 'bee') {
            y = 150 + Math.random() * 150; // 空中
        } else {
            y = this.game.height - 100 - 24 * 3; // 地面
        }

        const enemy = new Enemy(this.game, x, y, type);
        this.game.enemies.push(enemy);

        // 异步加载资源
        enemy.loadAssets().catch(e => console.error('Failed to load enemy assets:', e));
    }
}
