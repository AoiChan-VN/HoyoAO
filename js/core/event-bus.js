/* ==========================================================================
   js/core/event-bus.js
   Native Browser Experience Engine
   ========================================================================== */

class EventBus {

    #events;

    constructor() {

        this.#events = new Map();

    }

    on(eventName, callback) {

        if (typeof callback !== 'function') {
            throw new TypeError(
                `EventBus.on("${eventName}") requires a function`
            );
        }

        if (!this.#events.has(eventName)) {

            this.#events.set(
                eventName,
                new Set()
            );

        }

        const listeners =
            this.#events.get(eventName);

        listeners.add(callback);

        return () => {

            this.off(
                eventName,
                callback
            );

        };

    }

    once(eventName, callback) {

        const unsubscribe = this.on(
            eventName,
            (...args) => {

                unsubscribe();

                callback(...args);

            }
        );

        return unsubscribe;

    }

    off(eventName, callback) {

        const listeners =
            this.#events.get(eventName);

        if (!listeners) {
            return false;
        }

        const removed =
            listeners.delete(callback);

        if (listeners.size === 0) {

            this.#events.delete(
                eventName
            );

        }

        return removed;

    }

    emit(eventName, payload = null) {

        const listeners =
            this.#events.get(eventName);

        if (!listeners) {
            return false;
        }

        const queue = [
            ...listeners
        ];

        for (const listener of queue) {

            try {

                listener(payload);

            }
            catch (error) {

                console.error(
                    `[EventBus] "${eventName}" listener failed`,
                    error
                );

            }

        }

        return true;

    }

    has(eventName) {

        return this.#events.has(
            eventName
        );

    }

    count(eventName) {

        const listeners =
            this.#events.get(eventName);

        return listeners
            ? listeners.size
            : 0;

    }

    clear(eventName) {

        if (typeof eventName === 'string') {

            this.#events.delete(
                eventName
            );

            return;

        }

        this.#events.clear();

    }

    events() {

        return [
            ...this.#events.keys()
        ];

    }

    listeners(eventName) {

        const listeners =
            this.#events.get(eventName);

        if (!listeners) {
            return [];
        }

        return [
            ...listeners
        ];

    }

}

/* ==========================================================================
   GLOBAL INSTANCE
   ========================================================================== */

export const eventBus =
    new EventBus();

/* ==========================================================================
   DOM EVENT BRIDGE
   ========================================================================== */

export function emitDOM(
    eventName,
    detail = null
) {

    window.dispatchEvent(

        new CustomEvent(
            eventName,
            {
                detail
            }
        )

    );

}

export function onDOM(
    eventName,
    callback,
    options = false
) {

    window.addEventListener(
        eventName,
        callback,
        options
    );

    return () => {

        window.removeEventListener(
            eventName,
            callback,
            options
        );

    };

}

/* ==========================================================================
   RESOURCE CLEANUP GROUP
   ========================================================================== */

export class DisposableGroup {

    #disposers;

    constructor() {

        this.#disposers = [];

    }

    add(disposer) {

        if (
            typeof disposer ===
            'function'
        ) {

            this.#disposers.push(
                disposer
            );

        }

        return disposer;

    }

    dispose() {

        for (
            let i =
                this.#disposers.length - 1;
            i >= 0;
            i--
        ) {

            try {

                this.#disposers[i]();

            }
            catch (error) {

                console.error(
                    '[DisposableGroup]',
                    error
                );

            }

        }

        this.#disposers.length = 0;

    }

}

/* ==========================================================================
   FRAME EVENT CHANNEL
   ========================================================================== */

export const FRAME_EVENTS =
    Object.freeze({

        UPDATE: 'frame:update',

        BEFORE_RENDER:
            'frame:before-render',

        AFTER_RENDER:
            'frame:after-render'

    });

/* ==========================================================================
   APP LIFECYCLE CHANNEL
   ========================================================================== */

export const APP_EVENTS =
    Object.freeze({

        READY: 'app:ready',

        DESTROY: 'app:destroy',

        RESIZE: 'app:resize',

        VISIBILITY:
            'app:visibility'

    });

/* ==========================================================================
   DEBUG
   ========================================================================== */

export function debugEventBus() {

    const output = {};

    for (
        const eventName of
        eventBus.events()
    ) {

        output[eventName] =
            eventBus.count(
                eventName
            );

    }

    return output;

}
