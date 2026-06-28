import { eventBus } from './event-bus.js';

const MAX_DPR = 3;

class ResizeHandler {
    #width = 0;
    #height = 0;
    #dpr = 1;
    #pending = false;
    #rafId = null;
    #onResize = null;
    #onOrientation = null;
    #usesModernOrientation = false;

    init() {
        this.#width = window.innerWidth;
        this.#height = window.innerHeight;
        this.#dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

        this.#onResize = () => this.#schedule();
        this.#onOrientation = () => this.#schedule();

        window.addEventListener('resize', this.#onResize, { passive: true });

        this.#usesModernOrientation = Boolean(
            window.screen?.orientation?.addEventListener
        );

        if (this.#usesModernOrientation) {
            window.screen.orientation.addEventListener('change', this.#onOrientation);
        } else {
            window.addEventListener('orientationchange', this.#onOrientation, { passive: true });
        }
    }

    #schedule() {
        if (this.#pending) return;
        this.#pending = true;
        this.#rafId = requestAnimationFrame(() => {
            this.#pending = false;
            this.#rafId = null;
            this.#flush();
        });
    }

    #flush() {
        const w   = window.innerWidth;
        const h   = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

        if (w === this.#width && h === this.#height && dpr === this.#dpr) return;

        this.#width  = w;
        this.#height = h;
        this.#dpr    = dpr;

        eventBus.emit('resize', this.getState());
    }

    getState() {
        return {
            width:       this.#width,
            height:      this.#height,
            dpr:         this.#dpr,
            aspect:      this.#width / this.#height,
            pixelWidth:  Math.round(this.#width  * this.#dpr),
            pixelHeight: Math.round(this.#height * this.#dpr),
        };
    }

    get width()       { return this.#width; }
    get height()      { return this.#height; }
    get dpr()         { return this.#dpr; }
    get aspect()      { return this.#width / this.#height; }
    get pixelWidth()  { return Math.round(this.#width  * this.#dpr); }
    get pixelHeight() { return Math.round(this.#height * this.#dpr); }

    destroy() {
        if (this.#rafId !== null) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }

        window.removeEventListener('resize', this.#onResize);

        if (this.#usesModernOrientation) {
            window.screen.orientation.removeEventListener('change', this.#onOrientation);
        } else {
            window.removeEventListener('orientationchange', this.#onOrientation);
        }

        this.#onResize      = null;
        this.#onOrientation = null;
        this.#pending       = false;
    }
}

export const resizeHandler = new ResizeHandler(); 
