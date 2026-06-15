/**
 * ============================================================================
 * File: js/core/event-bus.js
 * Purpose: Global Event Bus (Mediator Pattern)
 * Domain: Shared Core Infrastructure
 * ============================================================================
 */

export class EventBus {
    #eventRegistry;

    constructor() {
        this.#eventRegistry = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} eventName
     * @param {Function} listener
     * @returns {Function} unsubscribe callback
     */
    subscribe(eventName, listener) {
        if (typeof eventName !== 'string' || eventName.trim().length === 0) {
            throw new TypeError(
                '[EventBus] Invalid event name supplied.'
            );
        }

        if (typeof listener !== 'function') {
            throw new TypeError(
                `[EventBus] Listener for "${eventName}" must be a function.`
            );
        }

        if (!this.#eventRegistry.has(eventName)) {
            this.#eventRegistry.set(eventName, new Set());
        }

        const listeners = this.#eventRegistry.get(eventName);

        listeners.add(listener);

        return () => {
            this.unsubscribe(eventName, listener);
        };
    }

    /**
     * Remove specific listener
     * @param {string} eventName
     * @param {Function} listener
     */
    unsubscribe(eventName, listener) {
        const listeners = this.#eventRegistry.get(eventName);

        if (!listeners) {
            return;
        }

        listeners.delete(listener);

        if (listeners.size === 0) {
            this.#eventRegistry.delete(eventName);
        }
    }

    /**
     * Publish event with payload
     * @param {string} eventName
     * @param {*} payload
     */
    publish(eventName, payload = null) {
        if (typeof eventName !== 'string' || eventName.trim().length === 0) {
            throw new TypeError(
                '[EventBus] Invalid event name supplied.'
            );
        }

        const listeners = this.#eventRegistry.get(eventName);

        if (!listeners || listeners.size === 0) {
            return;
        }

        const snapshot = [...listeners];

        for (const listener of snapshot) {
            try {
                listener(payload);
            } catch (error) {
                console.error(
                    `[EventBus] Listener execution failed for event "${eventName}".`,
                    error
                );
            }
        }
    }

    /**
     * Remove all listeners from one event
     * @param {string} eventName
     */
    clearEvent(eventName) {
        if (
            typeof eventName === 'string' &&
            this.#eventRegistry.has(eventName)
        ) {
            this.#eventRegistry.delete(eventName);
        }
    }

    /**
     * Remove all listeners from all events
     */
    clearAll() {
        this.#eventRegistry.clear();
    }

    /**
     * Check if event exists
     * @param {string} eventName
     * @returns {boolean}
     */
    hasEvent(eventName) {
        return this.#eventRegistry.has(eventName);
    }

    /**
     * Count listeners for event
     * @param {string} eventName
     * @returns {number}
     */
    listenerCount(eventName) {
        const listeners = this.#eventRegistry.get(eventName);

        return listeners ? listeners.size : 0;
    }

    /**
     * Debug information
     * @returns {Object}
     */
    getDiagnostics() {
        const diagnostics = {};

        for (const [eventName, listeners] of this.#eventRegistry.entries()) {
            diagnostics[eventName] = listeners.size;
        }

        return Object.freeze({
            totalEvents: this.#eventRegistry.size,
            events: diagnostics
        });
    }
}

/**
 * Singleton instance
 * Entire application must use this instance
 */
export const eventBus = new EventBus(); 
