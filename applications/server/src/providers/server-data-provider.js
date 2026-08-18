/**
 * ServerDataProvider — Data Provider Contract (§56)
 *
 * The Server Application consumes THIS CONTRACT, never a concrete provider.
 * This allows swapping the data source (development → API → local → stream)
 * without rewriting the UI (§55, §86).
 *
 * All returned server records must be plain data objects (§8 — no UI logic).
 */
export class ServerDataProvider {
  /**
   * Fetch the current list of servers.
   * @returns {Promise<Array<object>>} array of server records
   */
  async fetchServers() {
    throw new Error('ServerDataProvider.fetchServers() must be implemented by subclass');
  }

  /**
   * Subscribe to server list changes (live updates).
   * @param {Function} onChange - receives the updated server array
   * @returns {Function} unsubscribe
   */
  subscribe(onChange) {
    throw new Error('ServerDataProvider.subscribe() must be implemented by subclass');
  }
}

/**
 * EmptyServerProvider — null-object provider (§98).
 *
 * Used when no real data source is configured (e.g. production without
 * a backend). It returns an empty list honestly — NEVER fabricates data (§45).
 */
export class EmptyServerProvider extends ServerDataProvider {
  async fetchServers() {
    return [];
  }

  subscribe(_onChange) {
    // No source, no updates. Return a no-op unsubscribe.
    return () => {};
  }
} 
