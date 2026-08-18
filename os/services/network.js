/**
 * Network Service (§25, §24)
 *
 * Observes connectivity status and emits network events (§29).
 * This service does NOT perform HTTP requests — backend communication
 * belongs to application adapters/providers (§55, §56, §86).
 *
 * Uses browser-native events — never polls (§94).
 * Capability-detected for cross-platform safety (§23).
 */
export class NetworkService {
  #online = true;
  #eventBus;
  #logger;
  #listeners = new Set();
  #onOnline = null;
  #onOffline = null;

  constructor(eventBus, logger) {
    this.#eventBus = eventBus;
    this.#logger = logger;
  }

  /**
   * Detect initial state and subscribe to browser connectivity events.
   */
  init() {
    // Capability detection (§23).
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      this.#online = navigator.onLine;
    }

    if (typeof window !== 'undefined') {
      this.#onOnline = () => this.#setState(true);
      this.#onOffline = () => this.#setState(false);
      window.addEventListener('online', this.#onOnline);
      window.addEventListener('offline', this.#onOffline);
    }

    this.#logger.info('network', `Network service initialised (${this.#online ? 'online' : 'offline'})`);
  }

  /** @returns {boolean} current connectivity */
  isOnline() {
    return this.#online;
  }

  /** @returns {{online:boolean, checkedAt:number}} */
  getStatus() {
    return { online: this.#online, checkedAt: Date.now() };
  }

  /**
   * Subscribe to connectivity changes.
   * @param {Function} fn - receives (online:boolean)
   * @returns {Function} unsubscribe
   */
  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  /** Cleanup browser listeners (§74). */
  destroy() {
    if (typeof window !== 'undefined') {
      if (this.#onOnline) window.removeEventListener('online', this.#onOnline);
      if (this.#onOffline) window.removeEventListener('offline', this.#onOffline);
      this.#onOnline = null;
      this.#onOffline = null;
    }
    this.#listeners.clear();
  }

  /* ---- private ---- */

  #setState(online) {
    if (this.#online === online) return;

    this.#online = online;

    const eventName = online ? 'network:online' : 'network:offline';
    this.#eventBus.emit(eventName, { timestamp: Date.now() });

    this.#logger.info('network', `Network ${online ? 'online' : 'offline'}`);

    for (const fn of this.#listeners) {
      try {
        fn(online);
      } catch (err) {
        this.#logger.error('network', 'Subscriber error', { error: err.message });
      }
    }
  }
} 
