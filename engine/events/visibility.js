import { eventBus } from './event-bus.js';

class VisibilityHandler {
    #onChange = null;

    init() {
        this.#onChange = () => this.#handle();
        document.addEventListener('visibilitychange', this.#onChange);
    }

    #handle() {
        const hidden = document.hidden;
        const state  = document.visibilityState;

        if (hidden) {
            eventBus.emit('visibility:hidden', { state });
        } else {
            eventBus.emit('visibility:visible', { state });
        }

        eventBus.emit('visibility:change', { hidden, state });
    }

    get hidden()  { return document.hidden; }
    get visible() { return !document.hidden; }
    get state()   { return document.visibilityState; }

    destroy() {
        if (this.#onChange) {
            document.removeEventListener('visibilitychange', this.#onChange);
            this.#onChange = null;
        }
    }
}

export const visibilityHandler = new VisibilityHandler();
