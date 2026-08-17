/**
 * Application Lifecycle Manager (§32, §33)
 *
 * States: DISCOVERED → VALIDATING → READY → STARTING → RUNNING
 *         → SUSPENDED → STOPPING → STOPPED | FAILED | DISABLED
 *
 * Application failure is isolated (§33): a crash here does NOT
 * take down the Shell or other Applications.
 */

const VALID_STATES = new Set([
  'DISCOVERED', 'VALIDATING', 'READY', 'STARTING', 'RUNNING',
  'SUSPENDED', 'STOPPING', 'STOPPED', 'FAILED', 'DISABLED',
]);

export class ApplicationLifecycle {
  #registry;
  #logger;
  #eventBus;
  /** @type {Map<string, object>} loaded module references */
  #instances = new Map();

  constructor(registry, logger, eventBus) {
    this.#registry = registry;
    this.#logger = logger;
    this.#eventBus = eventBus;
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

      mod.mount(mountPoint);
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

  #transition(appId, state) {
    if (!VALID_STATES.has(state)) {
      throw new Error(`Invalid lifecycle state: "${state}"`);
    }
    this.#registry.setState(appId, state);
  }
} 
