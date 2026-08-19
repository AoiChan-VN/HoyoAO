/**
 * Resource Registry (§35, §64)
 *
 * Source of truth for resource descriptors. Pure storage + queries;
 * no lifecycle behavior (that belongs to ResourceService).
 *
 * Icons belong to IconRegistry and brand assets to AssetRegistry (§64);
 * this registry manages all other resources: themes, locales, fonts,
 * audio, video, documents, data, templates, application assets (§35).
 */
export class ResourceRegistry {
  /** @type {Map<string, object>} id → descriptor */
  #resources = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Register a resource descriptor.
   * @param {object} descriptor
   */
  register(descriptor) {
    if (!descriptor || !descriptor.id || !descriptor.type) {
      this.#logger.warn('resources', 'Invalid resource descriptor (missing id/type)');
      return;
    }
    if (this.#resources.has(descriptor.id)) {
      this.#logger.warn('resources', `Resource "${descriptor.id}" already registered — overwriting`);
    }
    this.#resources.set(descriptor.id, { ...descriptor });
  }

  unregister(id) {
    return this.#resources.delete(id);
  }

  get(id) {
    const r = this.#resources.get(id);
    return r ? { ...r } : null;
  }

  has(id) {
    return this.#resources.has(id);
  }

  getAll() {
    return Array.from(this.#resources.values()).map((r) => ({ ...r }));
  }

  getByType(type) {
    return this.getAll().filter((r) => r.type === type);
  }

  getByOwner(owner) {
    return this.getAll().filter((r) => r.owner === owner);
  }

  getByTag(tag) {
    return this.getAll().filter((r) => Array.isArray(r.tags) && r.tags.includes(tag));
  }

  /**
   * Update mutable lifecycle fields (installation/activation) (§84).
   * @param {string} id
   * @param {{installation?:string, activation?:string}} patch
   */
  updateState(id, patch) {
    const r = this.#resources.get(id);
    if (!r) return false;
    if (patch.installation !== undefined) r.installation = patch.installation;
    if (patch.activation !== undefined) r.activation = patch.activation;
    return true;
  }
} 
