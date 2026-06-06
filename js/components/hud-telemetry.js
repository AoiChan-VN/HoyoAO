// ./js/components/hud-telemetry.js

import { BaseMesh } from './base-mesh.js';

export class HUDTelemetry extends BaseMesh {
    constructor() {
        super();

        this.title =
            'Hardware Telemetry';

        this.visible =
            false;

        this.metrics = {
            fps: 0,
            drawCalls: 0,
            heapMemory: 0
        };

        this.canvas =
            document.createElement(
                'canvas'
            );

        this.context =
            this.canvas.getContext(
                '2d'
            );

        this.canvas.width = 512;
        this.canvas.height = 256;

        this.redraw();
    }

    setVisible(
        visible
    ) {
        this.visible =
            Boolean(
                visible
            );

        return this;
    }

    updateMetrics(
        metrics
    ) {
        this.metrics = {
            ...this.metrics,
            ...metrics
        };

        this.redraw();
    }

    redraw() {
        const context =
            this.context;

        context.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        context.fillStyle =
            'rgba(0, 0, 0, 0.85)';

        context.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        context.strokeStyle =
            '#00e5ff';

        context.lineWidth = 2;

        context.strokeRect(
            1,
            1,
            this.canvas.width - 2,
            this.canvas.height - 2
        );

        context.fillStyle =
            '#00e5ff';

        context.font =
            'bold 24px monospace';

        context.fillText(
            this.title,
            20,
            40
        );

        context.font =
            '18px monospace';

        context.fillText(
            `FPS: ${this.metrics.fps}`,
            20,
            90
        );

        context.fillText(
            `DRAW CALLS: ${this.metrics.drawCalls}`,
            20,
            130
        );

        context.fillText(
            `HEAP MEMORY: ${this.metrics.heapMemory} MB`,
            20,
            170
        );
    }

    getCanvas() {
        return this.canvas;
    }

    isVisible() {
        return this.visible;
    }

    render() {
    }
} 
