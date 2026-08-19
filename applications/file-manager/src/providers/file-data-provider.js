/**
 * FileDataProvider — Data Provider Contract (§56, §85)
 *
 * The File Manager consumes THIS CONTRACT, never a concrete provider.
 * This decouples the UI from any specific filesystem or storage backend (§85):
 *   - browser File System Access API
 *   - remote storage
 *   - IndexedDB
 *   - local adapter
 * can all implement this contract without rewriting the UI (§55).
 *
 * All returned entries are virtual file metadata objects (§8 — no UI logic).
 */
export class FileDataProvider {
  /**
   * Fetch the current list of virtual file entries.
   * @returns {Promise<Array<object>>}
   */
  async fetchFiles() {
    throw new Error('FileDataProvider.fetchFiles() must be implemented by subclass');
  }

  /**
   * Subscribe to file list changes.
   * @param {Function} onChange - receives updated files array
   * @returns {Function} unsubscribe
   */
  subscribe(onChange) {
    throw new Error('FileDataProvider.subscribe() must be implemented by subclass');
  }
}

/**
 * EmptyFileDataProvider — null-object provider (§98).
 *
 * Used when no real file source is configured.
 * Returns an empty list honestly — NEVER fabricates files (§45).
 */
export class EmptyFileDataProvider extends FileDataProvider {
  async fetchFiles() {
    return [];
  }

  subscribe(_onChange) {
    return () => {};
  }
} 
