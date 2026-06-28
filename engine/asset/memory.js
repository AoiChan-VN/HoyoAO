import { eventBus } from '../events/event-bus.js';

const DEFAULT_BUDGET = {
    images:   64  * 1024 * 1024,
    textures: 256 * 1024 * 1024,
    geometry: 32  * 1024 * 1024,
    misc:     16  * 1024 * 1024,
};

const PRESSURE_THRESHOLD = 0.85;
const RELIEF_THRESHOLD   = 0.70;

class MemoryManager {
    #allocations   = new Map();
    #usage         = new Map();
    #budget        = {};
    #pressureState = new Map();

    constructor(budget = {}) {
        this.#budget = { ...DEFAULT_BUDGET, ...budget };
        for (const category of Object.keys(this.#budget)) {
            this.#usage.set(category, 0);
            this.#pressureState.set(category, false);
        }
    }

    allocate(key, bytes, category = 'misc') {
        if (this.#allocations.has(key)) {
            this.free(key);
        }
        this.#allocations.set(key, { bytes, category });
        if (!this.#usage.has(category)) {
            this.#usage.set(category, 0);
            this.#pressureState.set(category, false);
        }
        this.#usage.set(category, this.#usage.get(category) + bytes);
        this.#checkPressure(category);
    }

    free(key) {
        const alloc = this.#allocations.get(key);
        if (!alloc) return;
        const prev = this.#usage.get(alloc.category) || 0;
        this.#usage.set(alloc.category, Math.max(0, prev - alloc.bytes));
        this.#allocations.delete(key);
        this.#checkPressure(alloc.category);
    }

    #checkPressure(category) {
        const budget = this.#budget[category];
        if (!budget) return;
        const usage = this.#usage.get(category) || 0;
        const ratio = usage / budget;
        const inPressure    = this.#pressureState.get(category) || false;
        const nowInPressure = ratio >= PRESSURE_THRESHOLD;
        const nowRelieved   = ratio <  RELIEF_THRESHOLD;

        if (nowInPressure && !inPressure) {
            this.#pressureState.set(category, true);
            eventBus.emit('memory:pressure', { category, usage, budget, ratio });
        } else if (nowRelieved && inPressure) {
            this.#pressureState.set(category, false);
            eventBus.emit('memory:relief', { category, usage, budget, ratio });
        }
    }

    getUsage(category) {
        if (category !== undefined) {
            return this.#usage.get(category) || 0;
        }
        let total = 0;
        for (const bytes of this.#usage.values()) total += bytes;
        return total;
    }

    getBudget(category) {
        if (category !== undefined) {
            return this.#budget[category] || 0;
        }
        return Object.values(this.#budget).reduce((a, b) => a + b, 0);
    }

    isUnderPressure(category) {
        if (category !== undefined) {
            return this.#pressureState.get(category) || false;
        }
        for (const state of this.#pressureState.values()) {
            if (state) return true;
        }
        return false;
    }

    allocationCount(category) {
        if (category === undefined) return this.#allocations.size;
        let count = 0;
        for (const alloc of this.#allocations.values()) {
            if (alloc.category === category) count++;
        }
        return count;
    }

    getStats() {
        const categories = {};
        for (const [category, budget] of Object.entries(this.#budget)) {
            const usage = this.#usage.get(category) || 0;
            categories[category] = {
                usage,
                budget,
                ratio:     budget > 0 ? usage / budget : 0,
                remaining: Math.max(0, budget - usage),
                pressure:  this.#pressureState.get(category) || false,
            };
        }

        const stats = {
            totalUsage:       this.getUsage(),
            totalBudget:      this.getBudget(),
            allocationCount:  this.#allocations.size,
            categories,
        };

        if (performance.memory) {
            stats.heap = {
                used:  performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                ratio: performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit,
            };
        }

        return stats;
    }

    clear(category) {
        if (category !== undefined) {
            for (const [key, alloc] of [...this.#allocations]) {
                if (alloc.category === category) this.free(key);
            }
        } else {
            for (const key of [...this.#allocations.keys()]) this.free(key);
        }
    }
}

export const memoryManager = new MemoryManager(); 
