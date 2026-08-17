/**
 * Data Provider Contract (§56)
 * 
 * Base class for all data sources. 
 * Applications and OS consume this contract, not concrete implementations.
 */
export class DataProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Fetch data from the source.
   * @returns {Promise<{data: *, meta: object}>}
   */
  async fetch() {
    throw new Error('DataProvider.fetch() must be implemented by subclass');
  }

  /**
   * Check if the provider is currently available/online.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return true;
  }
} 
