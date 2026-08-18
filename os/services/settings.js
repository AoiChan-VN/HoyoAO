/**
 * Settings Service (§25, §36, §49)
 *
 * The OS settings framework. Responsibilities:
 *   - Manage setting definitions (schema) registered by OS and Applications.
 *   - Manage current values with defaults.
 *   - Validate values before applying.
 *   - Persist user preferences to isolated storage (§34).
 *   - Emit "settings:changed" events (§29).
 *   - Invoke per-definition apply() effects.
 *
 * Applications register their own settings definitions (§49) via the
 * ServiceContext. The OS never hardcodes application settings (§3).
 */
export class SettingsService {
  /** @type {Map<string, object>} key → definition */
  #definitions = new Map();
  /** @type {Map<string, object>} sectionId → section meta */
  #sections = new Map();
  /** @type {Map<string, *>} key → current value */
  #values = new Map();
  #partition = null;
  #eventBus;
  #logger;
  #listeners = new Set();
  #applyContext = null;

  constructor(storage, eventBus, logger) {
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#initPartition(storage);
  }

  /* ---- partition (§34 isolated storage) ---- */

  #initPartition(storage) {
    try {
      this.#partition = storage.getPartition('os:settings', 'local');
    } catch {
      // Fallback when persistent storage is unavailable (§23, §24).
      this.#partition = storage.getPartition('os:settings', 'memory');
    }
  }

  /* ---- context ---- */

  /**
   * Context passed to definition apply() callbacks.
   * @param {object} ctx - typically { theme, localization, notifications, ... }
   */
  setApplyContext(ctx) {
    this.#applyContext = ctx;
  }

  /* ---- registration (§49) ---- */

  /**
   * Register a section for grouping.
   * @param {{id:string, titleKey:string, scope:string, order?:number}} section
   */
  registerSection(section) {
    if (!section || !section.id || !section.titleKey) {
      this.#logger.warn('settings', 'Invalid section registration');
      return;
    }
    this.#sections.set(section.id, {
      order: 0,
      ...section,
    });
  }

  /**
   * Register a setting definition.
   * @param {object} def
   */
  register(def) {
    if (!def || !def.key || !def.section || !def.type) {
      this.#logger.warn('settings', `Invalid setting definition: ${def?.key}`);
      return;
    }
    this.#definitions.set(def.key, { ...def });
    if (!this.#values.has(def.key)) {
      this.#values.set(def.key, def.defaultValue);
    }
  }

  registerMany(defs) {
    if (!Array.isArray(defs)) return;
    for (const d of defs) this.register(d);
  }

  /* ---- read ---- */

  has(key) {
    return this.#definitions.has(key);
  }

  /**
   * Get current value (falls back to definition default).
   * @param {string} key
   */
  get(key) {
    if (this.#values.has(key)) return this.#values.get(key);
    return this.#definitions.get(key)?.defaultValue;
  }

  /* ---- write ---- */

  /**
   * Set a value: validate → persist → emit → apply.
   * @param {string} key
   * @param {*} value
   */
  async set(key, value) {
    const def = this.#definitions.get(key);
    if (!def) {
      this.#logger.warn('settings', `Cannot set unknown setting "${key}"`);
      return;
    }
    if (typeof def.validate === 'function' && !def.validate(value)) {
      this.#logger.warn('settings', `Invalid value for "${key}"`);
      return;
    }

    const previous = this.get(key);
    this.#values.set(key, value);

    await this.#persist(key, value);

    this.#eventBus.emit('settings:changed', { key, value, previous });
    this.#notifyListeners(key, value);

    if (typeof def.apply === 'function') {
      try {
        def.apply(value, this.#applyContext);
      } catch (err) {
        this.#logger.error('settings', `Apply failed for "${key}"`, {
          error: err.message,
        });
      }
    }
  }

  /** Reset a single setting to its default. */
  async reset(key) {
    const def = this.#definitions.get(key);
    if (def) await this.set(key, def.defaultValue);
  }

  /* ---- persistence ---- */

  /** Load persisted values (called during boot). */
  async loadPersisted() {
    if (!this.#partition) return;
    try {
      const keys = await this.#partition.keys();
      for (const k of keys) {
        if (!this.#definitions.has(k)) continue;
        const val = await this.#partition.get(k);
        if (val !== undefined) this.#values.set(k, val);
      }
      this.#logger.info('settings', `Loaded ${keys.length} persisted value(s)`);
    } catch (err) {
      this.#logger.warn('settings', 'Failed to load persisted settings', {
        error: err.message,
      });
    }
  }

  /** Apply effects for all current values (called during boot). */
  async applyAll() {
    for (const [key, def] of this.#definitions) {
      if (typeof def.apply !== 'function') continue;
      try {
        def.apply(this.get(key), this.#applyContext);
      } catch (err) {
        this.#logger.error('settings', `applyAll failed for "${key}"`, {
          error: err.message,
        });
      }
    }
  }

  /* ---- queries for UI ---- */

  getSections() {
    return Array.from(this.#sections.values()).sort((a, b) => a.order - b.order);
  }

  getSectionsForScope(scope) {
    return this.getSections().filter((s) => s.scope === scope);
  }

  getAppSections() {
    return this.getSections().filter((s) => s.scope !== 'os');
  }

  getDefinitionsForSection(sectionId) {
    return Array.from(this.#definitions.values()).filter(
      (d) => d.section === sectionId,
    );
  }

  /* ---- subscription ---- */

  /**
   * Subscribe to value changes.
   * @param {Function} fn - receives (key, value)
   * @returns {Function} unsubscribe
   */
  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  destroy() {
    this.#listeners.clear();
  }

  /* ---- private ---- */

  #persist(key, value) {
    if (!this.#partition) return Promise.resolve();
    return this.#partition.set(key, value);
  }

  #notifyListeners(key, value) {
    for (const fn of this.#listeners) {
      try {
        fn(key, value);
      } catch (err) {
        this.#logger.error('settings', 'Subscriber error', { error: err.message });
      }
    }
  }
} 
