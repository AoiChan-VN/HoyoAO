/**
 * Application Registry (§31, §64)
 *
 * Source of truth for installed applications. Stores validated manifests
 * plus installation/activation metadata (§84) and runtime lifecycle state (§32).
 *
 * register(manifest, meta) is backward compatible: meta is optional,
 * so existing direct registrations still work (§60).
 */
export class ApplicationRegistry {
  /** @type {Map<string, object>} appId → entry */
  #apps = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Validate and register a manifest.
   * @param {object} manifest
   * @param {{installedAt?:number, installation?:string, activation?:string, validationWarnings?:Array}} [meta]
   */
  register(manifest, meta = {}) {
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
      // Installation metadata (§84) — defaults keep backward compat (§60).
      installedAt: meta.installedAt ?? Date.now(),
      installation: meta.installation ?? 'installed',
      activation: meta.activation ?? 'enabled',
      validationWarnings: meta.validationWarnings ?? [],
    });

    this.#logger.info('registry', `Registered "${manifest.id}" v${manifest.version}`);
  }

  /**
   * Basic shape validation — a safety net. The ManifestValidator performs
   * the full schema + security validation before installation (§40).
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

  get(appId) {
    return this.#apps.get(appId) ?? null;
  }

  has(appId) {
    return this.#apps.has(appId);
  }

  getAll() {
    return Array.from(this.#apps.values());
  }

  unregister(appId) {
    this.#apps.delete(appId);
    this.#logger.info('registry', `Unregistered "${appId}"`);
  }

  /** Update runtime lifecycle state (called by Lifecycle Manager). */
  setState(appId, state) {
    const entry = this.#apps.get(appId);
    if (entry) entry.state = state;
  }

  /** Update activation state (§84). */
  setActivation(appId, activation) {
    const entry = this.#apps.get(appId);
    if (entry) entry.activation = activation;
  }
}
