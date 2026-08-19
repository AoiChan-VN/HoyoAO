/**
 * Storage Service (§25, §34, §23, §85)
 *
 * Central storage orchestration. Registers available adapters via
 * capability detection (§23), exposes namespaced partitions (§34), and
 * falls back gracefully when a preferred backend is unavailable (§75).
 *
 * Adapters live in ./storage/adapters.js. The external contract
 * (StorageService exported from this module) is unchanged (§60, §71).
 */

import {
  MemoryStorageAdapter,
  LocalStorageAdapter,
  IndexedDBAdapter,
} from './storage/adapters.js';

const DEFAULT_DB_NAME = 'hoyo-db';
const DEFAULT_LOCAL_PREFIX = 'webos:';

export class StorageService {
  /** @type {Map<string, object>} adapterName → adapter */
  #adapters = new Map();
  #logger;

  constructor(logger, options = {}) {
    this.#logger = logger;
    this.#registerDefaultAdapters(options);
  }

  #registerDefaultAdapters(options) {
    // Memory is always available — the guaranteed fallback (§75).
    this.registerAdapter('memory', new MemoryStorageAdapter());

    if (LocalStorageAdapter.isAvailable()) {
      this.registerAdapter(
        'local',
        new LocalStorageAdapter({ prefix: options.localPrefix || DEFAULT_LOCAL_PREFIX }),
      );
    }

    if (IndexedDBAdapter.isAvailable()) {
      this.registerAdapter(
        'indexeddb',
        new IndexedDBAdapter(options.databaseName || DEFAULT_DB_NAME, {
          storeName: options.storeName || 'kv',
        }),
      );
    }

    this.#logger.info(
      'storage',
      `Storage adapters available: ${this.getAvailableAdapters().join(', ')}`,
    );
  }

  registerAdapter(name, adapter) {
    this.#adapters.set(name, adapter);
  }

  hasAdapter(name) {
    return this.#adapters.has(name);
  }

  getAvailableAdapters() {
    return Array.from(this.#adapters.keys());
  }

  /**
   * Resolve an adapter from a preference (or preference list), falling
   * back to memory when none are available (§75 fail gracefully).
   * @param {string|string[]} preferred
   * @returns {{name:string, adapter:object}}
   */
  resolveAdapter(preferred) {
    const prefs = Array.isArray(preferred) ? preferred : [preferred];
    for (const name of prefs) {
      if (this.#adapters.has(name)) {
        return { name, adapter: this.#adapters.get(name) };
      }
    }
    return { name: 'memory', adapter: this.#adapters.get('memory') };
  }

  /**
   * Get a namespaced partition (§34 isolation). The partition prefixes all
   * keys, so applications cannot silently access another namespace.
   * @param {string} namespace
   * @param {string|string[]} adapterName
   */
  getPartition(namespace, adapterName = 'memory') {
    const resolved = this.resolveAdapter(adapterName);

    const requested = Array.isArray(adapterName) ? adapterName : [adapterName];
    if (!requested.includes(resolved.name)) {
      this.#logger.warn(
        'storage',
        `Adapter "${requested.join('/')}" unavailable for "${namespace}"; fell back to "${resolved.name}"`,
      );
    }

    const adapter = resolved.adapter;
    const prefix = `${namespace}:`;

    return {
      get: (key) => adapter.get(`${prefix}${key}`),
      set: (key, value) => adapter.set(`${prefix}${key}`, value),
      delete: (key) => adapter.delete(`${prefix}${key}`),
      keys: async () => {
        const allKeys = await adapter.keys();
        return allKeys
          .filter((k) => k.startsWith(prefix))
          .map((k) => k.slice(prefix.length));
      },
      clear: async () => {
        const allKeys = await adapter.keys();
        for (const k of allKeys) {
          if (k.startsWith(prefix)) await adapter.delete(k);
        }
      },
    };
  }

  /** Close backend connections (§74). */
  async dispose() {
    for (const adapter of this.#adapters.values()) {
      if (typeof adapter.close === 'function') {
        try {
          await adapter.close();
        } catch {
          // best-effort close during teardown
        }
      }
    }
    this.#adapters.clear();
  }
}
