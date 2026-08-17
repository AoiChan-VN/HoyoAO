/**
 * Event Bus (§29)
 *
 * Explicit, named, scoped pub/sub for decoupled communication.
 * NOT an invisible global dependency — injected where needed.
 */

export class EventBus {
  /** @type {Map<string, Set<Function>>} */
  #listeners = new Map();

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} unsubscribe
   */
  on(event, handler) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Subscribe once.
   * @param {string} event
   * @param {Function} handler
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe.
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    const set = this.#listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this.#listeners.delete(event);
    }
  }

  /**
   * Emit an event.
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    const set = this.#listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(data);
      } catch (err) {
        // §46 — errors are explicit, never silently swallowed
        console.error(`[EventBus] Handler error on "${event}":`, err);
      }
    }
  }

  /** Remove all listeners (cleanup §74). */
  clear() {
    this.#listeners.clear();
  }

  /** Diagnostic: number of listeners per event. */
  inspect() {
    const report = {};
    for (const [event, set] of this.#listeners) {
      report[event] = set.size;
    }
    return report;
  }
} 
