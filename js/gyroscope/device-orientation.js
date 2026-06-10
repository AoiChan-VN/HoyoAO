/* ==========================================================================
   js/gyroscope/device-orientation.js
   Native Browser Experience Engine
   ========================================================================== */

import { CONFIG } from '../core/config.js';

export class DeviceOrientationController {

    constructor() {

        this.enabled = false;

        this.supported =
            typeof DeviceOrientationEvent !==
            'undefined';

        this.permissionGranted =
            false;

        this.alpha = 0;
        this.beta = 0;
        this.gamma = 0;

        this.rotationX = 0;
        this.rotationY = 0;

        this.targetRotationX = 0;
        this.targetRotationY = 0;

        this.handleOrientation =
            this.handleOrientation.bind(
                this
            );

    }

    async requestPermission() {

        if (!this.supported) {
            return false;
        }

        try {

            if (
                typeof DeviceOrientationEvent
                    .requestPermission ===
                'function'
            ) {

                const result =
                    await DeviceOrientationEvent
                        .requestPermission();

                this.permissionGranted =
                    result === 'granted';

            }
            else {

                this.permissionGranted =
                    true;

            }

            if (
                this.permissionGranted
            ) {

                this.enable();

            }

            return this.permissionGranted;

        }
        catch (error) {

            console.error(
                '[Gyroscope]',
                error
            );

            return false;

        }

    }

    enable() {

        if (
            !this.supported ||
            this.enabled
        ) {
            return;
        }

        window.addEventListener(
            'deviceorientation',
            this.handleOrientation,
            {
                passive: true
            }
        );

        this.enabled = true;

    }

    disable() {

        if (!this.enabled) {
            return;
        }

        window.removeEventListener(
            'deviceorientation',
            this.handleOrientation
        );

        this.enabled = false;

    }

    handleOrientation(
        event
    ) {

        const beta =
            Number.isFinite(
                event.beta
            )
                ? event.beta
                : 0;

        const gamma =
            Number.isFinite(
                event.gamma
            )
                ? event.gamma
                : 0;

        const alpha =
            Number.isFinite(
                event.alpha
            )
                ? event.alpha
                : 0;

        this.alpha = alpha;
        this.beta = beta;
        this.gamma = gamma;

        this.targetRotationX =
            Math.max(
                -CONFIG.EXPERIENCE
                    .CAMERA_ROTATION_LIMIT_X,

                Math.min(
                    CONFIG.EXPERIENCE
                        .CAMERA_ROTATION_LIMIT_X,

                    (-beta / 90) *
                    CONFIG.EXPERIENCE
                        .CAMERA_ROTATION_LIMIT_X *
                    CONFIG.EXPERIENCE
                        .GYRO_SENSITIVITY
                )
            );

        this.targetRotationY =
            Math.max(
                -CONFIG.EXPERIENCE
                    .CAMERA_ROTATION_LIMIT_Y,

                Math.min(
                    CONFIG.EXPERIENCE
                        .CAMERA_ROTATION_LIMIT_Y,

                    (gamma / 90) *
                    CONFIG.EXPERIENCE
                        .CAMERA_ROTATION_LIMIT_Y *
                    CONFIG.EXPERIENCE
                        .GYRO_SENSITIVITY
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

        this.rotationX +=
            (
                this.targetRotationX -
                this.rotationX
            ) *
            smoothing;

        this.rotationY +=
            (
                this.targetRotationY -
                this.rotationY
            ) *
            smoothing;

    }

    getState() {

        return {

            rotationX:
                this.rotationX,

            rotationY:
                this.rotationY,

            alpha:
                this.alpha,

            beta:
                this.beta,

            gamma:
                this.gamma,

            enabled:
                this.enabled,

            supported:
                this.supported,

            permissionGranted:
                this.permissionGranted

        };

    }

    reset() {

        this.alpha = 0;
        this.beta = 0;
        this.gamma = 0;

        this.rotationX = 0;
        this.rotationY = 0;

        this.targetRotationX = 0;
        this.targetRotationY = 0;

    }

    destroy() {

        this.disable();

    }

} 
