/**
 * ============================================================================
 * File: js/controllers/mouse-input.js
 * Purpose: Desktop Mouse Input Controller
 * Domain: Home (3D Skybox Experience)
 * ============================================================================
 */

import { APP_CONFIG } from '../core/config.js';
import { eventBus } from '../core/event-bus.js';

export class MouseInputController {
    #targetElement;
    #isDragging;
    #lastX;
    #lastY;

    #boundMouseDown;
    #boundMouseMove;
    #boundMouseUp;
    #boundMouseLeave;

    constructor(targetElement) {
        if (!(targetElement instanceof HTMLElement)) {
            throw new TypeError(
                '[MouseInputController] targetElement must be a valid HTMLElement.'
            );
        }

        this.#targetElement = targetElement;

        this.#isDragging = false;

        this.#lastX = 0;
        this.#lastY = 0;

        this.#boundMouseDown = this.#handleMouseDown.bind(this);
        this.#boundMouseMove = this.#handleMouseMove.bind(this);
        this.#boundMouseUp = this.#handleMouseUp.bind(this);
        this.#boundMouseLeave = this.#handleMouseLeave.bind(this);
    }

    /**
     * ------------------------------------------------------------------------
     * Lifecycle
     * ------------------------------------------------------------------------
     */

    initialize() {
        this.#targetElement.addEventListener(
            'mousedown',
            this.#boundMouseDown
        );

        window.addEventListener(
            'mousemove',
            this.#boundMouseMove
        );

        window.addEventListener(
            'mouseup',
            this.#boundMouseUp
        );

        this.#targetElement.addEventListener(
            'mouseleave',
            this.#boundMouseLeave
        );
    }

    destroy() {
        this.#targetElement.removeEventListener(
            'mousedown',
            this.#boundMouseDown
        );

        window.removeEventListener(
            'mousemove',
            this.#boundMouseMove
        );

        window.removeEventListener(
            'mouseup',
            this.#boundMouseUp
        );

        this.#targetElement.removeEventListener(
            'mouseleave',
            this.#boundMouseLeave
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Internal Helpers
     * ------------------------------------------------------------------------
     */

    #publishRotation(deltaYaw, deltaPitch) {
        eventBus.publish(
            APP_CONFIG.EVENTS.SKYBOX_ROTATION_REQUESTED,
            {
                deltaYaw,
                deltaPitch,
                source: 'mouse'
            }
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Event Handlers
     * ------------------------------------------------------------------------
     */

    #handleMouseDown(event) {
        if (
            event.button !==
            APP_CONFIG.INPUT.MOUSE_BUTTON_PRIMARY
        ) {
            return;
        }

        this.#isDragging = true;

        this.#lastX = event.clientX;
        this.#lastY = event.clientY;
    }

    #handleMouseMove(event) {
        if (!this.#isDragging) {
            return;
        }

        const deltaX =
            event.clientX - this.#lastX;

        const deltaY =
            event.clientY - this.#lastY;

        this.#lastX = event.clientX;
        this.#lastY = event.clientY;

        const deltaYaw =
            deltaX *
            APP_CONFIG.SKYBOX.ROTATION_SENSITIVITY_MOUSE;

        const deltaPitch =
            -deltaY *
            APP_CONFIG.SKYBOX.ROTATION_SENSITIVITY_MOUSE;

        this.#publishRotation(
            deltaYaw,
            deltaPitch
        );
    }

    #handleMouseUp() {
        this.#isDragging = false;
    }

    #handleMouseLeave() {
        this.#isDragging = false;
    }

    /**
     * ------------------------------------------------------------------------
     * Diagnostics
     * ------------------------------------------------------------------------
     */

    getDiagnostics() {
        return Object.freeze({
            isDragging: this.#isDragging,
            lastX: this.#lastX,
            lastY: this.#lastY
        });
    }
} 
