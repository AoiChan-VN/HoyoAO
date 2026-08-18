/**
 * Route Registry (§30, §64)
 *
 * Single source of truth for ALL routes in the OS.
 *   - OS routes are registered by the OS.
 *   - Application routes are registered from Application manifests.
 *
 * The registry only STORES route definitions. Actual navigation
 * (state, URL sync, events) is handled by the NavigationService.
 */

function normalizePath(path) {
  if (!path) return '/';
  let p = String(path);
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

export class RouteRegistry {
  /** @type {Map<string, object>} normalized path → route definition */
  #routes = new Map();
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Register a route definition.
   * @param {{
   *   path: string,
   *   scope: string,            // 'os' or application id
   *   kind: 'os'|'application',
   *   viewId?: string,          // for os routes
   *   title?: string,
   *   titleKey?: string,
   *   icon?: string,
   *   order?: number
   * }} route
   */
  register(route) {
    if (!route || !route.path || !route.scope || !route.kind) {
      this.#logger.warn('routes', 'Invalid route registration', { route });
      return;
    }

    const path = normalizePath(route.path);

    if (this.#routes.has(path)) {
      this.#logger.warn('routes', `Route "${path}" already registered — overwriting`);
    }

    this.#routes.set(path, { ...route, path });
  }

  registerMany(routes) {
    if (!Array.isArray(routes)) return;
    for (const r of routes) this.register(r);
  }

  unregister(path) {
    this.#routes.delete(normalizePath(path));
  }

  /** @returns {object|null} route definition for a path */
  resolve(path) {
    return this.#routes.get(normalizePath(path)) || null;
  }

  has(path) {
    return this.#routes.has(normalizePath(path));
  }

  getAll() {
    return Array.from(this.#routes.values());
  }

  getRoutesForScope(scope) {
    return this.getAll().filter((r) => r.scope === scope);
  }

  getOSRoutes() {
    return this.getAll()
      .filter((r) => r.kind === 'os')
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getApplicationRoutes() {
    return this.getAll().filter((r) => r.kind === 'application');
  }
} 
