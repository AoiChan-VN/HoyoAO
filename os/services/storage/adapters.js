/**
 * Storage Adapters (§25, §85, §23)
 *
 * Pluggable storage backends behind one async contract. Capability
 * detection (§23) lets the OS adapt to browser / standalone / offline
 * environments without coupling to a single backend (§85). Memory is the
 * guaranteed fallback (§75).
 */

function safeClone(value) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // fall through to JSON clone
    }
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

/** Base contract for all storage backends. */
export class StorageAdapter {
  get name() {
    return 'abstract';
  }
  static isAvailable() {
    return false;
  }
  async get(_key) {
    throw new Error('StorageAdapter.get not implemented');
  }
  async set(_key, _value) {
    throw new Error('StorageAdapter.set not implemented');
  }
  async delete(_key) {
    throw new Error('StorageAdapter.delete not implemented');
  }
  async keys() {
    throw new Error('StorageAdapter.keys not implemented');
  }
  async clear() {
    throw new Error('StorageAdapter.clear not implemented');
  }
  async close() {
    // Optional; backends with connections override this (§74).
  }
}

/** In-memory storage — always available, non-persistent. */
export class MemoryStorageAdapter extends StorageAdapter {
  #store = new Map();

  get name() {
    return 'memory';
  }

  static isAvailable() {
    return true;
  }

  async get(key) {
    const value = this.#store.get(key);
    return value === undefined ? undefined : safeClone(value);
  }

  async set(key, value) {
    this.#store.set(key, safeClone(value));
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

/** localStorage-backed storage (guarded for availability §23). */
export class LocalStorageAdapter extends StorageAdapter {
  #prefix;

  constructor(options = {}) {
    super();
    this.#prefix = options.prefix || 'webos:';
  }

  get name() {
    return 'local';
  }

  static isAvailable() {
    try {
      return typeof localStorage !== 'undefined' && localStorage !== null;
    } catch {
      return false;
    }
  }

  #k(key) {
    return this.#prefix + key;
  }

  async get(key) {
    try {
      const raw = localStorage.getItem(this.#k(key));
      return raw === null ? undefined : JSON.parse(raw);
    } catch {
      return undefined;
    }
  }

  async set(key, value) {
    localStorage.setItem(this.#k(key), JSON.stringify(value));
  }

  async delete(key) {
    localStorage.removeItem(this.#k(key));
  }

  async keys() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.#prefix)) {
        out.push(k.slice(this.#prefix.length));
      }
    }
    return out;
  }

  async clear() {
    const ks = await this.keys();
    for (const k of ks) {
      localStorage.removeItem(this.#k(k));
    }
  }
}

/**
 * IndexedDB-backed storage for larger persistent data (§24 offline-first).
 * Keys are the already-namespaced keys produced by StorageService
 * partitions, so a single object store serves all partitions.
 */
export class IndexedDBAdapter extends StorageAdapter {
  #dbName;
  #storeName;
  #version;
  #db = null;
  #opening = null;

  constructor(databaseName, options = {}) {
    super();
    this.#dbName = databaseName;
    this.#storeName = options.storeName || 'kv';
    this.#version = options.version || 1;
  }

  get name() {
    return 'indexeddb';
  }

  static isAvailable() {
    try {
      return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
      return false;
    }
  }

  async #open() {
    if (this.#db) return this.#db;
    if (this.#opening) return this.#opening;

    this.#opening = new Promise((resolve, reject) => {
      let request;
      try {
        request = indexedDB.open(this.#dbName, this.#version);
      } catch (err) {
        reject(err);
        return;
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.#storeName)) {
          db.createObjectStore(this.#storeName);
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        db.onversionchange = () => {
          db.close();
          this.#db = null;
        };
        resolve(db);
      };

      request.onerror = (event) => {
        reject(event.target.error || new Error('IndexedDB open failed'));
      };

      request.onblocked = () => {
        reject(new Error('IndexedDB open blocked'));
      };
    });

    try {
      this.#db = await this.#opening;
      return this.#db;
    } finally {
      this.#opening = null;
    }
  }

  async #transaction(mode) {
    const db = await this.#open();
    return db.transaction(this.#storeName, mode);
  }

  #toPromise(idbRequest) {
    return new Promise((resolve, reject) => {
      idbRequest.onsuccess = () => resolve(idbRequest.result);
      idbRequest.onerror = () => reject(idbRequest.error);
    });
  }

  async get(key) {
    const tx = await this.#transaction('readonly');
    const store = tx.objectStore(this.#storeName);
    const value = await this.#toPromise(store.get(key));
    return value === undefined ? undefined : value;
  }

  async set(key, value) {
    const tx = await this.#transaction('readwrite');
    const store = tx.objectStore(this.#storeName);
    await this.#toPromise(store.put(value, key));
  }

  async delete(key) {
    const tx = await this.#transaction('readwrite');
    const store = tx.objectStore(this.#storeName);
    await this.#toPromise(store.delete(key));
  }

  async keys() {
    const tx = await this.#transaction('readonly');
    const store = tx.objectStore(this.#storeName);
    const allKeys = await this.#toPromise(store.getAllKeys());
    return Array.from(allKeys);
  }

  async clear() {
    const tx = await this.#transaction('readwrite');
    const store = tx.objectStore(this.#storeName);
    await this.#toPromise(store.clear());
  }

  async close() {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
  }
} 
