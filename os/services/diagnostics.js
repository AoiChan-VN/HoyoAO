/**
 * Diagnostics Service (§25, §48)
 *
 * OS observability. Now also exposes Offline Sync status and registered
 * schemas so monitoring Applications can observe them.
 */
export class DiagnosticsService {
  #registry;
  #services;
  #eventBus;
  #logger;
  #storage;
  #config;

  #errors = [];
  #maxErrors = 100;
  #bootTimestamp = Date.now();
  #listeners = new Set();
  #unsubscribers = [];

  constructor(deps = {}) {
    this.#registry = deps.registry || null;
    this.#services = deps.services || null;
    this.#eventBus = deps.eventBus || null;
    this.#logger = deps.logger || null;
    this.#storage = deps.storage || null;
    this.#config = deps.config || null;

    this.#startCollecting();
  }

  getSnapshot() {
    return {
      boot: {
        timestamp: this.#bootTimestamp,
        uptimeMs: Date.now() - this.#bootTimestamp,
      },
      applications: this.#getApplications(),
      services: this.#getServices(),
      errors: [...this.#errors],
      events: this.#eventBus && typeof this.#eventBus.metrics === 'function'
        ? this.#eventBus.metrics()
        : {},
      memory: this.#getMemory(),
      cache: this.#getCacheStats(),
      permissions: this.#getPermissionStats(),
      resources: this.#getResourceStats(),
      extensions: this.#getExtensionStats(),
      sync: this.#getSyncStats(),
      schemas: this.#getSchemaStats(),
    };
  }

  getErrors() {
    return [...this.#errors];
  }

  getApplications() {
    return this.#getApplications();
  }

  getServices() {
    return this.#getServices();
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  destroy() {
    for (const unsub of this.#unsubscribers) unsub();
    this.#unsubscribers = [];
    this.#listeners.clear();
    this.#errors = [];
  }

  /* ---- private ---- */

  #startCollecting() {
    if (!this.#eventBus) return;

    const onLogEntry = (entry) => {
      if (entry && (entry.level === 'error' || entry.level === 'fatal')) {
        this.#recordError(entry);
      }
    };
    this.#eventBus.on('log:entry', onLogEntry);
    this.#unsubscribers.push(() => this.#eventBus.off('log:entry', onLogEntry));
  }

  #recordError(entry) {
    this.#errors.push({
      timestamp: entry.timestamp,
      level: entry.level,
      category: entry.category,
      message: entry.message,
    });
    if (this.#errors.length > this.#maxErrors) {
      this.#errors.shift();
    }
    this.#notifyListeners();
  }

  #getApplications() {
    if (!this.#registry) return [];
    return this.#registry.getAll().map((entry) => ({
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      state: entry.state,
      installation: entry.installation ?? 'installed',
      activation: entry.activation ?? 'enabled',
      validationWarnings: entry.validationWarnings ?? [],
    }));
  }

  #getServices() {
    if (!this.#services) return [];
    return this.#services.getAll();
  }

  #getMemory() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
      };
    }
    return null;
  }

  #getCacheStats() {
    if (!this.#services || !this.#services.has('cache')) return null;
    try {
      return this.#services.get('cache').getGlobalStats();
    } catch (err) {
      this.#logger?.warn('diagnostics', 'Failed to read cache stats', { error: err.message });
      return null;
    }
  }

  #getPermissionStats() {
    if (!this.#services || !this.#services.has('permissions')) return null;
    try {
      const permissions = this.#services.get('permissions');
      return {
        known: permissions.getKnownPermissions(),
        grants: permissions.getAllGrants(),
        recentAudit: permissions.getAuditLog().slice(-20),
      };
    } catch (err) {
      this.#logger?.warn('diagnostics', 'Failed to read permission stats', { error: err.message });
      return null;
    }
  }

  #getResourceStats() {
    if (!this.#services || !this.#services.has('resources')) return null;
    try {
      const resources = this.#services.get('resources');
      return {
        ...resources.getStats(),
        recent: resources.getResources().slice(0, 20).map((r) => ({
          id: r.id,
          type: r.type,
          owner: r.owner,
          activation: r.activation,
        })),
      };
    } catch (err) {
      this.#logger?.warn('diagnostics', 'Failed to read resource stats', { error: err.message });
      return null;
    }
  }

  #getExtensionStats() {
    if (!this.#services || !this.#services.has('extensions')) return null;
    try {
      const extensions = this.#services.get('extensions');
      return {
        ...extensions.getStats(),
        list: extensions.getExtensions(),
      };
    } catch (err) {
      this.#logger?.warn('diagnostics', 'Failed to read extension stats', { error: err.message });
      return null;
    }
  }

  /** Offline Sync status (§48). */
  #getSyncStats() {
    if (!this.#services || !this.#services.has('sync')) return null;
    try {
      return this.#services.get('sync').getStatus();
    } catch (err) {
      this.#logger?.warn('diagnostics', 'Failed to read sync stats', { error: err.message });
      return null;
    }
  }

  /** Registered schemas (§48, §64). */
  #getSchemaStats() {
    if (!this.#services || !this.#services.has('schemas')) return null;
    try {
      const schemas = this.#services.get('schemas');
      const list = schemas.listSchemas();
      return { total: list.length, list };
    } catch (err) {
      this.#logger?.warn('diagnostics', 'Failed to read schema stats', { error: err.message });
      return null;
    }
  }

  #notifyListeners() {
    const snapshot = this.getSnapshot();
    for (const fn of this.#listeners) {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('[Diagnostics] subscriber error', err);
      }
    }
  }
}
