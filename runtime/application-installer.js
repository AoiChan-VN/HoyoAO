/**
 * Application Installer (§40, §84, §31)
 *
 * Controlled installation orchestration. Never blindly registers or
 * executes an application (§40). Steps:
 *   validate → duplicate check → compatibility → dependencies → register
 *
 * Installation state is separate from activation state (§84), and both
 * are separate from runtime lifecycle state (§32).
 */

import { satisfiesVersion } from './manifest-validator.js';

export class ApplicationInstaller {
  #registry;
  #validator;
  #config;
  #eventBus;
  #logger;
  #osVersion;

  constructor({ registry, validator, config, eventBus, logger }) {
    this.#registry = registry;
    this.#validator = validator;
    this.#config = config;
    this.#eventBus = eventBus;
    this.#logger = logger;
    this.#osVersion = this.#config.get('os.version', '0.0.0');
  }

  /**
   * Install an application from a manifest object.
   * @param {object} manifest
   * @param {{force?:boolean}} options
   * @returns {Promise<{success:boolean, appId?:string, reason?:string, errors?:Array, warnings?:Array, missing?:Array}>}
   */
  async install(manifest, options = {}) {
    const rawId = manifest && typeof manifest.id === 'string' ? manifest.id : null;

    // 1. Validate schema + security (§39, §83).
    const validation = this.#validator.validate(manifest);
    if (!validation.valid) {
      this.#logger.error('installer', `Manifest validation failed for "${rawId}"`, {
        errors: validation.errors,
      });
      this.#eventBus.emit('application:install-failed', {
        appId: rawId,
        reason: 'invalid-manifest',
        errors: validation.errors,
      });
      return {
        success: false,
        reason: 'invalid-manifest',
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    const appId = manifest.id;

    // 2. Duplicate check.
    if (this.#registry.has(appId) && !options.force) {
      this.#logger.warn('installer', `"${appId}" already installed — skipping (use force to replace)`);
      return { success: false, appId, reason: 'already-installed' };
    }

    // 3. Compatibility check (§31).
    if (!this.#checkCompatibility(manifest)) {
      const required = manifest.compatibility?.osVersion || 'unknown';
      this.#logger.error('installer', `"${appId}" incompatible with OS ${this.#osVersion} (requires ${required})`);
      this.#eventBus.emit('application:install-failed', {
        appId,
        reason: 'incompatible',
        required,
        osVersion: this.#osVersion,
      });
      return { success: false, appId, reason: 'incompatible' };
    }

    // 4. Dependency resolution (§31).
    const missing = this.#checkDependencies(manifest);
    if (missing.length > 0) {
      this.#logger.error('installer', `"${appId}" missing dependencies`, { missing });
      this.#eventBus.emit('application:install-failed', {
        appId,
        reason: 'missing-dependencies',
        missing,
      });
      return { success: false, appId, reason: 'missing-dependencies', missing };
    }

    // 5. Register with installation metadata (§84).
    const meta = {
      installedAt: Date.now(),
      installation: 'installed',
      activation: 'enabled',
      validationWarnings: validation.warnings,
    };

    try {
      this.#registry.register(manifest, meta);
    } catch (err) {
      this.#logger.error('installer', `Failed to register "${appId}"`, { error: err.message });
      this.#eventBus.emit('application:install-failed', {
        appId,
        reason: 'registration-error',
        error: err.message,
      });
      return { success: false, appId, reason: 'registration-error' };
    }

    // 6. Announce.
    this.#eventBus.emit('application:installed', {
      appId,
      version: manifest.version,
      warnings: validation.warnings,
    });
    this.#logger.info('installer', `Installed "${appId}" v${manifest.version}`, {
      warnings: validation.warnings.length,
    });

    return { success: true, appId, warnings: validation.warnings };
  }

  /**
   * Uninstall an application. Refuses if the app is still running (§84 —
   * installation and usage are separately controlled; stop it first).
   * @param {string} appId
   */
  uninstall(appId) {
    if (!this.#registry.has(appId)) {
      return { success: false, appId, reason: 'not-installed' };
    }

    const entry = this.#registry.get(appId);
    if (entry.state === 'RUNNING' || entry.state === 'STARTING') {
      this.#logger.warn('installer', `Cannot uninstall "${appId}" while ${entry.state}`);
      return { success: false, appId, reason: 'still-running' };
    }

    this.#registry.unregister(appId);
    this.#eventBus.emit('application:uninstalled', { appId });
    this.#logger.info('installer', `Uninstalled "${appId}"`);

    return { success: true, appId };
  }

  /**
   * Enable or disable an installed application without uninstalling (§84).
   * @param {string} appId
   * @param {'enabled'|'disabled'} activation
   */
  setActivation(appId, activation) {
    if (!this.#registry.has(appId)) {
      return { success: false, appId, reason: 'not-installed' };
    }
    if (activation !== 'enabled' && activation !== 'disabled') {
      return { success: false, appId, reason: 'invalid-activation' };
    }

    this.#registry.setActivation(appId, activation);
    this.#eventBus.emit('application:activation-changed', { appId, activation });
    this.#logger.info('installer', `"${appId}" activation → ${activation}`);

    return { success: true, appId, activation };
  }

  /** @returns {Array<object>} installed application entries */
  listInstalled() {
    return this.#registry.getAll();
  }

  /**
   * @param {string} appId
   * @returns {{installed:boolean, activation?:string, state?:string}}
   */
  getInstallationState(appId) {
    const entry = this.#registry.get(appId);
    if (!entry) return { installed: false };
    return {
      installed: entry.installation === 'installed',
      activation: entry.activation,
      state: entry.state,
    };
  }

  /* ---- private ---- */

  #checkCompatibility(manifest) {
    const constraint = manifest?.compatibility?.osVersion;
    if (!constraint) return true;
    return satisfiesVersion(this.#osVersion, constraint);
  }

  #checkDependencies(manifest) {
    const deps = Array.isArray(manifest?.dependencies) ? manifest.dependencies : [];
    const missing = [];

    for (const dep of deps) {
      const depId = typeof dep === 'string' ? dep : dep?.id;
      if (!depId) continue;
      if (!this.#registry.has(depId)) {
        missing.push(depId);
      }
    }

    return missing;
  }
} 
