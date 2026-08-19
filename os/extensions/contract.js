/**
 * Extension Contract + Types (§61)
 *
 * Extensions operate through explicit contracts. Categories supported:
 * applications, modules, plugins, providers, themes, data adapters,
 * resource packs, integrations.
 *
 * An extension object should provide:
 *   { id, type, version, capabilities[], dependencies[],
 *     activate(context), deactivate() }
 *
 * `activate(context)` receives a capability-scoped context (§62) — never
 * unrestricted OS access.
 */

export const EXTENSION_TYPES = Object.freeze({
  APPLICATION: 'application',
  MODULE: 'module',
  PLUGIN: 'plugin',
  PROVIDER: 'provider',
  THEME: 'theme',
  DATA_ADAPTER: 'data-adapter',
  RESOURCE_PACK: 'resource-pack',
  INTEGRATION: 'integration',
});

/** @param {string} type */
export function isKnownExtensionType(type) {
  return Object.values(EXTENSION_TYPES).includes(type);
}

/**
 * Validate an extension against the contract.
 * @param {object} ext
 * @returns {string[]} list of errors (empty = valid)
 */
export function validateExtensionContract(ext) {
  const errors = [];

  if (!ext || typeof ext !== 'object') {
    return ['extension must be an object'];
  }
  if (typeof ext.id !== 'string' || ext.id.length === 0) {
    errors.push('extension.id is required');
  }
  if (typeof ext.type !== 'string' || ext.type.length === 0) {
    errors.push('extension.type is required');
  } else if (!isKnownExtensionType(ext.type)) {
    errors.push(`unknown extension type "${ext.type}"`);
  }
  if (ext.version !== undefined && typeof ext.version !== 'string') {
    errors.push('extension.version must be a string');
  }
  if (ext.capabilities !== undefined && !Array.isArray(ext.capabilities)) {
    errors.push('extension.capabilities must be an array');
  }
  if (ext.dependencies !== undefined && !Array.isArray(ext.dependencies)) {
    errors.push('extension.dependencies must be an array');
  }
  if (ext.activate !== undefined && typeof ext.activate !== 'function') {
    errors.push('extension.activate must be a function');
  }
  if (ext.deactivate !== undefined && typeof ext.deactivate !== 'function') {
    errors.push('extension.deactivate must be a function');
  }

  return errors;
} 
