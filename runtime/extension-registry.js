/**
 * Extension Registry (§61, §64)
 *
 * Source of truth for registered extensions. Stores descriptor + instance
 * + state. Registration/activation behavior belongs to ExtensionService.
 */
export class ExtensionRegistry {
  /** @type {Map<string, {descriptor:object, instance:object|null, state:object}>} */
  #extensions = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Register an extension object (self-describing: metadata + behavior).
   * @param {object} ext
   */
  register(ext) {
    if (!ext || !ext.id) {
      this.#logger.warn('extensions', 'Invalid extension (missing id)');
      return;
    }
    if (this.#extensions.has(ext.id)) {
      this.#logger.warn('extensions', `Extension "${ext.id}" already registered — overwriting`);
    }

    const descriptor = {
      id: ext.id,
      type: ext.type,
      version: ext.version || '0.0.0',
      description: ext.description || '',
      capabilities: Array.isArray(ext.capabilities) ? [...ext.capabilities] : [],
      dependencies: Array.isArray(ext.dependencies) ? [...ext.dependencies] : [],
      owner: ext.owner || 'os',
      registeredAt: Date.now(),
    };

    this.#extensions.set(ext.id, {
      descriptor,
      instance: ext,
      state: { installation: 'installed', activation: 'inactive' },
    });
  }

  unregister(id) {
    return this.#extensions.delete(id);
  }

  get(id) {
    return this.#extensions.get(id) || null;
  }

  has(id) {
    return this.#extensions.has(id);
  }

  getAll() {
    return Array.from(this.#extensions.values());
  }

  getByType(type) {
    return this.getAll().filter((e) => e.descriptor.type === type);
  }

  setInstance(id, instance) {
    const e = this.#extensions.get(id);
    if (e) e.instance = instance;
  }

  /**
   * Update lifecycle state (installation/activation).
   * @param {string} id
   * @param {{installation?:string, activation?:string}} patch
   */
  updateState(id, patch) {
    const e = this.#extensions.get(id);
    if (!e) return false;
    Object.assign(e.state, patch);
    return true;
  }
} 
