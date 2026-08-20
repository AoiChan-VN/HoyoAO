/**
 * App Router — lightweight hash-based router for Application internal
 * navigation (§88, §30).
 *
 * Applications manage their own internal navigation. This utility provides
 * a minimal, dependency-free router scoped to an application's route
 * prefix. It does NOT interfere with the OS-level RouteRegistry.
 *
 * Usage in an Application:
 *   import { createAppRouter } from '../../platform/app-router.js';
 *
 *   const router = createAppRouter('/apps/dashboard');
 *   router.on('/overview', () => renderOverview());
 *   router.on('/details', () => renderDetails());
 *   router.start();          // activate, navigate to current hash
 *   router.navigate('/details');
 *   router.destroy();        // cleanup on unmount (§74)
 */

export function createAppRouter(basePath, options = {}) {
  const { onNavigate = null } = options;

  const routes = new Map();
  let currentPath = null;
  let listening = false;

  function normalizePath(path) {
    if (!path) return '/';
    let p = String(path);
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }

  function getHashPath() {
    const hash = window.location.hash.slice(1) || '';
    // Strip the basePath prefix to get the internal route.
    if (hash.startsWith(basePath)) {
      return normalizePath(hash.slice(basePath.length)) || '/';
    }
    return normalizePath(hash);
  }

  function onHashChange() {
    if (!listening) return;
    const path = getHashPath();
    if (path === currentPath) return;
    currentPath = path;

    const handler = routes.get(path);
    if (handler) {
      try {
        handler(path);
      } catch (err) {
        // Application errors must not crash the router (§75).
        console.error(`[app-router] Handler error for "${path}":`, err);
      }
    }

    if (typeof onNavigate === 'function') {
      onNavigate(path);
    }
  }

  function on(routePath, handler) {
    if (typeof routePath !== 'string' || typeof handler !== 'function') return;
    routes.set(normalizePath(routePath), handler);
  }

  function navigate(routePath) {
    const target = normalizePath(routePath);
    const fullHash = basePath + target;
    if (window.location.hash.slice(1) === fullHash) {
      // Already there; trigger handler directly.
      currentPath = target;
      const handler = routes.get(target);
      if (handler) handler(target);
      return;
    }
    window.location.hash = fullHash;
  }

  function start() {
    if (listening) return;
    listening = true;
    window.addEventListener('hashchange', onHashChange);
    // Navigate to current hash on start.
    onHashChange();
  }

  function destroy() {
    listening = false;
    window.removeEventListener('hashchange', onHashChange);
    routes.clear();
    currentPath = null;
  }

  return { on, navigate, start, destroy, getHashPath };
} 
