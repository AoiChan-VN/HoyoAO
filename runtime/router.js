/**
 * Application-aware Router (§30)
 *
 * OS routes:      /os, /os/settings, /os/diagnostics
 * App routes:     /apps/dashboard, /apps/server, …
 *
 * Applications register their own routes through this router.
 * No giant hardcoded route table (§30).
 */

export class Router {
  /** @type {Map<string, {handler:Function, meta:object}>} */
  #routes = new Map();
  #current = null;
  #logger;
  #eventBus;
  #popstateHandler = null;

  constructor(logger, eventBus) {
    this.#logger = logger;
    this.#eventBus = eventBus;
  }

  /**
   * Register a route.
   * @param {string} path   e.g. "/apps/dashboard"
   * @param {Function} handler
   * @param {object} meta
   */
  register(path, handler, meta = {}) {
    this.#routes.set(path, { handler, meta });
    this.#logger.debug('router', `Route registered: ${path}`);
  }

  /**
   * Navigate to a path.
   * @param {string} path
   */
  navigate(path) {
    const route = this.#routes.get(path);
    if (route) {
      this.#current = { path, ...route.meta };
      route.handler();
      this.#eventBus.emit('route:changed', this.#current);
      this.#logger.info('router', `Navigated → ${path}`);
    } else {
      this.#logger.warn('router', `No route for "${path}"`);
      this.#eventBus.emit('route:not-found', { path });
    }
  }

  getCurrentRoute() {
    return this.#current;
  }

  /** Bind to browser history. */
  init() {
    this.#popstateHandler = () => {
      const hash = window.location.hash.slice(1) || '/';
      this.navigate(hash);
    };
    window.addEventListener('popstate', this.#popstateHandler);

    // Resolve initial route
    const initial = window.location.hash.slice(1) || '/';
    this.navigate(initial);
  }

  /** Cleanup (§74). */
  destroy() {
    if (this.#popstateHandler) {
      window.removeEventListener('popstate', this.#popstateHandler);
      this.#popstateHandler = null;
    }
    this.#routes.clear();
  }
} 
