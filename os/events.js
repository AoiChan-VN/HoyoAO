/**
 * Event Bus (§29)
 *
 * Explicit, named, scoped pub/sub for decoupled communication.
 * NOT an invisible global dependency — injected where needed.
 *
 * metrics() supports observability (§48): counts of emitted events.
 */

export class EventBus {
  /** @type {Map<string, Set<Function>>} */
  #listeners = new Map();
  /** @type {Map<string, number>} event name → emit count (§48) */
  #emitCounts = new Map();

  on(event, handler) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  off(event, handler) {
    const set = this.#listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this.#listeners.delete(event);
    }
  }

  emit(event, data) {
    // Count every emission for observability (§48).
    this.#emitCounts.set(event, (this.#emitCounts.get(event) || 0) + 1);

    const set = this.#listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[EventBus] Handler error on "${event}":`, err);
      }
    }
  }

  /** Remove all listeners + reset metrics (§74). */
  clear() {
    this.#listeners.clear();
    this.#emitCounts.clear();
  }

  /** Diagnostic: number of listeners per event. */
  inspect() {
    const report = {};
    for (const [event, set] of this.#listeners) {
      report[event] = set.size;
    }
    return report;
  }

  /**
   * Observability (§48): emit counts per event name.
   * @returns {object} copy of { event: count }
   */
  metrics() {
    const out = {};
    for (const [event, count] of this.#emitCounts) {
      out[event] = count;
    }
    return out;
  }
}
