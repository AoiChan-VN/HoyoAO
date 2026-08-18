/**
 * Navigation Service (§25, §30)
 *
 * Orchestrates navigation across the OS:
 *   - Resolves paths through the RouteRegistry (source of truth §64).
 *   - Maintains current navigation state.
 *   - Syncs the URL hash for deep-linking (§30).
 *   - Emits "navigation:changed" events (§29).
 *
 * This service does NOT render UI and does NOT control app lifecycle.
 * The Shell subscribes to navigation events and performs rendering (§87).
 */
export class NavigationService {
  #routes;
  #eventBus;
  #logger;
  /** @type {{path:string, route:object}|null} */
  #current = null;
  #listeners = new Set();
  #popstateHandler = null;

  constructor({ routeRegistry, eventBus, logger }) {
    this.#routes = routeRegistry;
    this.#eventBus = eventBus;
    this.#logger = logger;
  }

  /** Start listening to browser back/forward. */
  init() {
    if (typeof window === 'undefined') return;

    this.#popstateHandler = () => {
      const path = this.#readHash();
      if (path) this.navigate(path, { fromPopState: true });
    };
    window.addEventListener('popstate', this.#popstateHandler);
  }

  /**
   * Navigate to a registered path.
   * @param {string} path
   * @param {{fromPopState?:boolean}} options
   * @returns {boolean} whether navigation occurred
   */
  navigate(path, options = {}) {
    const route = this.#routes.resolve(path);

    if (!route) {
      this.#logger.warn('navigation', `No route registered for "${path}"`);
      this.#eventBus.emit('navigation:not-found', { path });
      return false;
    }

    // Avoid redundant navigation to the same path.
    if (this.#current && this.#current.path === route.path) {
      return true;
    }

    const previous = this.#current;
    this.#current = { path: route.path, route };

    if (!options.fromPopState) {
      this.#writeHash(route.path);
    }

    this.#eventBus.emit('navigation:changed', {
      path: route.path,
      route,
      previous,
    });
    this.#notifyListeners(route.path, route);

    this.#logger.info('navigation', `Navigated → ${route.path}`);
    return true;
  }

  /** Convenience: navigate to an application's primary route. */
  goToApplication(appId) {
    return this.navigate(`/apps/${appId}`);
  }

  /** Convenience: navigate to an OS view. */
  goToOSView(viewId) {
    return this.navigate(`/os/${viewId}`);
  }

  /** @returns {{path:string, route:object}|null} */
  getCurrent() {
    return this.#current;
  }

  /**
   * Determine the initial path at boot:
   * use a valid deep-link hash if present, otherwise the default.
   * @param {string} defaultPath
   * @returns {string}
   */
  getInitialPath(defaultPath) {
    const hash = this.#readHash();
    if (hash && this.#routes.has(hash)) return hash;
    return defaultPath;
  }

  /**
   * Subscribe to navigation changes.
   * @param {Function} fn - receives (path, route)
   * @returns {Function} unsubscribe
   */
  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  destroy() {
    if (this.#popstateHandler && typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.#popstateHandler);
      this.#popstateHandler = null;
    }
    this.#listeners.clear();
  }

  /* ---- private ---- */

  #readHash() {
    try {
      return window.location.hash.slice(1) || '';
    } catch {
      return '';
    }
  }

  #writeHash(path) {
    try {
      window.history.replaceState(null, '', '#' + path);
    } catch {
      // History API may be unavailable in some environments (§23).
    }
  }

  #notifyListeners(path, route) {
    for (const fn of this.#listeners) {
      try {
        fn(path, route);
      } catch (err) {
        this.#logger.error('navigation', 'Subscriber error', { error: err.message });
      }
    }
  }
} 
