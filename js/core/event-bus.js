/**
 * ==========================================================
 * Event Bus
 * File: js/core/event-bus.js
 * ==========================================================
 */

export class EventBus {

    #listeners;

    constructor() {
        this.#listeners = new Map();
    }

    /**
     * ======================================================
     * Subscribe
     * ======================================================
     *
     * @param {string} eventName
     * @param {Function} callback
     *
     * @returns {Function}
     */
    subscribe(eventName, callback) {

        this.#validateEventName(eventName);
        this.#validateCallback(callback);

        if (!this.#listeners.has(eventName)) {
            this.#listeners.set(eventName, new Set());
        }

        const listeners = this.#listeners.get(eventName);

        listeners.add(callback);

        return () => {
            this.unsubscribe(eventName, callback);
        };
    }

    /**
     * ======================================================
     * Subscribe Once
     * ======================================================
     *
     * @param {string} eventName
     * @param {Function} callback
     *
     * @returns {Function}
     */
    subscribeOnce(eventName, callback) {

        this.#validateEventName(eventName);
        this.#validateCallback(callback);

        const wrapper = (payload) => {

            try {
                callback(payload);
            } finally {
                this.unsubscribe(eventName, wrapper);
            }
        };

        return this.subscribe(eventName, wrapper);
    }

    /**
     * ======================================================
     * Publish
     * ======================================================
     *
     * @param {string} eventName
     * @param {*} payload
     *
     * @returns {number}
     */
    publish(eventName, payload = null) {

        this.#validateEventName(eventName);

        const listeners = this.#listeners.get(eventName);

        if (!listeners || listeners.size === 0) {
            return 0;
        }

        const snapshot = Array.from(listeners);

        let executedCount = 0;

        for (const listener of snapshot) {

            try {

                listener(payload);

                executedCount++;

            } catch (error) {

                console.error(
                    `[EventBus] Listener execution failed for event "${eventName}".`,
                    error
                );
            }
        }

        return executedCount;
    }

    /**
     * ======================================================
     * Unsubscribe
     * ======================================================
     *
     * @param {string} eventName
     * @param {Function} callback
     *
     * @returns {boolean}
     */
    unsubscribe(eventName, callback) {

        this.#validateEventName(eventName);
        this.#validateCallback(callback);

        const listeners = this.#listeners.get(eventName);

        if (!listeners) {
            return false;
        }

        const removed = listeners.delete(callback);

        if (listeners.size === 0) {
            this.#listeners.delete(eventName);
        }

        return removed;
    }

    /**
     * ======================================================
     * Remove All Listeners
     * ======================================================
     *
     * @param {string} eventName
     */
    clearEvent(eventName) {

        this.#validateEventName(eventName);

        this.#listeners.delete(eventName);
    }

    /**
     * ======================================================
     * Remove Entire Bus
     * ======================================================
     */
    clearAll() {
        this.#listeners.clear();
    }

    /**
     * ======================================================
     * Has Event
     * ======================================================
     *
     * @param {string} eventName
     *
     * @returns {boolean}
     */
    hasEvent(eventName) {

        this.#validateEventName(eventName);

        return this.#listeners.has(eventName);
    }

    /**
     * ======================================================
     * Listener Count
     * ======================================================
     *
     * @param {string} eventName
     *
     * @returns {number}
     */
    getListenerCount(eventName) {

        this.#validateEventName(eventName);

        const listeners = this.#listeners.get(eventName);

        return listeners ? listeners.size : 0;
    }

    /**
     * ======================================================
     * Registered Events
     * ======================================================
     *
     * @returns {string[]}
     */
    getRegisteredEvents() {
        return Array.from(this.#listeners.keys());
    }

    /**
     * ======================================================
     * Validation
     * ======================================================
     */

    #validateEventName(eventName) {

        if (
            typeof eventName !== "string" ||
            eventName.trim().length === 0
        ) {
            throw new TypeError(
                "EventBus: eventName must be a non-empty string."
            );
        }
    }

    #validateCallback(callback) {

        if (typeof callback !== "function") {
            throw new TypeError(
                "EventBus: callback must be a function."
            );
        }
    }
}

/**
 * ==========================================================
 * Global Singleton
 * ==========================================================
 */

export const eventBus = Object.freeze(
    new EventBus()
); 
