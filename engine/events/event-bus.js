export class EventBus {
    #listeners = new Map();

    on(event, handler) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(handler);
        return () => this.off(event, handler);
    }

    once(event, handler) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            handler(...args);
        };
        wrapper._original = handler;
        return this.on(event, wrapper);
    }

    off(event, handler) {
        const handlers = this.#listeners.get(event);
        if (!handlers) return;
        for (const h of handlers) {
            if (h === handler || h._original === handler) {
                handlers.delete(h);
            }
        }
        if (handlers.size === 0) {
            this.#listeners.delete(event);
        }
    }

    offAll(handler) {
        for (const [, handlers] of this.#listeners) {
            for (const h of handlers) {
                if (h === handler || h._original === handler) {
                    handlers.delete(h);
                }
            }
        }
        for (const [event, handlers] of this.#listeners) {
            if (handlers.size === 0) {
                this.#listeners.delete(event);
            }
        }
    }

    emit(event, ...args) {
        const handlers = this.#listeners.get(event);
        if (!handlers || handlers.size === 0) return;
        for (const handler of [...handlers]) {
            try {
                handler(...args);
            } catch (err) {
                console.error(`[EventBus] "${event}"`, err);
            }
        }
    }

    has(event) {
        const handlers = this.#listeners.get(event);
        return handlers !== undefined && handlers.size > 0;
    }

    listenerCount(event) {
        const handlers = this.#listeners.get(event);
        return handlers ? handlers.size : 0;
    }

    clear(event) {
        if (event !== undefined) {
            this.#listeners.delete(event);
        } else {
            this.#listeners.clear();
        }
    }

    events() {
        return [...this.#listeners.keys()];
    }
}

export const eventBus = new EventBus(); 
