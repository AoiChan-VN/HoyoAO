export class EventBus {

    #events = new Map();

    on(event, callback) {

        if (!this.#events.has(event)) {

            this.#events.set(event, new Set());

        }

        this.#events.get(event).add(callback);

        return () => this.off(event, callback);

    }

    off(event, callback) {

        const listeners = this.#events.get(event);

        if (!listeners) return;

        listeners.delete(callback);

    }

    emit(event, payload = null) {

        const listeners = this.#events.get(event);

        if (!listeners) return;

        for (const listener of listeners) {

            try {

                listener(payload);

            }

            catch (error) {

                console.error(error);

            }

        }

    }

    clear() {

        this.#events.clear();

    }

} 
