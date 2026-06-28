import { Vector3 } from '../math/vector3.js';
import { Matrix4 } from '../math/matrix4.js';

export class Pool {
    #free         = [];
    #factory;
    #reset;
    #maxSize;
    #acquired     = 0;
    #totalCreated = 0;

    constructor(factory, reset = null, initialSize = 0, maxSize = 256) {
        this.#factory = factory;
        this.#reset   = reset;
        this.#maxSize = maxSize;

        for (let i = 0; i < initialSize; i++) {
            this.#free.push(factory());
            this.#totalCreated++;
        }
    }

    acquire() {
        this.#acquired++;
        if (this.#free.length > 0) {
            return this.#free.pop();
        }
        this.#totalCreated++;
        return this.#factory();
    }

    release(obj) {
        if (obj === null || obj === undefined) return;
        this.#acquired = Math.max(0, this.#acquired - 1);
        if (this.#free.length >= this.#maxSize) return;
        if (this.#reset) this.#reset(obj);
        this.#free.push(obj);
    }

    use(callback) {
        const obj = this.acquire();
        try {
            return callback(obj);
        } finally {
            this.release(obj);
        }
    }

    clear() {
        this.#free.length = 0;
        this.#acquired    = 0;
    }

    stats() {
        return {
            available:    this.#free.length,
            inUse:        this.#acquired,
            total:        this.size,
            totalCreated: this.#totalCreated,
            maxSize:      this.#maxSize,
        };
    }

    get size()         { return this.#free.length + this.#acquired; }
    get available()    { return this.#free.length; }
    get inUse()        { return this.#acquired; }
    get totalCreated() { return this.#totalCreated; }
}

export const vec3Pool = new Pool(
    () => new Vector3(),
    (v) => v.zero(),
    8,
    64
);

export const mat4Pool = new Pool(
    () => new Matrix4(),
    (m) => m.identity(),
    4,
    32
);

export const float32x16Pool = new Pool(
    () => new Float32Array(16),
    (arr) => arr.fill(0),
    4,
    32
); 
