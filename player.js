// 玩家控制系统

class Player {
    constructor(game) {
        this.game = game;

        // 位置
        this.x = 100;
        this.y = 300;

        // 速度
        this.vx = 0;
        this.vy = 0;

        // 尺寸（像素，3 倍缩放）- 重装战士更大
        this.scale = 3.5;
        this.width = 32 * this.scale;
        this.height = 32 * this.scale;

        // 物理 - 重装战士：慢速但强力
        this.speed = 3.5;
        this.jumpForce = -12;
        this.gravity = 0.7;
        this.grounded = false;

        // 状态
        this.facingRight = true;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.isDead = false;
        this.invincible = false;
        this.invincibleTimer = 0;

        // 生命和分数 - 重装战士血量更高
        this.health = 5;
        this.maxHealth = 5;
        this.score = 0;

        // 攻击判定框 - 重装战士攻击范围更大
        this.attackBox = {
            x: 0,
            y: 0,
            width: 80,
            height: 50,
            active: false
        };

        // 攻击伤害 - 重装战士一击必杀
        this.attackDamage = 2;

        // 动画帧尺寸
        this.frameWidth = 32;
        this.frameHeight = 32;

        // 独立的动画管理器
        this.animator = new Animator();
        this.currentAnimName = null;
    }

    async loadAssets() {
        const assetPath = 'Legacy-Fantasy - High Forest 2.3/Character';
        const anim = this.animator;

        try {
            console.log('Loading player assets...');
            // 加载所有动画（8 帧待机，8 帧跑步，9 帧跳跃，8 帧攻击，9 帧死亡）
            await anim.loadAnimation('idle', `${assetPath}/Idle/Idle-Sheet.png`, 8, 32, 32);
            console.log('Idle loaded');
            await anim.loadAnimation('run', `${assetPath}/Run/Run-Sheet.png`, 8, 32, 32);
            console.log('Run loaded');
            // 注意：原素材文件夹名是 Jumlp-All（拼写错误）
            await anim.loadAnimation('jump', `${assetPath}/Jumlp-All/Jump-All-Sheet.png`, 9, 32, 32);
            console.log('Jump loaded');
            await anim.loadAnimation('attack', `${assetPath}/Attack-01/Attack-01-Sheet.png`, 8, 32, 32);
            console.log('Attack loaded');
            await anim.loadAnimation('dead', `${assetPath}/Dead/Dead-Sheet.png`, 9, 32, 32);
            console.log('Dead loaded');

            // 默认播放待机动画
            anim.play('idle', 8, true);
            console.log('Player assets loaded successfully');
        } catch (e) {
            console.error('Failed to load player assets:', e);
        }
    }

    update(deltaTime) {
        if (this.isDead) {
            this.animator.update(deltaTime);
            return;
        }

        // 输入处理
        this.handleInput();

        // 物理更新
        this.applyPhysics(deltaTime);

        // 攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // 无敌时间
        if (this.invincible && this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // 更新攻击判定框位置
        this.updateAttackBox();

        // 更新动画
        this.updateAnimation();
        this.animator.update(deltaTime);
    }

    handleInput() {
        // 水平移动
        if (input.isMovingLeft()) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if (input.isMovingRight()) {
            this.vx = this.speed;
            this.facingRight = true;
        } else {
            this.vx = 0;
        }

        // 跳跃
        if (input.keys.up && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }

        // 攻击
        if (input.getAttackPressed() && this.attackCooldown <= 0 && !this.isAttacking) {
            this.startAttack();
        }
    }

    applyPhysics(deltaTime) {
        // 应用重力
        this.vy += this.gravity;

        // 更新位置
        this.x += this.vx;
        this.y += this.vy;

        // 地面碰撞（简单处理）
        const groundLevel = this.game.height - 100;
        if (this.y + this.height > groundLevel) {
            this.y = groundLevel - this.height;
            this.vy = 0;
            this.grounded = true;
        }

        // 边界限制
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) {
            this.x = this.game.width - this.width;
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.attackCooldown = 500; // 500ms 冷却 - 重装战士攻击较慢
        this.attackBox.active = true;

        // 攻击动画播完后重置状态
        setTimeout(() => {
            this.isAttacking = false;
            this.attackBox.active = false;
        }, 400); // 重装战士攻击动作更长
    }

    updateAttackBox() {
        if (this.facingRight) {
            this.attackBox.x = this.x + this.width;
        } else {
            this.attackBox.x = this.x - this.attackBox.width;
        }
        this.attackBox.y = this.y + (this.height - this.attackBox.height) / 2;
    }

    updateAnimation() {
        let targetAnim;

        if (this.isDead) {
            targetAnim = 'dead';
        } else if (this.isAttacking) {
            targetAnim = 'attack';
        } else if (!this.grounded) {
            targetAnim = 'jump';
        } else if (this.vx !== 0) {
            targetAnim = 'run';
        } else {
            targetAnim = 'idle';
        }

        // 只在动画改变时播放新动画，避免帧重置闪烁
        if (this.currentAnimName !== targetAnim) {
            this.currentAnimName = targetAnim;
            const fps = targetAnim === 'attack' ? 25
                : (targetAnim === 'jump' ? 12
                : (targetAnim === 'run' ? 12
                : (targetAnim === 'dead' ? 8 : 8)));
            const loop = targetAnim === 'idle' || targetAnim === 'run';
            this.animator.play(targetAnim, fps, loop);
        }
    }

    draw(ctx) {
        // 无敌状态闪烁效果 - 修复：时间间隔太短导致几乎一直隐藏
        if (this.invincible && this.invincibleTimer > 500 && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }

        const frame = this.animator.getCurrentFrame();

        // 调试日志
        if (!frame) {
            console.log('No frame to draw, currentAnimation:', this.animator.currentAnimation);
            return;
        }

        ctx.save();

        if (this.facingRight) {
            ctx.drawImage(
                frame.image,
                frame.sx, frame.sy, frame.sw, frame.sh,
                this.x, this.y,
                frame.sw * this.scale, frame.sh * this.scale
            );
        } else {
            // 水平翻转绘制
            ctx.translate(this.x + frame.sw * this.scale, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                frame.image,
                frame.sx, frame.sy, frame.sw, frame.sh,
                0, 0,
                frame.sw * this.scale, frame.sh * this.scale
            );
        }

        ctx.restore();
    }

    takeDamage(amount) {
        if (this.isDead || this.invincible) return;

        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = 1500; // 1.5 秒无敌

        this.game.updateUI();

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.animator.play('dead', 8, false);

        setTimeout(() => {
            this.game.gameOver();
        }, 1000);
    }

    getBounds() {
        // 缩小碰撞箱，使判定更宽松
        const padding = 8 * this.scale;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }
}
