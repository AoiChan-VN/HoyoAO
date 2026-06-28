import { Cache }         from './cache.js';
import { memoryManager } from './memory.js';

const MAX_CONCURRENT = 6;

const _imageCache = new Cache({
    maxEntries: 64,
    onEvict: (key, bitmap) => {
        bitmap?.close?.();
        memoryManager.free(key);
    },
});

export { _imageCache as imageCache };

class ImageLoader {
    #queue     = [];
    #active    = 0;
    #inflight  = new Map();
    #maxConcurrent;

    constructor(maxConcurrent = MAX_CONCURRENT) {
        this.#maxConcurrent = maxConcurrent;
    }

    load(url, signal) {
        const cached = _imageCache.get(url);
        if (cached) return Promise.resolve(cached);

        if (this.#inflight.has(url)) {
            return this.#inflight.get(url);
        }

        const promise = new Promise((resolve, reject) => {
            this.#queue.push({ url, resolve, reject, signal: signal ?? null });
            this.#pump();
        });

        this.#inflight.set(url, promise);
        promise.finally(() => this.#inflight.delete(url));

        return promise;
    }

    loadMany(urls, signal) {
        return Promise.all(urls.map(url => this.load(url, signal)));
    }

    #pump() {
        while (this.#active < this.#maxConcurrent && this.#queue.length > 0) {
            const job = this.#queue.shift();
            this.#active++;
            this.#execute(job).finally(() => {
                this.#active--;
                this.#pump();
            });
        }
    }

    async #execute({ url, resolve, reject, signal }) {
        try {
            if (signal?.aborted) {
                reject(new DOMException('Load aborted', 'AbortError'));
                return;
            }

            const cached = _imageCache.get(url);
            if (cached) {
                resolve(cached);
                return;
            }

            const response = await fetch(url, signal ? { signal } : undefined);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} loading: ${url}`);
            }

            const blob   = await response.blob();
            const bitmap = await createImageBitmap(blob, {
                premultiplyAlpha:    'none',
                colorSpaceConversion: 'none',
            });

            const byteSize = bitmap.width * bitmap.height * 4;
            _imageCache.set(url, bitmap, byteSize);
            memoryManager.allocate(url, byteSize, 'images');

            resolve(bitmap);
        } catch (err) {
            reject(err);
        }
    }

    release(url) {
        _imageCache.delete(url);
    }

    isLoaded(url) {
        return _imageCache.has(url);
    }

    get queueLength()   { return this.#queue.length; }
    get activeCount()   { return this.#active; }
    get inflightCount() { return this.#inflight.size; }
}

export const imageLoader = new ImageLoader(); 
