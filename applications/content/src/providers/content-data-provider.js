/**
 * ContentDataProvider — Data Provider Contract (§56)
 *
 * The Content Application consumes THIS CONTRACT, never a concrete provider.
 * This allows swapping the source (development → API → file → stream)
 * without rewriting the UI (§55, §86).
 *
 * All returned content items must be plain data objects (§8 — no UI logic).
 */
export class ContentDataProvider {
  /**
   * Fetch the current list of content items.
   * @returns {Promise<Array<object>>}
   */
  async fetchItems() {
    throw new Error('ContentDataProvider.fetchItems() must be implemented by subclass');
  }

  /**
   * Subscribe to content changes.
   * @param {Function} onChange - receives updated items array
   * @returns {Function} unsubscribe
   */
  subscribe(onChange) {
    throw new Error('ContentDataProvider.subscribe() must be implemented by subclass');
  }
}

/**
 * EmptyContentDataProvider — null-object provider (§98).
 *
 * Used when no real content source is configured.
 * Returns an empty list honestly — NEVER fabricates content (§45).
 */
export class EmptyContentDataProvider extends ContentDataProvider {
  async fetchItems() {
    return [];
  }

  subscribe(_onChange) {
    return () => {};
  }
} 
