/**
 * Resource Service (§25, §35, §84, §59)
 *
 * Manages resource lifecycle (install/activate/deactivate/uninstall),
 * integrity verification (§84 via Web Crypto), resolution, and cached
 * loading. Uses ResourceRegistry as source of truth (§64).
 *
 * Installation and usage are separately controllable (§84).
 * No hardcoded physical paths — resources resolve through descriptors (§35).
 */

function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export class ResourceService {
  #registry;
  #eventBus;
  #logger;
  #cachePartition;

  constructor({ registry, eventBus, logger, cache }) {
    this.#registry = registry;
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#cachePartition = cache ? cache.getPartition('resources') : null;
  }

  /* ------------------------------------------------------------------ */
  /*  Registration                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Register a resource descriptor with sensible defaults.
   * @param {object} descriptor
   * @returns {{success:boolean, id?:string, reason?:string}}
   */
  registerResource(descriptor) {
    if (!descriptor || !descriptor.id || !descriptor.type) {
      this.#logger.warn('resources', 'registerResource: invalid descriptor');
      return { success: false, reason: 'invalid-descriptor' };
    }

    const full = {
      name: descriptor.id,
      version: '0.0.0',
      owner: 'os',
      tags: [],
      dependencies: [],
      mimeType: null,
      url: null,
      content: undefined,
      integrity: null,
      compatibility: null,
      installation: 'installed',
      activation: 'active',
      registeredAt: Date.now(),
      ...descriptor,
    };

    this.#registry.register(full);
    this.#eventBus.emit('resource:registered', { id: full.id, type: full.type });
    this.#logger.info('resources', `Registered resource "${full.id}" (${full.type})`);
    return { success: true, id: full.id };
  }

  /* ------------------------------------------------------------------ */
  /*  Lifecycle (§84 — installation separate from usage)                 */
  /* ------------------------------------------------------------------ */

  installResource(id) {
    if (!this.#registry.has(id)) return { success: false, reason: 'not-found' };
    this.#registry.updateState(id, { installation: 'installed' });
    this.#eventBus.emit('resource:installed', { id });
    return { success: true, id };
  }

  uninstallResource(id) {
    if (!this.#registry.has(id)) return { success: false, reason: 'not-found' };
    this.#registry.updateState(id, { installation: 'not-installed', activation: 'inactive' });
    this.#eventBus.emit('resource:uninstalled', { id });
    return { success: true, id };
  }

  activateResource(id) {
    if (!this.#registry.has(id)) return { success: false, reason: 'not-found' };
    this.#registry.updateState(id, { activation: 'active' });
    this.#eventBus.emit('resource:activated', { id });
    return { success: true, id };
  }

  deactivateResource(id) {
    if (!this.#registry.has(id)) return { success: false, reason: 'not-found' };
    this.#registry.updateState(id, { activation: 'inactive' });
    this.#eventBus.emit('resource:deactivated', { id });
    return { success: true, id };
  }

  removeResource(id) {
    const existed = this.#registry.unregister(id);
    if (existed) this.#eventBus.emit('resource:uninstalled', { id });
    return { success: existed, id };
  }

  /* ------------------------------------------------------------------ */
  /*  Resolution + loading                                               */
  /* ------------------------------------------------------------------ */

  getResource(id) {
    return this.#registry.get(id);
  }

  /**
   * Query resources with optional filters.
   * @param {{type?:string, owner?:string, tag?:string}} filter
   */
  getResources(filter = {}) {
    let all = this.#registry.getAll();
    if (filter.type) all = all.filter((r) => r.type === filter.type);
    if (filter.owner) all = all.filter((r) => r.owner === filter.owner);
    if (filter.tag) all = all.filter((r) => Array.isArray(r.tags) && r.tags.includes(filter.tag));
    return all;
  }

  resolveUrl(id) {
    const r = this.#registry.get(id);
    return r ? r.url : null;
  }

  getContent(id) {
    const r = this.#registry.get(id);
    return r ? r.content : undefined;
  }

  /**
   * Load resource content. Inline content returns immediately; URL resources
   * are fetched, optionally integrity-verified, and cached (§41 caching).
   * @param {string} id
   * @returns {Promise<{success:boolean, content?:*, cached?:boolean, reason?:string}>}
   */
  async loadResource(id) {
    const r = this.#registry.get(id);
    if (!r) return { success: false, reason: 'not-found' };
    if (r.activation !== 'active') return { success: false, reason: 'not-active' };

    // Inline content.
    if (r.content !== undefined) return { success: true, content: r.content };

    // Cache lookup.
    if (this.#cachePartition) {
      const cached = await this.#cachePartition.get(id);
      if (cached !== undefined) return { success: true, content: cached, cached: true };
    }

    if (!r.url) return { success: false, reason: 'no-source' };

    try {
      const response = await fetch(r.url);
      if (!response.ok) {
        return { success: false, reason: 'fetch-failed', status: response.status };
      }

      let content;
      if (r.integrity && r.integrity.hash) {
        const buffer = await response.arrayBuffer();
        const verify = await this.verifyIntegrity(r, buffer);
        if (!verify.verified) {
          this.#logger.error('resources', `Integrity mismatch for "${id}"`, { reason: verify.reason });
          return { success: false, reason: 'integrity-mismatch' };
        }
        content = new TextDecoder().decode(buffer);
      } else {
        content = await response.text();
      }

      if (this.#cachePartition) {
        await this.#cachePartition.set(id, content);
      }

      return { success: true, content };
    } catch (err) {
      return { success: false, reason: 'fetch-error', error: err.message };
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Integrity (§84) — Web Crypto                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Compute a content hash using Web Crypto (§6 Web Platform APIs).
   * Guarded for environments where crypto.subtle is unavailable (§23, §75).
   * @param {ArrayBuffer} buffer
   * @param {string} algorithm
   */
  async computeIntegrity(buffer, algorithm = 'SHA-256') {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return { supported: false, reason: 'web-crypto-unavailable' };
    }
    try {
      const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
      return { supported: true, algorithm, hash: bufferToHex(hashBuffer) };
    } catch (err) {
      return { supported: false, reason: err.message };
    }
  }

  /**
   * Verify a buffer against a descriptor's declared integrity.
   * @param {object} descriptor
   * @param {ArrayBuffer} buffer
   */
  async verifyIntegrity(descriptor, buffer) {
    if (!descriptor.integrity || !descriptor.integrity.hash) {
      return { verified: false, reason: 'no-integrity-provided' };
    }
    const result = await this.computeIntegrity(buffer, descriptor.integrity.algorithm || 'SHA-256');
    if (!result.supported) return { verified: false, reason: result.reason };
    return {
      verified: result.hash === descriptor.integrity.hash,
      computed: result.hash,
      expected: descriptor.integrity.hash,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Observability (§48)                                                */
  /* ------------------------------------------------------------------ */

  getStats() {
    const all = this.#registry.getAll();
    const byType = {};
    const byOwner = {};
    for (const r of all) {
      byType[r.type] = (byType[r.type] || 0) + 1;
      byOwner[r.owner] = (byOwner[r.owner] || 0) + 1;
    }
    return { total: all.length, byType, byOwner };
  }
}
