/**
 * Extension Service (§25, §61, §62)
 *
 * Registers, activates, and deactivates extensions through explicit
 * contracts (§61). Enforces least privilege (§62): an extension's
 * activate(context) receives ONLY the services its declared capabilities
 * allow — never unrestricted OS access.
 *
 * For this foundation, extensions are registered by the OS (trusted boot).
 * Runtime registration by arbitrary external code is deliberately NOT
 * enabled (§40 — no blind execution of downloaded code).
 */

import { validateExtensionContract, isKnownExtensionType } from '../extensions/contract.js';

export class ExtensionService {
  #registry;
  #eventBus;
  #logger;
  #services;
  #permissions;

  constructor({ registry, eventBus, logger, services, permissions }) {
    this.#registry = registry;
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#services = services;
    this.#permissions = permissions;
  }

  /* ------------------------------------------------------------------ */
  /*  Registration                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Register an extension object.
   * @param {object} ext
   * @returns {{success:boolean, id?:string, reason?:string, errors?:string[]}}
   */
  registerExtension(ext) {
    const contractErrors = validateExtensionContract(ext);
    if (contractErrors.length > 0) {
      this.#logger.error('extensions', `Extension contract invalid for "${ext?.id}"`, { contractErrors });
      return { success: false, reason: 'invalid-contract', errors: contractErrors };
    }

    if (this.#registry.has(ext.id)) {
      return { success: false, reason: 'already-registered', id: ext.id };
    }

    // Warn on unknown capabilities — they will not be granted (§62).
    for (const cap of ext.capabilities || []) {
      if (!this.#permissions.isKnown(cap)) {
        this.#logger.warn('extensions', `Extension "${ext.id}" declares unknown capability "${cap}" — not granted`);
      }
    }

    if (!isKnownExtensionType(ext.type)) {
      this.#logger.warn('extensions', `Extension "${ext.id}" has unrecognized type "${ext.type}"`);
    }

    this.#registry.register(ext);
    this.#eventBus.emit('extension:registered', { id: ext.id, type: ext.type });
    this.#logger.info('extensions', `Registered extension "${ext.id}" (${ext.type})`);
    return { success: true, id: ext.id };
  }

  /* ------------------------------------------------------------------ */
  /*  Activation / deactivation                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Activate an extension: dependency check → scoped context → activate().
   * @param {string} id
   */
  async activateExtension(id) {
    const entry = this.#registry.get(id);
    if (!entry) return { success: false, reason: 'not-found' };
    if (entry.state.activation === 'active') return { success: true, alreadyActive: true, id };

    // Dependency resolution.
    const missing = this.#checkDependencies(entry.descriptor);
    if (missing.length > 0) {
      this.#logger.error('extensions', `Extension "${id}" missing dependencies`, { missing });
      return { success: false, reason: 'missing-dependencies', missing };
    }

    // Build capability-scoped context (§62 least privilege).
    const context = this.#buildScopedContext(entry.descriptor);

    const instance = entry.instance;
    if (instance && typeof instance.activate === 'function') {
      try {
        await instance.activate(context);
      } catch (err) {
        this.#logger.error('extensions', `Extension "${id}" activation failed`, { error: err.message });
        this.#registry.updateState(id, { activation: 'failed' });
        this.#eventBus.emit('extension:error', { id, error: err.message });
        return { success: false, reason: 'activation-failed', error: err.message };
      }
    }

    this.#registry.updateState(id, { activation: 'active' });
    this.#eventBus.emit('extension:activated', { id });
    this.#logger.info('extensions', `Activated extension "${id}"`);
    return { success: true, id };
  }

  /**
   * Deactivate an extension, calling its deactivate() hook.
   * @param {string} id
   */
  async deactivateExtension(id) {
    const entry = this.#registry.get(id);
    if (!entry) return { success: false, reason: 'not-found' };
    if (entry.state.activation !== 'active') return { success: true, alreadyInactive: true, id };

    const instance = entry.instance;
    if (instance && typeof instance.deactivate === 'function') {
      try {
        await instance.deactivate();
      } catch (err) {
        this.#logger.warn('extensions', `Extension "${id}" deactivate error`, { error: err.message });
      }
    }

    this.#registry.updateState(id, { activation: 'inactive' });
    this.#eventBus.emit('extension:deactivated', { id });
    this.#logger.info('extensions', `Deactivated extension "${id}"`);
    return { success: true, id };
  }

  /* ------------------------------------------------------------------ */
  /*  Queries + observability (§48)                                      */
  /* ------------------------------------------------------------------ */

  getExtensions() {
    return this.#registry.getAll().map((e) => ({
      id: e.descriptor.id,
      type: e.descriptor.type,
      version: e.descriptor.version,
      owner: e.descriptor.owner,
      capabilities: e.descriptor.capabilities,
      activation: e.state.activation,
    }));
  }

  getStats() {
    const all = this.#registry.getAll();
    const byType = {};
    let active = 0;
    for (const e of all) {
      byType[e.descriptor.type] = (byType[e.descriptor.type] || 0) + 1;
      if (e.state.activation === 'active') active++;
    }
    return { total: all.length, active, byType };
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Build a capability-scoped context (§62). The extension receives ONLY
   * the services its declared (and known) capabilities allow.
   * @param {object} descriptor
   * @returns {Readonly<object>}
   */
  #buildScopedContext(descriptor) {
    const caps = new Set(descriptor.capabilities || []);
    const context = { extensionId: descriptor.id };

    const grant = (cap, serviceName, key) => {
      if (caps.has(cap) && this.#services.has(serviceName)) {
        context[key] = this.#services.get(serviceName);
      }
    };

    grant('resources', 'resources', 'resources');
    grant('data.read', 'data', 'data');
    grant('storage.read', 'storage', 'storage');
    grant('network', 'network', 'network');
    grant('notifications', 'notifications', 'notifications');
    grant('system.status', 'diagnostics', 'diagnostics');

    return Object.freeze(context);
  }

  #checkDependencies(descriptor) {
    const deps = descriptor.dependencies || [];
    const missing = [];
    for (const dep of deps) {
      const depId = typeof dep === 'string' ? dep : dep?.id;
      if (depId && !this.#registry.has(depId)) missing.push(depId);
    }
    return missing;
  }
} 
