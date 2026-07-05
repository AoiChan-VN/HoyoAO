import { clock }    from './timing.js';
import { eventBus } from '../events/event-bus.js';

class Loop {
    #rafId         = null;
    #running       = false;
    #paused        = false;
    #callbacks     = [];
    #frame         = null;
    #onHidden      = null;
    #onVisible     = null;

    start() {
        if (this.#running) return;
        this.#running = true;
        this.#paused  = false;

        clock.start();

        this.#onHidden  = () => this.#pause();
        this.#onVisible = () => this.#resume();

        eventBus.on('visibility:hidden',  this.#onHidden);
        eventBus.on('visibility:visible', this.#onVisible);

        this.#frame = () => this.#tick();
        this.#rafId = requestAnimationFrame(this.#frame);

        eventBus.emit('loop:started');
    }

    stop() {
        if (!this.#running) return;
        this.#running = false;
        this.#paused  = false;

        if (this.#rafId !== null) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }

        clock.stop();

        if (this.#onHidden) {
            eventBus.off('visibility:hidden', this.#onHidden);
            this.#onHidden = null;
        }
        if (this.#onVisible) {
            eventBus.off('visibility:visible', this.#onVisible);
            this.#onVisible = null;
        }

        eventBus.emit('loop:stopped');
    }

    #pause() {
        if (!this.#running || this.#paused) return;
        this.#paused = true;

        if (this.#rafId !== null) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }

        clock.stop();
        eventBus.emit('loop:paused');
    }

    #resume() {
        if (!this.#running || !this.#paused) return;
        this.#paused = false;

        clock.start();
        this.#rafId = requestAnimationFrame(this.#frame);
        eventBus.emit('loop:resumed');
    }

    #tick() {
        if (!this.#running || this.#paused) return;

        this.#rafId = requestAnimationFrame(this.#frame);

        const dt      = clock.tick();
        const elapsed = clock.elapsedTime;

        for (const cb of this.#callbacks) {
            try {
                cb(dt, elapsed);
            } catch (err) {
                console.error('[Loop]', err);
            }
        }
    }

    register(callback) {
        if (!this.#callbacks.includes(callback)) {
            this.#callbacks.push(callback);
        }
        return () => this.unregister(callback);
    }

    unregister(callback) {
        const idx = this.#callbacks.indexOf(callback);
        if (idx !== -1) this.#callbacks.splice(idx, 1);
    }

    get running()       { return this.#running; }
    get paused()        { return this.#paused; }
    get callbackCount() { return this.#callbacks.length; }
}

export const loop = new Loop(); 
