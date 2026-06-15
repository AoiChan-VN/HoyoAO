/**
 * ============================================================================
 * File: js/components/home/overlay-ui.js
 * Purpose: Overlay User Interface
 * Domain: Home (3D Skybox Experience)
 * ============================================================================
 */

import { APP_CONFIG } from '../../core/config.js';
import { eventBus } from '../../core/event-bus.js';

export class OverlayUI {
    #containerElement;

    #rootElement;

    #titleElement;

    #buttonPrevious;

    #buttonReset;

    #buttonNext;

    #boundPreviousHandler;

    #boundResetHandler;

    #boundNextHandler;

    constructor(containerElement) {
        if (!(containerElement instanceof HTMLElement)) {
            throw new TypeError(
                '[OverlayUI] containerElement must be a valid HTMLElement.'
            );
        }

        this.#containerElement = containerElement;

        this.#rootElement = null;

        this.#titleElement = null;

        this.#buttonPrevious = null;
        this.#buttonReset = null;
        this.#buttonNext = null;

        this.#boundPreviousHandler =
            this.#handlePreviousClick.bind(this);

        this.#boundResetHandler =
            this.#handleResetClick.bind(this);

        this.#boundNextHandler =
            this.#handleNextClick.bind(this);
    }

    /**
     * ------------------------------------------------------------------------
     * Lifecycle
     * ------------------------------------------------------------------------
     */

    initialize() {
        this.#createUI();
        this.#registerEvents();
    }

    destroy() {
        if (this.#buttonPrevious) {
            this.#buttonPrevious.removeEventListener(
                'click',
                this.#boundPreviousHandler
            );
        }

        if (this.#buttonReset) {
            this.#buttonReset.removeEventListener(
                'click',
                this.#boundResetHandler
            );
        }

        if (this.#buttonNext) {
            this.#buttonNext.removeEventListener(
                'click',
                this.#boundNextHandler
            );
        }

        if (
            this.#rootElement &&
            this.#rootElement.parentNode
        ) {
            this.#rootElement.parentNode.removeChild(
                this.#rootElement
            );
        }
    }

    /**
     * ------------------------------------------------------------------------
     * DOM Creation
     * ------------------------------------------------------------------------
     */

    #createUI() {
        const root = document.createElement('div');
        root.className = 'home-domain__overlay';

        const title = document.createElement('h1');
        title.className =
            'home-domain__overlay-title';

        title.textContent =
            'Vanilla 3D Skybox Experience';

        const controls = document.createElement('div');
        controls.className =
            'home-domain__overlay-controls';

        const previousButton =
            document.createElement('button');

        previousButton.type = 'button';

        previousButton.className =
            'home-domain__overlay-button';

        previousButton.textContent =
            'Previous Scene';

        const resetButton =
            document.createElement('button');

        resetButton.type = 'button';

        resetButton.className =
            'home-domain__overlay-button';

        resetButton.textContent =
            'Reset View';

        const nextButton =
            document.createElement('button');

        nextButton.type = 'button';

        nextButton.className =
            'home-domain__overlay-button';

        nextButton.textContent =
            'Next Scene';

        controls.append(
            previousButton,
            resetButton,
            nextButton
        );

        root.append(
            title,
            controls
        );

        this.#containerElement.appendChild(root);

        this.#rootElement = root;

        this.#titleElement = title;

        this.#buttonPrevious =
            previousButton;

        this.#buttonReset =
            resetButton;

        this.#buttonNext =
            nextButton;
    }

    /**
     * ------------------------------------------------------------------------
     * Event Registration
     * ------------------------------------------------------------------------
     */

    #registerEvents() {
        this.#buttonPrevious.addEventListener(
            'click',
            this.#boundPreviousHandler
        );

        this.#buttonReset.addEventListener(
            'click',
            this.#boundResetHandler
        );

        this.#buttonNext.addEventListener(
            'click',
            this.#boundNextHandler
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Event Handlers
     * ------------------------------------------------------------------------
     */

    #handlePreviousClick() {
        eventBus.publish(
            APP_CONFIG.EVENTS
                .OVERLAY_PREVIOUS_SKYBOX_REQUESTED
        );
    }

    #handleResetClick() {
        eventBus.publish(
            APP_CONFIG.EVENTS
                .OVERLAY_RESET_VIEW_REQUESTED
        );
    }

    #handleNextClick() {
        eventBus.publish(
            APP_CONFIG.EVENTS
                .OVERLAY_NEXT_SKYBOX_REQUESTED
        );
    }

    /**
     * ------------------------------------------------------------------------
     * Public API
     * ------------------------------------------------------------------------
     */

    setTitle(title) {
        if (
            typeof title !== 'string' ||
            title.trim().length === 0
        ) {
            throw new TypeError(
                '[OverlayUI] Invalid title.'
            );
        }

        if (this.#titleElement) {
            this.#titleElement.textContent =
                title;
        }
    }

    /**
     * ------------------------------------------------------------------------
     * Diagnostics
     * ------------------------------------------------------------------------
     */

    getDiagnostics() {
        return Object.freeze({
            mounted:
                this.#rootElement instanceof HTMLElement,
            hasTitle:
                this.#titleElement instanceof HTMLElement,
            hasControls:
                this.#buttonPrevious instanceof HTMLButtonElement &&
                this.#buttonReset instanceof HTMLButtonElement &&
                this.#buttonNext instanceof HTMLButtonElement
        });
    }
} 
