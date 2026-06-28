export class Cache {
    #store = new Map();
    #maxEntries;
    #maxSize;
    #totalSize = 0;
    #onEvict;
    #hits = 0;
    #misses = 0;

    constructor({ maxEntries = 128, maxSize = 0, onEvict = null } = {}) {
        this.#maxEntries = maxEntries;
        this.#maxSize    = maxSize;
        this.#onEvict    = onEvict;
    }

    has(key) {
        return this.#store.has(key);
    }

    get(key) {
        const entry = this.#store.get(key);
        if (!entry) {
            this.#misses++;
            return null;
        }
        this.#hits++;
        entry.lastUsed = performance.now();
        return entry.value;
    }

    set(key, value, byteSize = 0) {
        if (this.#store.has(key)) {
            const entry = this.#store.get(key);
            this.#totalSize -= entry.size;
            if (this.#onEvict) this.#onEvict(key, entry.value);
            entry.value    = value;
            entry.size     = byteSize;
            entry.lastUsed = performance.now();
            this.#totalSize += byteSize;
            return;
        }

        while (
            this.#store.size >= this.#maxEntries ||
            (this.#maxSize > 0 && this.#totalSize + byteSize > this.#maxSize)
        ) {
            if (!this.#evictLRU()) break;
        }

        this.#store.set(key, {
            value,
            size:     byteSize,
            lastUsed: performance.now(),
        });
        this.#totalSize += byteSize;
    }

    delete(key) {
        const entry = this.#store.get(key);
        if (!entry) return false;
        this.#totalSize -= entry.size;
        if (this.#onEvict) this.#onEvict(key, entry.value);
        this.#store.delete(key);
        return true;
    }

    #evictLRU() {
        let oldestTime = Infinity;
        let oldestKey  = null;

        for (const [key, entry] of this.#store) {
            if (entry.lastUsed < oldestTime) {
                oldestTime = entry.lastUsed;
                oldestKey  = key;
            }
        }

        if (oldestKey === null) return false;
        this.delete(oldestKey);
        return true;
    }

    clear() {
        for (const key of [...this.#store.keys()]) {
            this.delete(key);
        }
    }

    *keys() {
        yield* this.#store.keys();
    }

    *values() {
        for (const entry of this.#store.values()) {
            yield entry.value;
        }
    }

    *entries() {
        for (const [key, entry] of this.#store) {
            yield [key, entry.value];
        }
    }

    get size()       { return this.#store.size; }
    get totalSize()  { return this.#totalSize; }
    get hits()       { return this.#hits; }
    get misses()     { return this.#misses; }
    get hitRate() {
        const total = this.#hits + this.#misses;
        return total === 0 ? 0 : this.#hits / total;
    }

    stats() {
        return {
            size:       this.#store.size,
            totalSize:  this.#totalSize,
            hits:       this.#hits,
            misses:     this.#misses,
            hitRate:    this.hitRate,
            maxEntries: this.#maxEntries,
            maxSize:    this.#maxSize,
        };
    }
}

export const imageCache = new Cache({
    maxEntries: 64,
    onEvict: (key, bitmap) => {
        if (bitmap && typeof bitmap.close === 'function') {
            bitmap.close();
        }
    },
}); 
