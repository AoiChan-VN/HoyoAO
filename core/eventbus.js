export class EventBus {

    constructor() {

        this.events = new Map();

        this.wildcardListeners = new Set();
    }

    on(eventName, callback) {

        if (typeof eventName !== 'string') {
            throw new TypeError(
                'Event name must be a string.'
            );
        }

        if (typeof callback !== 'function') {
            throw new TypeError(
                'Callback must be a function.'
            );
        }

        if (!this.events.has(eventName)) {
            this.events.set(
                eventName,
                new Set()
            );
        }

        const listeners =
            this.events.get(eventName);

        listeners.add(callback);

        return () => {
            this.off(
                eventName,
                callback
            );
        };
    }

    once(eventName, callback) {

        if (typeof callback !== 'function') {
            throw new TypeError(
                'Callback must be a function.'
            );
        }

        const unsubscribe =
            this.on(
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
            this.events.get(eventName);

        if (!listeners) {
            return false;
        }

        const existed =
            listeners.delete(callback);

        if (
            listeners.size === 0
        ) {
            this.events.delete(eventName);
        }

        return existed;
    }

    emit(eventName, payload = null) {

        const listeners =
            this.events.get(eventName);

        if (listeners) {

            for (const listener of listeners) {

                try {

                    listener(payload);

                } catch (error) {

                    console.error(
                        `[EventBus] Listener Error (${eventName})`,
                        error
                    );
                }
            }
        }

        if (
            this.wildcardListeners.size > 0
        ) {

            for (
                const listener
                of this.wildcardListeners
            ) {

                try {

                    listener(
                        eventName,
                        payload
                    );

                } catch (error) {

                    console.error(
                        '[EventBus] Wildcard Listener Error',
                        error
                    );
                }
            }
        }
    }

    onAny(callback) {

        if (typeof callback !== 'function') {
            throw new TypeError(
                'Callback must be a function.'
            );
        }

        this.wildcardListeners.add(
            callback
        );

        return () => {

            this.wildcardListeners.delete(
                callback
            );
        };
    }

    clear(eventName) {

        if (
            typeof eventName === 'string'
        ) {

            this.events.delete(
                eventName
            );

            return;
        }

        this.events.clear();

        this.wildcardListeners.clear();
    }

    listenerCount(eventName) {

        const listeners =
            this.events.get(eventName);

        if (!listeners) {
            return 0;
        }

        return listeners.size;
    }

    eventCount() {

        return this.events.size;
    }

    has(eventName) {

        return this.events.has(
            eventName
        );
    }

    destroy() {

        this.clear();
    }
} 
