import { eventBus } from '../events/event-bus.js';

const VALID_STATES   = new Set(['loading', 'ready', 'error', 'paused']);
const VALID_QUALITY  = new Set(['low', 'medium', 'high']);

const TRANSITIONS = {
    loading: new Set(['ready', 'error']),
    ready:   new Set(['paused', 'error', 'loading']),
    paused:  new Set(['ready', 'error']),
    error:   new Set(['loading']),
};

class State {
    #current     = 'loading';
    #quality     = 'high';
    #fullscreen  = false;
    #hudVisible  = false;

    getState()   { return this.#current; }
    getQuality() { return this.#quality; }

    is(state) {
        return this.#current === state;
    }

    canTransition(next) {
        const allowed = TRANSITIONS[this.#current];
        return allowed ? allowed.has(next) : false;
    }

    transition(next, payload = {}) {
        if (!VALID_STATES.has(next)) {
            console.error(`[State] Invalid state: "${next}"`);
            return false;
        }

        if (!this.canTransition(next)) {
            console.error(`[State] Forbidden transition: "${this.#current}" → "${next}"`);
            return false;
        }

        const prev = this.#current;
        this.#current = next;

        document.documentElement.setAttribute('data-state', next);

        eventBus.emit('state:change', { prev, next, ...payload });
        eventBus.emit(`state:${next}`, { prev, ...payload });

        return true;
    }

    setQuality(level) {
        if (!VALID_QUALITY.has(level)) {
            console.error(`[State] Invalid quality: "${level}"`);
            return false;
        }

        if (this.#quality === level) return true;

        const prev = this.#quality;
        this.#quality = level;

        document.documentElement.setAttribute('data-quality', level);
        eventBus.emit('state:quality', { prev, next: level });

        return true;
    }

    setFullscreen(active) {
        if (this.#fullscreen === active) return;
        this.#fullscreen = active;
        document.documentElement.setAttribute('data-fullscreen', String(active));
        eventBus.emit('state:fullscreen', { active });
    }

    setHUD(visible) {
        if (this.#hudVisible === visible) return;
        this.#hudVisible = visible;
        const hud = document.getElementById('performance-hud');
        if (hud) hud.hidden = !visible;
        eventBus.emit('state:hud', { visible });
    }

    get current()    { return this.#current; }
    get quality()    { return this.#quality; }
    get fullscreen() { return this.#fullscreen; }
    get hudVisible() { return this.#hudVisible; }
    get isLoading()  { return this.#current === 'loading'; }
    get isReady()    { return this.#current === 'ready'; }
    get isError()    { return this.#current === 'error'; }
    get isPaused()   { return this.#current === 'paused'; }
}

export const engineState = new State(); 
