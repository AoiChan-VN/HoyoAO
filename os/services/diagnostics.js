/**
 * Diagnostics Service (§25, §48)
 *
 * OS observability infrastructure. Collects and exposes information about:
 *   active applications, loaded services, events, errors, boot, memory.
 *
 * This service COLLECTS and EXPOSES data only. It contains NO UI (§48).
 * The monitoring/diagnostics UI is a future Application that consumes
 * this service through the ServiceContext.
 */
export class DiagnosticsService {
  #registry;
  #services;
  #eventBus;
  #logger;
  #storage;
  #config;

  /** @type {Array<object>} circular buffer of recent errors */
  #errors = [];
  #maxErrors = 100;
  #bootTimestamp = Date.now();
  #listeners = new Set();
  #unsubscribers = [];

  constructor(deps = {}) {
    this.#registry = deps.registry || null;
    this.#services = deps.services || null;
    this.#eventBus = deps.eventBus || null;
    this.#logger = deps.logger || null;
    this.#storage = deps.storage || null;
    this.#config = deps.config || null;

    this.#startCollecting();
  }

  /**
   * Aggregate snapshot of the running OS (§48).
   * @returns {object}
   */
  getSnapshot() {
    return {
      boot: {
        timestamp: this.#bootTimestamp,
        uptimeMs: Date.now() - this.#bootTimestamp,
      },
      applications: this.#getApplications(),
      services: this.#getServices(),
      errors: [...this.#errors],
      events: this.#eventBus && typeof this.#eventBus.metrics === 'function'
        ? this.#eventBus.metrics()
        : {},
      memory: this.#getMemory(),
    };
  }

  /** @returns {Array<object>} recent errors (copy) */
  getErrors() {
    return [...this.#errors];
  }

  /** @returns {Array<object>} registered applications + state */
  getApplications() {
    return this.#getApplications();
  }

  /** @returns {Array<string>} registered service names */
  getServices() {
    return this.#getServices();
  }

  /**
   * Subscribe to diagnostics updates (fired when a new error is captured).
   * @param {Function} fn - receives the snapshot
   * @returns {Function} unsubscribe
   */
  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  /** Full cleanup (§74). */
  destroy() {
    for (const unsub of this.#unsubscribers) unsub();
    this.#unsubscribers = [];
    this.#listeners.clear();
    this.#errors = [];
  }

  /* ---- private ---- */

  #startCollecting() {
    if (!this.#eventBus) return;

    // Capture errors/fatals from the log stream (§47 categories).
    const onLogEntry = (entry) => {
      if (entry && (entry.level === 'error' || entry.level === 'fatal')) {
        this.#recordError(entry);
      }
    };
    this.#eventBus.on('log:entry', onLogEntry);
    this.#unsubscribers.push(() => this.#eventBus.off('log:entry', onLogEntry));
  }

  #recordError(entry) {
    this.#errors.push({
      timestamp: entry.timestamp,
      level: entry.level,
      category: entry.category,
      message: entry.message,
    });
    if (this.#errors.length > this.#maxErrors) {
      this.#errors.shift();
    }
    this.#notifyListeners();
  }

  #getApplications() {
    if (!this.#registry) return [];
    return this.#registry.getAll().map((entry) => ({
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      state: entry.state,
    }));
  }

  #getServices() {
    if (!this.#services) return [];
    return this.#services.getAll();
  }

  #getMemory() {
    // performance.memory is Chromium-only; return null elsewhere (§23).
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
      };
    }
    return null;
  }

  #notifyListeners() {
    const snapshot = this.getSnapshot();
    for (const fn of this.#listeners) {
      try {
        fn(snapshot);
      } catch (err) {
        // Avoid recursion into the log stream; use console as last resort.
        console.error('[Diagnostics] subscriber error', err);
      }
    }
  }
} 
