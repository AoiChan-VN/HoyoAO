/**
 * Cache Service (§25, §28, §34, §41, §94)
 *
 * In-memory cache with:
 *   - namespace partitions (§34 isolation)
 *   - TTL (lazy expiry — no polling §94)
 *   - LRU-style eviction with a budget (maxEntries §94)
 *   - hit/miss/eviction metrics (§48 observability)
 *
 * This is CACHED STATE (§28) — never a source of truth (§11).
 * Values are stored by reference for performance; consumers must not
 * mutate cached values after set. DOM nodes (e.g. icon templates) are
 * intentionally supported, so values are NOT deep-cloned.
 */

const GLOBAL_STATS_KEYS = ['hits', 'misses', 'sets', 'evictions'];

export class CacheService {
  /** @type {Map<string, object>} namespace → partition state */
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
   * Get a namespace-scoped cache partition (§34).
   * @param {string} namespace
   * @param {{maxEntries?:number}} [options]
   */
  getPartition(namespace, options = {}) {
    if (!namespace || typeof namespace !== 'string') {
      throw new Error('CacheService.getPartition: namespace is required');
    }

    const state = this.#ensurePartition(namespace, options);

    return {
      get: (key) => this.#get(state, namespace, key),
      set: (key, value, opts) => this.#set(state, namespace, key, value, opts),
      has: (key) => this.#has(state, namespace, key),
      delete: (key) => this.#delete(state, namespace, key),
      clear: () => this.#clear(state, namespace),
      stats: () => this.#partitionStats(state),
    };
  }

  /**
   * Aggregate stats across all partitions (§48).
   * @returns {object}
   */
  getGlobalStats() {
    const totals = { hits: 0, misses: 0, sets: 0, evictions: 0, entries: 0, partitions: 0 };

    for (const state of this.#partitions.values()) {
      totals.partitions += 1;
      totals.entries += state.entries.size;
      for (const k of GLOBAL_STATS_KEYS) {
        totals[k] += state[k];
      }
    }

    totals.hitRatio = totals.hits + totals.misses > 0
      ? Number((totals.hits / (totals.hits + totals.misses)).toFixed(3))
      : 0;

    return totals;
  }

  /** Release all cached data (§74). No timers exist (lazy expiry). */
  destroy() {
    for (const [ns, state] of this.#partitions) {
      state.entries.clear();
      this.#eventBus.emit('cache:clear', { namespace: ns });
    }
    this.#partitions.clear();
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE                                                            */
  /* ------------------------------------------------------------------ */

  #ensurePartition(namespace, options) {
    if (!this.#partitions.has(namespace)) {
      this.#partitions.set(namespace, {
        entries: new Map(),
        maxEntries: options.maxEntries || this.#maxEntries,
        hits: 0,
        misses: 0,
        sets: 0,
        evictions: 0,
      });
    }
    return this.#partitions.get(namespace);
  }

  #get(state, namespace, key) {
    const entry = state.entries.get(key);

    if (!entry) {
      state.misses += 1;
      return undefined;
    }

    // Lazy TTL check (§94 — no background sweep).
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      state.entries.delete(key);
      state.misses += 1;
      return undefined;
    }

    entry.lastAccessedAt = Date.now();
    state.hits += 1;
    return entry.value;
  }

  #set(state, namespace, key, value, opts = {}) {
    const now = Date.now();
    const ttl = typeof opts.ttl === 'number' && opts.ttl > 0 ? opts.ttl : null;

    // Evict before inserting if at budget (§94).
    if (!state.entries.has(key) && state.entries.size >= state.maxEntries) {
      this.#evictLeastRecentlyUsed(state, namespace);
    }

    state.entries.set(key, {
      value,
      createdAt: now,
      expiresAt: ttl === null ? null : now + ttl,
      lastAccessedAt: now,
    });

    state.sets += 1;
    this.#eventBus.emit('cache:set', { namespace, key });
  }

  #has(state, namespace, key) {
    // Route through #get so TTL is honoured consistently.
    return this.#get(state, namespace, key) !== undefined;
  }

  #delete(state, namespace, key) {
    const existed = state.entries.delete(key);
    return existed;
  }

  #clear(state, namespace) {
    state.entries.clear();
    this.#eventBus.emit('cache:clear', { namespace });
  }

  #evictLeastRecentlyUsed(state, namespace) {
    let oldestKey = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of state.entries) {
      if (entry.lastAccessedAt < oldestAccess) {
        oldestAccess = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      state.entries.delete(oldestKey);
      state.evictions += 1;
      this.#eventBus.emit('cache:evict', { namespace, key: oldestKey });
      this.#logger.debug('cache', `Evicted "${oldestKey}" from "${namespace}"`);
    }
  }

  #partitionStats(state) {
    return {
      entries: state.entries.size,
      maxEntries: state.maxEntries,
      hits: state.hits,
      misses: state.misses,
      sets: state.sets,
      evictions: state.evictions,
    };
  }
} 
