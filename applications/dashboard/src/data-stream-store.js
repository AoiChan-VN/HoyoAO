/**
 * DataStreamStore — Dashboard application-scoped state (§28)
 *
 * Holds lightweight summaries { id, metadata } of indexed packets.
 * Aggregates for visualization, stats, and category cards.
 * This is Application State, owned by Dashboard, cleaned up on unmount (§74).
 */
export class DataStreamStore {
  /** @type {Array<{id:string, metadata:object}>} */
  #packets = [];
  #maxPackets;
  #listeners = new Set();

  constructor(options = {}) {
    this.#maxPackets = options.maxPackets || 500;
  }

  add(summary) {
    this.#packets.push(summary);
    if (this.#packets.length > this.#maxPackets) {
      this.#packets.shift();
    }
    this.#notify();
  }

  getPackets() {
    return this.#packets;
  }

  getTotal() {
    return this.#packets.length;
  }

  /** Group summaries by metadata.domain. */
  getByCategory() {
    const groups = {};
    for (const p of this.#packets) {
      const key = p.metadata.domain || 'unclassified';
      (groups[key] = groups[key] || []).push(p);
    }
    return groups;
  }

  /** Packets indexed within the last 60 seconds. */
  getRate() {
    const now = Date.now();
    const windowMs = 60000;
    return this.#packets.filter(
      (p) => now - p.metadata.timestamp <= windowMs,
    ).length;
  }

  getMostActiveCategory() {
    const groups = this.getByCategory();
    let max = null;
    let maxCount = 0;
    for (const [key, arr] of Object.entries(groups)) {
      if (arr.length > maxCount) {
        maxCount = arr.length;
        max = key;
      }
    }
    return max;
  }

  getLastTimestamp() {
    let max = null;
    for (const p of this.#packets) {
      if (max === null || p.metadata.timestamp > max) {
        max = p.metadata.timestamp;
      }
    }
    return max;
  }

  /** §45 — detect simulated data so UI can label it. */
  hasSimulatedData() {
    return this.#packets.some(
      (p) => p.metadata.origin === 'development-simulation',
    );
  }

  /**
   * Subscribe to store changes.
   * @returns {Function} unsubscribe
   */
  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  #notify() {
    for (const fn of this.#listeners) fn(this);
  }

  clear() {
    this.#packets = [];
    this.#listeners.clear();
  }
}
