/**
 * PerformanceRegistry.js
 * Quản lý Delta Time chính xác, đồng bộ tần số quét phần cứng và khóa FPS linh hoạt.
 */
export class PerformanceRegistry {
    constructor() {
        this.fpsMode = 'uncapped'; // '60' | '120' | 'uncapped'
        this.lastFrameTime = performance.now();
        this.deltaTime = 0;
        this.frameInterval = 0; // Tính bằng ms, mặc định 0 cho uncapped
    }

    setFPSMode(mode) {
        this.fpsMode = mode;
        if (mode === '60') {
            this.frameInterval = 1000 / 60;
        } else if (mode === '120') {
            this.frameInterval = 1000 / 120;
        } else {
            this.frameInterval = 0; // Uncapped đồng bộ phần cứng máy qua rAF
        }
    }

    shouldRender(currentTime) {
        const elapsed = currentTime - this.lastFrameTime;
        
        if (this.fpsMode !== 'uncapped' && elapsed < this.frameInterval) {
            return false; 
        }

        // Tính toán Delta Time thực tế giữa hai khung hình hữu hiệu
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        return true;
    }

    getDeltaTime() {
        return this.deltaTime;
    }
}
 
