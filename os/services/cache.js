/**
 * Cache Service (§25, §94)
 *
 * In-memory cache with guaranteed LRU eviction per partition (§94 memory
 * budget). Operations are synchronous; callers may still `await` them
 * safely. FIX B4: eviction is enforced on every set() that exceeds the
 * partition budget, so the cache cannot grow unbounded.
 */
export class CacheService {
  /** @type {Map<string, {entries: Map}>} namespace → partition */
  #partitions = new Map();
  #eventBus;
  #logger;
  #maxEntries;

  constructor(eventBus, logger, options = {}) {
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#maxEntries = options.maxEntries || 200;
  }

  /**
   * Get a namespaced cache partition (§34 isolation).
   * Uses Map insertion order for LRU tracking.
   * @param {string} namespace
   */
  getPartition(namespace) {
    if (!this.#partitions.has(namespace)) {
      this.#partitions.set(namespace, { entries: new Map() });
    }
    const partition = this.#partitions.get(namespace);
    const service = this;

    return {
      get(key) {
        if (!partition.entries.has(key)) return undefined;
        // LRU: move accessed entry to the most-recent position.
        const value = partition.entries.get(key);
        partition.entries.delete(key);
        partition.entries.set(key, value);
        return value;
      },

      set(key, value) {
        if (partition.entries.has(key)) {
          partition.entries.delete(key);
        }
        partition.entries.set(key, value);

        // FIX B4: enforce the budget with LRU eviction.
        while (partition.entries.size > service.#maxEntries) {
          const oldestKey = partition.entries.keys().next().value;
          partition.entries.delete(oldestKey);
          service.#eventBus.emit('cache:evicted', { namespace, key: oldestKey });
        }
      },

      has(key) {
        return partition.entries.has(key);
      },

      delete(key) {
        return partition.entries.delete(key);
      },

      clear() {
        partition.entries.clear();
      },

      stats() {
        return { size: partition.entries.size, maxEntries: service.#maxEntries };
      },
    };
  }

  /** Observability (§48). */
  getGlobalStats() {
    const partitions = {};
    let totalSize = 0;
    for (const [ns, p] of this.#partitions) {
      partitions[ns] = p.entries.size;
      totalSize += p.entries.size;
    }
    return {
      totalSize,
      maxEntriesPerPartition: this.#maxEntries,
      partitions,
    };
  }

  dispose() {
    this.#partitions.clear();
  }
}
