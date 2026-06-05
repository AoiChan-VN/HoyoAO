export class VRCameraMatrix {
    constructor(sceneRootNode) {
        this.sceneRootNode = sceneRootNode;
        this.currentX = 0;
        this.currentY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.pitchLimit = 85;
        this.lerpSpeed = 10;
        this.lastTime = performance.now();
        this._startRenderLoop();
    }

    updateOrientation(rotationX, rotationY) {
        this.targetX = this._clamp(rotationX, -this.pitchLimit, this.pitchLimit);
        this.targetY = rotationY;
    }

    addManualOffset(deltaX, deltaY) {
        this.targetX = this._clamp(this.targetX + deltaX, -this.pitchLimit, this.pitchLimit);
        this.targetY = this.targetY + deltaY;
    }

    _clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    _startRenderLoop() {
        const render = (currentTime) => {
            const timestamp = currentTime || performance.now();
            const dt = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            if (dt <= 0 || dt > 0.1) {
                requestAnimationFrame(render);
                return;
            }

            const alpha = 1 - Math.exp(-this.lerpSpeed * dt);
            
            this.currentX += (this.targetX - this.currentX) * alpha;
            
            let diffY = this.targetY - this.currentY;
            diffY = ((diffY + 180) % 360 + 360) % 360 - 180;
            this.currentY += diffY * alpha;

            const transformMatrix = `
                perspective(var(--vr-perspective))
                rotateX(${-this.currentX}deg)
                rotateY(${this.currentY}deg)
                translateZ(0px)
            `;

            this.sceneRootNode.style.transform = transformMatrix;
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }
}
