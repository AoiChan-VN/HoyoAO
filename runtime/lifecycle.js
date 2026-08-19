/**
 * Application Lifecycle Manager (§32, §33)
 *
 * ServiceContext is built with least privilege (§92). Adds the `resources`
 * capability mapping so applications declaring it receive ResourceService.
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

  async start(appId, mountPoint) {
    const entry = this.#registry.get(appId);
    if (!entry) throw new Error(`Application "${appId}" not in registry`);

    if (entry.activation === 'disabled') {
      const err = new Error(`Application "${appId}" is disabled`);
      this.#eventBus.emit('application:error', { appId, error: err.message });
      throw err;
    }

    try {
      this.#transition(appId, 'STARTING');
      this.#eventBus.emit('application:starting', { appId });

      const mod = await import(entry.manifest.entry);

      if (typeof mod.mount !== 'function') {
        throw new Error(`"${appId}" must export a mount() function`);
      }

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
      this.#logger.error('lifecycle', `"${appId}" failed to start`, { error: err.message });
      throw err;
    }
  }

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
      this.#logger.error('lifecycle', `"${appId}" error during stop`, { error: err.message });
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

  #buildServiceContext(manifest) {
    const appId = manifest.id;

    const permissionService = this.#services.has('permissions')
      ? this.#services.get('permissions')
      : null;

    const manifestPerms = new Set(manifest.permissions || []);
    const has = (perm) =>
      permissionService ? permissionService.has(appId, perm) : manifestPerms.has(perm);

    const context = {};

    // Core services every application receives.
    context.events = this.#services.get('events');
    context.logger = this.#services.get('logger');
    context.config = this.#services.get('config');
    context.theme = this.#services.get('theme');
    context.localization = this.#services.get('localization');
    context.notifications = this.#services.get('notifications');
    context.icons = this.#services.get('icons');
    context.assets = this.#services.get('assets');
    context.settings = this.#services.get('settings');
    context.navigation = this.#services.get('navigation');
    context.cache = this.#services.get('cache');

    // Gated services — least privilege (§92).
    if (has('data.read')) {
      context.data = this.#services.get('data');
      context.indexer = this.#services.get('indexer');
    }

    if (has('storage.read') || has('storage.write')) {
      context.storage = this.#services.get('storage');
    }

    if (has('network')) {
      context.network = this.#services.get('network');
    }

    if (has('resources')) {
      context.resources = this.#services.get('resources');
    }

    if (has('system.status')) {
      context.registry = this.#registry;
      context.diagnostics = this.#services.get('diagnostics');
    }

    return Object.freeze(context);
  }

  #transition(appId, state) {
    if (!VALID_STATES.has(state)) {
      throw new Error(`Invalid lifecycle state: "${state}"`);
    }
    this.#registry.setState(appId, state);
  }
}
