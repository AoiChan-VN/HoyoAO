export class VRCameraMatrix {
    constructor(sceneRootNode) {
        this.sceneRootNode = sceneRootNode;
        this.currentX = 0;
        this.currentY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.pitchLimit = 85;
        
        // Tốc độ phản hồi ma sát (Số càng nhỏ chuyển động càng có độ trễ quán tính mượt mà)
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
            // Tính toán delta-time (khoảng thời gian thực tế trôi qua giữa 2 khung hình)
            const dt = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            // Bỏ qua nếu khung hình bị nhảy bậc quá lớn (tránh lỗi giật lag khi chuyển tab)
            if (dt > 0.1) {
                requestAnimationFrame(render);
                return;
            }

            // Công thức nội suy giảm chấn độc lập với tốc độ khung hình (Frame-rate Independent Lerp)
            const alpha = 1 - Math.exp(-this.lerpSpeed * dt);

            this.currentX += (this.targetX - this.currentX) * alpha;
            
            let diffY = this.targetY - this.currentY;
            diffY = ((diffY + 180) % 360 + 360) % 360 - 180;
            this.currentY += diffY * alpha;

            // Áp dụng ma trận biến đổi hình học không gian 3D mượt tuyệt đối
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
