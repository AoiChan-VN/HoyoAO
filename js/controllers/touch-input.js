/**
 * ============================================================================
 * File: js/controllers/touch-input.js
 * Purpose: Mobile Touch Input Controller
 * Domain: Home (3D Skybox Experience)
 * ============================================================================
 */

import { APP_CONFIG } from '../core/config.js';
import { eventBus } from '../core/event-bus.js';

export class TouchInputController {
    #targetElement;

    #isTouching;

    #lastX;
    #lastY;

    #activeTouchIdentifier;

    #boundTouchStart;
    #boundTouchMove;
    #boundTouchEnd;
    #boundTouchCancel;

    constructor(targetElement) {
        if (!(targetElement instanceof HTMLElement)) {
            throw new TypeError(
                '[TouchInputController] targetElement must be a valid HTMLElement.'
            );
        }

        this.#targetElement = targetElement;

        this.#isTouching = false;

        this.#lastX = 0;
        this.#lastY = 0;

        this.#activeTouchIdentifier = null;

        this.#boundTouchStart = this.#handleTouchStart.bind(this);
        this.#boundTouchMove = this.#handleTouchMove.bind(this);
        this.#boundTouchEnd = this.#handleTouchEnd.bind(this);
        this.#boundTouchCancel = this.#handleTouchCancel.bind(this);
    }

    /**
     * ------------------------------------------------------------------------
     * Lifecycle
     * ------------------------------------------------------------------------
     */

    initialize() {
        this.#targetElement.addEventListener(
            'touchstart',
            this.#boundTouchStart,
            APP_CONFIG.INPUT.PASSIVE_EVENT_OPTIONS
        );

        this.#targetElement.addEventListener(
            'touchmove',
            this.#boundTouchMove,
            APP_CONFIG.INPUT.ACTIVE_EVENT_OPTIONS
        );

        this.#targetElement.addEventListener(
            'touchend',
            this.#boundTouchEnd,
            APP_CONFIG.INPUT.PASSIVE_EVENT_OPTIONS
        );

        this.#targetElement.addEventListener(
            'touchcancel',
            this.#boundTouchCancel,
            APP_CONFIG.INPUT.PASSIVE_EVENT_OPTIONS
        );
    }

    destroy() {
        this.#targetElement.removeEventListener(
            'touchstart',
            this.#boundTouchStart
        );

        this.#targetElement.removeEventListener(
            'touchmove',
            this.#boundTouchMove
        );

        this.#targetElement.removeEventListener(
            'touchend',
            this.#boundTouchEnd
        );

        this.#targetElement.removeEventListener(
            'touchcancel',
            this.#boundTouchCancel
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------------
     */

    #findTrackedTouch(touchList) {
        if (this.#activeTouchIdentifier === null) {
            return null;
        }

        for (const touch of touchList) {
            if (
                touch.identifier ===
                this.#activeTouchIdentifier
            ) {
                return touch;
            }
        }

        return null;
    }

    #publishRotation(deltaYaw, deltaPitch) {
        eventBus.publish(
            APP_CONFIG.EVENTS.SKYBOX_ROTATION_REQUESTED,
            {
                deltaYaw,
                deltaPitch,
                source: 'touch'
            }
        );
    }

    #resetTracking() {
        this.#isTouching = false;

        this.#lastX = 0;
        this.#lastY = 0;

        this.#activeTouchIdentifier = null;
    }

    /**
     * ------------------------------------------------------------------------
     * Event Handlers
     * ------------------------------------------------------------------------
     */

    #handleTouchStart(event) {
        if (
            event.touches.length <
            APP_CONFIG.INPUT.TOUCH_MIN_POINTS
        ) {
            return;
        }

        const touch = event.touches[0];

        this.#isTouching = true;

        this.#activeTouchIdentifier =
            touch.identifier;

        this.#lastX = touch.clientX;
        this.#lastY = touch.clientY;
    }

    #handleTouchMove(event) {
        if (!this.#isTouching) {
            return;
        }

        const trackedTouch =
            this.#findTrackedTouch(
                event.touches
            );

        if (!trackedTouch) {
            return;
        }

        event.preventDefault();

        const deltaX =
            trackedTouch.clientX - this.#lastX;

        const deltaY =
            trackedTouch.clientY - this.#lastY;

        this.#lastX = trackedTouch.clientX;
        this.#lastY = trackedTouch.clientY;

        const deltaYaw =
            deltaX *
            APP_CONFIG.SKYBOX.ROTATION_SENSITIVITY_TOUCH;

        const deltaPitch =
            -deltaY *
            APP_CONFIG.SKYBOX.ROTATION_SENSITIVITY_TOUCH;

        this.#publishRotation(
            deltaYaw,
            deltaPitch
        );
    }

    #handleTouchEnd(event) {
        const trackedTouch =
            this.#findTrackedTouch(
                event.touches
            );

        if (!trackedTouch) {
            this.#resetTracking();
        }
    }

    #handleTouchCancel() {
        this.#resetTracking();
    }

    /**
     * ------------------------------------------------------------------------
     * Diagnostics
     * ------------------------------------------------------------------------
     */

    getDiagnostics() {
        return Object.freeze({
            isTouching: this.#isTouching,
            activeTouchIdentifier:
                this.#activeTouchIdentifier,
            lastX: this.#lastX,
            lastY: this.#lastY
        });
    }
} 
