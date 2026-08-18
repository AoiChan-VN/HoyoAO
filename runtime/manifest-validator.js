/**
 * Manifest Validator (§31, §39, §83, §40)
 *
 * Pure schema + security validation for Application manifests.
 * No side effects. All manifest input is treated as untrusted (§83).
 *
 * Returns a structured result (§46):
 *   { valid, errors: [{field, message}], warnings: [{field, message}] }
 */

/** Capabilities the OS currently understands (§91). */
export const KNOWN_PERMISSIONS = new Set([
  'data.read',
  'data.write',
  'storage.read',
  'storage.write',
  'network',
  'notifications',
  'resources',
  'system.status',
  'file.import',
]);

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/;
const MAX_ID_LENGTH = 64;
const MAX_NAME_LENGTH = 128;
const MAX_DESCRIPTION_LENGTH = 1024;

/* ------------------------------------------------------------------ */
/*  Semver helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Parse "1.2.3" (with optional pre-release/build suffix) into [1,2,3].
 * @param {string} version
 * @returns {number[]|null}
 */
export function parseVersion(version) {
  const m = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Compare two versions.
 * @returns {-1|0|1}
 */
export function compareVersions(a, b) {
  const pa = typeof a === 'string' ? parseVersion(a) : a;
  const pb = typeof b === 'string' ? parseVersion(b) : b;
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Check whether `version` satisfies a constraint like ">=1.0.0", "^1.2.0".
 * @param {string} version
 * @param {string} constraint
 * @returns {boolean}
 */
export function satisfiesVersion(version, constraint) {
  if (!constraint) return true;

  const c = String(constraint).trim();
  const m = c.match(/^(>=|<=|>|<|=|\^|~)?\s*(.+)$/);
  if (!m) return false;

  const op = m[1] || '=';
  const target = m[2];
  const cmp = compareVersions(version, target);

  switch (op) {
    case '>=': return cmp >= 0;
    case '<=': return cmp <= 0;
    case '>':  return cmp > 0;
    case '<':  return cmp < 0;
    case '=':  return cmp === 0;
    case '^': {
      const pv = parseVersion(version);
      const pt = parseVersion(target);
      if (!pv || !pt) return false;
      return pv[0] === pt[0] && cmp >= 0;
    }
    case '~': {
      const pv = parseVersion(version);
      const pt = parseVersion(target);
      if (!pv || !pt) return false;
      return pv[0] === pt[0] && pv[1] === pt[1] && cmp >= 0;
    }
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Validator                                                          */
/* ------------------------------------------------------------------ */

export class ManifestValidator {
  #logger;

  constructor(logger = null) {
    this.#logger = logger;
  }

  /**
   * Validate an application manifest.
   * @param {object} manifest
   * @returns {{valid:boolean, errors:Array, warnings:Array}}
   */
  validate(manifest) {
    const errors = [];
    const warnings = [];

    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      return {
        valid: false,
        errors: [{ field: 'manifest', message: 'Manifest must be a plain object' }],
        warnings,
      };
    }

    this.#validateIdentity(manifest, errors, warnings);
    this.#validateVersion(manifest, errors, warnings);
    this.#validateEntry(manifest, errors, warnings);
    this.#validatePermissions(manifest, errors, warnings);
    this.#validateCapabilities(manifest, errors, warnings);
    this.#validateDependencies(manifest, errors, warnings);
    this.#validateRoutes(manifest, errors, warnings);
    this.#validateCompatibility(manifest, errors, warnings);
    this.#validateLifecycle(manifest, errors, warnings);

    return { valid: errors.length === 0, errors, warnings };
  }

  /* ---- private ---- */

  #validateIdentity(m, errors, warnings) {
    // id
    if (typeof m.id !== 'string' || m.id.length === 0) {
      errors.push({ field: 'id', message: 'id is required and must be a non-empty string' });
    } else {
      if (!ID_PATTERN.test(m.id)) {
        errors.push({ field: 'id', message: 'id must be lowercase alphanumeric with hyphens, starting with a letter' });
      }
      if (m.id.length > MAX_ID_LENGTH) {
        errors.push({ field: 'id', message: `id exceeds ${MAX_ID_LENGTH} characters` });
      }
    }

    // name
    if (typeof m.name !== 'string' || m.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'name is required and must be a non-empty string' });
    } else if (m.name.length > MAX_NAME_LENGTH) {
      errors.push({ field: 'name', message: `name exceeds ${MAX_NAME_LENGTH} characters` });
    }

    // description (optional)
    if (m.description !== undefined) {
      if (typeof m.description !== 'string') {
        errors.push({ field: 'description', message: 'description must be a string' });
      } else if (m.description.length > MAX_DESCRIPTION_LENGTH) {
        warnings.push({ field: 'description', message: `description exceeds ${MAX_DESCRIPTION_LENGTH} characters` });
      }
    }
  }

  #validateVersion(m, errors) {
    if (typeof m.version !== 'string' || m.version.length === 0) {
      errors.push({ field: 'version', message: 'version is required and must be a non-empty string' });
      return;
    }
    if (!SEMVER_PATTERN.test(m.version)) {
      errors.push({ field: 'version', message: 'version must be valid semver (e.g. 1.0.0)' });
    }
  }

  /**
   * Entry point security validation (§39, §40, §83).
   * Rejects remote URLs, path traversal, absolute paths, non-modules.
   */
  #validateEntry(m, errors) {
    const entry = m.entry;

    if (typeof entry !== 'string' || entry.length === 0) {
      errors.push({ field: 'entry', message: 'entry is required and must be a non-empty string' });
      return;
    }

    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(entry)) {
      errors.push({ field: 'entry', message: 'entry must not be a remote URL (§40 trusted source)' });
    }

    if (entry.includes('..')) {
      errors.push({ field: 'entry', message: 'entry must not contain path traversal ("..") (§39)' });
    }

    if (entry.startsWith('/')) {
      errors.push({ field: 'entry', message: 'entry must be a relative path, not absolute' });
    }

    if (!/\.m?js$/.test(entry)) {
      errors.push({ field: 'entry', message: 'entry must point to an ES module (.js or .mjs)' });
    }
  }

  #validatePermissions(m, errors, warnings) {
    if (m.permissions === undefined) return;

    if (!Array.isArray(m.permissions)) {
      errors.push({ field: 'permissions', message: 'permissions must be an array of strings' });
      return;
    }

    for (const p of m.permissions) {
      if (typeof p !== 'string') {
        errors.push({ field: 'permissions', message: 'each permission must be a string' });
        continue;
      }
      if (!KNOWN_PERMISSIONS.has(p)) {
        // Unknown capability: warn but do not block (§61 extensibility).
        warnings.push({ field: 'permissions', message: `unknown permission "${p}"` });
      }
    }
  }

  #validateCapabilities(m, errors, warnings) {
    if (m.capabilities === undefined) return;

    if (!Array.isArray(m.capabilities)) {
      errors.push({ field: 'capabilities', message: 'capabilities must be an array of strings' });
      return;
    }

    for (const c of m.capabilities) {
      if (typeof c !== 'string') {
        errors.push({ field: 'capabilities', message: 'each capability must be a string' });
        continue;
      }
      if (!KNOWN_PERMISSIONS.has(c)) {
        warnings.push({ field: 'capabilities', message: `unknown capability "${c}"` });
      }
    }
  }

  #validateDependencies(m, errors) {
    if (m.dependencies === undefined) return;

    if (!Array.isArray(m.dependencies)) {
      errors.push({ field: 'dependencies', message: 'dependencies must be an array' });
      return;
    }

    for (const dep of m.dependencies) {
      if (typeof dep === 'string') {
        if (!ID_PATTERN.test(dep)) {
          errors.push({ field: 'dependencies', message: `invalid dependency id "${dep}"` });
        }
      } else if (dep && typeof dep === 'object') {
        if (typeof dep.id !== 'string' || !ID_PATTERN.test(dep.id)) {
          errors.push({ field: 'dependencies', message: 'dependency object requires valid "id"' });
        }
        if (dep.version !== undefined && !SEMVER_PATTERN.test(dep.version)) {
          errors.push({ field: 'dependencies', message: `dependency "${dep.id}" version must be valid semver` });
        }
      } else {
        errors.push({ field: 'dependencies', message: 'dependency must be a string id or { id, version } object' });
      }
    }
  }

  #validateRoutes(m, errors) {
    if (m.routes === undefined) return;

    if (!Array.isArray(m.routes)) {
      errors.push({ field: 'routes', message: 'routes must be an array' });
      return;
    }

    for (const r of m.routes) {
      if (!r || typeof r !== 'object') {
        errors.push({ field: 'routes', message: 'each route must be an object' });
        continue;
      }
      if (typeof r.path !== 'string' || !r.path.startsWith('/')) {
        errors.push({ field: 'routes', message: `route path must be a string starting with "/" (got "${r.path}")` });
      }
      if (r.name !== undefined && typeof r.name !== 'string') {
        errors.push({ field: 'routes', message: 'route name must be a string' });
      }
    }
  }

  #validateCompatibility(m, errors) {
    if (m.compatibility === undefined) return;

    if (!m.compatibility || typeof m.compatibility !== 'object') {
      errors.push({ field: 'compatibility', message: 'compatibility must be an object' });
      return;
    }

    if (m.compatibility.osVersion !== undefined) {
      if (typeof m.compatibility.osVersion !== 'string') {
        errors.push({ field: 'compatibility.osVersion', message: 'osVersion must be a string constraint' });
      } else if (parseVersion(m.compatibility.osVersion.replace(/^(>=|<=|>|<|=|\^|~)\s*/, '')) === null) {
        errors.push({ field: 'compatibility.osVersion', message: 'osVersion must contain a valid semver target' });
      }
    }
  }

  #validateLifecycle(m, errors) {
    if (m.lifecycle === undefined) return;

    if (!m.lifecycle || typeof m.lifecycle !== 'object') {
      errors.push({ field: 'lifecycle', message: 'lifecycle must be an object' });
      return;
    }

    if (m.lifecycle.autoStart !== undefined && typeof m.lifecycle.autoStart !== 'boolean') {
      errors.push({ field: 'lifecycle.autoStart', message: 'autoStart must be a boolean' });
    }
  }
} 
