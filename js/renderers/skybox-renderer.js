/* ==========================================================================
   js/renderers/skybox-renderer.js
   Native Browser Experience Engine
   ========================================================================== */

import { CONFIG } from '../core/config.js';

export class SkyboxRenderer {

    constructor() {

        this.container =
            document.getElementById(
                'skybox-container'
            );

        this.layer1 =
            document.getElementById(
                'skybox-layer-1'
            );

        this.layer2 =
            document.getElementById(
                'skybox-layer-2'
            );

        this.layer3 =
            document.getElementById(
                'skybox-layer-3'
            );

        this.rotationX = 0;
        this.rotationY = 0;

        this.targetX = 0;
        this.targetY = 0;

        this.enabled = true;

    }

    setTarget(
        x,
        y
    ) {

        this.targetX = x;
        this.targetY = y;

    }

    update(
        deltaTime = 0.016
    ) {

        if (!this.enabled) {
            return;
        }

        const smoothing =
            Math.min(
                1,
                CONFIG.EXPERIENCE.CAMERA_SMOOTHING *
                (deltaTime * 60)
            );

        this.rotationX +=
            (
                this.targetX -
                this.rotationX
            ) *
            smoothing;

        this.rotationY +=
            (
                this.targetY -
                this.rotationY
            ) *
            smoothing;

        this.render();

    }

    render() {

        const x =
            this.rotationX;

        const y =
            this.rotationY;

        const layer1X =
            x *
            CONFIG.SKYBOX.LAYER_1.SPEED;

        const layer1Y =
            y *
            CONFIG.SKYBOX.LAYER_1.SPEED;

        const layer2X =
            x *
            CONFIG.SKYBOX.LAYER_2.SPEED;

        const layer2Y =
            y *
            CONFIG.SKYBOX.LAYER_2.SPEED;

        const layer3X =
            x *
            CONFIG.SKYBOX.LAYER_3.SPEED;

        const layer3Y =
            y *
            CONFIG.SKYBOX.LAYER_3.SPEED;

        this.layer1.style.transform =
            `
            rotateX(${layer1Y}deg)
            rotateY(${layer1X}deg)
            `;

        this.layer2.style.transform =
            `
            rotateX(${layer2Y}deg)
            rotateY(${layer2X}deg)
            `;

        this.layer3.style.transform =
            `
            rotateX(${layer3Y}deg)
            rotateY(${layer3X}deg)
            `;

    }

    resize() {

        this.render();

    }

    reset() {

        this.rotationX = 0;
        this.rotationY = 0;

        this.targetX = 0;
        this.targetY = 0;

        this.render();

    }

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

    destroy() {

        this.disable();

        this.container = null;
        this.layer1 = null;
        this.layer2 = null;
        this.layer3 = null;

    }

} 
