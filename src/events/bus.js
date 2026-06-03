export class EventBus {

    #events = new Map();

    on(event, handler) {

        if (!this.#events.has(event)) {

            this.#events.set(
                event,
                new Set()
            );

        }

        this.#events
            .get(event)
            .add(handler);

    }

    off(event, handler) {

        this.#events
            .get(event)
            ?.delete(handler);

    }

    emit(event, payload) {

        const handlers =
            this.#events.get(event);

        if (!handlers) return;

        for (const handler of handlers) {

            handler(payload);

        }

    }

}

export const bus =
    new EventBus(); 
