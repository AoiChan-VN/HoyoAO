/* ==========================================================================
   js/camera/camera-controller.js
   Native Browser Experience Engine
   ========================================================================== */

import { CONFIG } from '../core/config.js';

export class CameraController {

    constructor() {

        this.rotationX = 0;
        this.rotationY = 0;

        this.targetRotationX = 0;
        this.targetRotationY = 0;

        this.zoom =
            CONFIG.EXPERIENCE
            .CAMERA_DEFAULT_ZOOM;

        this.targetZoom =
            this.zoom;

        this.pointerX = 0;
        this.pointerY = 0;

        this.dragging = false;

        this.touchDistance = 0;

        this.enabled = true;

        this.viewportWidth =
            window.innerWidth;

        this.viewportHeight =
            window.innerHeight;

        this.bindEvents();

    }

    bindEvents() {

        window.addEventListener(
            'pointermove',
            this.handlePointerMove,
            {
                passive: true
            }
        );

        window.addEventListener(
            'pointerdown',
            this.handlePointerDown,
            {
                passive: true
            }
        );

        window.addEventListener(
            'pointerup',
            this.handlePointerUp,
            {
                passive: true
            }
        );

        window.addEventListener(
            'wheel',
            this.handleWheel,
            {
                passive: true
            }
        );

        window.addEventListener(
            'touchstart',
            this.handleTouchStart,
            {
                passive: true
            }
        );

        window.addEventListener(
            'touchmove',
            this.handleTouchMove,
            {
                passive: true
            }
        );

        window.addEventListener(
            'resize',
            this.handleResize,
            {
                passive: true
            }
        );

    }

    handleResize = () => {

        this.viewportWidth =
            window.innerWidth;

        this.viewportHeight =
            window.innerHeight;

    };

    handlePointerDown = () => {

        this.dragging = true;

    };

    handlePointerUp = () => {

        this.dragging = false;

    };

    handlePointerMove = (
        event
    ) => {

        if (!this.enabled) {
            return;
        }

        const x =
            (
                event.clientX /
                this.viewportWidth
            ) * 2 - 1;

        const y =
            (
                event.clientY /
                this.viewportHeight
            ) * 2 - 1;

        this.pointerX = x;
        this.pointerY = y;

        this.targetRotationY =
            x *
            CONFIG.EXPERIENCE
            .CAMERA_ROTATION_LIMIT_Y;

        this.targetRotationX =
            -y *
            CONFIG.EXPERIENCE
            .CAMERA_ROTATION_LIMIT_X;

    };

    handleWheel = (
        event
    ) => {

        if (!this.enabled) {
            return;
        }

        this.targetZoom -=
            event.deltaY *
            CONFIG.EXPERIENCE
            .WHEEL_ZOOM_SPEED;

        this.targetZoom =
            Math.max(
                CONFIG.EXPERIENCE
                .CAMERA_ZOOM_MIN,

                Math.min(
                    CONFIG.EXPERIENCE
                    .CAMERA_ZOOM_MAX,

                    this.targetZoom
                )
            );

    };

    handleTouchStart = (
        event
    ) => {

        if (
            event.touches.length !== 2
        ) {
            return;
        }

        const touchA =
            event.touches[0];

        const touchB =
            event.touches[1];

        this.touchDistance =
            Math.hypot(
                touchB.clientX -
                touchA.clientX,

                touchB.clientY -
                touchA.clientY
            );

    };

    handleTouchMove = (
        event
    ) => {

        if (!this.enabled) {
            return;
        }

        if (
            event.touches.length !== 2
        ) {
            return;
        }

        const touchA =
            event.touches[0];

        const touchB =
            event.touches[1];

        const distance =
            Math.hypot(
                touchB.clientX -
                touchA.clientX,

                touchB.clientY -
                touchA.clientY
            );

        const delta =
            distance -
            this.touchDistance;

        this.touchDistance =
            distance;

        this.targetZoom +=
            delta * 0.003;

        this.targetZoom =
            Math.max(
                CONFIG.EXPERIENCE
                .CAMERA_ZOOM_MIN,

                Math.min(
                    CONFIG.EXPERIENCE
                    .CAMERA_ZOOM_MAX,

                    this.targetZoom
                )
            );

    };

    setRotation(
        x,
        y
    ) {

        this.targetRotationX = x;
        this.targetRotationY = y;

    }

    setZoom(
        zoom
    ) {

        this.targetZoom =
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

        const interpolation =
            Math.min(
                1,
                CONFIG.EXPERIENCE
                .CAMERA_SMOOTHING *
                (deltaTime * 60)
            );

        this.rotationX +=
            (
                this.targetRotationX -
                this.rotationX
            ) *
            interpolation;

        this.rotationY +=
            (
                this.targetRotationY -
                this.rotationY
            ) *
            interpolation;

        this.zoom +=
            (
                this.targetZoom -
                this.zoom
            ) *
            interpolation;

    }

    getState() {

        return {

            rotationX:
                this.rotationX,

            rotationY:
                this.rotationY,

            zoom:
                this.zoom,

            pointerX:
                this.pointerX,

            pointerY:
                this.pointerY

        };

    }

    reset() {

        this.rotationX = 0;
        this.rotationY = 0;

        this.targetRotationX = 0;
        this.targetRotationY = 0;

        this.zoom =
            CONFIG.EXPERIENCE
            .CAMERA_DEFAULT_ZOOM;

        this.targetZoom =
            this.zoom;

    }

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

    destroy() {

        this.disable();

        window.removeEventListener(
            'pointermove',
            this.handlePointerMove
        );

        window.removeEventListener(
            'pointerdown',
            this.handlePointerDown
        );

        window.removeEventListener(
            'pointerup',
            this.handlePointerUp
        );

        window.removeEventListener(
            'wheel',
            this.handleWheel
        );

        window.removeEventListener(
            'touchstart',
            this.handleTouchStart
        );

        window.removeEventListener(
            'touchmove',
            this.handleTouchMove
        );

        window.removeEventListener(
            'resize',
            this.handleResize
        );

    }

} 
