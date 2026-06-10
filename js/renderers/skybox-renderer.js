/* ==========================================================================
   js/renderers/skybox-renderer.js
   Native Browser Experience Engine
   Triple Layer Cube Skybox Renderer
   ========================================================================== */

import { CONFIG } from '../core/config.js';

export class SkyboxRenderer {

    constructor() {

        this.background =
            document.getElementById(
                'skybox-background'
            );

        this.atmosphere =
            document.getElementById(
                'skybox-atmosphere'
            );

        this.foreground =
            document.getElementById(
                'skybox-foreground'
            );

        this.targetX = 0;
        this.targetY = 0;

        this.currentX = 0;
        this.currentY = 0;

        this.enabled = true;

        this.initialize();

    }

    /* ===================================================================== */
    /* INIT
    /* ===================================================================== */

    initialize() {

        this.buildLayer(

            this.background,

            CONFIG.SKYBOX
                .BACKGROUND

        );

        this.buildLayer(

            this.atmosphere,

            CONFIG.SKYBOX
                .ATMOSPHERE

        );

        this.buildLayer(

            this.foreground,

            CONFIG.SKYBOX
                .FOREGROUND

        );

    }

    /* ===================================================================== */
    /* BUILD CUBE
    /* ===================================================================== */

    buildLayer(
        container,
        assets
    ) {

        if (
            !container
        ) {
            return;
        }

        container.innerHTML = '';

        const faces = [

            'front',
            'back',
            'left',
            'right',
            'top',
            'bottom'

        ];

        for (
            const face of faces
        ) {

            const element =
                document.createElement(
                    'div'
                );

            element.className =
                `skybox-face ${face}`;

            element.style.backgroundImage =
                `url("${assets[face]}")`;

            element.dataset.face =
                face;

            container.appendChild(
                element
            );

        }

    }

    /* ===================================================================== */
    /* TARGET
    /* ===================================================================== */

    setTarget(
        x,
        y
    ) {

        this.targetX = x;
        this.targetY = y;

    }

    /* ===================================================================== */
    /* UPDATE
    /* ===================================================================== */

    update(
        deltaTime = 0.016
    ) {

        if (
            !this.enabled
        ) {
            return;
        }

        const smoothing =
            Math.min(

                1,

                CONFIG.EXPERIENCE
                    .SKYBOX_SMOOTHING *

                (
                    deltaTime * 60
                )

            );

        this.currentX +=

            (
                this.targetX -
                this.currentX
            ) *

            smoothing;

        this.currentY +=

            (
                this.targetY -
                this.currentY
            ) *

            smoothing;

        this.render();

    }

    /* ===================================================================== */
    /* RENDER
    /* ===================================================================== */

    render() {

        this.renderLayer(

            this.background,

            CONFIG.EXPERIENCE
                .SKYBOX_SPEED_BACK,

            CONFIG.EXPERIENCE
                .SKYBOX_DEPTH_BACK

        );

        this.renderLayer(

            this.atmosphere,

            CONFIG.EXPERIENCE
                .SKYBOX_SPEED_MIDDLE,

            CONFIG.EXPERIENCE
                .SKYBOX_DEPTH_MIDDLE

        );

        this.renderLayer(

            this.foreground,

            CONFIG.EXPERIENCE
                .SKYBOX_SPEED_FRONT,

            CONFIG.EXPERIENCE
                .SKYBOX_DEPTH_FRONT

        );

    }

    renderLayer(
        layer,
        speed,
        depth
    ) {

        if (
            !layer
        ) {
            return;
        }

        const rotateY =
            this.currentX *
            speed;

        const rotateX =
            -this.currentY *
            speed;

        layer.style.transform =
            `
            translateZ(-${depth}px)

            rotateX(${rotateX}deg)

            rotateY(${rotateY}deg)
            `;

    }

    /* ===================================================================== */
    /* RESIZE
    /* ===================================================================== */

    resize() {

        this.render();

    }

    /* ===================================================================== */
    /* RESET
    /* ===================================================================== */

    reset() {

        this.currentX = 0;
        this.currentY = 0;

        this.targetX = 0;
        this.targetY = 0;

        this.render();

    }

    /* ===================================================================== */
    /* CONTROL
    /* ===================================================================== */

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

    /* ===================================================================== */
    /* DESTROY
    /* ===================================================================== */

    destroy() {

        this.disable();

        if (
            this.background
        ) {

            this.background.innerHTML =
                '';

        }

        if (
            this.atmosphere
        ) {

            this.atmosphere.innerHTML =
                '';

        }

        if (
            this.foreground
        ) {

            this.foreground.innerHTML =
                '';

        }

        this.background = null;
        this.atmosphere = null;
        this.foreground = null;

    }

} 
