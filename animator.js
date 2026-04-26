// 动画系统 - 处理 Sprite Sheet 动画播放

class Animator {
    constructor() {
        this.animations = {};
        this.currentAnimation = null;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = 100; // 默认每帧 100ms
    }

    // 从 Sprite Sheet 加载动画（横向排列的帧）
    loadAnimation(name, imageSrc, frameCount, frameWidth, frameHeight, offsetX = 0, offsetY = 0) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.animations[name] = {
                    image: img,
                    frameCount,
                    frameWidth,
                    frameHeight,
                    offsetX,
                    offsetY
                };
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load: ${imageSrc}`));
            img.src = imageSrc;
        });
    }

    // 从已加载的图像创建动画
    createAnimationFromImage(name, image, frameCount, frameWidth, frameHeight, offsetX = 0, offsetY = 0) {
        this.animations[name] = {
            image,
            frameCount,
            frameWidth,
            frameHeight,
            offsetX,
            offsetY
        };
    }

    // 播放指定动画
    play(name, fps = 10, loop = true) {
        if (this.currentAnimation === name && this.frameIndex < this.animations[name].frameCount) {
            return; // 已经在播放该动画
        }
        this.currentAnimation = name;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = 1000 / fps;
        this.loop = loop;
    }

    // 更新动画状态
    update(deltaTime) {
        if (!this.currentAnimation) return;

        const anim = this.animations[this.currentAnimation];
        if (!anim) return;

        this.frameTimer += deltaTime;

        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer -= this.frameInterval;
            this.frameIndex++;

            if (this.frameIndex >= anim.frameCount) {
                if (this.loop) {
                    this.frameIndex = 0;
                } else {
                    this.frameIndex = anim.frameCount - 1;
                }
            }
        }
    }

    // 获取当前帧的绘制信息
    getCurrentFrame() {
        if (!this.currentAnimation) return null;

        const anim = this.animations[this.currentAnimation];
        if (!anim) return null;

        return {
            image: anim.image,
            sx: anim.offsetX + this.frameIndex * anim.frameWidth,
            sy: anim.offsetY,
            sw: anim.frameWidth,
            sh: anim.frameHeight,
            frameIndex: this.frameIndex
        };
    }

    // 绘制当前帧
    draw(ctx, x, y, scale = 1, flipX = false) {
        const frame = this.getCurrentFrame();
        if (!frame) return;

        ctx.save();

        if (flipX) {
            ctx.translate(x + frame.sw * scale, y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                frame.image,
                frame.sx, frame.sy, frame.sw, frame.sh,
                0, 0, frame.sw * scale, frame.sh * scale
            );
        } else {
            ctx.drawImage(
                frame.image,
                frame.sx, frame.sy, frame.sw, frame.sh,
                x, y, frame.sw * scale, frame.sh * scale
            );
        }

        ctx.restore();
    }

    // 获取动画宽度
    getFrameWidth() {
        if (!this.currentAnimation) return 0;
        return this.animations[this.currentAnimation].frameWidth;
    }

    // 获取动画高度
    getFrameHeight() {
        if (!this.currentAnimation) return 0;
        return this.animations[this.currentAnimation].frameHeight;
    }

    // 检查动画是否完成（非循环动画）
    isAnimationComplete() {
        if (!this.currentAnimation) return false;
        const anim = this.animations[this.currentAnimation];
        return !this.loop && this.frameIndex >= anim.frameCount - 1;
    }

    // 重置动画状态
    reset() {
        this.currentAnimation = null;
        this.frameIndex = 0;
        this.frameTimer = 0;
    }
}

// 全局动画管理器
const animator = new Animator();
