// ./js/telemetry/hardware-monitor.js

export class HardwareMonitor {
    constructor() {
        this.fps = 0;

        this.frameCount = 0;

        this.drawCalls = 0;

        this.lastSampleTime =
            performance.now();

        this.heapMemory = 0;
    }

    update() {
        this.frameCount += 1;

        const now =
            performance.now();

        const elapsed =
            now -
            this.lastSampleTime;

        if (elapsed >= 1000) {
            this.fps =
                Math.round(
                    (this.frameCount * 1000) /
                    elapsed
                );

            this.frameCount = 0;

            this.lastSampleTime =
                now;

            this.updateMemoryUsage();
        }
    }

    updateMemoryUsage() {
        if (
            performance.memory
        ) {
            this.heapMemory =
                Math.round(
                    performance.memory
                        .usedJSHeapSize /
                    1024 /
                    1024
                );
        }
    }

    beginFrame() {
        this.drawCalls = 0;
    }

    registerDrawCall() {
        this.drawCalls += 1;
    }

    getMetrics() {
        return {
            fps: this.fps,
            drawCalls:
                this.drawCalls,
            heapMemory:
                this.heapMemory
        };
    }

    getFPS() {
        return this.fps;
    }

    getDrawCalls() {
        return this.drawCalls;
    }

    getHeapMemory() {
        return this.heapMemory;
    }

    reset() {
        this.fps = 0;
        this.frameCount = 0;
        this.drawCalls = 0;
        this.heapMemory = 0;

        this.lastSampleTime =
            performance.now();
    }
} 
