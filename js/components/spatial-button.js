// ./js/components/spatial-button.js

import { BaseMesh } from './base-mesh.js';

export class SpatialButton extends BaseMesh {
    constructor(
        label = 'Button'
    ) {
        super();

        this.label = label;

        this.enabled = true;

        this.hovered = false;

        this.pressed = false;

        this.pressDepth = 0;

        this.maxPressDepth = 0.04;

        this.callbacks = {
            click: null,
            hover: null
        };

        this.canvas =
            document.createElement(
                'canvas'
            );

        this.context =
            this.canvas.getContext(
                '2d'
            );

        this.canvas.width = 256;
        this.canvas.height = 128;

        this.redraw();

        this.setBoundingBox(
            {
                x: -0.5,
                y: -0.25,
                z: -0.05
            },
            {
                x: 0.5,
                y: 0.25,
                z: 0.05
            }
        );
    }

    setLabel(
        label
    ) {
        this.label = label;

        this.redraw();

        return this;
    }

    setEnabled(
        enabled
    ) {
        this.enabled =
            Boolean(
                enabled
            );

        this.redraw();

        return this;
    }

    onClick(
        callback
    ) {
        this.callbacks.click =
            callback;

        return this;
    }

    onHover(
        callback
    ) {
        this.callbacks.hover =
            callback;

        return this;
    }

    hover() {
        if (
            !this.enabled
        ) {
            return;
        }

        this.hovered = true;

        if (
            typeof this.callbacks
                .hover ===
            'function'
        ) {
            this.callbacks.hover(
                this
            );
        }

        this.redraw();
    }

    unhover() {
        this.hovered = false;

        this.redraw();
    }

    press() {
        if (
            !this.enabled
        ) {
            return;
        }

        this.pressed = true;

        this.pressDepth =
            this.maxPressDepth;

        this.redraw();
    }

    release() {
        if (
            !this.enabled
        ) {
            return;
        }

        const wasPressed =
            this.pressed;

        this.pressed = false;

        this.pressDepth = 0;

        if (
            wasPressed &&
            typeof this.callbacks
                .click ===
                'function'
        ) {
            this.callbacks.click(
                this
            );
        }

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

        const background =
            !this.enabled
                ? '#303030'
                : this.pressed
                ? '#00aacc'
                : this.hovered
                ? '#00d8ff'
                : '#00b7e6';

        context.fillStyle =
            background;

        context.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        context.strokeStyle =
            '#ffffff';

        context.lineWidth = 2;

        context.strokeRect(
            1,
            1,
            this.canvas.width - 2,
            this.canvas.height - 2
        );

        context.fillStyle =
            '#ffffff';

        context.font =
            'bold 26px sans-serif';

        context.textAlign =
            'center';

        context.textBaseline =
            'middle';

        context.fillText(
            this.label,
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }

    update(
        deltaTime
    ) {
        if (
            !this.pressed
        ) {
            return;
        }

        this.pressDepth =
            Math.max(
                0,
                this.pressDepth -
                    deltaTime * 0.2
            );
    }

    getCanvas() {
        return this.canvas;
    }

    isPressed() {
        return this.pressed;
    }

    isHovered() {
        return this.hovered;
    }

    isEnabled() {
        return this.enabled;
    }
} 
