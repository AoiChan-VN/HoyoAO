/**
 * ============================================================================
 * File: js/components/home/skybox-viewer.js
 * Purpose: 3D Skybox Renderer
 * Domain: Home (3D Skybox Experience)
 * ============================================================================
 */

import { APP_CONFIG } from '../../core/config.js';
import { eventBus } from '../../core/event-bus.js';

export class SkyboxViewer {
    #containerElement;
    #cubeElement;

    #faceElements;

    #yaw;
    #pitch;

    #animationFrameId;
    #renderPending;

    #unsubscribeRotation;
    #unsubscribeImage;

    constructor(containerElement) {
        if (!(containerElement instanceof HTMLElement)) {
            throw new TypeError(
                '[SkyboxViewer] containerElement must be a valid HTMLElement.'
            );
        }

        this.#containerElement = containerElement;

        this.#cubeElement = null;

        this.#faceElements = {};

        this.#yaw = APP_CONFIG.SKYBOX.INITIAL_YAW;
        this.#pitch = APP_CONFIG.SKYBOX.INITIAL_PITCH;

        this.#animationFrameId = null;
        this.#renderPending = false;

        this.#unsubscribeRotation = null;
        this.#unsubscribeImage = null;
    }

    /**
     * ------------------------------------------------------------------------
     * Public Lifecycle
     * ------------------------------------------------------------------------
     */

    initialize() {
        this.#createCubeStructure();
        this.#registerEvents();
        this.#scheduleRender();
    }

    destroy() {
        if (this.#unsubscribeRotation) {
            this.#unsubscribeRotation();
        }

        if (this.#unsubscribeImage) {
            this.#unsubscribeImage();
        }

        if (this.#animationFrameId !== null) {
            cancelAnimationFrame(this.#animationFrameId);
        }

        this.#containerElement.innerHTML = '';
    }

    /**
     * ------------------------------------------------------------------------
     * DOM Creation
     * ------------------------------------------------------------------------
     */

    #createCubeStructure() {
        const cube = document.createElement('div');

        cube.className = 'home-domain__skybox-cube';

        cube.style.willChange =
            APP_CONFIG.SKYBOX.WILL_CHANGE_PROPERTY;

        const faceNames = [
            'front',
            'back',
            'left',
            'right',
            'top',
            'bottom'
        ];

        for (const faceName of faceNames) {
            const face = document.createElement('div');

            face.className =
                `home-domain__skybox-face home-domain__skybox-face--${faceName}`;

            cube.appendChild(face);

            this.#faceElements[faceName] = face;
        }

        this.#containerElement.appendChild(cube);

        this.#cubeElement = cube;
    }

    /**
     * ------------------------------------------------------------------------
     * Event Registration
     * ------------------------------------------------------------------------
     */

    #registerEvents() {
        this.#unsubscribeRotation =
            eventBus.subscribe(
                APP_CONFIG.EVENTS.SKYBOX_ROTATION_UPDATED,
                (payload) => {
                    this.#handleRotationUpdate(payload);
                }
            );

        this.#unsubscribeImage =
            eventBus.subscribe(
                APP_CONFIG.EVENTS.SKYBOX_IMAGE_CHANGED,
                (payload) => {
                    this.#handleImageUpdate(payload);
                }
            );
    }

    /**
     * ------------------------------------------------------------------------
     * Event Handlers
     * ------------------------------------------------------------------------
     */

    #handleRotationUpdate(payload) {
        if (
            !payload ||
            typeof payload !== 'object'
        ) {
            return;
        }

        const { yaw, pitch } = payload;

        if (
            !Number.isFinite(yaw) ||
            !Number.isFinite(pitch)
        ) {
            return;
        }

        this.#yaw = yaw;
        this.#pitch = pitch;

        this.#scheduleRender();
    }

    #handleImageUpdate(imageSet) {
        if (
            imageSet === null ||
            typeof imageSet !== 'object'
        ) {
            return;
        }

        const faceNames = [
            'front',
            'back',
            'left',
            'right',
            'top',
            'bottom'
        ];

        for (const faceName of faceNames) {
            const faceElement =
                this.#faceElements[faceName];

            if (!faceElement) {
                continue;
            }

            const imageUrl = imageSet[faceName];

            if (typeof imageUrl !== 'string') {
                continue;
            }

            faceElement.style.backgroundImage =
                `url("${imageUrl}")`;
        }
    }

    /**
     * ------------------------------------------------------------------------
     * Rendering
     * ------------------------------------------------------------------------
     */

    #scheduleRender() {
        if (this.#renderPending) {
            return;
        }

        this.#renderPending = true;

        this.#animationFrameId =
            requestAnimationFrame(() => {
                this.#renderPending = false;
                this.#render();
            });
    }

    #render() {
        if (!this.#cubeElement) {
            return;
        }

        this.#cubeElement.style.transform =
            `
            translate(-50%, -50%)
            rotateX(${this.#pitch}deg)
            rotateY(${this.#yaw}deg)
            `;
    }

    /**
     * ------------------------------------------------------------------------
     * Public API
     * ------------------------------------------------------------------------
     */

    setPerspective(value) {
        if (!Number.isFinite(value)) {
            throw new TypeError(
                '[SkyboxViewer] Perspective value must be numeric.'
            );
        }

        this.#containerElement.style.perspective =
            `${value}px`;
    }

    /**
     * ------------------------------------------------------------------------
     * Diagnostics
     * ------------------------------------------------------------------------
     */

    getDiagnostics() {
        return Object.freeze({
            yaw: this.#yaw,
            pitch: this.#pitch,
            renderPending: this.#renderPending,
            cubeCreated:
                this.#cubeElement instanceof HTMLElement
        });
    }
} 
