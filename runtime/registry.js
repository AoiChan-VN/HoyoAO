/**
 * Application Registry (§31)
 *
 * Stores validated Application manifests.
 * The OS discovers Applications through this registry.
 * No application business logic lives here.
 */

export class ApplicationRegistry {
  /** @type {Map<string, {manifest:object, state:string, registeredAt:number}>} */
  #apps = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Validate and register a manifest.
   * @param {object} manifest
   */
  register(manifest) {
    const result = this.validate(manifest);
    if (!result.valid) {
      const msg = `Invalid manifest "${manifest?.id ?? 'unknown'}": ${result.errors.join('; ')}`;
      this.#logger.error('registry', msg);
      throw new Error(msg);
    }

    if (this.#apps.has(manifest.id)) {
      this.#logger.warn('registry', `Replacing existing registration: "${manifest.id}"`);
    }

    this.#apps.set(manifest.id, {
      manifest,
      state: 'DISCOVERED',
      registeredAt: Date.now(),
    });

    this.#logger.info('registry', `Registered "${manifest.id}" v${manifest.version}`);
  }

  /**
   * Validate manifest shape (§31).
   * @param {object} m
   * @returns {{valid:boolean, errors:string[]}}
   */
  validate(m) {
    const errors = [];
    if (!m) return { valid: false, errors: ['Manifest is null'] };

    const required = ['id', 'name', 'version', 'entry'];
    for (const field of required) {
      if (!m[field] || typeof m[field] !== 'string') {
        errors.push(`Missing or invalid required field: "${field}"`);
      }
    }

    if (m.id && !/^[a-z][a-z0-9-]*$/.test(m.id)) {
      errors.push('id must be lowercase alphanumeric with hyphens');
    }

    return { valid: errors.length === 0, errors };
  }

  get(appId) { return this.#apps.get(appId) ?? null; }
  has(appId) { return this.#apps.has(appId); }
  getAll()   { return Array.from(this.#apps.values()); }

  unregister(appId) {
    this.#apps.delete(appId);
    this.#logger.info('registry', `Unregistered "${appId}"`);
  }

  /** Update lifecycle state (called by Lifecycle Manager). */
  setState(appId, state) {
    const entry = this.#apps.get(appId);
    if (entry) entry.state = state;
  }
} 
