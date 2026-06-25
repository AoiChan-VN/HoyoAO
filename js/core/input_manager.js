export const inputManager = {
    keys: {},
    mouse: { x: 0, y: 0, isDown: false },
    joystick: { isActive: false, startX: 0, startY: 0, deltaX: 0, deltaY: 0, vectorX: 0, vectorY: 0 },
    isMobile: false,
    virtualFire: false,

    initialize(canvas, joystickBase, joystickHandle, btnVirtualFire) {
        this.isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        
        window.addEventListener("keydown", (e) => {
            this.keys[e.code] = true;
            if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") {
                e.preventDefault();
            }
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener("mousemove", (e) => {
            if (this.isMobile) return;
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });

        window.addEventListener("mousedown", (e) => {
            if (this.isMobile) return;
            if (e.button === 0) this.mouse.isDown = true;
        });

        window.addEventListener("mouseup", (e) => {
            if (this.isMobile) return;
            if (e.button === 0) this.mouse.isDown = false;
        });

        if (joystickBase && joystickHandle) {
            joystickBase.addEventListener("touchstart", (e) => {
                const touch = e.touches[0];
                const rect = joystickBase.getBoundingClientRect();
                this.joystick.isActive = true;
                this.joystick.startX = rect.left + rect.width / 2;
                this.joystick.startY = rect.top + rect.height / 2;
                this.handleJoystickMove(touch.clientX, touch.clientY, joystickHandle);
            }, { passive: true });

            joystickBase.addEventListener("touchmove", (e) => {
                if (!this.joystick.isActive) return;
                const touch = e.touches[0];
                this.handleJoystickMove(touch.clientX, touch.clientY, joystickHandle);
            }, { passive: true });

            joystickBase.addEventListener("touchend", () => {
                this.joystick.isActive = false;
                this.joystick.deltaX = 0;
                this.joystick.deltaY = 0;
                this.joystick.vectorX = 0;
                this.joystick.vectorY = 0;
                joystickHandle.style.transform = "translate(0px, 0px)";
            }, { passive: true });
        }

        if (btnVirtualFire) {
            btnVirtualFire.addEventListener("touchstart", (e) => {
                this.virtualFire = true;
            }, { passive: true });

            btnVirtualFire.addEventListener("touchend", () => {
                this.virtualFire = false;
            }, { passive: true });
        }
    },

    handleJoystickMove(clientX, clientY, handle) {
        let dx = clientX - this.joystick.startX;
        let dy = clientY - this.joystick.startY;
        const maxRadius = 35;
        const distance = Math.hypot(dx, dy);

        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
        }

        this.joystick.deltaX = dx;
        this.joystick.deltaY = dy;
        this.joystick.vectorX = dx / maxRadius;
        this.joystick.vectorY = dy / maxRadius;

        handle.style.transform = `translate(${dx}px, ${dy}px)`;
    },

    update(dt) {
        if (!this.isMobile) {
            this.joystick.vectorX = 0;
            this.joystick.vectorY = 0;

            if (this.keys["KeyA"] || this.keys["ArrowLeft"]) this.joystick.vectorX = -1;
            if (this.keys["KeyD"] || this.keys["ArrowRight"]) this.joystick.vectorX = 1;
            if (this.keys["KeyW"] || this.keys["ArrowUp"]) this.joystick.vectorY = -1;
            if (this.keys["KeyS"] || this.keys["ArrowDown"]) this.joystick.vectorY = 1;

            const len = Math.hypot(this.joystick.vectorX, this.joystick.vectorY);
            if (len > 0) {
                this.joystick.vectorX /= len;
                this.joystick.vectorY /= len;
            }
        }
    },

    getMoveX() {
        return this.joystick.vectorX;
    },

    getMoveY() {
        return this.joystick.vectorY;
    },

    isFiring() {
        if (this.isMobile) {
            return this.virtualFire;
        }
        return this.keys["Space"] || this.mouse.isDown;
    }
};
 
