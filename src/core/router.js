import globalEventBus from './event-bus.js';

class HashRouter {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.handleHashChange = this.handleHashChange.bind(this);
  }

  init() {
    window.addEventListener('hashchange', this.handleHashChange);
    this.handleHashChange();
  }

  register(hash, callback) {
    this.routes.set(hash, callback);
  }

  unregister(hash) {
    this.routes.delete(hash);
  }

  navigate(hash) {
    window.location.hash = hash.startsWith('#') ? hash : `#${hash}`;
  }

  handleHashChange() {
    const rawHash = window.location.hash || '#';
    const hashPath = rawHash.replace(/^#\/?/, '');
    
    const [path, queryString] = hashPath.split('?');
    const params = new URLSearchParams(queryString || '');
    const query = Object.fromEntries(params.entries());

    this.currentRoute = { path: path || '', query };

    globalEventBus.emit('router:change', this.currentRoute);

    if (this.routes.has(path)) {
      this.routes.get(path)(this.currentRoute);
    } else if (this.routes.has('*')) {
      this.routes.get('*')(this.currentRoute);
    }
  }

  getRoute() {
    return this.currentRoute;
  }

  destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    this.routes.clear();
  }
}

const globalRouter = new HashRouter();
export default globalRouter;
