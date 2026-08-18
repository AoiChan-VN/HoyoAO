/**
 * DevelopmentServerProvider
 *
 * ⚠ DEVELOPMENT / SIMULATED DATA SOURCE (§45)
 * Generates SIMULATED server records for development and demonstration ONLY.
 * Never used in production. Every record is implicitly development data,
 * and the UI labels the whole dataset as SIMULATED.
 *
 * Implements the ServerDataProvider contract (§56). In the future an
 * ApiServerProvider will implement the same contract against a real backend.
 */

import { ServerDataProvider } from './server-data-provider.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class DevelopmentServerProvider extends ServerDataProvider {
  /** @type {Array<object>} */
  #servers = [];
  /** @type {Set<Function>} */
  #listeners = new Set();
  #timer = null;
  #intervalMs;

  constructor(options = {}) {
    super();
    this.#intervalMs = options.intervalMs || 4000;
    this.#servers = this.#createInitialServers();
  }

  async fetchServers() {
    // Return copies so consumers cannot mutate provider state (§5 boundary).
    return this.#servers.map((s) => ({ ...s }));
  }

  /**
   * Simulated live updates. Real providers would use WebSocket/SSE (§86).
   * @param {Function} onChange
   * @returns {Function} unsubscribe
   */
  subscribe(onChange) {
    this.#listeners.add(onChange);

    if (!this.#timer) {
      this.#timer = setInterval(() => this.#tick(), this.#intervalMs);
    }

    return () => {
      this.#listeners.delete(onChange);
      if (this.#listeners.size === 0 && this.#timer) {
        clearInterval(this.#timer);
        this.#timer = null;
      }
    };
  }

  /** Release timers when the provider is discarded (§74). */
  destroy() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.#listeners.clear();
  }

  /* ---- private ---- */

  #tick() {
    for (const s of this.#servers) {
      if (s.status === 'online' || s.status === 'degraded') {
        s.cpuLoad = clamp(Math.round(s.cpuLoad + rand(-8, 8)), 1, 100);
        s.memoryLoad = clamp(Math.round(s.memoryLoad + rand(-5, 5)), 5, 100);
        s.connections = Math.max(0, s.connections + rand(-20, 20));
        s.uptimeSeconds += Math.round(this.#intervalMs / 1000);
      }
    }

    const snapshot = this.#servers.map((s) => ({ ...s }));
    for (const fn of this.#listeners) {
      try {
        fn(snapshot);
      } catch {
        // A failing consumer must not break the provider (§33 isolation).
      }
    }
  }

  /**
   * Simulated initial fleet — DEVELOPMENT data (§45).
   * These are NOT real servers.
   */
  #createInitialServers() {
    const now = Date.now();
    const day = 86400;

    return [
      {
        id: 'srv-web-01',
        name: 'web-prod-01',
        type: 'web',
        status: 'online',
        host: '10.0.1.12',
        port: 8080,
        region: 'us-east',
        cpuLoad: 42,
        memoryLoad: 58,
        connections: 140,
        version: '2.4.1',
        uptimeSeconds: day * 3,
        startedAt: now - day * 3 * 1000,
      },
      {
        id: 'srv-web-02',
        name: 'web-prod-02',
        type: 'web',
        status: 'online',
        host: '10.0.1.13',
        port: 8080,
        region: 'us-east',
        cpuLoad: 35,
        memoryLoad: 49,
        connections: 98,
        version: '2.4.1',
        uptimeSeconds: day * 3,
        startedAt: now - day * 3 * 1000,
      },
      {
        id: 'srv-game-01',
        name: 'game-eu-01',
        type: 'game',
        status: 'degraded',
        host: '10.0.2.21',
        port: 27015,
        region: 'eu-west',
        cpuLoad: 88,
        memoryLoad: 76,
        connections: 512,
        version: '1.9.0',
        uptimeSeconds: day,
        startedAt: now - day * 1000,
      },
      {
        id: 'srv-db-01',
        name: 'db-primary',
        type: 'database',
        status: 'online',
        host: '10.0.3.5',
        port: 5432,
        region: 'us-east',
        cpuLoad: 55,
        memoryLoad: 71,
        connections: 45,
        version: '15.2',
        uptimeSeconds: day * 12,
        startedAt: now - day * 12 * 1000,
      },
      {
        id: 'srv-cache-01',
        name: 'cache-01',
        type: 'cache',
        status: 'offline',
        host: '10.0.3.9',
        port: 6379,
        region: 'us-east',
        cpuLoad: 0,
        memoryLoad: 0,
        connections: 0,
        version: '7.0',
        uptimeSeconds: 0,
        startedAt: null,
      },
    ];
  }
} 
