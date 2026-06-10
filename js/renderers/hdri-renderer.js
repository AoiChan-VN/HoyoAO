/* ==========================================================================
   js/renderers/hdri-renderer.js
   Native Browser Experience Engine
   ========================================================================== */

import { CONFIG } from '../core/config.js';

export class HDRIRenderer {

    constructor() {

        this.container =
            document.getElementById(
                'hdri-container'
            );

        this.image =
            document.getElementById(
                'hdri-image'
            );

        this.targetX = 0;
        this.targetY = 0;

        this.currentX = 0;
        this.currentY = 0;

        this.zoom =
            CONFIG.EXPERIENCE
            .CAMERA_DEFAULT_ZOOM;

        this.enabled = true;

    }

    async setSource(
        source
    ) {

        if (
            !this.image ||
            !source
        ) {
            return;
        }

        await new Promise(
            (
                resolve,
                reject
            ) => {

                const img =
                    new Image();

                img.onload =
                    () => {

                        this.image.src =
                            source;

                        resolve();

                    };

                img.onerror =
                    reject;

                img.src =
                    source;

            }
        );

    }

    setTarget(
        x,
        y
    ) {

        this.targetX = x;
        this.targetY = y;

    }

    setZoom(
        zoom
    ) {

        this.zoom =
            Math.max(
                CONFIG.EXPERIENCE
                .CAMERA_ZOOM_MIN,

                Math.min(
                    CONFIG.EXPERIENCE
                    .CAMERA_ZOOM_MAX,
                    zoom
                )
            );

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
                CONFIG.EXPERIENCE
                .CAMERA_SMOOTHING *
                (deltaTime * 60)
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

    render() {

        if (!this.image) {
            return;
        }

        const translateX =
            this.currentX * 0.6;

        const translateY =
            this.currentY * 0.6;

        const scale =
            CONFIG.EXPERIENCE
            .HDRI_SCALE *
            this.zoom;

        this.image.style.transform =
            `
            translate3d(
                ${translateX}px,
                ${translateY}px,
                0
            )
            scale(${scale})
            `;

    }

    reset() {

        this.currentX = 0;
        this.currentY = 0;

        this.targetX = 0;
        this.targetY = 0;

        this.zoom =
            CONFIG.EXPERIENCE
            .CAMERA_DEFAULT_ZOOM;

        this.render();

    }

    resize() {

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
        this.image = null;

    }

} 
