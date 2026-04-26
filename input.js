// 输入处理系统

class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            attack: false
        };

        this.attackPressed = false; // 用于检测攻击按键瞬间

        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        const code = e.code;
        const key = e.key.toLowerCase();

        // 防止默认行为（如空格滚动页面）
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
            e.preventDefault();
        }

        // 方向键
        if (code === 'KeyA' || code === 'ArrowLeft') {
            this.keys.left = true;
        }
        if (code === 'KeyD' || code === 'ArrowRight') {
            this.keys.right = true;
        }
        if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
            this.keys.up = true;
        }
        if (code === 'KeyS' || code === 'ArrowDown') {
            this.keys.down = true;
        }

        // 攻击键
        if (code === 'KeyJ' || code === 'KeyK' || code === 'Enter') {
            if (!this.keys.attack) {
                this.attackPressed = true;
            }
            this.keys.attack = true;
        }
    }

    handleKeyUp(e) {
        const code = e.code;

        if (code === 'KeyA' || code === 'ArrowLeft') {
            this.keys.left = false;
        }
        if (code === 'KeyD' || code === 'ArrowRight') {
            this.keys.right = false;
        }
        if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
            this.keys.up = false;
        }
        if (code === 'KeyS' || code === 'ArrowDown') {
            this.keys.down = false;
        }
        if (code === 'KeyJ' || code === 'KeyK' || code === 'Enter') {
            this.keys.attack = false;
        }
    }

    // 获取攻击输入（单次触发）
    getAttackPressed() {
        const result = this.attackPressed;
        this.attackPressed = false; // 重置
        return result;
    }

    // 更新（每帧调用，重置瞬时状态）
    update() {
        this.attackPressed = false;
    }

    // 检查是否向左
    isMovingLeft() {
        return this.keys.left && !this.keys.right;
    }

    // 检查是否向右
    isMovingRight() {
        return this.keys.right && !this.keys.left;
    }

    // 检查是否静止
    isIdle() {
        return !this.keys.left && !this.keys.right;
    }
}

// 全局输入实例
const input = new InputHandler();
