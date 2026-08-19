/**
 * Migration Manager (§59, §34)
 *
 * Runs versioned DATA migrations against a storage partition. Works across
 * any storage adapter (memory / local / indexeddb). The applied version is
 * recorded in a reserved key so migrations run exactly once.
 *
 * IndexedDB SCHEMA migrations are handled natively by the IndexedDBAdapter
 * during version upgrades; this manager handles data-level migration logic
 * that is independent of the backend.
 */

const VERSION_KEY = '__migration_version__';

export class MigrationManager {
  #storage;
  #logger;

  constructor(storage, logger) {
    this.#storage = storage;
    this.#logger = logger;
  }

  /**
   * Apply pending migrations to a namespace.
   * @param {string} namespace        storage partition to migrate
   * @param {number} targetVersion    desired version
   * @param {Array<{version:number, description?:string, up:Function}>} migrations
   * @param {string} adapterName      adapter preference
   * @returns {Promise<{applied:number[], from:number, to:number}>}
   */
  async migrate(namespace, targetVersion, migrations, adapterName = 'memory') {
    const partition = this.#storage.getPartition(namespace, adapterName);
    const currentVersion = (await partition.get(VERSION_KEY)) || 0;

    if (currentVersion >= targetVersion) {
      return { applied: [], from: currentVersion, to: currentVersion };
    }

    const pending = (migrations || [])
      .filter((m) => m.version > currentVersion && m.version <= targetVersion)
      .sort((a, b) => a.version - b.version);

    const applied = [];
    for (const migration of pending) {
      if (typeof migration.up !== 'function') continue;

      await migration.up(partition, { from: currentVersion, to: migration.version });
      await partition.set(VERSION_KEY, migration.version);
      applied.push(migration.version);

      this.#logger.info('storage', `Migration v${migration.version} applied to "${namespace}"`, {
        description: migration.description || '',
      });
    }

    return { applied, from: currentVersion, to: targetVersion };
  }

  /**
   * Read the recorded version for a namespace.
   * @param {string} namespace
   * @param {string} adapterName
   * @returns {Promise<number>}
   */
  async currentVersion(namespace, adapterName = 'memory') {
    const partition = this.#storage.getPartition(namespace, adapterName);
    return (await partition.get(VERSION_KEY)) || 0;
  }
} 
