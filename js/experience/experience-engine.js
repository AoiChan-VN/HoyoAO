/* ==========================================================================
   js/experience/experience-engine.js
   Native Browser Experience Engine
   HDRI + Skybox + Camera + Gyroscope + Parallax
   ========================================================================== */

import { CONFIG } from '../core/config.js';

import {
    CameraController
} from '../camera/camera-controller.js';

import {
    DeviceOrientationController
} from '../gyroscope/device-orientation.js';

import {
    ParallaxEngine
} from '../parallax/parallax-engine.js';

import {
    SkyboxRenderer
} from '../renderers/skybox-renderer.js';

import {
    HDRIRenderer
} from '../renderers/hdri-renderer.js';

export class ExperienceEngine {

    constructor() {

        this.running = false;

        this.lastFrame =
            performance.now();

        this.deltaTime = 0;

        this.animationFrame =
            null;

        this.camera =
            new CameraController();

        this.gyroscope =
            new DeviceOrientationController();

        this.parallax =
            new ParallaxEngine();

        this.skybox =
            new SkyboxRenderer();

        this.hdri =
            new HDRIRenderer();

        this.scene =
            document.getElementById(
                'experience-scene'
            );

        this.root =
            document.documentElement;

        this.useGyroscope =
            false;

        this.bindEvents();

    }

    /* ===================================================================== */
    /* INIT
    /* ===================================================================== */

    async init() {

        this.running = true;

        this.lastFrame =
            performance.now();

        this.startLoop();

        return this;

    }

    /* ===================================================================== */
    /* EVENTS
    /* ===================================================================== */

    bindEvents() {

        document.addEventListener(
            'visibilitychange',
            () => {

                if (
                    document.hidden
                ) {

                    this.pause();

                }
                else {

                    this.resume();

                }

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

        this.skybox.resize();

        this.hdri.resize();

    };

    /* ===================================================================== */
    /* HDRI
    /* ===================================================================== */

    async loadHDRI(
        path
    ) {

        await this.hdri.setSource(
            path
        );

    }

    /* ===================================================================== */
    /* GYROSCOPE
    /* ===================================================================== */

    async enableGyroscope() {

        const granted =
            await this.gyroscope
                .requestPermission();

        this.useGyroscope =
            granted;

        return granted;

    }

    disableGyroscope() {

        this.useGyroscope =
            false;

        this.gyroscope.disable();

    }

    /* ===================================================================== */
    /* MAIN LOOP
    /* ===================================================================== */

    startLoop() {

        const frame =
            (
                timestamp
            ) => {

                if (
                    !this.running
                ) {
                    return;
                }

                this.deltaTime =
                    Math.min(
                        CONFIG.EXPERIENCE
                            .MAX_DELTA_TIME,

                        (
                            timestamp -
                            this.lastFrame
                        ) / 1000
                    );

                this.lastFrame =
                    timestamp;

                this.update(
                    this.deltaTime
                );

                this.render();

                this.animationFrame =
                    requestAnimationFrame(
                        frame
                    );

            };

        this.animationFrame =
            requestAnimationFrame(
                frame
            );

    }

    /* ===================================================================== */
    /* UPDATE
    /* ===================================================================== */

    update(
        deltaTime
    ) {

        this.camera.update(
            deltaTime
        );

        this.gyroscope.update(
            deltaTime
        );

        const cameraState =
            this.camera
                .getState();

        const gyroState =
            this.gyroscope
                .getState();

        let rotationX =
            cameraState.rotationX;

        let rotationY =
            cameraState.rotationY;

        if (
            this.useGyroscope &&
            gyroState.enabled
        ) {

            rotationX =
                gyroState.rotationX;

            rotationY =
                gyroState.rotationY;

        }

        this.skybox.setTarget(
            rotationY,
            rotationX
        );

        this.skybox.update(
            deltaTime
        );

        this.hdri.setTarget(
            rotationY * 4,
            rotationX * 4
        );

        this.hdri.setZoom(
            cameraState.zoom
        );

        this.hdri.update(
            deltaTime
        );

        this.parallax.setInput(

            rotationY /
            CONFIG.EXPERIENCE
                .CAMERA_ROTATION_LIMIT_Y,

            rotationX /
            CONFIG.EXPERIENCE
                .CAMERA_ROTATION_LIMIT_X

        );

        this.parallax.update(
            deltaTime
        );

        this.applySceneTransform(
            rotationX,
            rotationY,
            cameraState.zoom
        );

    }

    /* ===================================================================== */
    /* SCENE
    /* ===================================================================== */

    applySceneTransform(
        x,
        y,
        zoom
    ) {

        if (
            !this.scene
        ) {
            return;
        }

        this.scene.style.transform =
            `
            perspective(1600px)

            rotateX(${x}deg)

            rotateY(${y}deg)

            scale(${zoom})
            `;

    }

    /* ===================================================================== */
    /* RENDER
    /* ===================================================================== */

    render() {

        this.root.style.setProperty(
            '--frame-time',
            this.deltaTime
                .toFixed(4)
        );

    }

    /* ===================================================================== */
    /* STATE
    /* ===================================================================== */

    getState() {

        return {

            running:
                this.running,

            deltaTime:
                this.deltaTime,

            camera:
                this.camera
                    .getState(),

            gyroscope:
                this.gyroscope
                    .getState()

        };

    }

    /* ===================================================================== */
    /* CONTROL
    /* ===================================================================== */

    pause() {

        this.running = false;

        if (
            this.animationFrame
        ) {

            cancelAnimationFrame(
                this.animationFrame
            );

            this.animationFrame =
                null;

        }

    }

    resume() {

        if (
            this.running
        ) {
            return;
        }

        this.running = true;

        this.lastFrame =
            performance.now();

        this.startLoop();

    }

    reset() {

        this.camera.reset();

        this.gyroscope.reset();

        this.skybox.reset();

        this.hdri.reset();

        this.parallax.reset();

    }

    /* ===================================================================== */
    /* DESTROY
    /* ===================================================================== */

    destroy() {

        this.pause();

        this.camera.destroy();

        this.gyroscope.destroy();

        this.parallax.destroy();

        this.skybox.destroy();

        this.hdri.destroy();

    }

} 
