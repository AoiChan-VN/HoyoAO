/**
 * Storage Service (§34, §85)
 * 
 * Provides partitioned, isolated storage.
 * Decouples physical storage (Memory, LocalStorage) from logical operations.
 * Applications must use partitions to ensure storage isolation.
 */

/* ------------------------------------------------------------------ */
/*  ADAPTERS                                                           */
/* ------------------------------------------------------------------ */

class StorageAdapter {
  async get(key) { throw new Error('Not implemented'); }
  async set(key, value) { throw new Error('Not implemented'); }
  async delete(key) { throw new Error('Not implemented'); }
  async keys() { throw new Error('Not implemented'); }
  async clear() { throw new Error('Not implemented'); }
}

export class MemoryStorageAdapter extends StorageAdapter {
  #store = new Map();

  async get(key) { 
    const val = this.#store.get(key);
    return val !== undefined ? structuredClone(val) : undefined;
  }
  
  async set(key, value) { 
    this.#store.set(key, structuredClone(value)); 
  }
  
  async delete(key) { 
    this.#store.delete(key); 
  }
  
  async keys() { 
    return Array.from(this.#store.keys()); 
  }
  
  async clear() { 
    this.#store.clear(); 
  }
}

export class LocalStorageAdapter extends StorageAdapter {
  async get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : undefined;
    } catch { return undefined; }
  }

  async set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async delete(key) {
    localStorage.removeItem(key);
  }

  async keys() {
    return Object.keys(localStorage);
  }

  async clear() {
    localStorage.clear();
  }
}

/* ------------------------------------------------------------------ */
/*  STORAGE SERVICE                                                    */
/* ------------------------------------------------------------------ */

export class StorageService {
  /** @type {Map<string, StorageAdapter>} */
  #adapters = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
    // Register default adapters
    this.registerAdapter('memory', new MemoryStorageAdapter());
    
    // Only register LocalStorage if available (Cross-platform §23)
    if (typeof localStorage !== 'undefined') {
      this.registerAdapter('local', new LocalStorageAdapter());
    }
  }

  registerAdapter(name, adapter) {
    this.#adapters.set(name, adapter);
  }

  /**
   * Get an isolated storage partition for a specific namespace.
   * @param {string} namespace e.g. "os:config", "app:dashboard:metrics"
   * @param {string} adapterName e.g. "memory", "local"
   * @returns {object} Scoped storage interface
   */
  getPartition(namespace, adapterName = 'memory') {
    const adapter = this.#adapters.get(adapterName);
    if (!adapter) {
      throw new Error(`Storage adapter "${adapterName}" not registered.`);
    }

    const prefix = `${namespace}:`;

    return {
      get: async (key) => adapter.get(`${prefix}${key}`),
      set: async (key, value) => adapter.set(`${prefix}${key}`, value),
      delete: async (key) => adapter.delete(`${prefix}${key}`),
      
      keys: async () => {
        const allKeys = await adapter.keys();
        return allKeys
          .filter(k => k.startsWith(prefix))
          .map(k => k.slice(prefix.length));
      },
      
      clear: async () => {
        const allKeys = await adapter.keys();
        const targetKeys = allKeys.filter(k => k.startsWith(prefix));
        for (const k of targetKeys) {
          await adapter.delete(k);
        }
      }
    };
  }
} 
