export class VRCameraMatrix {
    constructor(sceneRootNode) {
        this.sceneRootNode = sceneRootNode;
        this.currentX = 0;
        this.currentY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.pitchLimit = 85;
        this.lerpFactor = 0.15;
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
        const render = () => {
            this.currentX += (this.targetX - this.currentX) * this.lerpFactor;
            
            let diffY = this.targetY - this.currentY;
            diffY = ((diffY + 180) % 360 + 360) % 360 - 180;
            this.currentY += diffY * this.lerpFactor;

            const transformMatrix = `
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
