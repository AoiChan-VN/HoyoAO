import { imageLoader } from './image-loader.js';
import { eventBus }    from '../events/event-bus.js';

class Preloader {
    #controller = null;
    #loading    = false;
    #loaded     = 0;
    #total      = 0;
    #errors     = [];

    async load(tasks, { onProgress, signal: externalSignal } = {}) {
        this.cancel();

        this.#controller = new AbortController();
        const signal = this.#controller.signal;

        if (externalSignal) {
            externalSignal.addEventListener(
                'abort',
                () => this.#controller?.abort(),
                { once: true }
            );
        }

        const sorted = [...tasks].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        this.#loading = true;
        this.#loaded  = 0;
        this.#total   = sorted.length;
        this.#errors  = [];

        eventBus.emit('preload:start', { total: this.#total });

        await Promise.allSettled(sorted.map(async (task) => {
            try {
                await imageLoader.load(task.url, signal);
            } catch (err) {
                if (err.name === 'AbortError') return;
                this.#errors.push({
                    url:   task.url,
                    error: err.message ?? String(err),
                });
            }

            this.#loaded++;
            const progress = this.#loaded / this.#total;

            eventBus.emit('preload:progress', {
                loaded:   this.#loaded,
                total:    this.#total,
                progress,
            });

            if (onProgress) onProgress(progress, this.#loaded, this.#total);
        }));

        this.#loading = false;

        if (signal.aborted) {
            eventBus.emit('preload:abort', {
                loaded: this.#loaded,
                total:  this.#total,
            });
            return {
                success: false,
                aborted: true,
                loaded:  this.#loaded,
                total:   this.#total,
                errors:  this.#errors,
            };
        }

        eventBus.emit('preload:complete', {
            loaded: this.#loaded,
            total:  this.#total,
            errors: this.#errors,
        });

        return {
            success: this.#errors.length === 0,
            aborted: false,
            loaded:  this.#loaded,
            total:   this.#total,
            errors:  this.#errors,
        };
    }

    cancel() {
        if (this.#controller) {
            this.#controller.abort();
            this.#controller = null;
        }
        this.#loading = false;
    }

    get isLoading()  { return this.#loading; }
    get progress()   { return this.#total > 0 ? this.#loaded / this.#total : 0; }
    get loaded()     { return this.#loaded; }
    get total()      { return this.#total; }
    get errorCount() { return this.#errors.length; }
}

export const preloader = new Preloader(); 
