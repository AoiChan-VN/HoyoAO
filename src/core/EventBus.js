export class EventBus {
    constructor() {
        this._events = new Map();
        this._destroyed = false;
    }

    _assertActive() {
        if (this._destroyed) {
            throw new Error('EventBus has been destroyed.');
        }
    }

    _assertEventName(eventName) {
        if (
            typeof eventName !== 'string' ||
            eventName.trim().length === 0
        ) {
            throw new TypeError(
                'Event name must be a non-empty string.'
            );
        }
    }

    subscribe(eventName, callback) {
        this._assertActive();
        this._assertEventName(eventName);

        if (typeof callback !== 'function') {
            throw new TypeError(
                'Callback must be a function.'
            );
        }

        let listeners = this._events.get(eventName);

        if (!listeners) {
            listeners = new Set();
            this._events.set(eventName, listeners);
        }

        listeners.add(callback);

        return () => {
            this.unsubscribe(
                eventName,
                callback
            );
        };
    }

    subscribeOnce(eventName, callback) {
        this._assertActive();
        this._assertEventName(eventName);

        if (typeof callback !== 'function') {
            throw new TypeError(
                'Callback must be a function.'
            );
        }

        const wrapper = (payload) => {
            this.unsubscribe(
                eventName,
                wrapper
            );

            callback(payload);
        };

        return this.subscribe(
            eventName,
            wrapper
        );
    }

    unsubscribe(eventName, callback) {
        this._assertEventName(eventName);

        const listeners =
            this._events.get(eventName);

        if (!listeners) {
            return false;
        }

        const deleted =
            listeners.delete(callback);

        if (listeners.size === 0) {
            this._events.delete(eventName);
        }

        return deleted;
    }

    publish(eventName, payload = null) {
        this._assertActive();
        this._assertEventName(eventName);

        const listeners =
            this._events.get(eventName);

        if (!listeners) {
            return;
        }

        const snapshot =
            Array.from(listeners);

        for (let i = 0; i < snapshot.length; i++) {
            const listener =
                snapshot[i];

            try {
                listener(payload);
            } catch (error) {
                console.error(
                    `[EventBus] Listener error for "${eventName}"`,
                    error
                );
            }
        }
    }

    hasListeners(eventName) {
        this._assertEventName(eventName);

        const listeners =
            this._events.get(eventName);

        return Boolean(
            listeners &&
            listeners.size > 0
        );
    }

    listenerCount(eventName) {
        this._assertEventName(eventName);

        const listeners =
            this._events.get(eventName);

        return listeners
            ? listeners.size
            : 0;
    }

    clear(eventName) {
        this._assertActive();
        this._assertEventName(eventName);

        this._events.delete(eventName);
    }

    clearAll() {
        this._assertActive();
        this._events.clear();
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        this._events.clear();
        this._destroyed = true;
    }
}
