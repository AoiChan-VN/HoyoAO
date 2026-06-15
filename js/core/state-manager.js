/**
 * ==========================================================
 * State Manager
 * File: js/core/state-manager.js
 * ==========================================================
 */

import { CONFIG } from "./config.js";
import { eventBus } from "./event-bus.js";

export class StateManager {

    #state;

    constructor() {

        this.#state = Object.freeze({
            application: {
                initialized: false,
                version: CONFIG.APPLICATION.VERSION
            },

            skybox: {
                rotationX:
                    CONFIG.SKYBOX.INITIAL_ROTATION_X,

                rotationY:
                    CONFIG.SKYBOX.INITIAL_ROTATION_Y,

                activeImageSet: null,

                isLoading: false,

                lastUpdated: null
            },

            articles: {
                currentArticleId: null,

                searchQuery: "",

                selectedCategory: null
            }
        });
    }

    /**
     * ======================================================
     * Get Entire State
     * ======================================================
     *
     * @returns {object}
     */
    getState() {
        return this.#deepClone(this.#state);
    }

    /**
     * ======================================================
     * Get State Section
     * ======================================================
     *
     * @param {string} section
     *
     * @returns {*}
     */
    getSection(section) {

        this.#validateKey(section);

        const value = this.#state[section];

        if (typeof value === "undefined") {
            throw new Error(
                `StateManager: Unknown state section "${section}".`
            );
        }

        return this.#deepClone(value);
    }

    /**
     * ======================================================
     * Replace Section
     * ======================================================
     *
     * @param {string} section
     * @param {object} data
     */
    replaceSection(section, data) {

        this.#validateKey(section);
        this.#validateObject(data);

        if (!(section in this.#state)) {
            throw new Error(
                `StateManager: Unknown state section "${section}".`
            );
        }

        const nextState = {
            ...this.#state,
            [section]: this.#deepClone(data)
        };

        this.#commitState(
            nextState,
            {
                section,
                type: "replace"
            }
        );
    }

    /**
     * ======================================================
     * Merge Section
     * ======================================================
     *
     * @param {string} section
     * @param {object} partialData
     */
    mergeSection(section, partialData) {

        this.#validateKey(section);
        this.#validateObject(partialData);

        const currentSection =
            this.#state[section];

        if (
            typeof currentSection !== "object" ||
            currentSection === null
        ) {
            throw new Error(
                `StateManager: Section "${section}" is not mergeable.`
            );
        }

        const nextState = {
            ...this.#state,
            [section]: {
                ...currentSection,
                ...this.#deepClone(partialData)
            }
        };

        this.#commitState(
            nextState,
            {
                section,
                type: "merge"
            }
        );
    }

    /**
     * ======================================================
     * Update Nested Value
     * ======================================================
     *
     * Example:
     * update("skybox", "rotationX", 20)
     *
     * @param {string} section
     * @param {string} property
     * @param {*} value
     */
    update(section, property, value) {

        this.#validateKey(section);
        this.#validateKey(property);

        const currentSection =
            this.#state[section];

        if (
            typeof currentSection !== "object" ||
            currentSection === null
        ) {
            throw new Error(
                `StateManager: Section "${section}" is not updateable.`
            );
        }

        const nextState = {
            ...this.#state,
            [section]: {
                ...currentSection,
                [property]: value
            }
        };

        this.#commitState(
            nextState,
            {
                section,
                property,
                type: "update"
            }
        );
    }

    /**
     * ======================================================
     * Reset State
     * ======================================================
     */
    reset() {

        this.#state = Object.freeze({
            application: {
                initialized: false,
                version: CONFIG.APPLICATION.VERSION
            },

            skybox: {
                rotationX:
                    CONFIG.SKYBOX.INITIAL_ROTATION_X,

                rotationY:
                    CONFIG.SKYBOX.INITIAL_ROTATION_Y,

                activeImageSet: null,

                isLoading: false,

                lastUpdated: null
            },

            articles: {
                currentArticleId: null,

                searchQuery: "",

                selectedCategory: null
            }
        });

        eventBus.publish(
            CONFIG.EVENTS.STATE_UPDATED,
            {
                type: "reset",
                state: this.getState()
            }
        );
    }

    /**
     * ======================================================
     * Commit State
     * ======================================================
     *
     * @param {object} nextState
     * @param {object} metadata
     */
    #commitState(nextState, metadata) {

        const previousState =
            this.getState();

        this.#state =
            Object.freeze(nextState);

        eventBus.publish(
            CONFIG.EVENTS.STATE_UPDATED,
            {
                ...metadata,

                previousState,

                currentState:
                    this.getState()
            }
        );
    }

    /**
     * ======================================================
     * Validation
     * ======================================================
     */

    #validateKey(value) {

        if (
            typeof value !== "string" ||
            value.trim().length === 0
        ) {
            throw new TypeError(
                "StateManager: key must be a non-empty string."
            );
        }
    }

    #validateObject(value) {

        if (
            typeof value !== "object" ||
            value === null ||
            Array.isArray(value)
        ) {
            throw new TypeError(
                "StateManager: value must be an object."
            );
        }
    }

    /**
     * ======================================================
     * Safe Clone
     * ======================================================
     *
     * @param {*} value
     *
     * @returns {*}
     */
    #deepClone(value) {

        if (typeof structuredClone === "function") {
            return structuredClone(value);
        }

        return JSON.parse(
            JSON.stringify(value)
        );
    }
}

/**
 * ==========================================================
 * Global Singleton
 * ==========================================================
 */

export const stateManager = Object.freeze(
    new StateManager()
); 
