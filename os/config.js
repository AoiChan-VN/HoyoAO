/**
 * Configuration Service (§36)
 *
 * Centralised, schema-aware configuration access.
 * Separates OS config from Application config from User preferences.
 */

export class ConfigService {
  #data = {};
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Load configuration from a JSON file.
   * @param {string} url
   */
  async load(url) {
    const res = await fetch(url);
    if (!res.ok) {
      const err = new Error(`Config load failed: ${url} → HTTP ${res.status}`);
      this.#logger.error('config', err.message);
      throw err;
    }
    this.#data = await res.json();
    this.#logger.debug('config', 'Configuration loaded', { url });
  }

  /**
   * Dot-path getter.
   * @param {string} path  e.g. "os.name"
   * @param {*} fallback
   */
  get(path, fallback = undefined) {
    const keys = path.split('.');
    let node = this.#data;
    for (const key of keys) {
      if (node === null || node === undefined || typeof node !== 'object') {
        return fallback;
      }
      node = node[key];
    }
    return node === undefined ? fallback : node;
  }

  /**
   * Dot-path setter (runtime config / user preferences).
   * @param {string} path
   * @param {*} value
   */
  set(path, value) {
    const keys = path.split('.');
    let node = this.#data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in node) || typeof node[keys[i]] !== 'object') {
        node[keys[i]] = {};
      }
      node = node[keys[i]];
    }
    node[keys[keys.length - 1]] = value;
  }

  /** Shallow copy of the full config tree. */
  getAll() {
    return structuredClone(this.#data);
  }
} 
