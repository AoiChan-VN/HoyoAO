/**
 * Application Lifecycle Manager (§32, §33)
 *
 * States: DISCOVERED → VALIDATING → READY → STARTING → RUNNING
 *         → SUSPENDED → STOPPING → STOPPED | FAILED | DISABLED
 *
 * Application failure is isolated (§33): a crash here does NOT
 * take down the Shell or other Applications.
 *
 * ServiceContext (§5, §91, §92):
 *   Applications receive a frozen, permission-filtered view of
 *   OS services. They NEVER get raw access to the ServiceRegistry.
 */

const VALID_STATES = new Set([
  'DISCOVERED', 'VALIDATING', 'READY', 'STARTING', 'RUNNING',
  'SUSPENDED', 'STOPPING', 'STOPPED', 'FAILED', 'DISABLED',
]);

export class ApplicationLifecycle {
  #registry;
  #logger;
  #eventBus;
  #services;
  /** @type {Map<string, object>} loaded module references */
  #instances = new Map();

  constructor(registry, logger, eventBus, services) {
    this.#registry = registry;
    this.#logger = logger;
    this.#eventBus = eventBus;
    this.#services = services;
  }

  /**
   * Start an Application.
   * @param {string} appId
   * @param {HTMLElement} mountPoint — DOM node provided by Shell
   * @returns {object} the loaded app module
   */
  async start(appId, mountPoint) {
    const entry = this.#registry.get(appId);
    if (!entry) throw new Error(`Application "${appId}" not in registry`);

    try {
      this.#transition(appId, 'STARTING');
      this.#eventBus.emit('application:starting', { appId });

      // Dynamic import — controlled loading (§40)
      const mod = await import(entry.manifest.entry);

      if (typeof mod.mount !== 'function') {
        throw new Error(`"${appId}" must export a mount() function`);
      }

      // Build permission-filtered service context (§91, §92)
      const serviceContext = this.#buildServiceContext(entry.manifest);

      mod.mount(mountPoint, serviceContext);
      this.#instances.set(appId, mod);

      this.#transition(appId, 'RUNNING');
      this.#eventBus.emit('application:started', { appId });
      this.#logger.info('lifecycle', `"${appId}" is RUNNING`);

      return mod;

    } catch (err) {
      this.#transition(appId, 'FAILED');
      this.#eventBus.emit('application:error', { appId, error: err.message });
      this.#logger.error('lifecycle', `"${appId}" failed to start`, {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Stop an Application.
   * @param {string} appId
   */
  async stop(appId) {
    const mod = this.#instances.get(appId);
    if (!mod) return;

    try {
      this.#transition(appId, 'STOPPING');
      this.#eventBus.emit('application:stopping', { appId });

      if (typeof mod.unmount === 'function') {
        await mod.unmount();
      }

      this.#instances.delete(appId);
      this.#transition(appId, 'STOPPED');
      this.#eventBus.emit('application:stopped', { appId });
      this.#logger.info('lifecycle', `"${appId}" stopped`);

    } catch (err) {
      this.#transition(appId, 'FAILED');
      this.#eventBus.emit('application:error', { appId, error: err.message });
      this.#logger.error('lifecycle', `"${appId}" error during stop`, {
        error: err.message,
      });
    }
  }

  getState(appId) {
    return this.#registry.get(appId)?.state ?? null;
  }

  isRunning(appId) {
    return this.getState(appId) === 'RUNNING';
  }

  getRunningApps() {
    return Array.from(this.#instances.keys());
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Build a frozen ServiceContext filtered by manifest permissions.
   * Applications only receive services they are allowed to use (§92).
   *
   * @param {object} manifest
   * @returns {Readonly<object>}
   */
  #buildServiceContext(manifest) {
    const permissions = new Set(manifest.permissions || []);
    const context = {};

    // Core services every application receives
    context.events = this.#services.get('events');
    context.logger = this.#services.get('logger');
    context.config = this.#services.get('config');
    context.theme = this.#services.get('theme');
    context.localization = this.#services.get('localization');

    // Data access requires data.read permission
    if (permissions.has('data.read')) {
      context.data = this.#services.get('data');
      context.indexer = this.#services.get('indexer');
    }

    // Storage access requires explicit permission
    if (permissions.has('storage.read') || permissions.has('storage.write')) {
      context.storage = this.#services.get('storage');
    }

    // System status access
    if (permissions.has('system.status')) {
      context.registry = this.#registry;
    }

    // Freeze to prevent mutation by Applications (§5)
    return Object.freeze(context);
  }

  #transition(appId, state) {
    if (!VALID_STATES.has(state)) {
      throw new Error(`Invalid lifecycle state: "${state}"`);
    }
    this.#registry.setState(appId, state);
  }
}
