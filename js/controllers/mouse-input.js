/**
 * ==========================================================
 * Mouse Input Controller
 * File: js/controllers/mouse-input.js
 * ==========================================================
 */

import { CONFIG } from "../core/config.js";
import { eventBus } from "../core/event-bus.js";

export class MouseInputController {

    #targetElement;

    #isDragging;

    #startX;

    #startY;

    #lastX;

    #lastY;

    #boundMouseDown;

    #boundMouseMove;

    #boundMouseUp;

    constructor(targetElement) {

        if (!(targetElement instanceof HTMLElement)) {
            throw new TypeError(
                "MouseInputController: targetElement must be a valid HTMLElement."
            );
        }

        this.#targetElement = targetElement;

        this.#isDragging = false;

        this.#startX = 0;
        this.#startY = 0;

        this.#lastX = 0;
        this.#lastY = 0;

        this.#boundMouseDown =
            this.#handleMouseDown.bind(this);

        this.#boundMouseMove =
            this.#handleMouseMove.bind(this);

        this.#boundMouseUp =
            this.#handleMouseUp.bind(this);
    }

    /**
     * ======================================================
     * Initialize
     * ======================================================
     */
    initialize() {

        this.#targetElement.addEventListener(
            "mousedown",
            this.#boundMouseDown
        );

        window.addEventListener(
            "mousemove",
            this.#boundMouseMove
        );

        window.addEventListener(
            "mouseup",
            this.#boundMouseUp
        );
    }

    /**
     * ======================================================
     * Destroy
     * ======================================================
     */
    destroy() {

        this.#targetElement.removeEventListener(
            "mousedown",
            this.#boundMouseDown
        );

        window.removeEventListener(
            "mousemove",
            this.#boundMouseMove
        );

        window.removeEventListener(
            "mouseup",
            this.#boundMouseUp
        );

        this.#isDragging = false;
    }

    /**
     * ======================================================
     * Mouse Down
     * ======================================================
     */
    #handleMouseDown(event) {

        if (event.button !== 0) {
            return;
        }

        this.#isDragging = true;

        this.#startX = event.clientX;
        this.#startY = event.clientY;

        this.#lastX = event.clientX;
        this.#lastY = event.clientY;

        eventBus.publish(
            CONFIG.EVENTS.INPUT_DRAG_STARTED,
            {
                source: "mouse",

                startX: event.clientX,
                startY: event.clientY,

                timestamp: performance.now()
            }
        );
    }

    /**
     * ======================================================
     * Mouse Move
     * ======================================================
     */
    #handleMouseMove(event) {

        if (!this.#isDragging) {
            return;
        }

        const deltaX =
            event.clientX - this.#lastX;

        const deltaY =
            event.clientY - this.#lastY;

        const totalDeltaX =
            event.clientX - this.#startX;

        const totalDeltaY =
            event.clientY - this.#startY;

        if (
            Math.abs(deltaX) <
                CONFIG.INPUT.MIN_DRAG_DISTANCE &&
            Math.abs(deltaY) <
                CONFIG.INPUT.MIN_DRAG_DISTANCE
        ) {
            return;
        }

        this.#lastX = event.clientX;
        this.#lastY = event.clientY;

        eventBus.publish(
            CONFIG.EVENTS.INPUT_DRAG_MOVED,
            {
                source: "mouse",

                currentX: event.clientX,
                currentY: event.clientY,

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
     * Mouse Up
     * ======================================================
     */
    #handleMouseUp(event) {

        if (!this.#isDragging) {
            return;
        }

        this.#isDragging = false;

        eventBus.publish(
            CONFIG.EVENTS.INPUT_DRAG_ENDED,
            {
                source: "mouse",

                endX: event.clientX,
                endY: event.clientY,

                timestamp: performance.now()
            }
        );
    }
} 
