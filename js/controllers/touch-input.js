/**
 * ==========================================================
 * Touch Input Controller
 * File: js/controllers/touch-input.js
 * ==========================================================
 */

import { CONFIG } from "../core/config.js";
import { eventBus } from "../core/event-bus.js";

export class TouchInputController {

    #targetElement;

    #isDragging;

    #activeTouchId;

    #startX;

    #startY;

    #lastX;

    #lastY;

    #boundTouchStart;

    #boundTouchMove;

    #boundTouchEnd;

    #boundTouchCancel;

    constructor(targetElement) {

        if (!(targetElement instanceof HTMLElement)) {
            throw new TypeError(
                "TouchInputController: targetElement must be a valid HTMLElement."
            );
        }

        this.#targetElement = targetElement;

        this.#isDragging = false;

        this.#activeTouchId = null;

        this.#startX = 0;
        this.#startY = 0;

        this.#lastX = 0;
        this.#lastY = 0;

        this.#boundTouchStart =
            this.#handleTouchStart.bind(this);

        this.#boundTouchMove =
            this.#handleTouchMove.bind(this);

        this.#boundTouchEnd =
            this.#handleTouchEnd.bind(this);

        this.#boundTouchCancel =
            this.#handleTouchCancel.bind(this);
    }

    /**
     * ======================================================
     * Initialize
     * ======================================================
     */
    initialize() {

        this.#targetElement.addEventListener(
            "touchstart",
            this.#boundTouchStart,
            {
                passive:
                    CONFIG.INPUT.PASSIVE_EVENTS
            }
        );

        this.#targetElement.addEventListener(
            "touchmove",
            this.#boundTouchMove,
            {
                passive:
                    CONFIG.INPUT.PASSIVE_EVENTS
            }
        );

        this.#targetElement.addEventListener(
            "touchend",
            this.#boundTouchEnd,
            {
                passive:
                    CONFIG.INPUT.PASSIVE_EVENTS
            }
        );

        this.#targetElement.addEventListener(
            "touchcancel",
            this.#boundTouchCancel,
            {
                passive:
                    CONFIG.INPUT.PASSIVE_EVENTS
            }
        );
    }

    /**
     * ======================================================
     * Destroy
     * ======================================================
     */
    destroy() {

        this.#targetElement.removeEventListener(
            "touchstart",
            this.#boundTouchStart
        );

        this.#targetElement.removeEventListener(
            "touchmove",
            this.#boundTouchMove
        );

        this.#targetElement.removeEventListener(
            "touchend",
            this.#boundTouchEnd
        );

        this.#targetElement.removeEventListener(
            "touchcancel",
            this.#boundTouchCancel
        );

        this.#reset();
    }

    /**
     * ======================================================
     * Touch Start
     * ======================================================
     */
    #handleTouchStart(event) {

        if (
            event.touches.length >
            CONFIG.INPUT.MAX_TOUCH_POINTS
        ) {
            return;
        }

        const touch = event.changedTouches[0];

        if (!touch) {
            return;
        }

        this.#isDragging = true;

        this.#activeTouchId =
            touch.identifier;

        this.#startX = touch.clientX;
        this.#startY = touch.clientY;

        this.#lastX = touch.clientX;
        this.#lastY = touch.clientY;

        eventBus.publish(
            CONFIG.EVENTS.INPUT_DRAG_STARTED,
            {
                source: "touch",

                startX: touch.clientX,
                startY: touch.clientY,

                timestamp: performance.now()
            }
        );
    }

    /**
     * ======================================================
     * Touch Move
     * ======================================================
     */
    #handleTouchMove(event) {

        if (!this.#isDragging) {
            return;
        }

        const touch =
            this.#findActiveTouch(
                event.changedTouches
            );

        if (!touch) {
            return;
        }

        const deltaX =
            touch.clientX - this.#lastX;

        const deltaY =
            touch.clientY - this.#lastY;

        const totalDeltaX =
            touch.clientX - this.#startX;

        const totalDeltaY =
            touch.clientY - this.#startY;

        if (
            Math.abs(deltaX) <
                CONFIG.INPUT.MIN_DRAG_DISTANCE &&
            Math.abs(deltaY) <
                CONFIG.INPUT.MIN_DRAG_DISTANCE
        ) {
            return;
        }

        this.#lastX = touch.clientX;
        this.#lastY = touch.clientY;

        eventBus.publish(
            CONFIG.EVENTS.INPUT_DRAG_MOVED,
            {
                source: "touch",

                currentX: touch.clientX,
                currentY: touch.clientY,

                deltaX,
                deltaY,

                totalDeltaX,
                totalDeltaY,

                timestamp: performance.now()
            }
        );
    }

    /**
     * ======================================================
     * Touch End
     * ======================================================
     */
    #handleTouchEnd(event) {

        if (!this.#isDragging) {
            return;
        }

        const touch =
            this.#findActiveTouch(
                event.changedTouches
            );

        if (!touch) {
            return;
        }

        eventBus.publish(
            CONFIG.EVENTS.INPUT_DRAG_ENDED,
            {
                source: "touch",

                endX: touch.clientX,
                endY: touch.clientY,

                timestamp: performance.now()
            }
        );

        this.#reset();
    }

    /**
     * ======================================================
     * Touch Cancel
     * ======================================================
     */
    #handleTouchCancel(event) {

        const touch =
            this.#findActiveTouch(
                event.changedTouches
            );

        if (!touch) {
            return;
        }

        eventBus.publish(
            CONFIG.EVENTS.INPUT_DRAG_ENDED,
            {
                source: "touch",

                endX: touch.clientX,
                endY: touch.clientY,

                cancelled: true,

                timestamp: performance.now()
            }
        );

        this.#reset();
    }

    /**
     * ======================================================
     * Find Active Touch
     * ======================================================
     *
     * @param {TouchList} touchList
     *
     * @returns {Touch|null}
     */
    #findActiveTouch(touchList) {

        for (const touch of touchList) {

            if (
                touch.identifier ===
                this.#activeTouchId
            ) {
                return touch;
            }
        }

        return null;
    }

    /**
     * ======================================================
     * Reset Internal State
     * ======================================================
     */
    #reset() {

        this.#isDragging = false;

        this.#activeTouchId = null;

        this.#startX = 0;
        this.#startY = 0;

        this.#lastX = 0;
        this.#lastY = 0;
    }
} 
