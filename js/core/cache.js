/* ==========================================================================
   js/core/cache.js
   Native Browser Experience Engine
   ========================================================================== */

import { CONFIG } from './config.js';

/* ==========================================================================
   LRU CACHE
   ========================================================================== */

class LRUCache {

    #store;
    #limit;

    constructor(limit = 100) {

        this.#store = new Map();
        this.#limit = limit;

    }

    get(key) {

        if (!this.#store.has(key)) {
            return null;
        }

        const value =
            this.#store.get(key);

        this.#store.delete(key);

        this.#store.set(
            key,
            value
        );

        return value;

    }

    set(key, value) {

        if (this.#store.has(key)) {

            this.#store.delete(key);

        }

        this.#store.set(
            key,
            value
        );

        if (
            this.#store.size >
            this.#limit
        ) {

            const oldestKey =
                this.#store.keys()
                .next()
                .value;

            this.#store.delete(
                oldestKey
            );

        }

        return value;

    }

    has(key) {

        return this.#store.has(
            key
        );

    }

    delete(key) {

        return this.#store.delete(
            key
        );

    }

    clear() {

        this.#store.clear();

    }

    keys() {

        return [
            ...this.#store.keys()
        ];

    }

    values() {

        return [
            ...this.#store.values()
        ];

    }

    entries() {

        return [
            ...this.#store.entries()
        ];

    }

    get size() {

        return this.#store.size;

    }

}

/* ==========================================================================
   CACHE INSTANCES
   ========================================================================== */

const jsonCache =
    new LRUCache(
        CONFIG.CACHE.MAX_JSON_CACHE
    );

const textCache =
    new LRUCache(
        CONFIG.CACHE.MAX_TEXT_CACHE
    );

const binaryCache =
    new LRUCache(
        CONFIG.CACHE.MAX_BINARY_CACHE
    );

/* ==========================================================================
   FETCH HELPERS
   ========================================================================== */

async function fetchOrThrow(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                cache: 'force-cache',
                ...options
            }
        );

    if (!response.ok) {

        throw new Error(
            `Failed to load "${url}" (${response.status})`
        );

    }

    return response;

}

/* ==========================================================================
   JSON CACHE
   ========================================================================== */

export async function loadJSON(url) {

    const cached =
        jsonCache.get(url);

    if (cached) {
        return cached;
    }

    const response =
        await fetchOrThrow(url);

    const data =
        await response.json();

    jsonCache.set(
        url,
        data
    );

    return data;

}

/* ==========================================================================
   TEXT CACHE
   ========================================================================== */

export async function loadText(url) {

    const cached =
        textCache.get(url);

    if (cached !== null) {
        return cached;
    }

    const response =
        await fetchOrThrow(url);

    const text =
        await response.text();

    textCache.set(
        url,
        text
    );

    return text;

}

/* ==========================================================================
   BLOB CACHE
   ========================================================================== */

export async function loadBlob(url) {

    const cached =
        binaryCache.get(url);

    if (cached) {
        return cached;
    }

    const response =
        await fetchOrThrow(url);

    const blob =
        await response.blob();

    binaryCache.set(
        url,
        blob
    );

    return blob;

}

/* ==========================================================================
   OBJECT URL CACHE
   ========================================================================== */

const objectURLMap =
    new Map();

export async function loadObjectURL(
    url
) {

    if (
        objectURLMap.has(url)
    ) {

        return objectURLMap.get(
            url
        );

    }

    const blob =
        await loadBlob(url);

    const objectURL =
        URL.createObjectURL(
            blob
        );

    objectURLMap.set(
        url,
        objectURL
    );

    return objectURL;

}

/* ==========================================================================
   IMAGE CACHE
   ========================================================================== */

export async function loadImage(
    url
) {

    const cacheKey =
        `image:${url}`;

    const cached =
        binaryCache.get(
            cacheKey
        );

    if (cached) {
        return cached;
    }

    const image =
        await new Promise(
            (
                resolve,
                reject
            ) => {

                const img =
                    new Image();

                img.decoding =
                    'async';

                img.loading =
                    'eager';

                img.onload =
                    () =>
                        resolve(img);

                img.onerror =
                    () =>
                        reject(
                            new Error(
                                `Image load failed: ${url}`
                            )
                        );

                img.src = url;

            }
        );

    binaryCache.set(
        cacheKey,
        image
    );

    return image;

}

/* ==========================================================================
   PRELOAD GROUP
   ========================================================================== */

export async function preload(
    urls = []
) {

    const tasks =
        urls.map(
            (url) =>
                loadBlob(url)
        );

    return Promise.allSettled(
        tasks
    );

}

/* ==========================================================================
   MEMORY CLEANUP
   ========================================================================== */

export function disposeObjectURLs() {

    for (
        const url of
        objectURLMap.values()
    ) {

        URL.revokeObjectURL(
            url
        );

    }

    objectURLMap.clear();

}

export function clearAllCaches() {

    jsonCache.clear();
    textCache.clear();
    binaryCache.clear();

    disposeObjectURLs();

}

/* ==========================================================================
   CACHE STATS
   ========================================================================== */

export function getCacheStats() {

    return {

        json:
            jsonCache.size,

        text:
            textCache.size,

        binary:
            binaryCache.size,

        objectURLs:
            objectURLMap.size

    };

} 
