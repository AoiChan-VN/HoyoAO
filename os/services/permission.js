/**
 * Permission Service (§25, §91, §92, §62, §64)
 *
 * Single source of truth for application capabilities (§64).
 * Responsibilities:
 *   - Define known permissions with metadata (§91).
 *   - Validate permission lists from manifests (§39, §83).
 *   - Register/unregister app permission grants (called by Installer).
 *   - Enforce least privilege at runtime via has() (§92).
 *   - Audit grants/denials for observability (§47, §48).
 *
 * This service is NOT exposed to Applications via ServiceContext —
 * apps must not grant permissions to themselves (§62).
 */

/**
 * Known capabilities (§91). Source of truth (§64).
 * Each entry carries metadata for validation, UI, and diagnostics.
 */
export const KNOWN_PERMISSIONS = Object.freeze({
  'data.read':      { category: 'data',     description: 'Read indexed data and data services' },
  'data.write':     { category: 'data',     description: 'Ingest or write data' },
  'storage.read':   { category: 'storage',  description: 'Read application-scoped storage' },
  'storage.write':  { category: 'storage',  description: 'Write application-scoped storage' },
  'network':        { category: 'network',  description: 'Network access' },
  'notifications':  { category: 'ui',       description: 'Present notifications to the user' },
  'resources':      { category: 'resource', description: 'Access the resource system' },
  'system.status':  { category: 'system',   description: 'Read system status and diagnostics' },
  'file.import':    { category: 'file',     description: 'Import files into the system' },
});

/** Ordered list of known permission names. */
export const KNOWN_PERMISSION_NAMES = Object.freeze(Object.keys(KNOWN_PERMISSIONS));

const MAX_AUDIT = 100;

export class PermissionService {
  /** @type {Map<string, Set<string>>} appId → granted permissions */
  #grants = new Map();
  /** @type {Array<object>} circular audit buffer */
  #audit = [];
  #eventBus;
  #logger;

  constructor(eventBus, logger) {
    this.#eventBus = eventBus;
    this.#logger = logger;
  }

  /* ------------------------------------------------------------------ */
  /*  Known-permission queries (§91)                                     */
  /* ------------------------------------------------------------------ */

  /** @returns {string[]} all known permission names */
  getKnownPermissions() {
    return [...KNOWN_PERMISSION_NAMES];
  }

  /** @param {string} permission */
  isKnown(permission) {
    return typeof permission === 'string'
      && Object.prototype.hasOwnProperty.call(KNOWN_PERMISSIONS, permission);
  }

  /** @param {string} permission */
  getPermissionInfo(permission) {
    return KNOWN_PERMISSIONS[permission] || null;
  }

  /* ------------------------------------------------------------------ */
  /*  Validation (§39, §83)                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Validate a permission list from a manifest.
   * Unknown permissions are reported but not fatal (§61 extensibility);
   * they are ignored at registration time (§62 least privilege).
   * @param {*} permissions
   * @returns {{valid:boolean, unknown:string[], errors:string[]}}
   */
  validatePermissions(permissions) {
    if (permissions === undefined) {
      return { valid: true, unknown: [], errors: [] };
    }
    if (!Array.isArray(permissions)) {
      return { valid: false, unknown: [], errors: ['permissions must be an array of strings'] };
    }

    const errors = [];
    const unknown = [];

    for (const p of permissions) {
      if (typeof p !== 'string') {
        errors.push('each permission must be a string');
        continue;
      }
      if (!this.isKnown(p)) {
        unknown.push(p);
      }
    }

    return { valid: errors.length === 0, unknown, errors };
  }

  /* ------------------------------------------------------------------ */
  /*  Registration (called by Installer §40)                             */
  /* ------------------------------------------------------------------ */

  /**
   * Register the effective permissions for an installed application.
   * Unknown permissions are dropped and logged (§62).
   * @param {string} appId
   * @param {Array<string>} manifestPermissions
   */
  registerApp(appId, manifestPermissions = []) {
    const perms = Array.isArray(manifestPermissions) ? manifestPermissions : [];

    const known = [];
    for (const p of perms) {
      if (this.isKnown(p)) {
        known.push(p);
      } else {
        this.#logger.warn('permissions', `Unknown permission "${p}" requested by "${appId}" — ignored (§62)`);
      }
    }

    this.#grants.set(appId, new Set(known));
    this.#recordAudit('granted', appId, known);
    this.#eventBus.emit('permission:granted', { appId, permissions: known });
    this.#logger.info('permissions', `Registered ${known.length} permission(s) for "${appId}"`);
  }

  /**
   * Remove all permissions for an uninstalled application.
   * @param {string} appId
   */
  unregisterApp(appId) {
    if (!this.#grants.has(appId)) return;
    this.#grants.delete(appId);
    this.#recordAudit('revoked', appId, []);
    this.#eventBus.emit('permission:revoked', { appId });
  }

  /* ------------------------------------------------------------------ */
  /*  Runtime enforcement (§92)                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Check whether an application holds a permission.
   * Denials are audited and emitted for observability (§48).
   * @param {string} appId
   * @param {string} permission
   * @returns {boolean}
   */
  has(appId, permission) {
    const set = this.#grants.get(appId);
    const granted = set ? set.has(permission) : false;

    if (!granted) {
      this.#recordAudit('denied', appId, [permission]);
      this.#eventBus.emit('permission:denied', { appId, permission });
    }

    return granted;
  }

  /* ------------------------------------------------------------------ */
  /*  Runtime grant/revoke (future dynamic permissions)                  */
  /* ------------------------------------------------------------------ */

  /**
   * Grant a known permission at runtime.
   * @param {string} appId
   * @param {string} permission
   * @returns {boolean} whether the grant occurred
   */
  grant(appId, permission) {
    if (!this.isKnown(permission)) {
      this.#logger.warn('permissions', `Cannot grant unknown permission "${permission}"`);
      return false;
    }
    if (!this.#grants.has(appId)) this.#grants.set(appId, new Set());
    this.#grants.get(appId).add(permission);
    this.#recordAudit('granted', appId, [permission]);
    this.#eventBus.emit('permission:granted', { appId, permissions: [permission] });
    return true;
  }

  /**
   * Revoke a permission at runtime.
   * @param {string} appId
   * @param {string} permission
   * @returns {boolean} whether a permission was removed
   */
  revoke(appId, permission) {
    const set = this.#grants.get(appId);
    if (!set) return false;
    const removed = set.delete(permission);
    if (removed) {
      this.#recordAudit('revoked', appId, [permission]);
      this.#eventBus.emit('permission:revoked', { appId, permissions: [permission] });
    }
    return removed;
  }

  /* ------------------------------------------------------------------ */
  /*  Queries + audit (§48)                                              */
  /* ------------------------------------------------------------------ */

  /** @param {string} appId @returns {string[]} granted permissions (copy) */
  getPermissions(appId) {
    const set = this.#grants.get(appId);
    return set ? Array.from(set) : [];
  }

  /** @returns {object} appId → permissions[] */
  getAllGrants() {
    const out = {};
    for (const [appId, set] of this.#grants) {
      out[appId] = Array.from(set);
    }
    return out;
  }

  /** @returns {Array<object>} recent audit entries (copy) */
  getAuditLog() {
    return [...this.#audit];
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE                                                            */
  /* ------------------------------------------------------------------ */

  #recordAudit(action, appId, permissions) {
    this.#audit.push({
      timestamp: Date.now(),
      action,
      appId,
      permissions: [...permissions],
    });
    if (this.#audit.length > MAX_AUDIT) {
      this.#audit.shift();
    }
  }
} 
