// ./js/components/hud-validator.js

import { BaseMesh } from './base-mesh.js';

export class HUDValidator extends BaseMesh {
    constructor() {
        super();

        this.visible =
            false;

        this.errors = [];

        this.canvas =
            document.createElement(
                'canvas'
            );

        this.context =
            this.canvas.getContext(
                '2d'
            );

        this.canvas.width = 768;
        this.canvas.height = 384;

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

    updateErrors(
        errors
    ) {
        this.errors =
            Array.isArray(errors)
                ? [...errors]
                : [];

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
            'rgba(8, 8, 8, 0.92)';

        context.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        context.strokeStyle =
            '#ff4d4d';

        context.lineWidth = 2;

        context.strokeRect(
            1,
            1,
            this.canvas.width - 2,
            this.canvas.height - 2
        );

        context.fillStyle =
            '#ff4d4d';

        context.font =
            'bold 24px monospace';

        context.fillText(
            'Code Validator',
            20,
            40
        );

        context.font =
            '18px monospace';

        if (
            this.errors.length === 0
        ) {
            context.fillStyle =
                '#00ff99';

            context.fillText(
                'STATUS: NO ERRORS',
                20,
                90
            );

            return;
        }

        context.fillStyle =
            '#ffd166';

        context.fillText(
            `TOTAL ERRORS: ${this.errors.length}`,
            20,
            90
        );

        const visibleErrors =
            this.errors.slice(
                0,
                6
            );

        let y = 140;

        for (
            let i = 0;
            i < visibleErrors.length;
            i += 1
        ) {
            const error =
                visibleErrors[i];

            const source =
                error.source ||
                'unknown';

            const line =
                error.line || 0;

            const message =
                error.message ||
                'Unknown error';

            context.fillStyle =
                '#ffffff';

            context.fillText(
                `[${i + 1}] ${source}:${line}`,
                20,
                y
            );

            context.fillStyle =
                '#ff8080';

            context.fillText(
                message.length > 70
                    ? `${message.slice(0, 70)}...`
                    : message,
                20,
                y + 28
            );

            y += 56;
        }
    }

    getCanvas() {
        return this.canvas;
    }

    getErrors() {
        return [
            ...this.errors
        ];
    }

    isVisible() {
        return this.visible;
    }

    render() {
    }
} 
